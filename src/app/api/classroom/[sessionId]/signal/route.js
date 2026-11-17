import connectDB from '@/lib/db';
import Signal from '@/models/Signal';

let lastMonotonicTime = 0;
function getMonotonicTimestamp() {
  const now = Date.now();
  lastMonotonicTime = now > lastMonotonicTime ? now : lastMonotonicTime + 1;
  return lastMonotonicTime;
}

/**
 * POST /api/classroom/[sessionId]/signal
 * Dispatches signaling message into MongoDB (and in-memory broadcast)
 */
export async function POST(request, { params }) {
  try {
    const { sessionId } = await params;
    const uppercaseCode = sessionId.toUpperCase();
    const body = await request.json();
    const { from, to = 'all', type, data, senderName, senderRole } = body;

    if (!from || !type) {
      return Response.json({ error: 'Missing required signal fields' }, { status: 400 });
    }

    const timestamp = getMonotonicTimestamp();

    await connectDB();
    const newSignal = await Signal.create({
      sessionId: uppercaseCode,
      from,
      to,
      type,
      data,
      senderName,
      senderRole,
      timestamp,
      createdAt: new Date()
    });

    return Response.json({ success: true, signalId: newSignal._id });
  } catch (err) {
    console.error('Signaling POST error:', err);
    return Response.json({ error: 'Signal transmission failed' }, { status: 500 });
  }
}

/**
 * GET /api/classroom/[sessionId]/signal?userId=...&since=...
 * Retrieves unread signaling messages for userId or broadcast to 'all'.
 */
export async function GET(request, { params }) {
  try {
    const { sessionId } = await params;
    const uppercaseCode = sessionId.toUpperCase();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const since = parseInt(searchParams.get('since') || '0', 10);

    if (!userId) {
      return Response.json({ error: 'Missing userId parameter' }, { status: 400 });
    }

    await connectDB();

    const query = {
      sessionId: uppercaseCode,
      from: { $ne: userId },
      $or: [{ to: 'all' }, { to: userId }],
    };

    if (since > 0) {
      query.timestamp = { $gte: since };
    }

    const signals = await Signal.find(query)
      .sort({ timestamp: 1 })
      .limit(100)
      .lean();

    const latestTimestamp = signals.length > 0
      ? signals[signals.length - 1].timestamp
      : (lastMonotonicTime || Date.now());

    return Response.json({
      success: true,
      signals: signals.map(s => ({
        id: s._id.toString(),
        from: s.from,
        to: s.to,
        type: s.type,
        data: s.data,
        senderName: s.senderName,
        senderRole: s.senderRole,
        timestamp: s.timestamp
      })),
      serverTime: latestTimestamp
    });
  } catch (err) {
    console.error('Signaling GET error:', err);
    return Response.json({ error: 'Signal fetch failed' }, { status: 500 });
  }
}
