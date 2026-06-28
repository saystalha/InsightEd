import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Meeting from '@/models/Meeting';
import { cookies } from 'next/headers';

/**
 * GET /api/classroom
 *
 * Returns a list of meeting sessions.
 * Requires an authenticated session (any role: admin, teacher, student).
 *
 * Query parameters:
 *   - `teacherName` (string) — filter sessions by the teacher's name
 *   - `all` (boolean, "true") — include inactive (ended) sessions;
 *                               defaults to active-only
 *
 * Used by:
 *   - Admin dashboard: to list all active sessions for monitoring
 *   - Teacher dashboard: to list their own past and active sessions
 *   - Student dashboard: to find joinable active sessions
 */
export async function GET(request) {
  try {
    // Require a valid session — any authenticated user may view sessions
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('insighted_session');
    if (!sessionCookie || !sessionCookie.value) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in to view classroom sessions.' },
        { status: 401 }
      );
    }

    await connectDB();

    // Parse optional query parameters
    const { searchParams } = new URL(request.url);
    const teacherName = searchParams.get('teacherName');
    const includeInactive = searchParams.get('all') === 'true';

    // Build the MongoDB filter object
    const filter = {};
    if (!includeInactive) {
      // By default, only return active (ongoing) sessions
      filter.active = true;
    }
    if (teacherName) {
      // Filter to a specific teacher's sessions (used by teacher dashboard)
      filter.teacherName = teacherName;
    }

    // Retrieve matching meetings, newest first
    const meetings = await Meeting.find(filter).sort({ createdAt: -1 });

    return NextResponse.json({ success: true, meetings });
  } catch (err) {
    console.error('Failed to retrieve meetings:', err);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
