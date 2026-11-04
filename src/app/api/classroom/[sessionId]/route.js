import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import Meeting from '@/models/Meeting';
import AuditLog from '@/models/AuditLog';
import { cookies } from 'next/headers';

/**
 * Helper to get the current user or guest fallback
 */
async function resolveUser(request) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('insighted_session');

    if (sessionCookie && sessionCookie.value) {
      const user = await User.findById(sessionCookie.value);
      if (user) return user;
    }
  } catch (err) {
    // Cookie read failed
  }
  return null;
}

/**
 * GET /api/classroom/[sessionId]
 * Fetches the current state of a classroom session.
 */
export async function GET(request, { params }) {
  try {
    const { sessionId } = await params;
    const uppercaseCode = sessionId.toUpperCase();

    await connectDB();
    const meeting = await Meeting.findOne({ code: uppercaseCode });

    if (!meeting) {
      return NextResponse.json(
        { error: 'Classroom not found' },
        { status: 404 }
      );
    }

    if (!meeting.active) {
      return NextResponse.json(
        { error: 'Classroom session has ended', active: false },
        { status: 410 }
      );
    }

    // Prune stale participants (inactive for more than 20 seconds)
    const now = Date.now();
    const staleLimit = 20000;
    const originalCount = meeting.participants.length;

    meeting.participants = meeting.participants.filter(p => {
      if (p.role === 'teacher') return true;
      return (now - new Date(p.lastSeen).getTime()) < staleLimit;
    });

    if (meeting.participants.length !== originalCount) {
      await meeting.save();
    }

    // Recalculate aggregate stats based on active students
    const activeStudents = meeting.participants.filter(p => p.role === 'student');
    if (activeStudents.length > 0) {
      const avgScore = activeStudents.reduce((sum, s) => sum + (s.score || 75), 0) / activeStudents.length;
      meeting.cfi = Math.round(avgScore);
      meeting.attention = avgScore / 100;
      meeting.confusion = Math.max(0.05, Math.min(0.80, 0.95 - (avgScore / 100)));
      meeting.energy = Math.max(0.20, Math.min(1.0, (avgScore / 100) * 1.1));
      await meeting.save();
    }

    return NextResponse.json({
      success: true,
      meeting
    });
  } catch (err) {
    console.error('Error fetching classroom state:', err);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/classroom/[sessionId]
 * Handles actions inside a classroom session: join, heartbeat, chat, marker, end.
 */
export async function POST(request, { params }) {
  try {
    const { sessionId } = await params;
    const uppercaseCode = sessionId.toUpperCase();
    const body = await request.json();
    const { action, guestName, guestRole } = body;

    await connectDB();
    const meeting = await Meeting.findOne({ code: uppercaseCode, active: true });

    if (!meeting) {
      return NextResponse.json(
        { error: 'Active classroom not found' },
        { status: 404 }
      );
    }

    // Resolve user (or fallback to guest)
    const user = await resolveUser(request);
    const userId = user ? user._id.toString() : (body.peerId || 'guest_' + Math.random().toString(36).substring(2, 9));
    const userName = user ? `${user.firstName} ${user.lastName}` : (guestName || body.userName || 'Student');
    const userInitials = user
      ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
      : userName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || 'ST';
    const userRole = user ? (user.role === 'admin' ? 'teacher' : user.role) : (guestRole || body.role || 'student');

    // ── ACTION: JOIN ──
    if (action === 'join') {
      let pIdx = meeting.participants.findIndex(p => p.userId?.toString() === userId || p.name === userName);
      if (pIdx > -1) {
        meeting.participants[pIdx].lastSeen = new Date();
      } else {
        meeting.participants.push({
          userId: user ? user._id : undefined,
          name: userName,
          initials: userInitials,
          role: userRole,
          lastSeen: new Date(),
          score: 80,
          handRaised: false,
          camOff: false,
          muted: false
        });

        if (user) {
          await AuditLog.create({
            action: 'CLASSROOM_JOINED',
            details: `${userRole === 'teacher' ? 'Teacher' : 'Student'} ${userName} joined live classroom ${uppercaseCode}`,
            performedBy: user.email,
          });
        }
      }
      await meeting.save();
      return NextResponse.json({ success: true, meeting });
    }

    // ── ACTION: HEARTBEAT / STATUS UPDATE ──
    if (action === 'heartbeat') {
      let pIdx = meeting.participants.findIndex(p => p.userId?.toString() === userId || p.name === userName);
      if (pIdx > -1) {
        meeting.participants[pIdx].lastSeen = new Date();
        if (body.score !== undefined) meeting.participants[pIdx].score = body.score;
        if (body.handRaised !== undefined) meeting.participants[pIdx].handRaised = body.handRaised;
        if (body.camOff !== undefined) meeting.participants[pIdx].camOff = body.camOff;
        if (body.muted !== undefined) meeting.participants[pIdx].muted = body.muted;
        if (body.isSpeaking !== undefined) meeting.participants[pIdx].isSpeaking = body.isSpeaking;
        await meeting.save();
      }
      return NextResponse.json({ success: true });
    }

    // ── ACTION: SEND CHAT ──
    if (action === 'chat') {
      const { msg } = body;
      if (!msg) {
        return NextResponse.json({ error: 'Message cannot be empty' }, { status: 400 });
      }

      meeting.messages.push({
        sender: userName,
        msg,
        time: new Date().toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' }),
        role: userRole
      });

      await meeting.save();
      return NextResponse.json({ success: true, messages: meeting.messages });
    }

    // ── ACTION: MARK TOPIC ──
    if (action === 'marker') {
      if (userRole !== 'teacher' && user?.role !== 'admin') {
        return NextResponse.json(
          { error: 'Forbidden. Only instructors can mark classroom topics.' },
          { status: 403 }
        );
      }
      const { label, time, cfi } = body;
      if (!label || !time) {
        return NextResponse.json({ error: 'Marker label and time required' }, { status: 400 });
      }

      meeting.topicMarkers.push({
        label,
        time,
        cfi: cfi || meeting.cfi
      });

      await meeting.save();
      return NextResponse.json({ success: true, topicMarkers: meeting.topicMarkers });
    }

    // ── ACTION: END SESSION ──
    if (action === 'end') {
      if (userRole !== 'teacher' && user?.role !== 'admin') {
        return NextResponse.json(
          { error: 'Forbidden. Only instructors can end a classroom session.' },
          { status: 403 }
        );
      }
      meeting.active = false;
      await meeting.save();

      if (user) {
        await AuditLog.create({
          action: 'CLASSROOM_ENDED',
          details: `Live classroom ${uppercaseCode} was ended by ${userName}`,
          performedBy: user.email,
        });
      }

      return NextResponse.json({ success: true, message: 'Meeting session ended successfully' });
    }

    return NextResponse.json(
      { error: 'Invalid action parameter' },
      { status: 400 }
    );
  } catch (err) {
    console.error('Error handling classroom action:', err);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
