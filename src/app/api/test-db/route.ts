import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    console.log('Testing database connection...');
    
    // Step 1: Test basic connection
    await prisma.$connect();
    console.log('✅ Database connected');
    
    // Step 2: Test raw query
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Raw query works:', result);
    
    // Step 3: Check if admin table exists
    try {
      const count = await prisma.admin.count();
      console.log('✅ Admin table exists, count:', count);
      
      return NextResponse.json({ 
        status: 'success',
        message: 'Database working, admin table exists',
        adminCount: count
      });
    } catch (tableError) {
      const err = tableError as any;
      console.log('❌ Admin table does not exist:', err?.message);
      
      return NextResponse.json({ 
        status: 'tables_missing',
        message: 'Database connected but tables do not exist',
        error: err?.message || 'Table access failed'
      });
    }
    
  } catch (error) {
    console.error('Database test failed:', error);
    const err = error as any;
    return NextResponse.json({ 
      status: 'error',
      message: 'Database connection failed',
      error: err?.message || 'Connection failed'
    }, { status: 500 });
  }
}