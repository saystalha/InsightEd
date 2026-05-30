import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Meeting from '@/models/Meeting';

export async function GET(request) {
  try {
    await connectDB();
    
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const teacherName = searchParams.get('teacherName');
    const includeInactive = searchParams.get('all') === 'true';

    const filter = {};
    if (!includeInactive) {
      filter.active = true;
    }
    if (teacherName) {
      filter.teacherName = teacherName;
    }

    // Retrieve meetings, sorted by creation timestamp (newest first)
    const meetings = await Meeting.find(filter).sort({ createdAt: -1 });
    return NextResponse.json({
      success: true,
      meetings
    });
  } catch (err) {
    console.error('Failed to retrieve meetings:', err);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
