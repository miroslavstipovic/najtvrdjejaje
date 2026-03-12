import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { name, email, subject, message } = await request.json()

    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { message: 'All fields are required' },
        { status: 400 }
      )
    }

    // Here you would typically send an email or save to a contact messages table
    // For now, we'll just return success
    // You could add a ContactMessage model to your Prisma schema if you want to store messages

    // Optional: Save to database (would require adding ContactMessage model to schema)
    /*
    await prisma.contactMessage.create({
      data: {
        name,
        email,
        subject,
        message,
        createdAt: new Date(),
      },
    })
    */

    // Optional: Send email notification (would require email service setup)
    /*
    await sendEmailNotification({
      to: 'admin@videoportal.com',
      subject: `Contact Form: ${subject}`,
      text: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
    })
    */

    return NextResponse.json({
      message: 'Message sent successfully',
    })
  } catch (error) {
    console.error('Contact form error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
