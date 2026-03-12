import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

function verifyAdminToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }

  const token = authHeader.substring(7)
  
  try {
    return jwt.verify(token, JWT_SECRET) as any
  } catch (error) {
    return null
  }
}

// Helper function to generate slug
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/[đ]/g, 'd')
    .replace(/[ž]/g, 'z')
    .replace(/[č]/g, 'c')
    .replace(/[ć]/g, 'c')
    .replace(/[š]/g, 's')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
}

// GET - Lista svih natjecatelja s paginacijom i pretragom
export async function GET(request: NextRequest) {
  const decodedToken = verifyAdminToken(request)
  if (!decodedToken) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit

    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { city: { contains: search, mode: 'insensitive' as const } },
            { email: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {}

    const [competitors, total] = await Promise.all([
      prisma.competitor.findMany({
        where,
        orderBy: { totalEggsBroken: 'desc' },
        skip,
        take: limit,
        include: {
          _count: {
            select: {
              homeMatches: true,
              awayMatches: true,
              rankings: true,
            },
          },
        },
      }),
      prisma.competitor.count({ where }),
    ])

    return NextResponse.json({
      competitors,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Competitors fetch error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Kreiranje novog natjecatelja
export async function POST(request: NextRequest) {
  const decodedToken = verifyAdminToken(request)
  if (!decodedToken) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { name, email, phone, city, country, profileImage, bio, familyGroup } = body

    if (!name) {
      return NextResponse.json(
        { message: 'Ime natjecatelja je obavezno' },
        { status: 400 }
      )
    }

    // Generate unique slug
    let baseSlug = generateSlug(name)
    let slug = baseSlug
    let counter = 1

    while (await prisma.competitor.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`
      counter++
    }

    // Check if email already exists (if provided)
    if (email) {
      const existingEmail = await prisma.competitor.findUnique({
        where: { email },
      })
      if (existingEmail) {
        return NextResponse.json(
          { message: 'Natjecatelj s ovom email adresom već postoji' },
          { status: 400 }
        )
      }
    }

    const competitor = await prisma.competitor.create({
      data: {
        name,
        slug,
        email: email || null,
        phone: phone || null,
        city: city || null,
        country: country || 'Bosna i Hercegovina',
        profileImage: profileImage || null,
        bio: bio || null,
        familyGroup: familyGroup || null,
        isActive: true,
      },
      include: {
        _count: {
          select: {
            homeMatches: true,
            awayMatches: true,
            rankings: true,
          },
        },
      },
    })

    return NextResponse.json(competitor, { status: 201 })
  } catch (error) {
    console.error('Competitor creation error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
