import { NextResponse } from 'next/server';
import { generateAndSaveWeeklyStats } from '@/lib/actions/channelHistory';

export async function GET() {
  try {
    // Generate stats for all channels
    await generateAndSaveWeeklyStats();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error generating stats:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate stats' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';