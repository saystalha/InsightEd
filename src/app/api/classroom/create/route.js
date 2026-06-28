import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import Meeting from '@/models/Meeting';
import AuditLog from '@/models/AuditLog';
import { cookies } from 'next/headers';
import crypto from 'crypto';

/**
 * Generates a cryptographically secure, unique 6-character classroom join code.
 *
 * Uses crypto.randomBytes() instead of Math.random() to ensure the code
 * cannot be predicted or brute-forced within a short time window.
 * Characters are from base-36 (a-z, 0-9), converted to uppercase.
 *
 * @returns {string} A 6-character alphanumeric code (e.g. "AB3X7Z")
 */
function generateSecureCode() {
  // Generate 4 random bytes → convert to a base-36 string → take first 6 chars
  return crypto.randomBytes(4).toString('hex').slice(0, 6).toUpperCase();
}

/**
 * POST /api/classroom/create
 *
 * Creates a new live classroom session.
 * Only teachers and admins are allowed to start a classroom.
 *
 * The session code is guaranteed to be unique across ALL meetings
 * (both active and inactive) to avoid MongoDB duplicate key errors.
 *
 * Flow:
 *  1. Verify the user is authenticated and has a teacher or admin role
 *  2. Generate a unique 6-character session code
 *  3. Create the Meeting document with the teacher as the first participant
 *  4. Write an audit log entry
 */
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
        { error: 'Session title is required' },
        { status: 400 }
      );
    }

    await connectDB();

    // Verify the session user and check their role
    const user = await User.findById(sessionCookie.value);
    if (!user) {
      return NextResponse.json(
        { error: 'User session is invalid' },
        { status: 401 }
      );
    }

    // Only teachers and admins can create classroom sessions
    if (user.role !== 'teacher' && user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only teachers and administrators can start a classroom session' },
        { status: 403 }
      );
    }

    // ── Generate a unique join code ───────────────────────────────────────
    // Check against ALL meetings (active AND inactive) to avoid MongoDB
    // duplicate key errors — the Meeting schema has a unique index on `code`.
    let code = generateSecureCode();
    let codeConflict = await Meeting.findOne({ code });
    let attempts = 0;

    while (codeConflict && attempts < 10) {
      code = generateSecureCode();
      codeConflict = await Meeting.findOne({ code });
      attempts++;
    }

    // If we couldn't generate a unique code after 10 tries (extremely unlikely),
    // return an error rather than silently creating a potentially conflicting code
    if (codeConflict) {
      return NextResponse.json(
        { error: 'Failed to generate a unique session code. Please try again.' },
        { status: 500 }
      );
    }

    const teacherName = `${user.firstName} ${user.lastName}`;

    // Create the Meeting document, with the teacher as the first participant
    const meeting = await Meeting.create({
      code,
      title: title.trim(),
      description: description?.trim() || '',
      teacherName,
      active: true,
      participants: [
        {
          userId: user._id,
          name: teacherName,
          initials: `${user.firstName[0]}${user.lastName[0]}`.toUpperCase(),
          role: 'teacher',
          lastSeen: new Date(),
          score: 75,
          handRaised: false,
          camOff: false,
          muted: false,
        },
      ],
      messages: [],
      topicMarkers: [],
    });

    // Record this classroom creation in the audit log
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
