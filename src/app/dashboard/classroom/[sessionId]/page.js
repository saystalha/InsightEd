'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams, useRouter, useParams } from 'next/navigation';

/* ─── SVG Icon ─────────────────────────── */
function Icon({ d, size = 20, fill = 'none', className = '', ...rest }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} {...rest}>
      {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p} />) : <path d={d} />}
    </svg>
  );
}

/* ─── Circular Gauge (CFI) ─────────────── */
function CircularGauge({ value = 72, size = 120 }) {
  const r = size / 2 - 12;
  const circ = 2 * Math.PI * r;
  const dash = (value / 100) * circ;
  const color = value > 65 ? '#c47c3e' : value > 40 ? '#d4924e' : '#8c5828';
  const label = value > 65 ? 'High Engagement' : value > 40 ? 'Moderate Attention' : 'Low Engagement';
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(196,124,62,0.12)" strokeWidth="8" />
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="8"
            strokeDasharray={`${dash} ${circ - dash}`} strokeDashoffset={circ / 4} strokeLinecap="round"
            style={{ transition: 'stroke-dasharray 0.8s ease, stroke 0.5s' }} />
        </svg>
        <div className="absolute text-center">
          <p className="text-[1.35rem] font-black text-snow leading-none">{value}</p>
          <p className="text-[0.55rem] text-mist font-semibold">CFI</p>
        </div>
      </div>
      <p className="text-[0.72rem] font-bold text-copper">{label}</p>
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
    <div className="flex flex-col gap-1 w-full">
      <div className="flex justify-between items-center">
        <span className="text-[0.72rem] text-mist font-medium">{label}</span>
        <span className="text-[0.75rem] font-bold text-snow">{Math.round(value * 100)}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-[rgba(196,124,62,0.12)] overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${value * 100}%`, background: gradient }} />
      </div>
    </div>
  );
}

const formatTime = (s) => `${String(Math.floor(s / 3600)).padStart(2, '0')}:${String(Math.floor((s % 3600) / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

/* ─── Teacher View ────────────────────── */
function TeacherView({ sessionId }) {
  const router = useRouter();
  
  const [userName, setUserName] = useState('Dr. Ahmed');
  const [meetingTitle, setMeetingTitle] = useState('Advanced Mathematics');
  const [cfi, setCfi] = useState(75);
  const [trend, setTrend] = useState('stable');
  const [metrics, setMetrics] = useState({ attention: 0.75, confusion: 0.20, energy: 0.70 });
  
  // Tabbed sidebar state: 'analytics' | 'participants' | 'chat' | null
  const [sidebarTab, setSidebarTab] = useState(null);
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

  // Toast notifications for connected users
  const [joinNotifications, setJoinNotifications] = useState([]);
  const prevStudentsRef = useRef([]);

  // Voice Equalizer meters
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Video Media streams
  const [stream, setStream] = useState(null);
  const [screenStream, setScreenStream] = useState(null);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  const localVideoRef = useRef(null);
  const localVideoRefSmall = useRef(null);
  const screenVideoRef = useRef(null);

  // Retrieve authenticated user info
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
    : 'TA';

  // Session state polling
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
          
          // Detect student join events for toast logs
          const prevIds = prevStudentsRef.current.map(s => s._id || s.userId);
          activeStudents.forEach(s => {
            const currentId = s._id || s.userId;
            if (prevIds.length > 0 && !prevIds.includes(currentId)) {
              const nId = Date.now() + Math.random();
              setJoinNotifications(prev => [...prev, { id: nId, message: `${s.name} joined the class` }]);
              setTimeout(() => {
                setJoinNotifications(prev => prev.filter(n => n.id !== nId));
              }, 4000);
            }
          });
          prevStudentsRef.current = activeStudents;
          setStudents(activeStudents);

          // Raise hand notifications
          setHandAlerts(
            activeStudents
              .filter(s => s.handRaised)
              .map(s => ({ id: s._id || s.userId, name: s.name }))
          );

          setMessages(meeting.messages || []);
          setTopicMarkers(meeting.topicMarkers || []);
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
          alert('Session has ended.');
          router.push('/dashboard');
        }
      } catch (err) {
        console.error('Error fetching session state:', err);
      }
    }

    // Join room endpoint
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
        setIsSpeaking(average > 8); // speech threshold
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

  // Enable/disable audio track
  useEffect(() => {
    if (stream) {
      stream.getAudioTracks().forEach(track => {
        track.enabled = !muted;
      });
    }
  }, [muted, stream]);

  // Bind video element sources
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

  useEffect(() => {
    if (screenVideoRef.current) {
      screenVideoRef.current.srcObject = screenStream || null;
    }
  }, [screenStream, isScreenSharing]);

  // Screen share handlers
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

  // Student Mockup Feeds Canvas Loops
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

          // Background canvas body
          ctx.fillStyle = '#10141e';
          ctx.fillRect(0, 0, w, h);

          const time = Date.now() * 0.001 + (s.score || 0) * 10;

          // Glowing background based on score
          const grad = ctx.createRadialGradient(w/2, h/2, 5, w/2, h/2, w/1.2);
          const colorHue = s.camOff ? 0 : s.handRaised ? 35 : (s.score >= 70 ? 120 : s.score >= 50 ? 38 : 10);
          grad.addColorStop(0, `hsla(${colorHue}, 45%, 15%, 0.35)`);
          grad.addColorStop(1, '#0c0f17');
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, w, h);

          // Head / Body Avatar
          ctx.fillStyle = s.handRaised ? 'rgba(196, 124, 62, 0.22)' : 'rgba(196, 124, 62, 0.08)';
          ctx.beginPath();
          ctx.arc(w / 2, h / 2 - 10, h * 0.18, 0, Math.PI * 2);
          ctx.fill();

          ctx.beginPath();
          ctx.ellipse(w / 2, h / 2 + h * 0.25, h * 0.28, h * 0.18, 0, 0, Math.PI * 2);
          ctx.fill();

          if (s.camOff) {
            ctx.fillStyle = 'rgba(15,24,36,0.65)';
            ctx.fillRect(0, 0, w, h);
            ctx.fillStyle = 'rgba(255,255,255,0.15)';
            ctx.font = '10px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('Camera Off', w/2, h/2 + 25);
          }

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

  // Class timers
  useEffect(() => {
    const timer = setInterval(() => setElapsed(s => s + 1), 1000);
    return () => clearInterval(timer);
  }, []);

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
    if (window.confirm('Are you sure you want to end this class session?')) {
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

  const toggleSidebar = (tab) => {
    setSidebarTab(prev => prev === tab ? null : tab);
  };

  // Dynamically calculate grid columns based on connected users
  const totalFeeds = students.length + 1; // +1 for the teacher
  const getGridClass = () => {
    if (isScreenSharing) return ''; // handles small previews row underneath
    if (totalFeeds === 1) return 'max-w-[720px] aspect-video w-full mx-auto';
    if (totalFeeds === 2) return 'grid-cols-2 max-w-[1000px] w-full mx-auto';
    return 'grid-cols-2 md:grid-cols-3 max-w-[1250px] w-full mx-auto';
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[#111] text-snow relative">
      <style>{`
        @keyframes voiceRipple {
          0% { transform: scale(1); opacity: 0.7; }
          50% { transform: scale(1.15); opacity: 0.35; }
          100% { transform: scale(1.3); opacity: 0; }
        }
      `}</style>

      {/* ── TOAST NOTIFICATIONS ────────────────── */}
      <div className="fixed bottom-24 left-6 z-50 flex flex-col gap-2 pointer-events-none">
        {joinNotifications.map(n => (
          <div key={n.id} className="flex items-center gap-2.5 px-4.5 py-3 rounded-xl shadow-2xl bg-copper border border-white/10 text-white font-extrabold text-xs animate-fadeUp">
            <span>👤</span>
            <p>{n.message}</p>
          </div>
        ))}
      </div>

      {/* ── BREAK ALERT BANNER ────────────────── */}
      {breakAlert && (
        <div id="break-alert-banner" className="flex-shrink-0 flex items-center justify-between px-6 py-3 z-50 bg-[#161a25] border-b border-copper/30 animate-fadeUp">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-copper animate-pulse" />
            <div>
              <p className="text-[0.85rem] font-bold text-white">Engagement Alert — CFI dropped to {cfi}%</p>
              <p className="text-[0.72rem] text-mist">Recommend a 5-minute break to restore attention</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button id="call-break-btn" onClick={() => setBreakAlert(false)}
              className="px-4 py-1.5 rounded-full text-[0.78rem] font-bold btn-primary">
              Call Break
            </button>
            <button onClick={() => setBreakAlert(false)} className="text-mist hover:text-snow transition-colors">
              <Icon d="M18 6 6 18M6 6l12 12" size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ── HAND RAISE ALERTS ──────────────────── */}
      {handAlerts.length > 0 && (
        <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
          {handAlerts.map(h => (
            <div key={h.id} id={`hand-alert-${h.id}`} className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl shadow-lg bg-[#182030] border border-copper/30">
              <span>✋</span>
              <p className="text-[0.8rem] font-semibold text-snow">{h.name} raised hand</p>
              <button onClick={() => setHandAlerts(prev => prev.filter(x => x.id !== h.id))}
                className="text-copper/60 hover:text-copper ml-1.5 transition-colors font-bold text-sm">×</button>
            </div>
          ))}
        </div>
      )}

      {/* ── MAIN VIEWWORKSPACE ─────────────────── */}
      <div className="flex-1 flex overflow-hidden relative h-full">
        
        {/* Left: Responsive Video Grid Workspace */}
        <div className="flex-1 flex flex-col justify-center overflow-hidden p-6 relative">
          
          {isScreenSharing ? (
            /* Presentation Mode stage layout */
            <div className="flex-1 flex flex-col min-h-0 w-full">
              <div id="screen-share-stage" className="flex-1 relative rounded-2xl overflow-hidden border border-white/5 bg-[#0a0a0a] flex items-center justify-center">
                <video ref={screenVideoRef} autoPlay playsInline muted className="w-full h-full object-contain" />
                <div className="absolute bottom-4 left-4 text-[0.75rem] font-bold text-snow px-3 py-1.5 rounded-lg bg-black/60 backdrop-blur-md">
                  Screen Sharing Active
                </div>
                <button onClick={() => stopScreenShare(null)} className="absolute bottom-4 right-4 px-4 py-2 rounded-xl text-[0.75rem] font-bold bg-red-600/90 hover:bg-red-500 text-white transition-all shadow-lg active:scale-95">
                  Stop Presenting
                </button>
              </div>

              {/* Row of feeds small previews underneath */}
              <div className="h-[110px] flex gap-3 mt-3 overflow-x-auto pb-1 flex-shrink-0">
                {/* Teacher feed */}
                <div className="w-[150px] h-full relative rounded-xl overflow-hidden bg-[#1f1f1f] border border-white/5 flex-shrink-0 flex items-center justify-center">
                  {camOff ? (
                    <div className="w-full h-full flex items-center justify-center text-sm font-black bg-gradient-to-br from-[#241a12] to-[#121824]">{userInitials}</div>
                  ) : (
                    <video ref={localVideoRefSmall} autoPlay playsInline muted className="w-full h-full object-cover" />
                  )}
                  <div className="absolute bottom-1.5 left-1.5 text-[0.58rem] text-white px-2 py-0.5 rounded bg-black/60 font-medium">You</div>
                </div>

                {/* Student feeds */}
                {students.map(s => (
                  <div key={s._id || s.userId} className="w-[150px] h-full relative rounded-xl overflow-hidden bg-[#1f1f1f] flex-shrink-0 flex items-center justify-center border border-white/5">
                    <canvas id={`student-canvas-small-${s._id || s.userId}`} className="absolute inset-0 w-full h-full object-cover opacity-85" />
                    <div className="relative z-10 w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-black bg-gradient-to-br from-[#c47c3e] to-[#8c5828]">{s.initials}</div>
                    <div className="absolute bottom-1.5 left-1.5 right-1.5 flex items-center justify-between text-[0.58rem] text-white px-1.5 py-0.5 rounded bg-black/60">
                      <span className="truncate max-w-[55px] font-medium">{s.name.split(' ')[0]}</span>
                      <span className="font-bold" style={{ color: scoreColor(s.score) }}>{s.score}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Unified Tiled Responsive Grid */
            <div className={`grid gap-4 items-center justify-center w-full min-h-0 ${getGridClass()}`}>
              
              {/* Teacher feed inside grid */}
              <div id="teacher-self-view" className={`relative rounded-2xl overflow-hidden bg-[#1e1e1e] border flex items-center justify-center w-full aspect-video transition-all duration-300 ${
                isSpeaking ? 'border-copper/70 ring-2 ring-copper/15' : 'border-white/5'
              }`}>
                {camOff ? (
                  <div className="w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-black bg-gradient-to-br from-[#c47c3e] to-[#8c5828]">{userInitials}</div>
                ) : (
                  <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                )}
                <div className="absolute bottom-3 left-3 text-[0.7rem] font-semibold text-white px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md">
                  {userName} (Host)
                </div>
                {muted && (
                  <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 flex items-center justify-center">
                    <Icon d="m19 10-1.39 4.5M9 5a3 3 0 0 1 5.3 1.8M12 19v4M8 23h8M1 1l22 22" size={14} className="text-red-400" />
                  </div>
                )}
              </div>

              {/* Student feeds inside grid */}
              {students.map(s => (
                <div key={s._id || s.userId} id={`student-video-${s._id || s.userId}`}
                  className="relative rounded-2xl overflow-hidden aspect-video flex items-center justify-center bg-[#1e1e1e] border w-full transition-all duration-300"
                  style={{
                    borderColor: s.handRaised ? 'rgba(196,124,62,0.7)' : 'rgba(255, 255, 255, 0.05)',
                    boxShadow: s.handRaised ? '0 0 16px rgba(196,124,62,0.2)' : 'none',
                  }}>
                  <canvas id={`student-canvas-${s._id || s.userId}`} className="absolute inset-0 w-full h-full object-cover opacity-85" />
                  <div className="relative z-10 w-12 h-12 rounded-full flex items-center justify-center text-white text-sm font-black bg-gradient-to-br from-[#c47c3e] to-[#8c5828]">{s.initials}</div>
                  
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between z-10">
                    <span className="text-[0.7rem] font-semibold text-white px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md truncate max-w-[100px]">{s.name.split(' ')[0]}</span>
                    <span className="text-[0.7rem] font-bold px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md"
                      style={{ color: scoreColor(s.score) }}>{s.score}%</span>
                  </div>
                  {s.handRaised && (
                    <div className="absolute top-3 right-3 text-lg z-10 animate-bounce">✋</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Unified Tabbed Sidebar Container */}
        {sidebarTab !== null && (
          <div id="unified-sidebar" className="w-[330px] flex-shrink-0 flex flex-col bg-[#171717] border-l border-[#262626] h-full z-30 animate-slide-down">
            
            {/* Sidebar Tab Header */}
            <div className="flex items-center border-b border-[#262626] px-2 pt-2">
              <button onClick={() => setSidebarTab('analytics')}
                className={`flex-1 py-3 text-[0.76rem] font-extrabold border-b-2 text-center transition-colors ${
                  sidebarTab === 'analytics' ? 'border-copper text-copper' : 'border-transparent text-mist hover:text-snow'
                }`}>
                Analytics
              </button>
              <button onClick={() => setSidebarTab('participants')}
                className={`flex-1 py-3 text-[0.76rem] font-extrabold border-b-2 text-center transition-colors ${
                  sidebarTab === 'participants' ? 'border-copper text-copper' : 'border-transparent text-mist hover:text-snow'
                }`}>
                Students ({students.length + 1})
              </button>
              <button onClick={() => setSidebarTab('chat')}
                className={`flex-1 py-3 text-[0.76rem] font-extrabold border-b-2 text-center transition-colors ${
                  sidebarTab === 'chat' ? 'border-copper text-copper' : 'border-transparent text-mist hover:text-snow'
                }`}>
                Chat
              </button>
              <button onClick={() => setSidebarTab(null)} className="p-2.5 text-mist hover:text-snow transition-colors">
                <Icon d="M18 6 6 18M6 6l12 12" size={14} />
              </button>
            </div>

            {/* Sidebar Tab Contents */}
            <div className="flex-1 overflow-y-auto flex flex-col min-h-0">
              
              {/* Tab 1: Live Analytics */}
              {sidebarTab === 'analytics' && (
                <div className="flex-1 p-5 flex flex-col gap-5">
                  <div className="flex flex-col items-center border-b border-[#262626] pb-5">
                    <CircularGauge value={cfi} />
                    <div className="flex items-center gap-1.5 mt-2">
                      {trend === 'improving'
                        ? <><Icon d="m17 17 9.2-9.2M17 17V7H7" size={12} className="text-copper" /><span className="text-[0.7rem] text-copper font-semibold">Improving</span></>
                        : <><Icon d="M17 7l-9.2 9.2M7 7v10h10" size={12} className="text-mist" /><span className="text-[0.7rem] text-mist font-semibold">Declining</span></>
                      }
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 border-b border-[#262626] pb-5">
                    <p className="text-[0.68rem] font-bold uppercase tracking-[0.10em] text-mist/40">Engagement Metrics</p>
                    <MetricBar label="Attention" value={metrics.attention} />
                    <MetricBar label="Confusion" value={metrics.confusion} />
                    <MetricBar label="Energy" value={metrics.energy} />
                  </div>

                  <div id="topic-marker-section" className="border-b border-[#262626] pb-5">
                    <p className="text-[0.68rem] font-bold uppercase tracking-[0.10em] text-mist/40 mb-3">Topic Marker</p>
                    <div className="flex gap-2 mb-3">
                      <input id="topic-label-input" type="text" placeholder="e.g., Started Derivatives"
                        value={topicLabel} onChange={e => setTopicLabel(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && markTopic()}
                        className="flex-1 px-3 py-2 rounded-lg text-[0.78rem] text-snow placeholder:text-mist/30 outline-none neu-input" />
                      <button id="mark-topic-btn" onClick={markTopic}
                        className="px-3 py-2 rounded-lg text-[0.75rem] font-bold btn-primary">Mark</button>
                    </div>
                    {topicMarkers.length > 0 && (
                      <div className="flex flex-col gap-1.5 max-h-[120px] overflow-y-auto">
                        {topicMarkers.map((m, i) => (
                          <div key={i} className="flex items-center gap-2 text-[0.7rem]">
                            <span className="w-1.5 h-1.5 rounded-full bg-copper flex-shrink-0" />
                            <span className="text-snow/70 truncate flex-1">{m.label}</span>
                            <span className="text-mist/40 flex-shrink-0 font-mono text-[0.64rem]">{m.time}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div id="announcement-section" className="pb-5">
                    <p className="text-[0.68rem] font-bold uppercase tracking-[0.10em] text-mist/40 mb-3">Announce to Class</p>
                    <div className="flex gap-2">
                      <input id="announcement-input" type="text" placeholder="Broadcast a message…"
                        value={announcement} onChange={e => setAnnouncement(e.target.value)}
                        className="flex-1 px-3 py-2 rounded-lg text-[0.78rem] text-snow placeholder:text-mist/30 outline-none neu-input" />
                      <button id="send-announcement-btn" onClick={() => setAnnouncement('')}
                        className="px-3 py-2 rounded-lg text-[0.75rem] font-bold btn-secondary">Send</button>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Connected Students */}
              {sidebarTab === 'participants' && (
                <div className="flex-1 p-4 flex flex-col gap-2.5">
                  <div className="flex items-center gap-2.5 py-1 border-b border-[#262626] pb-3">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[0.65rem] font-bold bg-gradient-to-br from-[#c47c3e] to-[#8c5828] flex-shrink-0">{userInitials}</div>
                    <span className="text-[0.78rem] text-snow font-bold flex-1 truncate">{userName}</span>
                    <span className="text-[0.65rem] text-copper font-bold uppercase tracking-wider">Host</span>
                  </div>
                  {students.length === 0 ? (
                    <p className="text-center text-mist/30 text-[0.72rem] mt-8">No students connected</p>
                  ) : (
                    students.map(s => (
                      <div key={s._id || s.userId} className="flex items-center gap-2.5 py-1">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[0.65rem] font-bold bg-[#1e293b] flex-shrink-0 border border-white/5">{s.initials}</div>
                        <span className="text-[0.78rem] text-mist flex-1 truncate font-medium">{s.name}</span>
                        <div className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ background: s.score >= 75 ? '#d4924e' : s.score >= 50 ? '#c47c3e' : '#8c5828' }} />
                        {s.handRaised && <span className="text-xs">✋</span>}
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Tab 3: Class Chat Messages */}
              {sidebarTab === 'chat' && (
                <div className="flex-1 flex flex-col min-h-0 bg-transparent">
                  <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
                    {messages.length === 0 ? (
                      <p className="text-center text-mist/30 text-xs mt-8">No messages in chat</p>
                    ) : (
                      messages.map(m => (
                        <div key={m._id || m.id} className={`flex flex-col gap-0.5 ${m.sender.includes('(You)') || m.role === 'teacher' ? 'items-end' : 'items-start'}`}>
                          <span className="text-[0.64rem] text-mist/40">{m.sender}</span>
                          <div className="px-3 py-2 rounded-[14px] max-w-[85%]"
                            style={{ background: m.role === 'teacher' ? 'rgba(196,124,62,0.16)' : 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <p className="text-[0.78rem] text-snow/90 leading-relaxed font-medium">{m.msg}</p>
                          </div>
                          <span className="text-[0.62rem] text-mist/20 font-mono">{m.time}</span>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="p-3 border-t border-[#262626] flex gap-2">
                    <input type="text" placeholder="Send a message…" value={chatMsg} onChange={e => setChatMsg(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && sendChat()}
                      className="flex-1 px-3 py-2 rounded-xl text-[0.78rem] text-white placeholder:text-mist/30 outline-none neu-input" />
                    <button onClick={sendChat} className="w-8 h-8 rounded-xl flex items-center justify-center btn-primary flex-shrink-0">
                      <Icon d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" size={13} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── GOOGLE MEET STYLE CONTROL BAR ─────── */}
      <div id="teacher-control-bar" className="fixed bottom-0 left-0 right-0 h-20 bg-[#171717] border-t border-[#262626] flex items-center justify-between px-6 z-40">
        
        {/* Left Section: Time & Meeting details */}
        <div className="flex items-center gap-3">
          <span className="text-[0.82rem] text-mist font-bold uppercase tracking-wider">{formatTime(elapsed)}</span>
          <span className="text-white/10">|</span>
          <span className="text-[0.85rem] font-bold text-snow truncate max-w-[160px]">{meetingTitle}</span>
          <span className="text-white/10">|</span>
          <span className="text-[0.76rem] font-mono font-bold tracking-wider text-copper bg-white/5 border border-white/5 px-2.5 py-0.5 rounded-lg select-all cursor-pointer">{sessionId}</span>
        </div>

        {/* Center Section: Core Controls */}
        <div className="flex items-center gap-3.5">
          {/* Mute (Mic) Toggle */}
          <button id="ctrl-mute" onClick={() => setMuted(!muted)}
            className={`w-11 h-11 rounded-full flex items-center justify-center transition-all duration-200 relative ${
              muted 
                ? 'bg-red-500/20 border border-red-500/40 text-red-400 hover:bg-red-500/30' 
                : 'bg-[#2b2b2b] border border-[#3c3c3c] text-white hover:bg-[#363636]'
            }`}
            title={muted ? "Unmute Microphone" : "Mute Microphone"}>
            {isSpeaking && (
              <span className="absolute inset-0 rounded-full bg-[#c47c3e]/30 pointer-events-none animate-ping" style={{ animationDuration: '1.5s' }} />
            )}
            <Icon d={muted ? 'm12 19 3-3 M19 10v1a7.9 7.9 0 0 1-3.07 6.27M12 2a3 3 0 0 0-3 3v1.17M1 1l22 22' : 'M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z M19 10v2a7 7 0 0 1-14 0v-2 M12 19v4 M8 23h8'} size={18} />
          </button>

          {/* Camera (Video) Toggle */}
          <button id="ctrl-cam" onClick={() => setCamOff(!camOff)}
            className={`w-11 h-11 rounded-full flex items-center justify-center transition-all duration-200 ${
              camOff 
                ? 'bg-red-500/20 border border-red-500/40 text-red-400 hover:bg-red-500/30' 
                : 'bg-[#2b2b2b] border border-[#3c3c3c] text-white hover:bg-[#363636]'
            }`}
            title={camOff ? "Start Camera" : "Stop Camera"}>
            <Icon d={camOff ? 'm2 2 20 20M21 16V8a2 2 0 0 0-2-2h-9.83 M22 8l-6 4 6 4V8Z' : 'm22 8-6 4 6 4V8Z M2 6h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z'} size={18} />
          </button>

          {/* Screen Share Toggle */}
          <button id="ctrl-screen" onClick={isScreenSharing ? () => stopScreenShare(null) : startScreenShare}
            className={`w-11 h-11 rounded-full flex items-center justify-center transition-all duration-200 ${
              isScreenSharing 
                ? 'bg-copper/20 border border-copper/40 text-copper hover:bg-copper/30' 
                : 'bg-[#2b2b2b] border border-[#3c3c3c] text-white hover:bg-[#363636]'
            }`}
            title={isScreenSharing ? "Stop Sharing Screen" : "Share Screen"}>
            <Icon d="M2 3h20a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z M12 17v4 M8 21h8" size={18} />
          </button>

          {/* End Call Button */}
          <button id="end-class-btn" onClick={endClass}
            className="px-6 py-2.5 rounded-full bg-red-600 hover:bg-red-500 text-white font-extrabold text-[0.82rem] transition-all active:scale-95 flex items-center gap-2 shadow-lg shadow-red-600/10"
            title="End Session for All">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            End Session
          </button>
        </div>

        {/* Right Section: Sidebar Toggles */}
        <div className="flex items-center gap-3">
          
          {/* Live Telemetry Analytics Sidebar Toggle */}
          <button onClick={() => toggleSidebar('analytics')}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 ${
              sidebarTab === 'analytics'
                ? 'bg-copper/20 border border-copper/40 text-copper'
                : 'bg-[#2b2b2b] border border-[#3c3c3c] text-[#f2f2f2]/60 hover:text-white hover:bg-[#363636]'
            }`}
            title="Live Focus Analytics">
            <Icon d="M18 20V10 M12 20V4 M6 20V14" size={17} />
          </button>

          {/* Connected Students List Toggle */}
          <button onClick={() => toggleSidebar('participants')}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 relative ${
              sidebarTab === 'participants'
                ? 'bg-copper/20 border border-copper/40 text-copper'
                : 'bg-[#2b2b2b] border border-[#3c3c3c] text-[#f2f2f2]/60 hover:text-white hover:bg-[#363636]'
            }`}
            title="Students List">
            <Icon d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M16 3.13a4 4 0 0 1 0 7.75" size={17} />
            {students.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-copper text-white text-[0.58rem] font-bold w-4 h-4 rounded-full flex items-center justify-center border border-[#171717]">
                {students.length}
              </span>
            )}
          </button>

          {/* Class Chat Toggle */}
          <button onClick={() => toggleSidebar('chat')}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 relative ${
              sidebarTab === 'chat'
                ? 'bg-copper/20 border border-copper/40 text-copper'
                : 'bg-[#2b2b2b] border border-[#3c3c3c] text-[#f2f2f2]/60 hover:text-white hover:bg-[#363636]'
            }`}
            title="Class Chat">
            <Icon d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" size={17} />
            {messages.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-copper text-white text-[0.58rem] font-bold w-4 h-4 rounded-full flex items-center justify-center border border-[#171717]">
                {messages.length}
              </span>
            )}
          </button>

        </div>
      </div>
    </div>
  );
}

/* ─── Student View ────────────────────── */
function StudentView({ sessionId }) {
  const router = useRouter();
  
  const [userName, setUserName] = useState('Carol Lee');
  const [meetingTitle, setMeetingTitle] = useState('Advanced Mathematics');
  const [handRaised, setHandRaised] = useState(false);
  const [muted, setMuted] = useState(false);
  const [camOff, setCamOff] = useState(false);
  
  // Tabbed sidebar state: 'participants' | 'chat' | null
  const [sidebarTab, setSidebarTab] = useState(null);
  const [chatMsg, setChatMsg] = useState('');
  
  const [messages, setMessages] = useState([]);
  const [students, setStudents] = useState([]);
  const [breakBanner, setBreakBanner] = useState(false);
  const [engScore, setEngScore] = useState(82);
  const [elapsed, setElapsed] = useState(0);

  // Connected notification
  const [joinNotifications, setJoinNotifications] = useState([]);
  const prevStudentsRef = useRef([]);

  const [isSpeaking, setIsSpeaking] = useState(false);

  // Camera preview stream
  const [stream, setStream] = useState(null);
  const [screenStream, setScreenStream] = useState(null);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

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
    : 'JD';

  // Classroom state polling
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
          
          // Toast notifies connected students
          const prevIds = prevStudentsRef.current.map(s => s._id || s.userId);
          activeStudents.forEach(s => {
            const currentId = s._id || s.userId;
            if (prevIds.length > 0 && !prevIds.includes(currentId)) {
              const nId = Date.now() + Math.random();
              setJoinNotifications(prev => [...prev, { id: nId, message: `${s.name} joined the class` }]);
              setTimeout(() => {
                setJoinNotifications(prev => prev.filter(n => n.id !== nId));
              }, 4000);
            }
          });
          prevStudentsRef.current = activeStudents;
          setStudents(activeStudents);

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

    // Join classroom action
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

  // Request camera stream
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

  // Mic speech analyze loop
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
        setIsSpeaking(average > 8); // threshold speech
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

  // Set audio enabled status
  useEffect(() => {
    if (stream) {
      stream.getAudioTracks().forEach(track => {
        track.enabled = !muted;
      });
    }
  }, [muted, stream]);

  // Bind local preview elements
  useEffect(() => {
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = stream || null;
    }
  }, [stream, camOff]);

  useEffect(() => {
    if (screenVideoRef.current) {
      screenVideoRef.current.srcObject = screenStream || null;
    }
  }, [screenStream, isScreenSharing]);

  // Student screen share trigger
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

  // Blackboard simulator canvas rendering
  useEffect(() => {
    const canvas = document.getElementById('teacher-lecture-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId;
    const render = () => {
      const w = canvas.width = canvas.clientWidth || 800;
      const h = canvas.height = canvas.clientHeight || 500;

      // blackboard
      ctx.fillStyle = '#080d1a';
      ctx.fillRect(0, 0, w, h);

      // grids
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

      // chalkboard title headers
      ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
      ctx.font = 'bold 15px sans-serif';
      ctx.fillText("Lecture 04: Derivative Tangents & Live Wave Slopes", 40, 50);

      // axis grids
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 2;
      const oX = w / 2;
      const oY = h / 2 + 30;
      
      ctx.beginPath();
      ctx.moveTo(45, oY); ctx.lineTo(w - 45, oY);
      ctx.moveTo(oX, 85); ctx.lineTo(oX, h - 75);
      ctx.stroke();

      // wave curve f(x)
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
          ctx.moveTo(px, py); first = false;
        } else {
          ctx.lineTo(px, py);
        }
      }
      ctx.stroke();

      // tangent node coordinates
      const tDx = Math.sin(time * 0.4) * (w / 3.2);
      const tX = oX + tDx;
      const tY = oY - Math.sin(tDx * sX + time) * Math.cos(tDx * 0.004) * sY;

      const delta = 0.1;
      const dyLeft = Math.sin((tDx - delta) * sX + time) * Math.cos((tDx - delta) * 0.004) * sY;
      const dyRight = Math.sin((tDx + delta) * sX + time) * Math.cos((tDx + delta) * 0.004) * sY;
      const slope = (dyRight - dyLeft) / (2 * delta);

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(tX - 70, tY + slope * 70);
      ctx.lineTo(tX + 70, tY - slope * 70);
      ctx.stroke();

      ctx.fillStyle = '#d4924e';
      ctx.beginPath();
      ctx.arc(tX, tY, 6.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.font = '12px monospace';
      ctx.fillText(`P(x) = (${Math.round(tDx)}, ${Math.round(tY - oY)})`, tX + 15, tY - 15);
      ctx.fillText(`Slope f'(x) = ${slope.toFixed(3)}`, tX + 15, tY + 4);

      // Embedded instructor preview camera Box
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

      ctx.fillStyle = '#c47c3e';
      const eqCount = 6;
      for (let i = 0; i < eqCount; i++) {
        const hEq = 4 + Math.abs(Math.sin(time * 7 + i)) * 14;
        ctx.fillRect(bX + 18 + i * 8, bY + bH - 18 - hEq, 4, hEq);
      }

      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      ctx.beginPath();
      ctx.arc(bX + bW / 2 + 20, bY + bH / 2 - 8, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(bX + bW / 2 + 20, bY + bH / 2 + 20, 20, 12, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = 'rgba(255,255,255,0.50)';
      ctx.font = '9px sans-serif';
      ctx.fillText("Dr. Ahmed (Lecturing)", bX + 15, bY + 16);

      animId = requestAnimationFrame(render);
    };
    render();
    return () => cancelAnimationFrame(animId);
  }, []);

  // Update engagement score locally
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

  const toggleSidebar = (tab) => {
    setSidebarTab(prev => prev === tab ? null : tab);
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[#111] text-snow relative">
      <style>{`
        @keyframes voiceRipple {
          0% { transform: scale(1); opacity: 0.7; }
          50% { transform: scale(1.15); opacity: 0.35; }
          100% { transform: scale(1.3); opacity: 0; }
        }
      `}</style>

      {/* ── TOAST NOTIFICATIONS ────────────────── */}
      <div className="fixed bottom-24 left-6 z-50 flex flex-col gap-2 pointer-events-none">
        {joinNotifications.map(n => (
          <div key={n.id} className="flex items-center gap-2.5 px-4.5 py-3 rounded-xl shadow-2xl bg-copper border border-white/10 text-white font-extrabold text-xs animate-fadeUp">
            <span>👤</span>
            <p>{n.message}</p>
          </div>
        ))}
      </div>

      {/* Break Banner */}
      {breakBanner && (
        <div id="student-break-banner" className="flex-shrink-0 flex items-center justify-center gap-3 px-6 py-3 z-50 bg-[#161a25] border-b border-copper/30 animate-fadeDown">
          <span className="text-white text-sm font-bold">☕ Teacher called a 5-minute break</span>
          <button onClick={() => setBreakBanner(false)} className="text-mist hover:text-snow transition-colors ml-3">×</button>
        </div>
      )}

      {/* Main viewport workspace */}
      <div className="flex-1 flex overflow-hidden relative h-full">
        
        {/* Main Blackboard lecture screen stage */}
        <div id="teacher-main-video" className="flex-1 relative flex items-center justify-center bg-[#0c0d12]">
          
          {isScreenSharing ? (
            /* Student screen sharing mode screen layout */
            <div className="w-full h-full flex flex-col bg-black">
              <video ref={screenVideoRef} autoPlay playsInline muted className="w-full h-full object-contain" />
              <div className="absolute bottom-4 left-4 text-[0.75rem] font-bold text-snow px-3 py-1.5 rounded-lg bg-black/60 backdrop-blur-md">
                Presenting your screen to class
              </div>
              <button onClick={() => stopScreenShare(null)} className="absolute bottom-4 right-4 px-4 py-2 rounded-xl text-[0.75rem] font-bold bg-red-600/90 hover:bg-red-500 text-white transition-all shadow-lg active:scale-95">
                Stop Presenting
              </button>
            </div>
          ) : (
            /* Chalkboard math canvas */
            <canvas id="teacher-lecture-canvas" className="w-full h-full object-cover" />
          )}

          {/* Floating Self Preview Box (Google Meet styled pip in corner) */}
          <div id="student-self-preview" className="absolute bottom-6 right-6 w-[180px] rounded-2xl overflow-hidden bg-[#1e1e1e] border border-white/10 shadow-2xl z-20 aspect-video transition-all duration-300">
            <div className="w-full h-full flex items-center justify-center">
              {camOff ? (
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-black bg-gradient-to-br from-[#c47c3e] to-[#8c5828]">{userInitials}</div>
              ) : (
                <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
              )}
            </div>
            <div className="absolute bottom-2 left-2 text-[0.58rem] font-semibold text-white px-2 py-0.5 rounded bg-black/60 font-medium">You</div>
            {muted && (
              <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 flex items-center justify-center">
                <Icon d="m19 10-1.39 4.5M9 5a3 3 0 0 1 5.3 1.8M12 19v4M8 23h8M1 1l22 22" size={10} className="text-red-400" />
              </div>
            )}
          </div>

          {/* Private personal attention telemetry indicator */}
          <div id="personal-score" className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/60 border border-copper/20 backdrop-blur-md">
            <span className="text-[0.68rem] text-mist font-medium">My Attention</span>
            <span className="text-[0.8rem] font-black text-copper">{Math.round(engScore)}%</span>
            <span className="text-[0.58rem] text-mist/40 font-bold">· local</span>
          </div>

          {/* AI Security indicator */}
          <div id="ai-active-badge" className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#161a25]/90 border border-copper/20 backdrop-blur-md">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#d4924e" strokeWidth="2.5">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            <span className="text-[0.68rem] font-bold text-snow">AI Protected</span>
            <span className="w-1.5 h-1.5 rounded-full bg-copper animate-pulse" />
          </div>
        </div>

        {/* Right: Unified Tabbed Sidebar Drawer */}
        {sidebarTab !== null && (
          <div id="unified-sidebar" className="w-[320px] flex-shrink-0 flex flex-col bg-[#171717] border-l border-[#262626] h-full z-30 animate-slide-down">
            
            {/* Sidebar Tab Header */}
            <div className="flex items-center border-b border-[#262626] px-2 pt-2">
              <button onClick={() => setSidebarTab('participants')}
                className={`flex-1 py-3 text-[0.76rem] font-extrabold border-b-2 text-center transition-colors ${
                  sidebarTab === 'participants' ? 'border-copper text-copper' : 'border-transparent text-mist hover:text-snow'
                }`}>
                Students ({students.length + 1})
              </button>
              <button onClick={() => setSidebarTab('chat')}
                className={`flex-1 py-3 text-[0.76rem] font-extrabold border-b-2 text-center transition-colors ${
                  sidebarTab === 'chat' ? 'border-copper text-copper' : 'border-transparent text-mist hover:text-snow'
                }`}>
                Chat
              </button>
              <button onClick={() => setSidebarTab(null)} className="p-2.5 text-mist hover:text-snow transition-colors">
                <Icon d="M18 6 6 18M6 6l12 12" size={14} />
              </button>
            </div>

            {/* Sidebar Tab Contents */}
            <div className="flex-1 overflow-y-auto flex flex-col min-h-0">
              
              {/* Tab 1: Connected Users */}
              {sidebarTab === 'participants' && (
                <div className="flex-1 p-4 flex flex-col gap-2.5">
                  <div className="flex items-center gap-2.5 py-1 border-b border-[#262626] pb-3">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[0.6rem] font-bold bg-[#1e293b] flex-shrink-0 border border-white/5">TA</div>
                    <span className="text-[0.78rem] text-mist flex-1 truncate font-medium">Dr. Ahmed</span>
                    <span className="text-[0.65rem] text-copper font-bold uppercase tracking-wider">Host</span>
                  </div>
                  {students.length === 0 ? (
                    <p className="text-center text-mist/30 text-[0.72rem] mt-8">No students connected</p>
                  ) : (
                    students.map(s => (
                      <div key={s._id || s.userId} className="flex items-center gap-2.5 py-1">
                        <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[0.6rem] font-bold bg-[#1f293d] flex-shrink-0 border border-white/5">{s.initials}</div>
                        <span className="text-[0.78rem] text-mist flex-1 truncate font-medium">{s.name}</span>
                        {s.handRaised && <span className="text-xs">✋</span>}
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Tab 2: Class Chat messages */}
              {sidebarTab === 'chat' && (
                <div className="flex-1 flex flex-col min-h-0 bg-transparent">
                  <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
                    {messages.length === 0 ? (
                      <p className="text-center text-mist/30 text-xs mt-8">No messages in chat</p>
                    ) : (
                      messages.map(m => (
                        <div key={m._id || m.id} className={`flex flex-col gap-0.5 ${m.sender === 'You' || m.sender.includes('(You)') || m.role === 'teacher' ? 'items-end' : 'items-start'}`}>
                          <span className="text-[0.64rem] text-mist/40">{m.sender}</span>
                          <div className="px-3 py-2 rounded-[14px] max-w-[85%]"
                            style={{ background: m.role === 'teacher' ? 'rgba(196,124,62,0.16)' : 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <p className="text-[0.78rem] text-snow/90 leading-relaxed font-medium">{m.msg}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="p-3 border-t border-[#262626] flex gap-2">
                    <input type="text" placeholder="Send a message…" value={chatMsg} onChange={e => setChatMsg(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && sendChat()}
                      className="flex-1 px-3 py-2 rounded-xl text-[0.78rem] text-white placeholder:text-mist/30 outline-none neu-input" />
                    <button onClick={sendChat} className="w-8 h-8 rounded-xl flex items-center justify-center btn-primary flex-shrink-0">
                      <Icon d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" size={13} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── GOOGLE MEET STYLE CONTROL BAR ─────── */}
      <div id="student-control-bar" className="fixed bottom-0 left-0 right-0 h-20 bg-[#171717] border-t border-[#262626] flex items-center justify-between px-6 z-40">
        
        {/* Left Section: Time & Details */}
        <div className="flex items-center gap-3">
          <span className="text-[0.82rem] text-mist font-bold uppercase tracking-wider">{formatTime(elapsed)}</span>
          <span className="text-white/10">|</span>
          <span className="text-[0.85rem] font-bold text-snow truncate max-w-[160px]">{meetingTitle}</span>
          <span className="text-white/10">|</span>
          <span className="text-[0.76rem] font-mono font-bold tracking-wider text-copper bg-white/5 border border-white/5 px-2.5 py-0.5 rounded-lg select-all cursor-pointer">{sessionId}</span>
        </div>

        {/* Center Section: Core Controls */}
        <div className="flex items-center gap-3.5">
          
          {/* Mute toggle */}
          <button id="student-ctrl-mute" onClick={() => setMuted(!muted)}
            className={`w-11 h-11 rounded-full flex items-center justify-center transition-all duration-200 relative ${
              muted 
                ? 'bg-red-500/20 border border-red-500/40 text-red-400 hover:bg-red-500/30' 
                : 'bg-[#2b2b2b] border border-[#3c3c3c] text-white hover:bg-[#363636]'
            }`}
            title={muted ? "Unmute Microphone" : "Mute Microphone"}>
            {isSpeaking && (
              <span className="absolute inset-0 rounded-full bg-[#c47c3e]/30 pointer-events-none animate-ping" style={{ animationDuration: '1.5s' }} />
            )}
            <Icon d={muted ? 'm12 19 3-3 M19 10v1a7.9 7.9 0 0 1-3.07 6.27M12 2a3 3 0 0 0-3 3v1.17M1 1l22 22' : 'M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z M19 10v2a7 7 0 0 1-14 0v-2 M12 19v4 M8 23h8'} size={18} />
          </button>

          {/* Video Toggle */}
          <button id="student-ctrl-cam" onClick={() => setCamOff(!camOff)}
            className={`w-11 h-11 rounded-full flex items-center justify-center transition-all duration-200 ${
              camOff 
                ? 'bg-red-500/20 border border-red-500/40 text-red-400 hover:bg-red-500/30' 
                : 'bg-[#2b2b2b] border border-[#3c3c3c] text-white hover:bg-[#363636]'
            }`}
            title={camOff ? "Start Video" : "Stop Video"}>
            <Icon d={camOff ? 'm2 2 20 20M21 16V8a2 2 0 0 0-2-2h-9.83 M22 8l-6 4 6 4V8Z' : 'm22 8-6 4 6 4V8Z M2 6h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z'} size={18} />
          </button>

          {/* Screen Share Toggle */}
          <button id="student-ctrl-screen" onClick={isScreenSharing ? () => stopScreenShare(null) : startScreenShare}
            className={`w-11 h-11 rounded-full flex items-center justify-center transition-all duration-200 ${
              isScreenSharing 
                ? 'bg-copper/20 border border-copper/40 text-copper hover:bg-copper/30' 
                : 'bg-[#2b2b2b] border border-[#3c3c3c] text-white hover:bg-[#363636]'
            }`}
            title={isScreenSharing ? "Stop Sharing Screen" : "Share Screen"}>
            <Icon d="M2 3h20a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z M12 17v4 M8 21h8" size={18} />
          </button>

          {/* Hand Raise Toggle */}
          <button id="student-ctrl-hand" onClick={() => setHandRaised(!handRaised)}
            className={`w-11 h-11 rounded-full flex items-center justify-center transition-all duration-200 ${
              handRaised 
                ? 'bg-copper/20 border border-copper/40 text-copper hover:bg-copper/30' 
                : 'bg-[#2b2b2b] border border-[#3c3c3c] text-white hover:bg-[#363636]'
            }`}
            title={handRaised ? "Lower Hand" : "Raise Hand"}>
            <Icon d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v5 M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v6 M10 10.5V3a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8.5 M6 12V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v9c0 5 4 9 9 9h3a9 9 0 0 0 9-9v-3.5a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2" size={18} />
          </button>

          {/* Leave Call Button */}
          <button id="student-ctrl-leave" onClick={() => router.push('/dashboard')}
            className="px-6 py-2.5 rounded-full bg-red-600 hover:bg-red-500 text-white font-extrabold text-[0.82rem] transition-all active:scale-95"
            title="Leave Session">
            Leave Class
          </button>
        </div>

        {/* Right Section: Sidebar Toggles */}
        <div className="flex items-center gap-3">
          
          {/* Participants list toggle */}
          <button onClick={() => toggleSidebar('participants')}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 relative ${
              sidebarTab === 'participants'
                ? 'bg-copper/20 border border-copper/40 text-copper'
                : 'bg-[#2b2b2b] border border-[#3c3c3c] text-[#f2f2f2]/60 hover:text-white hover:bg-[#363636]'
            }`}
            title="Class Participants">
            <Icon d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M16 3.13a4 4 0 0 1 0 7.75" size={17} />
            {students.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-copper text-white text-[0.58rem] font-bold w-4 h-4 rounded-full flex items-center justify-center border border-[#171717]">
                {students.length}
              </span>
            )}
          </button>

          {/* Chat Toggle */}
          <button onClick={() => toggleSidebar('chat')}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 relative ${
              sidebarTab === 'chat'
                ? 'bg-copper/20 border border-copper/40 text-copper'
                : 'bg-[#2b2b2b] border border-[#3c3c3c] text-[#f2f2f2]/60 hover:text-white hover:bg-[#363636]'
            }`}
            title="Class Chat">
            <Icon d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" size={17} />
            {messages.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-copper text-white text-[0.58rem] font-bold w-4 h-4 rounded-full flex items-center justify-center border border-[#171717]">
                {messages.length}
              </span>
            )}
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
      <div className="min-h-screen bg-[#0f111a] flex items-center justify-center">
        <div className="text-center animate-fadeIn">
          <div className="w-12 h-12 border-2 border-[rgba(196,124,62,0.20)] border-t-copper rounded-full animate-spin-slow mx-auto mb-4" />
          <p className="text-mist text-sm font-semibold">Loading classroom context…</p>
        </div>
      </div>
    }>
      <ClassroomContent />
    </Suspense>
  );
}
