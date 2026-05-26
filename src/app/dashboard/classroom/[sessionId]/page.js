'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useRouter, useParams } from 'next/navigation';
import { Suspense } from 'react';

/* ─── SVG Icon ─────────────────────────── */
function Icon({ d, size = 20, fill = 'none', ...rest }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke="currentColor"
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...rest}>
      {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p} />) : <path d={d} />}
    </svg>
  );
}

/* ─── Circular Gauge (CFI) ─────────────── */
function CircularGauge({ value = 72, size = 130 }) {
  const r = size / 2 - 12;
  const circ = 2 * Math.PI * r;
  const dash = (value / 100) * circ;
  const color = value > 65 ? '#c47c3e' : value > 40 ? '#d4924e' : '#8c5828';
  const label = value > 65 ? 'High Engagement' : value > 40 ? 'Moderate Attention' : 'Low Engagement';
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(196,124,62,0.12)" strokeWidth="10" />
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="10"
            strokeDasharray={`${dash} ${circ - dash}`} strokeDashoffset={circ / 4} strokeLinecap="round"
            style={{ transition: 'stroke-dasharray 0.8s ease, stroke 0.5s' }} />
        </svg>
        <div className="absolute text-center">
          <p className="text-[1.5rem] font-black text-snow leading-none">{value}</p>
          <p className="text-[0.6rem] text-mist font-semibold">CFI</p>
        </div>
      </div>
      <p className="text-[0.75rem] font-bold text-copper">{label}</p>
    </div>
  );
}

