import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import Meeting from '@/models/Meeting';
import AuditLog from '@/models/AuditLog';
import Signal from '@/models/Signal';
import { cookies } from 'next/headers';

async function resolveUser() {
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
 * Verifies whether the current caller is the creator/owner of the meeting
 */
function isSessionCreator(meeting, user, userName) {
  if (meeting.teacherId && user?._id) {
    return String(meeting.teacherId) === String(user._id);
  }
  if (meeting.teacherName && userName) {
    return (
      meeting.teacherName.trim().toLowerCase() === userName.trim().toLowerCase() &&
      (user?.role === 'teacher' || user?.role === 'admin')
    );
  }
  return false;
}

/**
 * GET /api/classroom/[sessionId]
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

    // Prune stale participants (inactive for more than 25 seconds)
    const now = Date.now();
    const staleLimit = 25000;
    const originalCount = meeting.participants.length;

    const seenKeys = new Set();
    const uniqueParticipants = [];
    const sorted = [...meeting.participants].sort(
      (a, b) => new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime()
    );

    for (const p of sorted) {
      const key = p.userId ? `uid:${p.userId.toString()}` : `name:${p.name}`;
      if (!seenKeys.has(key)) {
        seenKeys.add(key);
        uniqueParticipants.push(p);
      }
    }

    meeting.participants = uniqueParticipants.filter(
      (p) => now - new Date(p.lastSeen).getTime() < staleLimit
    );

    if (meeting.participants.length !== originalCount) {
      await meeting.save();
    }

    // Recalculate aggregate focus metrics from active students
    const activeStudents = meeting.participants.filter((p) => p.role === 'student');
    if (activeStudents.length > 0) {
      const avgScore =
        activeStudents.reduce((sum, s) => sum + (s.score || 75), 0) / activeStudents.length;
      meeting.cfi = Math.round(avgScore);
      meeting.attention = avgScore / 100;
      meeting.confusion = Math.max(0.05, Math.min(0.8, 0.95 - avgScore / 100));
      meeting.energy = Math.max(0.2, Math.min(1.0, (avgScore / 100) * 1.1));
      await meeting.save();
    }

    return NextResponse.json({
      success: true,
      meeting,
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
 */
export async function POST(request, { params }) {
  try {
    const { sessionId } = await params;
    const uppercaseCode = sessionId.toUpperCase();

    let body = {};
    try {
      body = await request.json();
    } catch (e) {
      try {
        const raw = await request.text();
        if (raw) body = JSON.parse(raw);
      } catch (err2) {}
    }

    const { action, guestName, guestRole } = body;

    await connectDB();
    const meeting = await Meeting.findOne({ code: uppercaseCode, active: true });

    if (!meeting) {
      return NextResponse.json(
        { error: 'Active classroom not found' },
        { status: 404 }
      );
    }

    const user = await resolveUser();
    const userId = user
      ? user._id.toString()
      : body.peerId || 'guest_' + Math.random().toString(36).substring(2, 9);
    const userName = user
      ? `${user.firstName} ${user.lastName}`
      : guestName || body.userName || 'Student';
    const userInitials = user
      ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
      : userName
          .split(' ')
          .map((w) => w[0])
          .join('')
          .toUpperCase()
          .slice(0, 2) || 'ST';

    const creator = isSessionCreator(meeting, user, userName);
    const userRole = creator
      ? 'teacher'
      : user
      ? user.role === 'admin'
        ? 'observer'
        : user.role
      : guestRole || body.role || 'student';

    // ── ACTION: JOIN ──
    if (action === 'join') {
      const pIdx = meeting.participants.findIndex((p) =>
        user && p.userId ? p.userId.toString() === userId : p.name === userName
      );

      if (pIdx > -1) {
        meeting.participants[pIdx].lastSeen = new Date();
        meeting.participants[pIdx].role = userRole;
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
          muted: false,
        });

        if (user) {
          await AuditLog.create({
            action: 'CLASSROOM_JOINED',
            details: `${creator ? 'Host' : 'Participant'} ${userName} joined live classroom ${uppercaseCode}`,
            performedBy: user.email,
          });
        }
      }
      await meeting.save();
      return NextResponse.json({ success: true, meeting, isCreator: creator });
    }

    // ── ACTION: HEARTBEAT / STATUS UPDATE ──
    if (action === 'heartbeat') {
      const pIdx = meeting.participants.findIndex((p) =>
        user && p.userId ? p.userId.toString() === userId : p.name === userName
      );

      if (pIdx > -1) {
        meeting.participants[pIdx].lastSeen = new Date();
        if (body.score !== undefined) meeting.participants[pIdx].score = body.score;
        if (body.handRaised !== undefined) meeting.participants[pIdx].handRaised = body.handRaised;
        if (body.camOff !== undefined) meeting.participants[pIdx].camOff = body.camOff;
        if (body.muted !== undefined) meeting.participants[pIdx].muted = body.muted;
        if (body.isSpeaking !== undefined) meeting.participants[pIdx].isSpeaking = body.isSpeaking;
      } else {
        // Re-register participant if they were pruned after a brief network drop
        meeting.participants.push({
          userId: user ? user._id : undefined,
          name: userName,
          initials: userInitials,
          role: userRole,
          lastSeen: new Date(),
          score: body.score ?? 80,
          handRaised: Boolean(body.handRaised),
          camOff: Boolean(body.camOff),
          muted: Boolean(body.muted),
        });
      }
      await meeting.save();
      return NextResponse.json({ success: true });
    }

    // ── ACTION: SEND CHAT ──
    if (action === 'chat') {
      const { msg, clientMsgId } = body;
      if (!msg || !msg.trim()) {
        return NextResponse.json({ error: 'Message cannot be empty' }, { status: 400 });
      }

      const timeStr = new Date().toLocaleTimeString('en', {
        hour: '2-digit',
        minute: '2-digit',
      });

      // Prevent duplicate insertion if same sender + text was just saved
      const recentDuplicate = meeting.messages
        .slice(-5)
        .find((m) => m.sender === userName && m.msg === msg.trim() && m.time === timeStr);

      if (recentDuplicate) {
        return NextResponse.json({
          success: true,
          message: recentDuplicate,
          messages: meeting.messages,
        });
      }

      meeting.messages.push({
        sender: userName,
        msg: msg.trim(),
        time: timeStr,
        role: userRole,
        ...(clientMsgId ? { clientMsgId } : {}),
      });

      await meeting.save();
      const savedMessage = meeting.messages[meeting.messages.length - 1];

      return NextResponse.json({
        success: true,
        message: savedMessage,
        messages: meeting.messages,
      });
    }

    // ── ACTION: MARK TOPIC ──
    if (action === 'marker') {
      if (!creator && user?.role !== 'admin') {
        return NextResponse.json(
          { error: 'Forbidden. Only the session host can mark classroom topics.' },
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
        cfi: cfi || meeting.cfi,
      });

      await meeting.save();
      return NextResponse.json({ success: true, topicMarkers: meeting.topicMarkers });
    }

    // ── ACTION: LEAVE (Never ends the session — safe for page reloads & free join/leave) ──
    if (action === 'leave') {
      meeting.participants = meeting.participants.filter((p) => {
        const matchId = user && p.userId && p.userId.toString() === userId;
        const matchName = !user && p.name === userName;
        return !matchId && !matchName;
      });
      await meeting.save();

      try {
        await Signal.create({
          sessionId: uppercaseCode,
          from: body.peerId || userId,
          to: 'all',
          type: 'leave',
          senderName: userName,
          senderRole: userRole,
          timestamp: Date.now() + 10,
          createdAt: new Date(),
        });
      } catch (sigErr) {}

      return NextResponse.json({ success: true, message: 'Participant left call' });
    }

    // ── ACTION: END SESSION (Strictly Creator-Only) ──
    if (action === 'end') {
      if (!creator) {
        return NextResponse.json(
          { error: 'Forbidden. Only the creator of this meeting can end the session.' },
          { status: 403 }
        );
      }

      meeting.active = false;
      meeting.participants = [];
      await meeting.save();

      try {
        await Signal.create({
          sessionId: uppercaseCode,
          from: body.peerId || userId || 'host',
          to: 'all',
          type: 'session-ended',
          senderName: userName || 'Instructor',
          senderRole: 'teacher',
          timestamp: Date.now() + 10,
          createdAt: new Date(),
        });
      } catch (sigErr) {}

      if (user) {
        await AuditLog.create({
          action: 'CLASSROOM_ENDED',
          details: `Live classroom ${uppercaseCode} was ended by creator ${userName}`,
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