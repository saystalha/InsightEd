// Next.js App Router native Response handler

/**
 * In-memory signaling bus for WebRTC peer-to-peer audio, video, and screen sharing.
 * Stored on globalThis to persist across hot reloads in Next.js development.
 */
if (!globalThis.__classroomSignaling) {
  globalThis.__classroomSignaling = new Map();
}

const signalingStore = globalThis.__classroomSignaling;

function getSessionSignals(sessionId) {
  const sid = sessionId.toUpperCase();
  if (!signalingStore.has(sid)) {
    signalingStore.set(sid, {
      signals: [],
      subscribers: new Set(),
      lastActive: Date.now()
    });
  }
  return signalingStore.get(sid);
}

let lastMonotonicTime = 0;
function getMonotonicTimestamp() {
  const now = Date.now();
  lastMonotonicTime = now > lastMonotonicTime ? now : lastMonotonicTime + 1;
  return lastMonotonicTime;
}

// Clean up sessions older than 2 hours periodically
setInterval(() => {
  const now = Date.now();
  for (const [sid, data] of signalingStore.entries()) {
    if (now - data.lastActive > 2 * 60 * 60 * 1000) {
      signalingStore.delete(sid);
    }
  }
}, 60 * 1000);

/**
 * POST /api/classroom/[sessionId]/signal
 * Sends a signal message:
 * {
 *   from: string (userId/peerId),
 *   to?: string (peerId or 'all'),
 *   type: 'join' | 'offer' | 'answer' | 'ice-candidate' | 'screen-share' | 'leave' | 'chat',
 *   data: any,
 *   senderName?: string,
 *   senderRole?: string
 * }
 */
export async function POST(request, { params }) {
  try {
    const { sessionId } = await params;
    const body = await request.json();
    const { from, to = 'all', type, data, senderName, senderRole } = body;

    if (!from || !type) {
      return Response.json({ error: 'Missing required signal fields' }, { status: 400 });
    }

    const session = getSessionSignals(sessionId);
    session.lastActive = Date.now();

    const timestamp = getMonotonicTimestamp();
    const signalItem = {
      id: `${timestamp}_${Math.random().toString(36).substring(2, 9)}`,
      from,
      to,
      type,
      data,
      senderName,
      senderRole,
      timestamp
    };

    // Keep up to 200 recent signals in memory
    session.signals.push(signalItem);
    if (session.signals.length > 200) {
      session.signals.shift();
    }

    // Notify any active SSE subscribers
    session.subscribers.forEach(callback => {
      try {
        callback(signalItem);
      } catch (err) {
        // Subscriber might have disconnected
      }
    });

    return Response.json({ success: true, signalId: signalItem.id });
  } catch (err) {
    console.error('Signaling POST error:', err);
    return Response.json({ error: 'Signal transmission failed' }, { status: 500 });
  }
}

/**
 * GET /api/classroom/[sessionId]/signal?userId=...&since=...&sse=true/false
 * Polls or streams signaling messages targeted at userId or broadcast to 'all'.
 */
export async function GET(request, { params }) {
  try {
    const { sessionId } = await params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const since = parseInt(searchParams.get('since') || '0', 10);
    const isSSE = searchParams.get('sse') === 'true';

    if (!userId) {
      return Response.json({ error: 'Missing userId parameter' }, { status: 400 });
    }

    const session = getSessionSignals(sessionId);
    session.lastActive = Date.now();

    if (isSSE) {
      // Server-Sent Events stream for instant low-latency signaling
      const stream = new ReadableStream({
        start(controller) {
          const encoder = new TextEncoder();

          // Send any signals that occurred since timestamp
          const pending = session.signals.filter(s =>
            s.timestamp > since &&
            s.from !== userId &&
            (s.to === 'all' || s.to === userId)
          );

          pending.forEach(sig => {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(sig)}\n\n`));
          });

          // Callback for future signals
          const onSignal = (sig) => {
            if (sig.from !== userId && (sig.to === 'all' || sig.to === userId)) {
              try {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify(sig)}\n\n`));
              } catch (e) {
                session.subscribers.delete(onSignal);
              }
            }
          };

          session.subscribers.add(onSignal);

          // Heartbeat to keep connection open
          const interval = setInterval(() => {
            try {
              controller.enqueue(encoder.encode(': heartbeat\n\n'));
            } catch (e) {
              clearInterval(interval);
              session.subscribers.delete(onSignal);
            }
          }, 15000);

          request.signal.addEventListener('abort', () => {
            clearInterval(interval);
            session.subscribers.delete(onSignal);
          });
        }
      });

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache, no-transform',
          'Connection': 'keep-alive'
        }
      });
    }

    // Standard fast polling fallback
    const filtered = session.signals.filter(s =>
      s.timestamp > since &&
      s.from !== userId &&
      (s.to === 'all' || s.to === userId)
    );

    const latestTimestamp = session.signals.length > 0
      ? session.signals[session.signals.length - 1].timestamp
      : (lastMonotonicTime || Date.now());

    return Response.json({
      success: true,
      signals: filtered,
      serverTime: latestTimestamp
    });
  } catch (err) {
    console.error('Signaling GET error:', err);
    return Response.json({ error: 'Signal fetch failed' }, { status: 500 });
  }
}
