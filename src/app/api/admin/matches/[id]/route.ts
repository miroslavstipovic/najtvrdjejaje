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

// GET - Dohvat pojedinačnog meča
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const decodedToken = verifyAdminToken(request)
  if (!decodedToken) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params
    const matchId = parseInt(id)

    if (isNaN(matchId)) {
      return NextResponse.json(
        { message: 'Invalid match ID' },
        { status: 400 }
      )
    }

    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        homeCompetitor: true,
        awayCompetitor: true,
        competition: true,
        round: true,
      },
    })

    if (!match) {
      return NextResponse.json(
        { message: 'Meč nije pronađen' },
        { status: 404 }
      )
    }

    return NextResponse.json(match)
  } catch (error) {
    console.error('Match fetch error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH - Ažuriranje meča (uključujući rezultat)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const decodedToken = verifyAdminToken(request)
  if (!decodedToken) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params
    const matchId = parseInt(id)

    if (isNaN(matchId)) {
      return NextResponse.json(
        { message: 'Invalid match ID' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const {
      homeEggsBroken,
      awayEggsBroken,
      matchDate,
      location,
      videoUrl,
      description,
      status,
      images,
    } = body

    // Get existing match with round info
    const existingMatch = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        homeCompetitor: true,
        awayCompetitor: true,
        round: true,
      },
    })

    if (!existingMatch) {
      return NextResponse.json(
        { message: 'Meč nije pronađen' },
        { status: 404 }
      )
    }

    const wasCompleted = existingMatch.status === 'completed'
    const isBeingCompleted = status === 'completed' && !wasCompleted

    // Build update data
    const updateData: any = {}

    if (homeEggsBroken !== undefined) updateData.homeEggsBroken = homeEggsBroken
    if (awayEggsBroken !== undefined) updateData.awayEggsBroken = awayEggsBroken
    if (matchDate !== undefined) updateData.matchDate = matchDate ? new Date(matchDate) : null
    if (location !== undefined) updateData.location = location || null
    if (videoUrl !== undefined) updateData.videoUrl = videoUrl || null
    if (description !== undefined) updateData.description = description || null
    if (status !== undefined) updateData.status = status
    if (images !== undefined) updateData.images = images

    // Determine result - pobjednik je onaj tko razbije više jaja
    const finalHomeEggs = homeEggsBroken ?? existingMatch.homeEggsBroken
    const finalAwayEggs = awayEggsBroken ?? existingMatch.awayEggsBroken

    if (finalHomeEggs > finalAwayEggs) {
      updateData.result = 'home_win'
    } else if (finalAwayEggs > finalHomeEggs) {
      updateData.result = 'away_win'
    } else {
      // Jednaki broj razbijenih jaja - rezultat ostaje null
      updateData.result = null
    }

    // Automatski postavi status na 'completed' ako su uneseni rezultati
    if ((homeEggsBroken !== undefined || awayEggsBroken !== undefined) && 
        (finalHomeEggs > 0 || finalAwayEggs > 0) && 
        updateData.result !== null) {
      updateData.status = 'completed'
    }

    // Update the match
    const match = await prisma.match.update({
      where: { id: matchId },
      data: updateData,
      include: {
        homeCompetitor: { 
          select: { 
            id: true, 
            name: true, 
            slug: true, 
            totalEggsBroken: true 
          } 
        },
        awayCompetitor: { 
          select: { 
            id: true, 
            name: true, 
            slug: true, 
            totalEggsBroken: true 
          } 
        },
        competition: { select: { id: true, name: true, slug: true } },
        round: { 
          select: { 
            id: true, 
            name: true, 
            roundNumber: true,
            roundType: true,
            pointMultiplier: true,
            groupNumber: true,
          } 
        },
      },
    })

    const multiplier = existingMatch.round?.pointMultiplier || 1

    // If match is being completed, update BRJ statistics
    if (isBeingCompleted && updateData.result) {
      await updateStatsOnMatchComplete(
        existingMatch.homeCompetitorId,
        existingMatch.awayCompetitorId,
        finalHomeEggs,
        finalAwayEggs,
        updateData.result,
        existingMatch.competitionId,
        multiplier
      )
    }

    // If match was already completed and result/eggs changed, need to reverse and reapply
    if (wasCompleted && (
      existingMatch.result !== updateData.result ||
      existingMatch.homeEggsBroken !== finalHomeEggs ||
      existingMatch.awayEggsBroken !== finalAwayEggs
    )) {
      // Reverse old result
      if (existingMatch.result) {
        await reverseMatchResult(
          existingMatch.homeCompetitorId,
          existingMatch.awayCompetitorId,
          existingMatch.homeEggsBroken,
          existingMatch.awayEggsBroken,
          existingMatch.result,
          existingMatch.competitionId,
          multiplier
        )
      }
      // Apply new result if match is still completed
      if (status !== 'cancelled' && updateData.result) {
        await updateStatsOnMatchComplete(
          existingMatch.homeCompetitorId,
          existingMatch.awayCompetitorId,
          finalHomeEggs,
          finalAwayEggs,
          updateData.result,
          existingMatch.competitionId,
          multiplier
        )
      }
    }

    return NextResponse.json(match)
  } catch (error) {
    console.error('Match update error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Brisanje meča
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const decodedToken = verifyAdminToken(request)
  if (!decodedToken) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params
    const matchId = parseInt(id)

    if (isNaN(matchId)) {
      return NextResponse.json(
        { message: 'Invalid match ID' },
        { status: 400 }
      )
    }

    // Get match to reverse stats if completed
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: { round: true },
    })

    if (!match) {
      return NextResponse.json(
        { message: 'Meč nije pronađen' },
        { status: 404 }
      )
    }

    // If match was completed, reverse the statistics
    if (match.status === 'completed' && match.result) {
      const multiplier = match.round?.pointMultiplier || 1
      await reverseMatchResult(
        match.homeCompetitorId,
        match.awayCompetitorId,
        match.homeEggsBroken,
        match.awayEggsBroken,
        match.result,
        match.competitionId,
        multiplier
      )
    }

    // Delete the match
    await prisma.match.delete({
      where: { id: matchId },
    })

    return NextResponse.json({ message: 'Meč uspješno obrisan' })
  } catch (error) {
    console.error('Match delete error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper to update stats when match is completed - BRJ sustav
async function updateStatsOnMatchComplete(
  homeId: number,
  awayId: number,
  homeEggsBroken: number,
  awayEggsBroken: number,
  result: string,
  competitionId: number | null,
  multiplier: number = 1
) {
  // Update competitor totals
  const homeUpdate: any = {
    totalEggsBroken: { increment: homeEggsBroken },
    totalEggsLost: { increment: awayEggsBroken },
  }
  const awayUpdate: any = {
    totalEggsBroken: { increment: awayEggsBroken },
    totalEggsLost: { increment: homeEggsBroken },
  }

  if (result === 'home_win') {
    homeUpdate.totalWins = { increment: 1 }
    awayUpdate.totalLosses = { increment: 1 }
  } else if (result === 'away_win') {
    homeUpdate.totalLosses = { increment: 1 }
    awayUpdate.totalWins = { increment: 1 }
  }

  await Promise.all([
    prisma.competitor.update({ where: { id: homeId }, data: homeUpdate }),
    prisma.competitor.update({ where: { id: awayId }, data: awayUpdate }),
  ])

  // Update competition rankings
  if (competitionId) {
    const homeWeightedPoints = homeEggsBroken * multiplier
    const awayWeightedPoints = awayEggsBroken * multiplier

    await Promise.all([
      prisma.ranking.upsert({
        where: { competitionId_competitorId: { competitionId, competitorId: homeId } },
        update: {
          points: { increment: homeEggsBroken },
          weightedPoints: { increment: homeWeightedPoints },
          wins: result === 'home_win' ? { increment: 1 } : undefined,
          losses: result === 'away_win' ? { increment: 1 } : undefined,
          eggsBroken: { increment: homeEggsBroken },
          eggsLost: { increment: awayEggsBroken },
        },
        create: {
          competitionId,
          competitorId: homeId,
          position: 0,
          points: homeEggsBroken,
          weightedPoints: homeWeightedPoints,
          wins: result === 'home_win' ? 1 : 0,
          losses: result === 'away_win' ? 1 : 0,
          eggsBroken: homeEggsBroken,
          eggsLost: awayEggsBroken,
        },
      }),
      prisma.ranking.upsert({
        where: { competitionId_competitorId: { competitionId, competitorId: awayId } },
        update: {
          points: { increment: awayEggsBroken },
          weightedPoints: { increment: awayWeightedPoints },
          wins: result === 'away_win' ? { increment: 1 } : undefined,
          losses: result === 'home_win' ? { increment: 1 } : undefined,
          eggsBroken: { increment: awayEggsBroken },
          eggsLost: { increment: homeEggsBroken },
        },
        create: {
          competitionId,
          competitorId: awayId,
          position: 0,
          points: awayEggsBroken,
          weightedPoints: awayWeightedPoints,
          wins: result === 'away_win' ? 1 : 0,
          losses: result === 'home_win' ? 1 : 0,
          eggsBroken: awayEggsBroken,
          eggsLost: homeEggsBroken,
        },
      }),
    ])

    // Recalculate positions - sorted by weightedPoints (BRJ s multiplikatorom)
    const rankings = await prisma.ranking.findMany({
      where: { competitionId },
      orderBy: [
        { weightedPoints: 'desc' },
        { eggsBroken: 'desc' },
        { wins: 'desc' },
        { eggsLost: 'asc' },
      ],
    })

    for (let i = 0; i < rankings.length; i++) {
      await prisma.ranking.update({
        where: { id: rankings[i].id },
        data: { position: i + 1 },
      })
    }
  }
}

// Helper to reverse match result (for deletion or result change) - BRJ sustav
async function reverseMatchResult(
  homeId: number,
  awayId: number,
  homeEggsBroken: number,
  awayEggsBroken: number,
  result: string,
  competitionId: number | null,
  multiplier: number = 1
) {
  // Reverse competitor stats
  const homeUpdate: any = {
    totalEggsBroken: { decrement: homeEggsBroken },
    totalEggsLost: { decrement: awayEggsBroken },
  }
  const awayUpdate: any = {
    totalEggsBroken: { decrement: awayEggsBroken },
    totalEggsLost: { decrement: homeEggsBroken },
  }

  if (result === 'home_win') {
    homeUpdate.totalWins = { decrement: 1 }
    awayUpdate.totalLosses = { decrement: 1 }
  } else if (result === 'away_win') {
    homeUpdate.totalLosses = { decrement: 1 }
    awayUpdate.totalWins = { decrement: 1 }
  }

  await Promise.all([
    prisma.competitor.update({ where: { id: homeId }, data: homeUpdate }),
    prisma.competitor.update({ where: { id: awayId }, data: awayUpdate }),
  ])

  // Reverse competition rankings
  if (competitionId) {
    const homeWeightedPoints = homeEggsBroken * multiplier
    const awayWeightedPoints = awayEggsBroken * multiplier

    await Promise.all([
      prisma.ranking.update({
        where: { competitionId_competitorId: { competitionId, competitorId: homeId } },
        data: {
          points: { decrement: homeEggsBroken },
          weightedPoints: { decrement: homeWeightedPoints },
          wins: result === 'home_win' ? { decrement: 1 } : undefined,
          losses: result === 'away_win' ? { decrement: 1 } : undefined,
          eggsBroken: { decrement: homeEggsBroken },
          eggsLost: { decrement: awayEggsBroken },
        },
      }).catch(() => {}), // Ignore if ranking doesn't exist
      prisma.ranking.update({
        where: { competitionId_competitorId: { competitionId, competitorId: awayId } },
        data: {
          points: { decrement: awayEggsBroken },
          weightedPoints: { decrement: awayWeightedPoints },
          wins: result === 'away_win' ? { decrement: 1 } : undefined,
          losses: result === 'home_win' ? { decrement: 1 } : undefined,
          eggsBroken: { decrement: awayEggsBroken },
          eggsLost: { decrement: homeEggsBroken },
        },
      }).catch(() => {}),
    ])

    // Recalculate positions
    const rankings = await prisma.ranking.findMany({
      where: { competitionId },
      orderBy: [
        { weightedPoints: 'desc' },
        { eggsBroken: 'desc' },
        { wins: 'desc' },
        { eggsLost: 'asc' },
      ],
    })

    for (let i = 0; i < rankings.length; i++) {
      await prisma.ranking.update({
        where: { id: rankings[i].id },
        data: { position: i + 1 },
      })
    }
  }
}
