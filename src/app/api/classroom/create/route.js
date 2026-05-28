import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import Meeting from '@/models/Meeting';
import AuditLog from '@/models/AuditLog';
import { cookies } from 'next/headers';

function generateUniqueCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
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

    const { title, description } = await request.json();
    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    await connectDB();

    // Verify user and check role
    const user = await User.findById(sessionCookie.value);
    if (!user) {
      return NextResponse.json(
        { error: 'User session invalid' },
        { status: 401 }
      );
    }

    const teacherName = `${user.firstName} ${user.lastName}`;

    // Ensure generated code is unique
    let code = generateUniqueCode();
    let codeConflict = await Meeting.findOne({ code, active: true });
    let attempts = 0;
    while (codeConflict && attempts < 10) {
      code = generateUniqueCode();
      codeConflict = await Meeting.findOne({ code, active: true });
      attempts++;
    }

    // Create the meeting document
    const meeting = await Meeting.create({
      code,
      title,
      description: description || '',
      teacherName,
      active: true,
      participants: [{
        userId: user._id,
        name: teacherName,
        initials: `${user.firstName[0]}${user.lastName[0]}`.toUpperCase(),
        role: 'teacher',
        lastSeen: new Date(),
        camOff: false,
        muted: false
      }],
      messages: [],
      topicMarkers: []
    });

    // Write to audit log
    await AuditLog.create({
      action: 'CLASSROOM_CREATED',
      details: `Teacher ${teacherName} (${user.email}) started live classroom "${title}" with code ${meeting.code}`,
      performedBy: user.email,
    });

    return NextResponse.json({
      success: true,
      code: meeting.code,
      meeting
    });
  } catch (err) {
    console.error('Error creating meeting:', err);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
