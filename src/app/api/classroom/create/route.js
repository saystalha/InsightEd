import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import Meeting from '@/models/Meeting';
import AuditLog from '@/models/AuditLog';
import { cookies } from 'next/headers';
import crypto from 'crypto';

function generateSecureCode() {
  return crypto.randomBytes(4).toString('hex').slice(0, 6).toUpperCase();
}

export async function POST(request) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('insighted_session');

    if (!sessionCookie || !sessionCookie.value) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in.' },
        { status: 401 }
      );
    }

    const { title, description, threshold } = await request.json();

    if (!title || !title.trim()) {
      return NextResponse.json(
        { error: 'Session title is required' },
        { status: 400 }
      );
    }

    await connectDB();

    const user = await User.findById(sessionCookie.value);
    if (!user) {
      return NextResponse.json(
        { error: 'User session is invalid' },
        { status: 401 }
      );
    }

    if (user.role !== 'teacher' && user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only teachers and administrators can start a classroom session' },
        { status: 403 }
      );
    }

    // Generate a unique 6-character code across all meetings
    let code = generateSecureCode();
    let codeConflict = await Meeting.findOne({ code });
    let attempts = 0;

    while (codeConflict && attempts < 10) {
      code = generateSecureCode();
      codeConflict = await Meeting.findOne({ code });
      attempts++;
    }

    if (codeConflict) {
      return NextResponse.json(
        { error: 'Failed to generate a unique session code. Please try again.' },
        { status: 500 }
      );
    }

    const teacherName = `${user.firstName} ${user.lastName}`;
    const parsedThreshold = Number.isFinite(Number(threshold)) ? Number(threshold) : 40;

    const meeting = await Meeting.create({
      code,
      title: title.trim(),
      description: description?.trim() || '',
      teacherName,
      teacherId: user._id,
      threshold: parsedThreshold,
      active: true,
      participants: [],
      messages: [],
      topicMarkers: [],
    });

    await AuditLog.create({
      action: 'CLASSROOM_CREATED',
      details: `${user.role === 'admin' ? 'Admin' : 'Teacher'} ${teacherName} (${user.email}) started live classroom "${title.trim()}" with join code ${meeting.code}`,
      performedBy: user.email,
    });

    return NextResponse.json({ success: true, code: meeting.code, meeting });
  } catch (err) {
    console.error('Error creating meeting:', err);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}