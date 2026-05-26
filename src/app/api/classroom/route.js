import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Meeting from '@/models/Meeting';

export async function GET() {
  try {
    await connectDB();
    // Retrieve active meetings, sorted by creation timestamp (newest first)
    const meetings = await Meeting.find({ active: true }).sort({ createdAt: -1 });
    return NextResponse.json({
      success: true,
      meetings
    });
  } catch (err) {
    console.error('Failed to retrieve active meetings:', err);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