/* ─── Metric Bar ─────────────────────── */
function MetricBar({ label, value }) {
  const gradient = label === 'Attention'
    ? 'linear-gradient(90deg, #8c5828, #c47c3e)'
    : label === 'Confusion'
      ? 'linear-gradient(90deg, #8c5828, #d4924e)'
      : 'linear-gradient(90deg, #8c5828, #c47c3e)';
      
  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between items-center">
        <span className="text-[0.75rem] text-mist font-medium">{label}</span>
        <span className="text-[0.78rem] font-bold text-snow">{Math.round(value * 100)}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-[rgba(196,124,62,0.12)] overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${value * 100}%`, background: gradient }} />
      </div>
    </div>
  );
}

/* ─── Initial Data ─────────────────── */
const INITIAL_CHAT_MSGS = [
  { id: 1, sender: 'Alice Johnson', msg: 'Can you explain the second step again?', time: '10:14', role: 'student' },
  { id: 2, sender: 'Dr. Ahmed', msg: 'Sure! The key is to apply the chain rule first.', time: '10:15', role: 'teacher' },
  { id: 3, sender: 'Bob Martinez', msg: 'I have a question about the derivative formula', time: '10:16', role: 'student' },
  { id: 4, sender: 'Carol Lee', msg: '✋ I raised my hand', time: '10:17', role: 'student' },
];

/* ─── Teacher View ────────────────────── */
function TeacherView({ sessionId }) {
  const router = useRouter();
  
  // Safe state initialization from localStorage
  const [userName, setUserName] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('userName') || 'Dr. Ahmed';
    }
    return 'Dr. Ahmed';
  });

  const [meetingTitle, setMeetingTitle] = useState('Advanced Mathematics');
  const [cfi, setCfi] = useState(75);
  const [trend, setTrend] = useState('stable');
  const [metrics, setMetrics] = useState({ attention: 0.75, confusion: 0.20, energy: 0.70 });
  
  const [chatOpen, setChatOpen] = useState(false);
  const [participantsOpen, setParticipantsOpen] = useState(true);
  const [breakAlert, setBreakAlert] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const [topicLabel, setTopicLabel] = useState('');
  const [topicMarkers, setTopicMarkers] = useState([]);
  const [chatMsg, setChatMsg] = useState('');
  
  const [messages, setMessages] = useState([]);
  const [students, setStudents] = useState([]);
  const [elapsed, setElapsed] = useState(0);
  const [muted, setMuted] = useState(false);
  const [camOff, setCamOff] = useState(false);
  const [handAlerts, setHandAlerts] = useState([]);

  // Join Toast Notifications
  const [joinNotifications, setJoinNotifications] = useState([]);
  const prevStudentsRef = useRef([]);

  // Voice Detection State
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Media Streams State
  const [stream, setStream] = useState(null);
  const [screenStream, setScreenStream] = useState(null);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  // References for live streams
  const localVideoRef = useRef(null);
  const localVideoRefSmall = useRef(null);
  const screenVideoRef = useRef(null);

  // Retrieve actual authenticated teacher name
  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.authenticated && data.user) {
          const fullName = `${data.user.firstName} ${data.user.lastName}`;
          setUserName(fullName);
          localStorage.setItem('userName', fullName);
        }
      })
      .catch(err => console.error('Session retrieve failed:', err));
  }, []);

  const userInitials = userName
    ? userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'JD';

  // Poll classroom state from MongoDB
  useEffect(() => {
    async function fetchSessionState() {
      try {
        const res = await fetch(`/api/classroom/${sessionId}`);
        const data = await res.json();
        if (res.ok && data.success) {
          const meeting = data.meeting;
          setMeetingTitle(meeting.title);
          
          // Update participants & students list
          const activeParticipants = meeting.participants || [];
          const activeStudents = activeParticipants.filter(p => p.role === 'student');
          
          // Detect joins
          const prevIds = prevStudentsRef.current.map(s => s._id || s.userId);
          activeStudents.forEach(s => {
            const currentId = s._id || s.userId;
            if (prevIds.length > 0 && !prevIds.includes(currentId)) {
              // Trigger a toast notification
              const nId = Date.now() + Math.random();
              setJoinNotifications(prev => [...prev, { id: nId, message: `${s.name} joined the meeting` }]);
              setTimeout(() => {
                setJoinNotifications(prev => prev.filter(n => n.id !== nId));
              }, 4000);
            }
          });
          prevStudentsRef.current = activeStudents;
          setStudents(activeStudents);

          // Update alerts for raised hands
          setHandAlerts(
            activeStudents
              .filter(s => s.handRaised)
              .map(s => ({ id: s._id || s.userId, name: s.name }))
          );

          // Sync chats & markers
          setMessages(meeting.messages || []);
          setTopicMarkers(meeting.topicMarkers || []);

          // Sync classroom-wide telemetry
          setCfi(meeting.cfi);
          setMetrics({
            attention: meeting.attention,
            confusion: meeting.confusion,
            energy: meeting.energy
          });

          if (meeting.cfi < 40) {
            setBreakAlert(true);
          }
        } else if (data.active === false) {
          // If session is terminated
          alert('Session has ended.');
          router.push('/dashboard');
        }
      } catch (err) {
        console.error('Error fetching session state:', err);
      }
    }

    // Join meeting initially
    fetch(`/api/classroom/${sessionId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'join' })
    })
      .then(() => fetchSessionState())
      .catch(err => console.error('Join session error:', err));

    const pollInterval = setInterval(fetchSessionState, 3000);
    return () => clearInterval(pollInterval);
  }, [sessionId, router]);

  // Keep heartbeat alive for teacher
  useEffect(() => {
    const heartbeatInterval = setInterval(() => {
      fetch(`/api/classroom/${sessionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'heartbeat',
          score: 100,
          handRaised: false,
          camOff,
          muted
        })
      }).catch(err => console.error('Heartbeat sync failed:', err));
    }, 3000);
    return () => clearInterval(heartbeatInterval);
  }, [sessionId, camOff, muted]);

  // Request/release webcam stream
  useEffect(() => {
    let activeStream = null;
    async function initCamera() {
      if (typeof window !== 'undefined' && navigator.mediaDevices && !camOff) {
        try {
          const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
          activeStream = mediaStream;
          setStream(mediaStream);
        } catch (err) {
          console.warn('Webcam permission denied or unavailable:', err);
          setCamOff(true);
        }
      } else {
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
          setStream(null);
        }
      }
    }
    initCamera();

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach(t => t.stop());
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [camOff]);

  // Real-time microphone speech analyzer
  useEffect(() => {
    if (!stream || muted) {
      setTimeout(() => setIsSpeaking(false), 0);
      return;
    }

    const audioTracks = stream.getAudioTracks();
    if (audioTracks.length === 0) return;

    let audioContext;
    let analyser;
    let source;
    let rafId;

    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      audioContext = new AudioContextClass();
      analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;

      source = audioContext.createMediaStreamSource(new MediaStream([audioTracks[0]]));
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const checkSpeechVolume = () => {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const average = sum / bufferLength;
        setIsSpeaking(average > 8); // threshold level
        rafId = requestAnimationFrame(checkSpeechVolume);
      };
      checkSpeechVolume();
    } catch (err) {
      console.warn('Audio Context failed:', err);
    }

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      if (source) source.disconnect();
      if (audioContext && audioContext.state !== 'closed') {
        audioContext.close();
      }
    };
  }, [stream, muted]);

  // Handle mute track updates
  useEffect(() => {
    if (stream) {
      stream.getAudioTracks().forEach(track => {
        track.enabled = !muted;
      });
    }
  }, [muted, stream]);

  // Bind local video source
  useEffect(() => {
    if (isScreenSharing) {
      if (localVideoRefSmall.current) {
        localVideoRefSmall.current.srcObject = stream || null;
      }
    } else {
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream || null;
      }
    }
  }, [stream, camOff, isScreenSharing]);

  // Bind screen video source
  useEffect(() => {
    if (screenVideoRef.current) {
      screenVideoRef.current.srcObject = screenStream || null;
    }
  }, [screenStream, isScreenSharing]);

  // Screen sharing triggers
  const startScreenShare = async () => {
    if (typeof window !== 'undefined' && navigator.mediaDevices) {
      try {
        const scrStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        setScreenStream(scrStream);
        setIsScreenSharing(true);

        scrStream.getVideoTracks()[0].onended = () => {
          stopScreenShare(scrStream);
        };
      } catch (err) {
        console.error('Screen capture rejected:', err);
      }
    }
  };

  const stopScreenShare = (passedStream) => {
    const activeScr = passedStream || screenStream;
    if (activeScr) {
      activeScr.getTracks().forEach(t => t.stop());
    }
    setScreenStream(null);
    setIsScreenSharing(false);
  };

  // Student Canvas Animation Loop
  useEffect(() => {
    let animationFrameId;
    const render = () => {
      students.forEach(s => {
        const canvases = [
          document.getElementById(`student-canvas-${s._id || s.userId}`),
          document.getElementById(`student-canvas-small-${s._id || s.userId}`)
        ].filter(Boolean);

        canvases.forEach(canvas => {
          const ctx = canvas.getContext('2d');
          if (!ctx) return;

          const w = canvas.width = canvas.clientWidth || 160;
          const h = canvas.height = canvas.clientHeight || 120;

          // Charcoal navy background
          ctx.fillStyle = '#0a0e16';
          ctx.fillRect(0, 0, w, h);

          const time = Date.now() * 0.001 + (s.score || 0) * 10;

          // Ambient glowing gradient matching attention index
          const grad = ctx.createRadialGradient(w/2, h/2, 5, w/2, h/2, w/1.2);
          const colorHue = s.camOff ? 0 : s.handRaised ? 35 : (s.score >= 70 ? 120 : s.score >= 50 ? 38 : 10);
          grad.addColorStop(0, `hsla(${colorHue}, 45%, 15%, 0.35)`);
          grad.addColorStop(1, '#0e1525');
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, w, h);

          // Head & shoulders avatar silhouette
          ctx.fillStyle = s.handRaised ? 'rgba(196, 124, 62, 0.22)' : 'rgba(196, 124, 62, 0.08)';
          ctx.beginPath();
          ctx.arc(w / 2, h / 2 - 10, h * 0.18, 0, Math.PI * 2);
          ctx.fill();

          ctx.beginPath();
          ctx.ellipse(w / 2, h / 2 + h * 0.25, h * 0.28, h * 0.18, 0, 0, Math.PI * 2);
          ctx.fill();

          // Camera off overlay
          if (s.camOff) {
            ctx.fillStyle = 'rgba(15,24,36,0.65)';
            ctx.fillRect(0, 0, w, h);
            ctx.fillStyle = 'rgba(255,255,255,0.15)';
            ctx.font = '10px Outfit, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('Camera Off', w/2, h/2 + 25);
          }

          // Action rings (Hand Raised vs Attention Level)
          if (s.handRaised) {
            ctx.strokeStyle = '#c47c3e';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.arc(w / 2, h / 2 - 10, h * 0.22 + Math.sin(time * 8) * 3, 0, Math.PI * 2);
            ctx.stroke();
          } else if (!s.camOff) {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(w / 2, h / 2 - 10, h * 0.20 + Math.sin(time * 2.5) * 1.5, 0, Math.PI * 2);
            ctx.stroke();
          }
        });
      });
      animationFrameId = requestAnimationFrame(render);
    };
    render();
    return () => cancelAnimationFrame(animationFrameId);
  }, [students, isScreenSharing]);

  // Elapsed timer
  useEffect(() => {
    const t = setInterval(() => setElapsed(s => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const formatTime = (s) => `${String(Math.floor(s / 3600)).padStart(2, '0')}:${String(Math.floor((s % 3600) / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const markTopic = async () => {
    if (!topicLabel.trim()) return;
    try {
      const res = await fetch(`/api/classroom/${sessionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'marker',
          label: topicLabel,
          time: formatTime(elapsed),
          cfi
        })
      });
      if (res.ok) {
        setTopicLabel('');
      }
    } catch (err) {
      console.error('Error marking topic:', err);
    }
  };

  const sendChat = async () => {
    if (!chatMsg.trim()) return;
    try {
      const res = await fetch(`/api/classroom/${sessionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'chat',
          msg: chatMsg
        })
      });
      if (res.ok) {
        setChatMsg('');
      }
    } catch (err) {
      console.error('Error sending chat:', err);
    }
  };

  const endClass = async () => {
    if (window.confirm('End this class session?')) {
      try {
        await fetch(`/api/classroom/${sessionId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'end' })
        });
      } catch (err) {
        console.error('Error ending class:', err);
      }
      router.push('/dashboard');
    }
  };

  const scoreColor = (s) => s >= 75 ? '#d4924e' : s >= 50 ? '#c47c3e' : 'rgba(242,242,242,0.50)';

  return (
    <div className="h-screen flex flex-col overflow-hidden dashboard-bg text-snow relative">
      <style>{`
        @keyframes voiceRipple {
          0% { transform: scale(1); opacity: 0.7; }
          50% { transform: scale(1.15); opacity: 0.35; }
          100% { transform: scale(1.3); opacity: 0; }
        }
      `}</style>

      {/* ── TOAST NOTIFICATIONS ────────────────── */}
      <div className="fixed bottom-20 left-6 z-50 flex flex-col gap-2 pointer-events-none">
        {joinNotifications.map(n => (
          <div key={n.id} className="flex items-center gap-2.5 px-4.5 py-3 rounded-xl shadow-2xl bg-copper border border-white/10 text-white font-extrabold text-xs animate-fadeUp">
            <span>👤</span>
            <p>{n.message}</p>
          </div>
        ))}
      </div>

      {/* ── BREAK ALERT BANNER ────────────────── */}
      {breakAlert && (
        <div id="break-alert-banner" className="flex-shrink-0 flex items-center justify-between px-6 py-3 z-50 animate-fadeUp"
          style={{ background: 'rgba(21,32,56,0.95)', borderBottom: '1px solid rgba(196,124,62,0.30)' }}>
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-copper animate-pulse" />
            <div>
              <p className="text-[0.88rem] font-bold text-white">Engagement Alert — CFI dropped to {cfi}%</p>
              <p className="text-[0.76rem] text-mist">Recommend a 5-minute break to restore attention</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button id="call-break-btn" onClick={() => setBreakAlert(false)}
              className="px-4 py-2 rounded-xl text-[0.82rem] font-bold btn-primary">
              Call Break
            </button>
            <button onClick={() => setBreakAlert(false)} className="text-mist hover:text-snow transition-colors">
              <Icon d="M18 6 6 18M6 6l12 12" size={18} />
            </button>
          </div>
        </div>
      )}

      {/* ── HAND RAISE ALERTS ──────────────────── */}
      {handAlerts.length > 0 && (
        <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
          {handAlerts.map(h => (
            <div key={h.id} id={`hand-alert-${h.id}`} className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl shadow-lg card-navy border border-copper/15">
              <span>✋</span>
              <p className="text-[0.82rem] font-semibold text-snow">{h.name} raised hand</p>
              <button onClick={() => setHandAlerts(prev => prev.filter(x => x.id !== h.id))}
                className="text-copper/60 hover:text-copper ml-1 transition-colors">×</button>
            </div>
          ))}
        </div>
      )}

      {/* ── TOP BAR ────────────────────────────── */}
      <div id="teacher-topbar" className="flex-shrink-0 flex items-center justify-between px-5 py-3 glass-topbar">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-copper animate-pulse" />
            <span className="text-[0.8rem] font-bold text-snow">LIVE ({sessionId})</span>
          </div>
          <div className="w-px h-4 bg-[rgba(196,124,62,0.25)]" />
          <p className="text-[0.88rem] font-semibold text-snow">{meetingTitle}</p>
          <div className="w-px h-4 bg-[rgba(196,124,62,0.25)]" />
          <span className="text-[0.8rem] text-mist font-mono">{formatTime(elapsed)}</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[0.75rem] font-semibold badge-copper">
            <Icon d={['M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2', 'M23 21v-2a4 4 0 0 0-3-3.87', 'M16 3.13a4 4 0 0 1 0 7.75']} size={13} />
            {students.length} Student(s)
          </div>
          <button id="topbar-participants" onClick={() => setParticipantsOpen(!participantsOpen)}
            className={`px-3 py-1.5 rounded-lg text-[0.75rem] font-semibold transition-colors ${participantsOpen ? 'badge-copper' : 'btn-secondary border-none shadow-none text-mist'}`}>
            Participants
          </button>
          <button id="topbar-chat" onClick={() => setChatOpen(!chatOpen)}
            className={`px-3 py-1.5 rounded-lg text-[0.75rem] font-semibold transition-colors ${chatOpen ? 'badge-copper' : 'btn-secondary border-none shadow-none text-mist'}`}>
            Chat
          </button>
        </div>
      </div>

      {/* ── MAIN BODY ──────────────────────────── */}
      <div className="flex-1 flex overflow-hidden">

        {/* Left: Video Grid / Presentation Workspace */}
        <div className="flex-1 flex flex-col overflow-hidden p-4 gap-4">
          
          {isScreenSharing ? (
            /* Presentation Mode active layout */
            <div className="flex-1 flex flex-col min-h-0">
              <div id="screen-share-stage" className="flex-1 relative rounded-[16px] overflow-hidden card-navy border border-copper/25 bg-black flex items-center justify-center">
                <video ref={screenVideoRef} autoPlay playsInline muted className="w-full h-full object-contain" />
                <div className="absolute bottom-3 left-3 text-[0.75rem] font-bold text-snow px-3 py-1.5 rounded-lg" style={{ background: 'rgba(15,24,36,0.80)' }}>
                  Screen Sharing Active
                </div>
                <button onClick={() => stopScreenShare(null)} className="absolute bottom-3 right-3 px-3 py-1.5 rounded-lg text-[0.75rem] font-bold bg-red-500/20 border border-red-500/40 text-red-400 hover:bg-red-500/30 transition-all">
                  Stop Presentation
                </button>
              </div>

              {/* Row of small participant cameras underneath */}
              <div className="h-[110px] flex gap-3 mt-3 overflow-x-auto pb-1 flex-shrink-0">
                {/* Teacher feed */}
                <div className="w-[150px] h-full relative rounded-xl overflow-hidden card-navy border border-white/5 flex-shrink-0">
                  {camOff ? (
                    <div className="w-full h-full flex items-center justify-center text-sm font-black bg-gradient-to-br from-[rgba(196,124,62,0.15)] to-[rgba(21,32,56,0.80)]">{userInitials}</div>
                  ) : (
                    <video ref={localVideoRefSmall} autoPlay playsInline muted className="w-full h-full object-cover" />
                  )}
                  <div className="absolute bottom-1 left-1 text-[0.6rem] text-white px-1.5 py-0.5 rounded" style={{ background: 'rgba(15,24,36,0.65)' }}>You</div>
                </div>

                {/* Student feeds */}
                {students.map(s => (
                  <div key={s._id || s.userId} className="w-[150px] h-full relative rounded-xl overflow-hidden card-navy flex-shrink-0 flex items-center justify-center border border-white/5">
                    <canvas id={`student-canvas-small-${s._id || s.userId}`} className="absolute inset-0 w-full h-full object-cover opacity-85" />
                    <div className="relative z-10 w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-black" style={{ background: 'linear-gradient(135deg, #c47c3e, #8c5828)' }}>{s.initials}</div>
                    <div className="absolute bottom-1 left-1 right-1 flex items-center justify-between text-[0.58rem] text-white px-1 py-0.5 rounded" style={{ background: 'rgba(15,24,36,0.65)' }}>
                      <span className="truncate max-w-[55px]">{s.name.split(' ')[0]}</span>
                      <span style={{ color: scoreColor(s.score) }}>{s.score}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Standard Grid Layout */
            <>
              {/* Teacher main self-camera card */}
              <div id="teacher-self-view" className="relative rounded-[16px] overflow-hidden flex-shrink-0 card-navy border border-white/5"
                style={{ height: 260 }}>
                <div className="w-full h-full flex items-center justify-center">
                  {camOff ? (
                    <div className="w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-black"
                      style={{ background: 'linear-gradient(135deg, #c47c3e, #8c5828)' }}>{userInitials}</div>
                  ) : (
                    <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                  )}
                </div>
                <div className="absolute bottom-3 left-3 text-[0.72rem] font-semibold text-white px-2.5 py-1 rounded-md"
                  style={{ background: 'rgba(15,24,36,0.65)' }}>{userName} (Teacher / Host)</div>
                {muted && (
                  <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-[rgba(15,24,36,0.70)] flex items-center justify-center">
                    <Icon d="M1 1l22 22M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" size={14} />
                  </div>
                )}
              </div>

              {/* Student video grids */}
              <div id="student-video-grid" className="flex-1 grid grid-cols-3 gap-3 overflow-y-auto">
                {students.length === 0 ? (
                  <div className="col-span-3 flex flex-col items-center justify-center p-8 text-center text-mist/60 card-navy rounded-2xl border border-white/5">
                    <span className="text-3xl mb-2 animate-bounce">👋</span>
                    <p className="text-[0.88rem] font-bold text-snow">Classroom is Empty</p>
                    <p className="text-xs text-mist/40 mt-0.5">Share access token code <strong className="text-copper">{sessionId}</strong> to let students join.</p>
                  </div>
                ) : (
                  students.map(s => (
                    <div key={s._id || s.userId} id={`student-video-${s._id || s.userId}`}
                      className="relative rounded-[14px] overflow-hidden aspect-video flex items-center justify-center card-navy border"
                      style={{
                        borderColor: s.handRaised ? 'rgba(196,124,62,0.70)' : 'rgba(196,124,62,0.14)',
                        boxShadow: s.handRaised ? '0 0 16px rgba(196,124,62,0.30)' : 'none',
                      }}>
                      <canvas id={`student-canvas-${s._id || s.userId}`} className="absolute inset-0 w-full h-full object-cover opacity-85" />
                      <div className="relative z-10 w-11 h-11 rounded-full flex items-center justify-center text-white text-sm font-black"
                        style={{ background: 'linear-gradient(135deg, #c47c3e, #8c5828)' }}>{s.initials}</div>
                      
                      <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between z-10">
                        <span className="text-[0.65rem] font-semibold text-white px-1.5 py-0.5 rounded-md truncate"
                          style={{ background: 'rgba(15,24,36,0.65)', maxWidth: 85 }}>{s.name.split(' ')[0]}</span>
                        <span className="text-[0.65rem] font-bold px-1.5 py-0.5 rounded-md"
                          style={{ background: 'rgba(15,24,36,0.65)', color: scoreColor(s.score) }}>{s.score}%</span>
                      </div>
                      {s.handRaised && (
                        <div className="absolute top-2 right-2 text-base z-10 animate-bounce">✋</div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>

        {/* Right: Analytics Sidebar */}
        <div id="analytics-sidebar" className="w-[280px] flex-shrink-0 flex flex-col glass-sidebar overflow-y-auto">

          {/* CFI Gauge */}
          <div className="p-5 border-b border-[rgba(196,124,62,0.12)] flex flex-col items-center gap-4">
            <CircularGauge value={cfi} />
            <div className="flex items-center gap-1.5">
              {trend === 'improving'
                ? <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#c47c3e" strokeWidth="2.5"><path d="M7 17l9.2-9.2M17 17V7H7" /></svg><span className="text-[0.75rem] text-copper font-semibold">Improving</span></>
                : <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(196,124,62,0.50)" strokeWidth="2.5"><path d="M17 7l-9.2 9.2M7 7v10h10" /></svg><span className="text-[0.75rem] text-mist font-semibold">Declining</span></>
              }
            </div>
          </div>

          {/* Metrics */}
          <div className="p-5 border-b border-[rgba(196,124,62,0.12)] flex flex-col gap-3">
            <p className="text-[0.72rem] font-bold uppercase tracking-[0.10em] text-mist/40">Live Metrics</p>
            <MetricBar label="Attention" value={metrics.attention} />
            <MetricBar label="Confusion" value={metrics.confusion} />
            <MetricBar label="Energy" value={metrics.energy} />
            <div className="pt-1 text-[0.73rem] text-mist/40">
              Active students: <strong className="text-mist">{students.length}</strong>
            </div>
          </div>

          {/* Topic Marker */}
          <div id="topic-marker-section" className="p-5 border-b border-[rgba(196,124,62,0.12)]">
            <p className="text-[0.72rem] font-bold uppercase tracking-[0.10em] text-mist/40 mb-3">Topic Marker</p>
            <div className="flex gap-2 mb-3">
              <input id="topic-label-input" type="text" placeholder="e.g. Started Derivatives"
                value={topicLabel} onChange={e => setTopicLabel(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && markTopic()}
                className="flex-1 px-3 py-2 rounded-lg text-[0.82rem] text-snow placeholder:text-mist/30 outline-none neu-input" />
              <button id="mark-topic-btn" onClick={markTopic}
                className="px-3 py-2 rounded-lg text-[0.78rem] font-bold btn-primary">Mark</button>
            </div>
            {topicMarkers.length > 0 && (
              <div className="flex flex-col gap-1.5 max-h-[120px] overflow-y-auto">
                {topicMarkers.map((m, i) => (
                  <div key={i} className="flex items-center gap-2 text-[0.73rem]">
                    <span className="w-1.5 h-1.5 rounded-full bg-copper flex-shrink-0" />
                    <span className="text-snow/70 truncate flex-1">{m.label}</span>
                    <span className="text-mist/40 flex-shrink-0">{m.time}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Broadcast */}
          <div id="announcement-section" className="p-5">
            <p className="text-[0.72rem] font-bold uppercase tracking-[0.10em] text-mist/40 mb-3">Announce to Class</p>
            <div className="flex gap-2">
              <input id="announcement-input" type="text" placeholder="Broadcast a message…"
                value={announcement} onChange={e => setAnnouncement(e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg text-[0.82rem] text-snow placeholder:text-mist/30 outline-none neu-input" />
              <button id="send-announcement-btn" onClick={() => setAnnouncement('')}
                className="px-3 py-2 rounded-lg text-[0.78rem] font-bold btn-secondary">Send</button>
            </div>
          </div>
        </div>

        {/* Participants Panel */}
        {participantsOpen && (
          <div id="participants-panel-teacher" className="w-[260px] flex-shrink-0 flex flex-col card-navy border-y-0 border-r-0 border-l border-[rgba(196,124,62,0.15)] rounded-none">
            <div className="px-4 py-3 border-b border-[rgba(196,124,62,0.12)] flex items-center justify-between">
              <p className="text-[0.82rem] font-bold text-snow">Participants ({students.length + 1})</p>
              <button onClick={() => setParticipantsOpen(false)} className="text-mist hover:text-snow transition-colors">
                <Icon d="M18 6 6 18M6 6l12 12" size={14} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
              {/* Teacher */}
              <div className="flex items-center gap-2.5 py-1">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[0.65rem] font-bold flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, #c47c3e, #8c5828)' }}>{userInitials}</div>
                <span className="text-[0.8rem] text-mist flex-1 truncate">{userName}</span>
                <span className="text-[0.65rem] text-copper font-semibold">Host</span>
              </div>
              {/* Students */}
              {students.length === 0 ? (
                <p className="text-center text-mist/30 text-[0.72rem] mt-8">No students connected</p>
              ) : (
                students.map(s => (
                  <div key={s._id || s.userId} className="flex items-center gap-2.5 py-1">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[0.65rem] font-bold flex-shrink-0"
                      style={{ background: 'linear-gradient(135deg, #c47c3e, #8c5828)' }}>{s.initials}</div>
                    <span className="text-[0.8rem] text-mist flex-1 truncate">{s.name}</span>
                    <div className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ background: s.score >= 75 ? '#d4924e' : s.score >= 50 ? '#c47c3e' : '#8c5828' }} />
                    {s.handRaised && <span className="text-xs">✋</span>}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Chat Panel */}
        {chatOpen && (
          <div id="chat-panel-teacher" className="w-[260px] flex-shrink-0 flex flex-col card-navy border-y-0 border-r-0 border-l border-[rgba(196,124,62,0.15)] rounded-none">
            <div className="px-4 py-3 border-b border-[rgba(196,124,62,0.12)] flex items-center justify-between">
              <p className="text-[0.82rem] font-bold text-snow">Class Chat</p>
              <button onClick={() => setChatOpen(false)} className="text-mist hover:text-snow transition-colors">
                <Icon d="M18 6 6 18M6 6l12 12" size={14} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2.5">
              {messages.length === 0 ? (
                <p className="text-center text-mist/30 text-xs mt-8">No messages in chat</p>
              ) : (
                messages.map(m => (
                  <div key={m._id || m.id} className={`flex flex-col gap-0.5 ${m.sender.includes('(You)') || m.role === 'teacher' ? 'items-end' : 'items-start'}`}>
                    <span className="text-[0.67rem] text-mist/40">{m.sender}</span>
                    <div className="px-3 py-2 rounded-[12px] max-w-[90%]"
                      style={{ background: m.role === 'teacher' ? 'rgba(196,124,62,0.16)' : 'rgba(15,24,36,0.60)', border: '1px solid rgba(196,124,62,0.10)' }}>
                      <p className="text-[0.8rem] text-snow/90 leading-[1.5]">{m.msg}</p>
                    </div>
                    <span className="text-[0.64rem] text-mist/25">{m.time}</span>
                  </div>
                ))
              )}
            </div>
            <div className="p-3 border-t border-[rgba(196,124,62,0.12)] flex gap-2">
              <input type="text" placeholder="Type a message…" value={chatMsg} onChange={e => setChatMsg(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendChat()}
                className="flex-1 px-3 py-2 rounded-xl text-[0.8rem] text-white placeholder:text-mist/35 outline-none neu-input" />
              <button onClick={sendChat} className="w-8 h-8 rounded-xl flex items-center justify-center btn-primary flex-shrink-0">
                <Icon d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" size={13} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── CONTROL BAR (Centered & Grouped) ── */}
      <div id="teacher-control-bar" className="flex-shrink-0 flex items-center justify-center px-6 py-3 glass-topbar border-t border-b-0">
        <div className="flex items-center gap-3">
          
          {/* Mute Button (With voice pulse ripple) */}
          <button id="ctrl-mute" onClick={() => setMuted(!muted)}
            className={`relative flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all ${muted ? 'badge-copper' : 'btn-secondary border-none shadow-none text-mist'}`}>
            {isSpeaking && (
              <span className="absolute inset-0 rounded-xl bg-[#c47c3e]/30 pointer-events-none" style={{ animation: 'voiceRipple 1.2s infinite ease-out' }} />
            )}
            <Icon d={muted ? 'M1 1l22 22M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23M12 19v4M8 23h8' : 'M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3zM19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8'} size={18} stroke={muted ? '#d4924e' : 'rgba(255,255,255,0.60)'} />
            <span className="text-[0.62rem]">{muted ? 'Unmute' : 'Mute'}</span>
          </button>

          {/* Camera Button */}
          <button id="ctrl-cam" onClick={() => setCamOff(!camOff)}
            className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all ${camOff ? 'badge-copper' : 'btn-secondary border-none shadow-none text-mist'}`}>
            <Icon d={camOff ? 'M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2m5.66 0H14a2 2 0 0 1 2 2v3.34l1 1L23 7v10M1 1l22 22' : 'M15 10l4.553-2.069A1 1 0 0 1 21 8.914V15.086a1 1 0 0 1-1.447.914L15 14M3 8a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8z'} size={18} stroke={camOff ? '#d4924e' : 'rgba(255,255,255,0.60)'} />
            <span className="text-[0.62rem]">{camOff ? 'Start Camera' : 'Stop Camera'}</span>
          </button>

          {/* Screen Share Button */}
          <button id="ctrl-screen" onClick={isScreenSharing ? () => stopScreenShare(null) : startScreenShare}
            className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all ${isScreenSharing ? 'badge-copper' : 'btn-secondary border-none shadow-none text-mist'}`}>
            <Icon d="M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6zm6 14h4m-8 0h12" size={18} stroke={isScreenSharing ? '#d4924e' : 'rgba(255,255,255,0.60)'} />
            <span className="text-[0.62rem]">{isScreenSharing ? 'Stop Present' : 'Share Screen'}</span>
          </button>

          {/* Divider */}
          <div className="mx-2 w-px h-8 bg-[rgba(196,124,62,0.25)]" />

          {/* End Call Button */}
          <button id="end-class-btn" onClick={endClass}
            className="px-6 py-2.5 rounded-xl text-[0.88rem] font-extrabold transition-all hover:opacity-90 active:scale-95"
            style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1.5px solid rgba(239, 68, 68, 0.35)',
              color: '#ef4444'
            }}>
            End Class
          </button>

          {/* Divider */}
          <div className="mx-2 w-px h-8 bg-[rgba(196,124,62,0.25)]" />

          {/* Chat Toggle */}
          <button id="ctrl-chat" onClick={() => setChatOpen(!chatOpen)}
            className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all ${chatOpen ? 'badge-copper' : 'btn-secondary border-none shadow-none text-mist'}`}>
            <Icon d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" size={18} stroke={chatOpen ? '#d4924e' : 'rgba(255,255,255,0.60)'} />
            <span className="text-[0.62rem]">Chat</span>
          </button>

          {/* Participants Toggle */}
          <button id="ctrl-participants" onClick={() => setParticipantsOpen(!participantsOpen)}
            className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all ${participantsOpen ? 'badge-copper' : 'btn-secondary border-none shadow-none text-mist'}`}>
            <Icon d={['M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2', 'M23 21v-2a4 4 0 0 0-3-3.87', 'M16 3.13a4 4 0 0 1 0 7.75']} size={18} stroke={participantsOpen ? '#d4924e' : 'rgba(255,255,255,0.60)'} />
            <span className="text-[0.62rem]">Students</span>
          </button>

        </div>
      </div>
    </div>
  );
}

/* ─── Student View ────────────────────── */
function StudentView({ sessionId }) {
  const router = useRouter();
  
  // Safe state initialization from localStorage
  const [userName, setUserName] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('userName') || 'Carol Lee';
    }
    return 'Carol Lee';
  });

  const [meetingTitle, setMeetingTitle] = useState('Advanced Mathematics');
  const [handRaised, setHandRaised] = useState(false);
  const [muted, setMuted] = useState(false);
  const [camOff, setCamOff] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [participantsOpen, setParticipantsOpen] = useState(false);
  const [chatMsg, setChatMsg] = useState('');
  
  const [messages, setMessages] = useState([]);
  const [students, setStudents] = useState([]);
  const [breakBanner, setBreakBanner] = useState(false);
  const [engScore, setEngScore] = useState(82);
  const [elapsed, setElapsed] = useState(0);

  // Join notifications
  const [joinNotifications, setJoinNotifications] = useState([]);
  const prevStudentsRef = useRef([]);

  // Voice activity tracking
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Camera stream state
  const [stream, setStream] = useState(null);
  const [screenStream, setScreenStream] = useState(null);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  // References for live streams
  const localVideoRef = useRef(null);
  const screenVideoRef = useRef(null);

  // Retrieve student profile
  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.authenticated && data.user) {
          const fullName = `${data.user.firstName} ${data.user.lastName}`;
          setUserName(fullName);
          localStorage.setItem('userName', fullName);
        }
      })
      .catch(err => console.error('Student retrieve failed:', err));
  }, []);

  const userInitials = userName
    ? userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'CL';

  // Poll classroom state from MongoDB
  useEffect(() => {
    async function fetchSessionState() {
      try {
        const res = await fetch(`/api/classroom/${sessionId}`);
        const data = await res.json();
        if (res.ok && data.success) {
          const meeting = data.meeting;
          setMeetingTitle(meeting.title);
          
          const activeParticipants = meeting.participants || [];
          const activeStudents = activeParticipants.filter(p => p.role === 'student');
          
          // Detect joins
          const prevIds = prevStudentsRef.current.map(s => s._id || s.userId);
          activeStudents.forEach(s => {
            const currentId = s._id || s.userId;
            if (prevIds.length > 0 && !prevIds.includes(currentId)) {
              // Trigger toast notification
              const nId = Date.now() + Math.random();
              setJoinNotifications(prev => [...prev, { id: nId, message: `${s.name} joined the meeting` }]);
              setTimeout(() => {
                setJoinNotifications(prev => prev.filter(n => n.id !== nId));
              }, 4000);
            }
          });
          prevStudentsRef.current = activeStudents;
          setStudents(activeStudents);

          // Sync chats & markers
          setMessages(meeting.messages || []);

          if (meeting.cfi < 40) {
            setBreakBanner(true);
          } else {
            setBreakBanner(false);
          }
        } else if (data.active === false) {
          alert('Session has ended.');
          router.push('/dashboard');
        }
      } catch (err) {
        console.error('Error fetching session state:', err);
      }
    }

    // Join classroom
    fetch(`/api/classroom/${sessionId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'join' })
    })
      .then(() => fetchSessionState())
      .catch(err => console.error('Join session error:', err));

    const pollInterval = setInterval(fetchSessionState, 3000);
    return () => clearInterval(pollInterval);
  }, [sessionId, router]);

  // Keep heartbeat alive for student
  useEffect(() => {
    const heartbeatInterval = setInterval(() => {
      fetch(`/api/classroom/${sessionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'heartbeat',
          score: engScore,
          handRaised,
          camOff,
          muted
        })
      }).catch(err => console.error('Heartbeat sync failed:', err));
    }, 3000);
    return () => clearInterval(heartbeatInterval);
  }, [sessionId, engScore, handRaised, camOff, muted]);

  // Local camera stream hooks
  useEffect(() => {
    let activeStream = null;
    async function initCamera() {
      if (typeof window !== 'undefined' && navigator.mediaDevices && !camOff) {
        try {
          const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
          activeStream = mediaStream;
          setStream(mediaStream);
        } catch (err) {
          console.warn('Webcam permission denied or unavailable for student:', err);
          setCamOff(true);
        }
      } else {
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
          setStream(null);
        }
      }
    }
    initCamera();

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach(t => t.stop());
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [camOff]);

  // Microphone audio capture level analyzer
  useEffect(() => {
    if (!stream || muted) {
      setTimeout(() => setIsSpeaking(false), 0);
      return;
    }

    const audioTracks = stream.getAudioTracks();
    if (audioTracks.length === 0) return;

    let audioContext;
    let analyser;
    let source;
    let rafId;

    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      audioContext = new AudioContextClass();
      analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;

      source = audioContext.createMediaStreamSource(new MediaStream([audioTracks[0]]));
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const checkSpeechVolume = () => {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const average = sum / bufferLength;
        setIsSpeaking(average > 8); // threshold level
        rafId = requestAnimationFrame(checkSpeechVolume);
      };
      checkSpeechVolume();
    } catch (err) {
      console.warn('Audio Context failed for student speaking indicator:', err);
    }

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      if (source) source.disconnect();
      if (audioContext && audioContext.state !== 'closed') {
        audioContext.close();
      }
    };
  }, [stream, muted]);

  // Handle mute track updates
  useEffect(() => {
    if (stream) {
      stream.getAudioTracks().forEach(track => {
        track.enabled = !muted;
      });
    }
  }, [muted, stream]);

  // Bind local webcam preview
  useEffect(() => {
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = stream || null;
    }
  }, [stream, camOff]);

  // Bind screen share video
  useEffect(() => {
    if (screenVideoRef.current) {
      screenVideoRef.current.srcObject = screenStream || null;
    }
  }, [screenStream, isScreenSharing]);

  // Screen sharing methods
  const startScreenShare = async () => {
    if (typeof window !== 'undefined' && navigator.mediaDevices) {
      try {
        const scrStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        setScreenStream(scrStream);
        setIsScreenSharing(true);

        scrStream.getVideoTracks()[0].onended = () => {
          stopScreenShare(scrStream);
        };
      } catch (err) {
        console.error('Student screen capture rejected:', err);
      }
    }
  };

  const stopScreenShare = (passedStream) => {
    const activeScr = passedStream || screenStream;
    if (activeScr) {
      activeScr.getTracks().forEach(t => t.stop());
    }
    setScreenStream(null);
    setIsScreenSharing(false);
  };

  // Chalkboard derivatives graph simulator (Teacher feed)
  useEffect(() => {
    const canvas = document.getElementById('teacher-lecture-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId;
    const render = () => {
      const w = canvas.width = canvas.clientWidth || 800;
      const h = canvas.height = canvas.clientHeight || 500;

      // Dark blackboard board
      ctx.fillStyle = '#080d1a';
      ctx.fillRect(0, 0, w, h);

      // Fine math grid
      ctx.strokeStyle = 'rgba(196, 124, 62, 0.035)';
      ctx.lineWidth = 1;
      const stepSize = 30;
      for (let x = 0; x < w; x += stepSize) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
      }
      for (let y = 0; y < h; y += stepSize) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
      }

      const time = Date.now() * 0.001;

      // Header board titles
      ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
      ctx.font = 'bold 15px Outfit, sans-serif';
      ctx.fillText("Lecture 04: Derivative Tangents & Live Wave Slopes", 40, 50);

      // Coordinate axes
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 2;
      const oX = w / 2;
      const oY = h / 2 + 30;
      
      // X-Axis
      ctx.beginPath();
      ctx.moveTo(45, oY);
      ctx.lineTo(w - 45, oY);
      // Y-Axis
      ctx.moveTo(oX, 85);
      ctx.lineTo(oX, h - 75);
      ctx.stroke();

      // Continuous animated derivative curve: f(x)
      ctx.strokeStyle = '#c47c3e';
      ctx.lineWidth = 3;
      ctx.beginPath();
      let first = true;
      const sX = 0.015;
      const sY = 110;
      for (let px = 50; px < w - 50; px++) {
        const dx = px - oX;
        const dy = Math.sin(dx * sX + time) * Math.cos(dx * 0.004) * sY;
        const py = oY - dy;
        if (first) {
          ctx.moveTo(px, py);
          first = false;
        } else {
          ctx.lineTo(px, py);
        }
      }
      ctx.stroke();

      // Tangent point coordinates
      const tDx = Math.sin(time * 0.4) * (w / 3.2);
      const tX = oX + tDx;
      const tDy = Math.sin(tDx * sX + time) * Math.cos(tDx * 0.004) * sY;
      const tY = oY - tDy;

      // Derivative slope f'(x) approximation
      const delta = 0.1;
      const dyLeft = Math.sin((tDx - delta) * sX + time) * Math.cos((tDx - delta) * 0.004) * sY;
      const dyRight = Math.sin((tDx + delta) * sX + time) * Math.cos((tDx + delta) * 0.004) * sY;
      const slope = (dyRight - dyLeft) / (2 * delta);

      // Tangent line rendering
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      const lx1 = tX - 70;
      const ly1 = tY + slope * 70;
      const lx2 = tX + 70;
      const ly2 = tY - slope * 70;
      ctx.moveTo(lx1, ly1);
      ctx.lineTo(lx2, ly2);
      ctx.stroke();

      // Tangency node dot
      ctx.fillStyle = '#d4924e';
      ctx.beginPath();
      ctx.arc(tX, tY, 6.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Text data badges
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.font = '12px Courier New, monospace';
      ctx.fillText(`P(x) = (${Math.round(tDx)}, ${Math.round(tDy)})`, tX + 15, tY - 15);
      ctx.fillText(`Slope f'(x) = ${slope.toFixed(3)}`, tX + 15, tY + 4);

      // Embedded teacher avatar talking box
      const bW = 145;
      const bH = 95;
      const bX = w - bW - 40;
      const bY = 40;

      ctx.fillStyle = 'rgba(12, 19, 34, 0.88)';
      ctx.strokeStyle = 'rgba(196, 124, 62, 0.25)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(bX, bY, bW, bH, 10);
      ctx.fill();
      ctx.stroke();

      // Talking micro equalizer bars
      ctx.fillStyle = '#c47c3e';
      const eqCount = 6;
      for (let i = 0; i < eqCount; i++) {
        const hEq = 4 + Math.abs(Math.sin(time * 7 + i)) * 14;
        ctx.fillRect(bX + 18 + i * 8, bY + bH - 18 - hEq, 4, hEq);
      }

      // Teacher silhouette head
      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      ctx.beginPath();
      ctx.arc(bX + bW / 2 + 20, bY + bH / 2 - 8, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(bX + bW / 2 + 20, bY + bH / 2 + 20, 20, 12, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = 'rgba(255,255,255,0.50)';
      ctx.font = '9px Outfit, sans-serif';
      ctx.fillText("Dr. Ahmed (Lecturing)", bX + 15, bY + 16);

      animId = requestAnimationFrame(render);
    };
    render();
    return () => cancelAnimationFrame(animId);
  }, []);

  // Engagement index updates
  useEffect(() => {
    const t = setInterval(() => {
      setElapsed(s => s + 1);
      setEngScore(prev => Math.max(40, Math.min(99, prev + (Math.random() - 0.48) * 4)));
    }, 3000);
    return () => clearInterval(t);
  }, []);

  const sendChat = async () => {
    if (!chatMsg.trim()) return;
    try {
      const res = await fetch(`/api/classroom/${sessionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'chat',
          msg: chatMsg
        })
      });
      if (res.ok) {
        setChatMsg('');
      }
    } catch (err) {
      console.error('Error sending chat:', err);
    }
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden dashboard-bg text-snow relative">
      <style>{`
        @keyframes voiceRipple {
          0% { transform: scale(1); opacity: 0.7; }
          50% { transform: scale(1.15); opacity: 0.35; }
          100% { transform: scale(1.3); opacity: 0; }
        }
      `}</style>

      {/* ── TOAST NOTIFICATIONS ────────────────── */}
      <div className="fixed bottom-20 left-6 z-50 flex flex-col gap-2 pointer-events-none">
        {joinNotifications.map(n => (
          <div key={n.id} className="flex items-center gap-2.5 px-4.5 py-3 rounded-xl shadow-2xl bg-copper border border-white/10 text-white font-extrabold text-xs animate-fadeUp">
            <span>👤</span>
            <p>{n.message}</p>
          </div>
        ))}
      </div>

      {/* Break Banner */}
      {breakBanner && (
        <div id="student-break-banner" className="flex-shrink-0 flex items-center justify-center gap-3 px-6 py-3 z-50 animate-fadeDown"
          style={{ background: 'rgba(21,32,56,0.95)', borderBottom: '1px solid rgba(196,124,62,0.30)' }}>
          <span className="text-white text-sm font-bold">☕ Teacher called a 5-minute break</span>
          <button onClick={() => setBreakBanner(false)} className="text-mist hover:text-snow transition-colors ml-3">×</button>
        </div>
      )}

      {/* Top bar */}
      <div id="student-topbar" className="flex-shrink-0 flex items-center justify-between px-5 py-3 glass-topbar">
        <div className="flex items-center gap-4">
          <span className="w-2 h-2 rounded-full bg-copper animate-pulse" />
          <p className="text-[0.88rem] font-semibold text-snow">{meetingTitle}</p>
          <span className="text-[0.8rem] text-mist font-mono">{formatTime(elapsed)}</span>
        </div>

        {/* AI Active badge */}
        <div id="ai-active-badge" className="flex items-center gap-1.5 px-3 py-1.5 rounded-full badge-copper">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#d4924e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          <span className="text-[0.72rem] font-bold text-snow">AI Active — Analyzing Locally</span>
          <span className="w-1.5 h-1.5 rounded-full bg-copper animate-pulse" />
        </div>

        <div className="flex items-center gap-2">
          <button id="student-participants" onClick={() => setParticipantsOpen(!participantsOpen)}
            className={`px-3 py-1.5 rounded-lg text-[0.75rem] font-semibold transition-colors ${participantsOpen ? 'badge-copper' : 'btn-secondary border-none shadow-none text-mist'}`}>
            Participants
          </button>
          <button id="student-chat" onClick={() => setChatOpen(!chatOpen)}
            className={`px-3 py-1.5 rounded-lg text-[0.75rem] font-semibold transition-colors ${chatOpen ? 'badge-copper' : 'btn-secondary border-none shadow-none text-mist'}`}>
            Chat
          </button>
        </div>
      </div>

      {/* Main area */}
      <div className="flex-1 flex overflow-hidden relative">

        {/* Teacher video (main stage / screen share) */}
        <div id="teacher-main-video" className="flex-1 relative flex items-center justify-center bg-navy-dark/30">
          
          {isScreenSharing ? (
            /* Student screen share active content */
            <div className="w-full h-full flex flex-col bg-black">
              <video ref={screenVideoRef} autoPlay playsInline muted className="w-full h-full object-contain" />
              <div className="absolute bottom-3 left-3 text-[0.75rem] font-bold text-snow px-3 py-1.5 rounded-lg" style={{ background: 'rgba(15,24,36,0.80)' }}>
                Presenting your screen to class
              </div>
              <button onClick={() => stopScreenShare(null)} className="absolute bottom-3 right-3 px-3 py-1.5 rounded-lg text-[0.75rem] font-bold bg-red-500/20 border border-red-500/40 text-red-400 hover:bg-red-500/30 transition-all">
                Stop Presentation
              </button>
            </div>
          ) : (
            /* Standard mathematical chalkboard presentation */
            <canvas id="teacher-lecture-canvas" className="w-full h-full object-cover" />
          )}

          {/* Self camera video preview (bottom-left) */}
          <div id="student-self-preview" className="absolute bottom-4 left-4 w-[160px] rounded-xl overflow-hidden card-navy border border-white/5 shadow-2xl"
            style={{ aspectRatio: '4/3' }}>
            <div className="w-full h-full flex items-center justify-center">
              {camOff ? (
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-black"
                  style={{ background: 'linear-gradient(135deg, #c47c3e, #8c5828)' }}>
                  {userInitials}
                </div>
              ) : (
                <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
              )}
            </div>
            <div className="absolute bottom-1 left-1.5 text-[0.6rem] font-semibold text-white px-1.5 py-0.5 rounded"
              style={{ background: 'rgba(15,24,36,0.65)' }}>You</div>
            {muted && (
              <div className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-[rgba(15,24,36,0.70)] flex items-center justify-center">
                <Icon d="M1 1l22 22M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" size={10} />
              </div>
            )}
          </div>

          {/* Personal engagement score (private) */}
          <div id="personal-score" className="absolute top-4 left-4 flex items-center gap-2 px-3 py-2 rounded-xl card-navy border border-copper/15">
            <span className="text-[0.7rem] text-mist">My Engagement</span>
            <span className="text-[0.88rem] font-black text-copper">{Math.round(engScore)}%</span>
            <span className="text-[0.62rem] text-mist/40">· local only</span>
          </div>
        </div>

        {/* Participants panel */}
        {participantsOpen && (
          <div id="student-participants-panel" className="w-[220px] flex-shrink-0 border-l border-[rgba(196,124,62,0.15)] flex flex-col card-navy border-y-0 border-r-0 rounded-none">
            <div className="px-4 py-3 border-b border-[rgba(196,124,62,0.12)] flex items-center justify-between">
              <p className="text-[0.82rem] font-bold text-snow">Participants ({students.length + 1})</p>
              <button onClick={() => setParticipantsOpen(false)} className="text-mist hover:text-snow transition-colors">
                <Icon d="M18 6 6 18M6 6l12 12" size={13} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
              <div className="flex items-center gap-2.5 py-1">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[0.6rem] font-black"
                  style={{ background: 'linear-gradient(135deg,#c47c3e,#8c5828)' }}>JD</div>
                <span className="text-[0.8rem] text-mist">Teacher / Host</span>
                <span className="ml-auto text-[0.65rem] text-copper font-semibold">Host</span>
              </div>
              {students.map(s => (
                <div key={s._id || s.userId} className="flex items-center gap-2.5 py-1">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[0.6rem] font-black"
                    style={{ background: 'linear-gradient(135deg,rgba(196,124,62,0.15),rgba(196,124,62,0.05))', border: '1px solid rgba(196,124,62,0.20)' }}>{s.initials}</div>
                  <span className="text-[0.8rem] text-mist/85 truncate">{s.name}</span>
                  {s.handRaised && <span className="text-xs ml-auto">✋</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Chat */}
        {chatOpen && (
          <div id="chat-panel-student" className="w-[240px] flex-shrink-0 flex flex-col border-l border-[rgba(196,124,62,0.15)] card-navy border-y-0 border-r-0 rounded-none">
            <div className="px-4 py-3 border-b border-[rgba(196,124,62,0.12)] flex items-center justify-between">
              <p className="text-[0.82rem] font-bold text-snow">Class Chat</p>
              <button onClick={() => setChatOpen(false)} className="text-mist hover:text-snow transition-colors">
                <Icon d="M18 6 6 18M6 6l12 12" size={13} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2.5">
              {messages.length === 0 ? (
                <p className="text-center text-mist/30 text-xs mt-8">No messages in chat</p>
              ) : (
                messages.map(m => (
                  <div key={m._id || m.id} className={`flex flex-col gap-0.5 ${m.sender === 'You' || m.sender.includes('(You)') || m.role === 'teacher' ? 'items-end' : 'items-start'}`}>
                    <span className="text-[0.67rem] text-mist/40">{m.sender}</span>
                    <div className="px-3 py-2 rounded-[12px] max-w-[90%]"
                      style={{ background: m.role === 'teacher' ? 'rgba(196,124,62,0.16)' : 'rgba(15,24,36,0.60)', border: '1px solid rgba(196,124,62,0.10)' }}>
                      <p className="text-[0.8rem] text-snow/90 leading-[1.5]">{m.msg}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="p-3 border-t border-[rgba(196,124,62,0.12)] flex gap-2">
              <input type="text" placeholder="Message…" value={chatMsg} onChange={e => setChatMsg(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendChat()}
                className="flex-1 px-3 py-2 rounded-xl text-[0.8rem] text-white placeholder:text-mist/35 outline-none neu-input" />
              <button onClick={sendChat} className="w-8 h-8 rounded-xl flex items-center justify-center btn-primary flex-shrink-0">
                <Icon d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" size={13} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Student control bar (Centered & Grouped) */}
      <div id="student-control-bar" className="flex-shrink-0 flex items-center justify-center px-6 py-3 glass-topbar border-t border-b-0">
        <div className="flex items-center gap-3">
          
          {/* Mute Button */}
          <button id="student-ctrl-mute" onClick={() => setMuted(!muted)}
            className={`relative flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all ${muted ? 'badge-copper' : 'btn-secondary border-none shadow-none text-mist'}`}>
            {isSpeaking && (
              <span className="absolute inset-0 rounded-xl bg-[#c47c3e]/30 pointer-events-none" style={{ animation: 'voiceRipple 1.2s infinite ease-out' }} />
            )}
            <Icon d={muted ? 'M1 1l22 22M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23M12 19v4M8 23h8' : 'M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3zM19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8'} size={18} stroke={muted ? '#d4924e' : 'rgba(255,255,255,0.60)'} />
            <span className="text-[0.62rem]">{muted ? 'Unmute' : 'Mute'}</span>
          </button>

          {/* Camera Button */}
          <button id="student-ctrl-cam" onClick={() => setCamOff(!camOff)}
            className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all ${camOff ? 'badge-copper' : 'btn-secondary border-none shadow-none text-mist'}`}>
            <Icon d={camOff ? 'M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2m5.66 0H14a2 2 0 0 1 2 2v3.34l1 1L23 7v10M1 1l22 22' : 'M15 10l4.553-2.069A1 1 0 0 1 21 8.914V15.086a1 1 0 0 1-1.447.914L15 14M3 8a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8z'} size={18} stroke={camOff ? '#d4924e' : 'rgba(255,255,255,0.60)'} />
            <span className="text-[0.62rem]">{camOff ? 'Start Video' : 'Stop Video'}</span>
          </button>

          {/* Screen Share Button */}
          <button id="student-ctrl-screen" onClick={isScreenSharing ? () => stopScreenShare(null) : startScreenShare}
            className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all ${isScreenSharing ? 'badge-copper' : 'btn-secondary border-none shadow-none text-mist'}`}>
            <Icon d="M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6zm6 14h4m-8 0h12" size={18} stroke={isScreenSharing ? '#d4924e' : 'rgba(255,255,255,0.60)'} />
            <span className="text-[0.62rem]">{isScreenSharing ? 'Stop Present' : 'Share Screen'}</span>
          </button>

          {/* Hand Raise Button */}
          <button id="student-ctrl-hand" onClick={() => setHandRaised(!handRaised)}
            className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all ${handRaised ? 'badge-copper' : 'btn-secondary border-none shadow-none text-mist'}`}>
            <Icon d="M18 11.5V8a2 2 0 0 0-2-2 2 2 0 0 0-2 2v4.5M14 8V6a2 2 0 0 0-2-2 2 2 0 0 0-2 2v2M10 8V5a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7l-2-2a2 2 0 0 0-2.83 2.83L4 16c.87.87 3.07 3 4 4h6c2 0 4-2 4-4V11.5a2 2 0 0 0-2-2 2 2 0 0 0-2 2" size={18} stroke={handRaised ? '#d4924e' : 'rgba(255,255,255,0.60)'} />
            <span className="text-[0.62rem]">{handRaised ? 'Lower Hand' : 'Raise Hand'}</span>
          </button>

          {/* Divider */}
          <div className="mx-2 w-px h-8 bg-[rgba(196,124,62,0.25)]" />

          {/* Leave Button */}
          <button id="student-ctrl-leave" onClick={() => router.push('/dashboard')}
            className="px-5 py-2.5 rounded-xl text-[0.85rem] font-extrabold btn-secondary hover:bg-red-500/10 hover:border-red-500/40 hover:text-red-400 transition-all">
            Leave Class
          </button>

          {/* Divider */}
          <div className="mx-2 w-px h-8 bg-[rgba(196,124,62,0.25)]" />

          {/* Chat Toggle */}
          <button id="student-ctrl-chat" onClick={() => setChatOpen(!chatOpen)}
            className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all ${chatOpen ? 'badge-copper' : 'btn-secondary border-none shadow-none text-mist'}`}>
            <Icon d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" size={18} stroke={chatOpen ? '#d4924e' : 'rgba(255,255,255,0.60)'} />
            <span className="text-[0.62rem]">Chat</span>
          </button>

          {/* Participants Toggle */}
          <button id="student-ctrl-participants" onClick={() => setParticipantsOpen(!participantsOpen)}
            className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all ${participantsOpen ? 'badge-copper' : 'btn-secondary border-none shadow-none text-mist'}`}>
            <Icon d={['M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2', 'M23 21v-2a4 4 0 0 0-3-3.87', 'M16 3.13a4 4 0 0 1 0 7.75']} size={18} stroke={participantsOpen ? '#d4924e' : 'rgba(255,255,255,0.60)'} />
            <span className="text-[0.62rem]">Students</span>
          </button>

        </div>
      </div>
    </div>
  );
}

/* ─── Main export with role detection ── */
function ClassroomContent() {
  const { sessionId } = useParams();
  const searchParams = useSearchParams();
  const role = searchParams.get('role') ?? 'student';
  return role === 'teacher' ? <TeacherView sessionId={sessionId} /> : <StudentView sessionId={sessionId} />;
}

export default function ClassroomPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen dashboard-bg flex items-center justify-center">
        <div className="text-center animate-fadeIn">
          <div className="w-12 h-12 border-2 border-[rgba(196,124,62,0.20)] border-t-copper rounded-full animate-spin-slow mx-auto mb-4" />
          <p className="text-mist text-sm">Loading classroom…</p>
        </div>
      </div>
    }>
      <ClassroomContent />
    </Suspense>
  );
}
