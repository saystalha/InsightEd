'use client';

import { useState, useEffect, useRef, useMemo, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter, useParams } from 'next/navigation';
import { useClassroomWebRTC } from '@/lib/useClassroomWebRTC';
import MeetingVideoTile from '@/components/MeetingVideoTile';

/* ─── SVG Icon Helper ─────────────────────────── */
function Icon({ d, size = 20, fill = 'none', className = '', ...rest }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} {...rest}>
      {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p} />) : <path d={d} />}
    </svg>
  );
}

/* ─── Circular Gauge (CFI) ─────────────── */
function CircularGauge({ value = 75, size = 110 }) {
  const r = size / 2 - 10;
  const circ = 2 * Math.PI * r;
  const dash = (value / 100) * circ;
  const color = value > 65 ? '#3B82F6' : value > 40 ? '#60A5FA' : '#EF4444';
  const label = value > 65 ? 'High Focus' : value > 40 ? 'Moderate Attention' : 'Needs Engagement';

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="7" />
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="7"
            strokeDasharray={`${dash} ${circ - dash}`} strokeDashoffset={circ / 4} strokeLinecap="round"
            style={{ transition: 'stroke-dasharray 0.8s ease, stroke 0.5s' }} />
        </svg>
        <div className="absolute text-center">
          <p className="text-xl font-black text-white leading-none">{value}%</p>
          <p className="text-[10px] text-white/50 font-semibold tracking-wider">CFI</p>
        </div>
      </div>
      <p className="text-xs font-bold text-blue-400">{label}</p>
    </div>
  );
}

/* ─── Metric Bar ─────────────────────── */
function MetricBar({ label, value }) {
  const gradient = label === 'Attention'
    ? 'linear-gradient(90deg, #1D4ED8, #3B82F6)'
    : label === 'Confusion'
      ? 'linear-gradient(90deg, #EF4444, #F87171)'
      : 'linear-gradient(90deg, #10B981, #34D399)';

  return (
    <div className="flex flex-col gap-1 w-full">
      <div className="flex justify-between items-center text-xs">
        <span className="text-white/60 font-medium">{label}</span>
        <span className="font-bold text-white">{Math.round(value * 100)}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${value * 100}%`, background: gradient }} />
      </div>
    </div>
  );
}

const formatTime = (s) => `${String(Math.floor(s / 3600)).padStart(2, '0')}:${String(Math.floor((s % 3600) / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

/* ─── Unified High-End Classroom Component ─── */
function ClassroomView({ sessionId, role = 'student' }) {
  const router = useRouter();

  // Current user state
  const [userProfile, setUserProfile] = useState(null);
  const [meetingTitle, setMeetingTitle] = useState('InsightEd Live Classroom');
  const [cfi, setCfi] = useState(75);
  const [metrics, setMetrics] = useState({ attention: 0.75, confusion: 0.20, energy: 0.70 });
  const [elapsed, setElapsed] = useState(0);

  // Tabbed sidebar state: 'chat' | 'participants' | 'analytics' | null
  const [sidebarTab, setSidebarTab] = useState(null);
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const chatScrollRef = useRef(null);

  // Notifications & alerts
  const [toasts, setToasts] = useState([]);
  const [breakAlert, setBreakAlert] = useState(false);
  const [topicLabel, setTopicLabel] = useState('');
  const [topicMarkers, setTopicMarkers] = useState([]);
  const [announcement, setAnnouncement] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);

  // Modals
  const [isEndModalOpen, setIsEndModalOpen] = useState(false);
  const [isSessionEndedModalOpen, setIsSessionEndedModalOpen] = useState(false);
  const [pinnedPeerId, setPinnedPeerId] = useState(null);

  const screenVideoRef = useRef(null);
  const prevHandsRef = useRef({});

  // Show Toast helper
  const showToast = useCallback((message, icon = 'ℹ️') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, icon }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  }, []);

  // Retrieve authenticated profile
  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.authenticated && data.user) {
          setUserProfile(data.user);
          localStorage.setItem('userName', `${data.user.firstName} ${data.user.lastName}`);
        }
      })
      .catch(err => console.warn('Could not load user profile:', err));
  }, []);

  // Determine stable user info immediately
  const currentUser = useMemo(() => {
    const storedName = typeof window !== 'undefined' ? localStorage.getItem('userName') : null;
    if (userProfile) {
      return {
        id: userProfile._id,
        name: `${userProfile.firstName} ${userProfile.lastName}`,
        role: role === 'teacher' ? 'teacher' : (userProfile.role || 'student')
      };
    }
    return {
      id: storedName ? `usr_${storedName.replace(/\s+/g, '_').toLowerCase()}` : (role === 'teacher' ? 'usr_teacher' : 'usr_student'),
      name: storedName || (role === 'teacher' ? 'Instructor' : 'Student'),
      role
    };
  }, [userProfile, role]);

  // Handle incoming real-time chat messages
  const handleIncomingChatMessage = useCallback((msg) => {
    setChatMessages(prev => {
      if (prev.some(m => m.id === msg.id)) return prev;
      return [...prev, msg];
    });

    if (sidebarTab !== 'chat') {
      setUnreadChatCount(c => c + 1);
    }
  }, [sidebarTab]);

  const onPeerJoin = useCallback((peer) => {
    showToast(`${peer.name} joined the class`, '👤');
  }, [showToast]);

  const onPeerLeave = useCallback((peer) => {
    showToast(`${peer.name} left the class`, '👋');
  }, [showToast]);

  // Initialize WebRTC
  const {
    myId,
    myName,
    myRole,
    localStream,
    remoteStreams,
    peers,
    muted,
    camOff,
    isSpeaking,
    handRaised,
    isScreenSharing,
    localScreenStream,
    remoteScreenStream,
    screenSharer,
    toggleMic,
    toggleCam,
    toggleHandRaise,
    startScreenShare,
    stopScreenShare,
    sendChatMessage
  } = useClassroomWebRTC({
    sessionId,
    user: currentUser,
    onChatMessage: handleIncomingChatMessage,
    onPeerJoin,
    onPeerLeave
  });

  // Track session duration
  useEffect(() => {
    const timer = setInterval(() => setElapsed(s => s + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  // Poll database meeting session state - STRICTLY runs periodically without effect restarts
  useEffect(() => {
    if (!sessionId) return;

    let isMounted = true;

    async function fetchSessionState() {
      try {
        const res = await fetch(`/api/classroom/${sessionId}`);
        if (!res.ok) return;
        const data = await res.json();
        if (isMounted && data.success) {
          const meeting = data.meeting;
          setMeetingTitle(meeting.title || 'InsightEd Classroom');
          setCfi(meeting.cfi || 75);
          setMetrics({
            attention: meeting.attention ?? 0.75,
            confusion: meeting.confusion ?? 0.20,
            energy: meeting.energy ?? 0.70
          });
          setTopicMarkers(meeting.topicMarkers || []);

          if (meeting.messages && meeting.messages.length > 0) {
            setChatMessages(prev => {
              const ids = new Set(prev.map(m => m.id || m._id));
              const newMsgs = meeting.messages.filter(m => !ids.has(m._id || m.id));
              if (newMsgs.length === 0) return prev;
              return [...prev, ...newMsgs];
            });
          }

          if (meeting.cfi < 40 && role === 'teacher') {
            setBreakAlert(true);
          }
        } else if (data.active === false) {
          setIsSessionEndedModalOpen(true);
        }
      } catch (err) {}
    }

    // Join room in DB once
    fetch(`/api/classroom/${sessionId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'join',
        peerId: myId,
        userName: myName,
        role: myRole
      })
    })
      .then(() => fetchSessionState())
      .catch(() => {});

    const pollInterval = setInterval(fetchSessionState, 4000);

    return () => {
      isMounted = false;
      clearInterval(pollInterval);
    };
  }, [sessionId, myId, myName, myRole, role]);

  // Keep heartbeat alive in MongoDB
  useEffect(() => {
    if (!sessionId) return;
    const hbInterval = setInterval(() => {
      fetch(`/api/classroom/${sessionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'heartbeat',
          peerId: myId,
          userName: myName,
          role: myRole,
          camOff,
          muted,
          handRaised,
          isSpeaking,
          score: Math.round(metrics.attention * 100)
        })
      }).catch(() => {});
    }, 4500);
    return () => clearInterval(hbInterval);
  }, [sessionId, myId, myName, myRole, camOff, muted, handRaised, isSpeaking, metrics.attention]);

  // Filter out duplicate peers by name and self
  const peerList = useMemo(() => {
    const list = Object.values(peers).filter(p => p.id !== myId && p.name !== myName);
    const seen = new Set();
    const unique = [];
    for (const p of list) {
      if (!seen.has(p.name)) {
        seen.add(p.name);
        unique.push(p);
      }
    }
    return unique;
  }, [peers, myId, myName]);

  // Handle hand raised notification for teacher without loops
  useEffect(() => {
    if (role === 'teacher') {
      peerList.forEach(p => {
        if (p.handRaised && !prevHandsRef.current[p.id]) {
          showToast(`${p.name} raised their hand`, '✋');
        }
        prevHandsRef.current[p.id] = p.handRaised;
      });
    }
  }, [peerList, role, showToast]);

  // Resume any blocked audio on user click
  useEffect(() => {
    const resumeAllAudio = () => {
      document.querySelectorAll('audio, video').forEach(media => {
        if (media.paused && media.srcObject && !media.muted) {
          media.play().catch(() => {});
        }
      });
    };
    window.addEventListener('click', resumeAllAudio, { passive: true });
    window.addEventListener('keydown', resumeAllAudio, { passive: true });
    window.addEventListener('touchstart', resumeAllAudio, { passive: true });
    return () => {
      window.removeEventListener('click', resumeAllAudio);
      window.removeEventListener('keydown', resumeAllAudio);
      window.removeEventListener('touchstart', resumeAllAudio);
    };
  }, []);

  // Ensure remote screen stream binds to video element
  useEffect(() => {
    if (screenVideoRef.current) {
      const activeScreen = isScreenSharing ? localScreenStream : remoteScreenStream;
      if (activeScreen) {
        screenVideoRef.current.srcObject = activeScreen;
        screenVideoRef.current.play().catch(() => {});
      } else {
        screenVideoRef.current.srcObject = null;
      }
    }
  }, [isScreenSharing, localScreenStream, remoteScreenStream]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (sidebarTab === 'chat' && chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages, sidebarTab]);

  // Send a chat message
  const handleSendChat = async () => {
    if (!chatInput.trim()) return;
    const text = chatInput.trim();
    setChatInput('');

    const timeStr = new Date().toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' });
    const localMsg = {
      id: `local_${Date.now()}`,
      sender: myName,
      role: myRole,
      msg: text,
      time: timeStr
    };

    // Optimistic local update
    setChatMessages(prev => [...prev, localMsg]);

    // Fast WebRTC broadcast
    sendChatMessage(text);

    // Save to DB
    try {
      await fetch(`/api/classroom/${sessionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'chat',
          msg: text,
          userName: myName,
          role: myRole
        })
      });
    } catch (err) {
      console.warn('DB chat save failed:', err);
    }
  };

  // Teacher marks a topic marker
  const handleMarkTopic = async () => {
    if (!topicLabel.trim()) return;
    const label = topicLabel.trim();
    setTopicLabel('');
    try {
      const res = await fetch(`/api/classroom/${sessionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'marker',
          label,
          time: formatTime(elapsed),
          cfi
        })
      });
      if (res.ok) {
        showToast(`Topic marked: "${label}"`, '📌');
      }
    } catch (e) {
      console.warn('Topic marker failed:', e);
    }
  };

  // Teacher broadcasts an announcement
  const handleBroadcastAnnouncement = () => {
    if (!announcement.trim()) return;
    const text = announcement.trim();
    setAnnouncement('');
    sendChatMessage(`📢 ANNOUNCEMENT: ${text}`);
    showToast('Announcement sent to class', '📢');
  };

  // End or Leave Class
  const handleEndOrLeave = () => {
    if (role === 'teacher') {
      setIsEndModalOpen(true);
    } else {
      router.push('/dashboard');
    }
  };

  const confirmEndClass = async () => {
    setIsEndModalOpen(false);
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
  };

  const handleCopyCode = () => {
    navigator.clipboard?.writeText(sessionId);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const totalCount = peerList.length + 1; // +1 for self
  const activeScreenShare = isScreenSharing ? localScreenStream : remoteScreenStream;
  const presentingUser = isScreenSharing ? { name: 'You' } : screenSharer;

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-[#0d0f15] text-white relative font-sans select-none">
      
      {/* ── TOAST NOTIFICATIONS ────────────────── */}
      <div className="fixed bottom-24 left-6 z-50 flex flex-col gap-2.5 pointer-events-none">
        {toasts.map(t => (
          <div key={t.id} className="flex items-center gap-3 px-4.5 py-3 rounded-2xl shadow-2xl bg-[#1c2130] border border-white/10 text-white font-semibold text-xs backdrop-blur-xl animate-fadeUp">
            <span className="text-sm">{t.icon}</span>
            <p className="tracking-wide">{t.message}</p>
          </div>
        ))}
      </div>

      {/* ── BREAK ALERT BANNER ────────────────── */}
      {breakAlert && (
        <div className="flex-shrink-0 flex items-center justify-between px-6 py-2.5 z-50 bg-gradient-to-r from-blue-900/90 to-indigo-900/90 border-b border-blue-400/30 backdrop-blur-md animate-slide-down">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
            <div>
              <p className="text-xs font-bold text-white">Engagement Alert: Class Focus Index dropped to {cfi}%</p>
              <p className="text-[11px] text-white/70">A 5-minute break is recommended to restore student focus.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                sendChatMessage('☕ Instructor announced a 5-minute break. Grab water and stretch!');
                setBreakAlert(false);
              }}
              className="px-4 py-1.5 rounded-full text-xs font-black bg-blue-500 hover:bg-blue-400 text-white transition-all shadow-md active:scale-95"
            >
              Call 5-min Break
            </button>
            <button onClick={() => setBreakAlert(false)} className="text-white/60 hover:text-white p-1">
              <Icon d="M18 6 6 18M6 6l12 12" size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ── TOP HEADER BAR ────────────────────── */}
      <header className="h-14 px-6 flex items-center justify-between border-b border-white/5 bg-[#12151e]/80 backdrop-blur-md flex-shrink-0 z-30">
        <div className="flex items-center gap-3.5">
          {/* Logo Badge */}
          <div className="w-7 h-7 rounded-xl bg-blue-600 flex items-center justify-center font-black text-xs shadow-md shadow-blue-600/30">
            IE
          </div>

          <div className="flex items-center gap-2">
            <h1 className="text-sm font-bold text-white tracking-tight truncate max-w-[260px] sm:max-w-[400px]">
              {meetingTitle}
            </h1>
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-red-500/15 border border-red-500/30 text-[10px] font-black uppercase text-red-400 tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              Live
            </span>
          </div>
        </div>

        {/* Center / Right metadata badges */}
        <div className="flex items-center gap-3">
          {/* Meeting Code Copy */}
          <button
            onClick={handleCopyCode}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono font-bold text-blue-400 transition-all active:scale-95"
            title="Click to copy meeting code"
          >
            <Icon d="M9 9h13v13H9z M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" size={12} />
            <span>{sessionId}</span>
            {copiedCode && <span className="text-[10px] text-emerald-400 ml-1">Copied!</span>}
          </button>

          {/* CFI Indicator for Teacher */}
          {role === 'teacher' && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs font-bold text-blue-400">
              <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
              <span>CFI: {cfi}%</span>
            </div>
          )}

          {/* Elapsed Timer */}
          <div className="text-xs font-mono font-bold text-white/60 bg-white/5 px-2.5 py-1.5 rounded-xl border border-white/5">
            {formatTime(elapsed)}
          </div>
        </div>
      </header>

      {/* ── MAIN VIDEO & COLLABORATION STAGE ─── */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* Main Stage: Grid or Presentation Mode */}
        <div className="flex-1 flex flex-col justify-center items-center p-4 sm:p-6 overflow-hidden relative min-h-0">
          
          {activeScreenShare ? (
            /* ── PRESENTATION / SCREEN SHARING MODE ── */
            <div className="w-full h-full flex flex-col gap-3 min-h-0">
              
              {/* Primary High-Resolution Presentation Screen */}
              <div className="flex-1 relative rounded-2xl overflow-hidden bg-[#07090e] border border-white/10 flex items-center justify-center shadow-2xl min-h-0">
                <video
                  ref={el => {
                    screenVideoRef.current = el;
                    if (el && activeScreenShare && el.srcObject !== activeScreenShare) {
                      el.srcObject = activeScreenShare;
                      el.play().catch(() => {});
                    }
                  }}
                  autoPlay
                  playsInline
                  muted={isScreenSharing}
                  className="w-full h-full object-contain"
                />

                {/* Presenter Pill Overlay */}
                <div className="absolute top-4 left-4 flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-black/70 backdrop-blur-md border border-white/10 text-xs font-bold text-white shadow-xl">
                  <Icon d="M2 3h20a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z M12 17v4 M8 21h8" size={14} className="text-blue-400" />
                  <span>{presentingUser?.name} is sharing their screen</span>
                </div>

                {/* Stop Sharing Button (if self) */}
                {isScreenSharing && (
                  <button
                    onClick={stopScreenShare}
                    className="absolute bottom-4 right-4 px-4 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-500 text-white transition-all shadow-lg active:scale-95 flex items-center gap-2"
                  >
                    <Icon d="M18 6 6 18M6 6l12 12" size={14} />
                    Stop Presenting
                  </button>
                )}
              </div>

              {/* Bottom Carousel Thumbnail Strip */}
              <div className="h-[120px] flex gap-3 overflow-x-auto pb-1 flex-shrink-0 w-full items-center justify-center">
                {/* Self tile thumbnail */}
                <div className="w-[180px] h-full flex-shrink-0">
                  <MeetingVideoTile
                    stream={localStream}
                    name={myName}
                    role={myRole}
                    isLocal={true}
                    muted={muted}
                    camOff={camOff}
                    isSpeaking={isSpeaking}
                    handRaised={handRaised}
                  />
                </div>

                {/* Peer tiles thumbnails */}
                {peerList.map(peer => (
                  <div key={peer.id} className="w-[180px] h-full flex-shrink-0">
                    <MeetingVideoTile
                      stream={remoteStreams[peer.id]}
                      name={peer.name}
                      role={peer.role}
                      isLocal={false}
                      muted={peer.muted}
                      camOff={peer.camOff}
                      isSpeaking={peer.isSpeaking}
                      handRaised={peer.handRaised}
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* ── RESPONSIVE BALANCED GRID MODE ── */
            <div className={`w-full h-full flex items-center justify-center min-h-0 ${
              totalCount === 1
                ? 'max-w-3xl'
                : totalCount === 2
                ? 'grid grid-cols-1 sm:grid-cols-2 max-w-5xl gap-4'
                : totalCount <= 4
                ? 'grid grid-cols-2 max-w-5xl gap-4'
                : 'grid grid-cols-2 md:grid-cols-3 max-w-6xl gap-3 sm:gap-4'
            }`}>
              
              {/* Local Video Tile */}
              <MeetingVideoTile
                stream={localStream}
                name={myName}
                role={myRole}
                isLocal={true}
                muted={muted}
                camOff={camOff}
                isSpeaking={isSpeaking}
                handRaised={handRaised}
                isPinned={pinnedPeerId === myId}
                onPin={() => setPinnedPeerId(pinnedPeerId === myId ? null : myId)}
              />

              {/* Remote Peer Video Tiles */}
              {peerList.map(peer => (
                <MeetingVideoTile
                  key={peer.id}
                  stream={remoteStreams[peer.id]}
                  name={peer.name}
                  role={peer.role}
                  isLocal={false}
                  muted={peer.muted}
                  camOff={peer.camOff}
                  isSpeaking={peer.isSpeaking}
                  handRaised={peer.handRaised}
                  isPinned={pinnedPeerId === peer.id}
                  onPin={() => setPinnedPeerId(pinnedPeerId === peer.id ? null : peer.id)}
                />
              ))}
            </div>
          )}

        </div>

        {/* ── UNIFIED RIGHT DRAWER SIDEBAR ──────── */}
        {sidebarTab !== null && (
          <aside className="w-[340px] flex-shrink-0 flex flex-col bg-[#141824] border-l border-white/10 h-full z-40 animate-slide-down shadow-2xl">
            
            {/* Sidebar Tab Header */}
            <div className="flex items-center justify-between border-b border-white/10 px-4 pt-3 pb-2">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => { setSidebarTab('chat'); setUnreadChatCount(0); }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    sidebarTab === 'chat'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  Chat
                </button>
                <button
                  onClick={() => setSidebarTab('participants')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    sidebarTab === 'participants'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  People ({totalCount})
                </button>
                {role === 'teacher' && (
                  <button
                    onClick={() => setSidebarTab('analytics')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      sidebarTab === 'analytics'
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'text-white/60 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    Focus
                  </button>
                )}
              </div>

              <button
                onClick={() => setSidebarTab(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-colors"
                title="Close panel"
              >
                <Icon d="M18 6 6 18M6 6l12 12" size={16} />
              </button>
            </div>

            {/* TAB 1: REAL-TIME IN-CALL CHAT */}
            {sidebarTab === 'chat' && (
              <div className="flex-1 flex flex-col min-h-0">
                <div ref={chatScrollRef} className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 min-h-0">
                  <div className="p-3 rounded-xl bg-white/5 border border-white/5 text-[11px] text-white/50 text-center">
                    Messages are delivered in real time to everyone in the call.
                  </div>

                  {chatMessages.length === 0 ? (
                    <div className="text-center text-white/30 text-xs my-auto py-8">
                      No messages yet. Say hello! 👋
                    </div>
                  ) : (
                    chatMessages.map((m, idx) => {
                      const isMe = m.sender === myName || m.sender === 'You';
                      const isHost = m.role === 'teacher';

                      return (
                        <div key={m.id || idx} className={`flex flex-col gap-1 ${isMe ? 'items-end' : 'items-start'}`}>
                          <div className="flex items-center gap-1.5 px-1 text-[11px] text-white/50">
                            <span className="font-semibold text-white/70">{m.sender}</span>
                            {isHost && (
                              <span className="text-[9px] font-black uppercase text-blue-400 bg-blue-500/20 px-1.5 py-0.2 rounded border border-blue-400/30">
                                Host
                              </span>
                            )}
                            <span className="font-mono text-[10px] text-white/40">{m.time}</span>
                          </div>
                          
                          <div
                            className={`px-3.5 py-2 rounded-2xl max-w-[85%] text-xs font-medium leading-relaxed shadow-md ${
                              isMe
                                ? 'bg-blue-600 text-white rounded-br-none'
                                : isHost
                                ? 'bg-[#1e2538] text-blue-100 border border-blue-500/30 rounded-bl-none'
                                : 'bg-[#1b1f2d] text-white/90 border border-white/10 rounded-bl-none'
                            }`}
                          >
                            {m.msg}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Chat Input Bar */}
                <div className="p-3 border-t border-white/10 bg-[#121520] flex gap-2">
                  <input
                    type="text"
                    placeholder="Send message to everyone…"
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSendChat()}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder:text-white/30 outline-none focus:border-blue-500 focus:bg-white/10 transition-all"
                  />
                  <button
                    onClick={handleSendChat}
                    disabled={!chatInput.trim()}
                    className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md active:scale-95 flex-shrink-0"
                  >
                    <Icon d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" size={15} />
                  </button>
                </div>
              </div>
            )}

            {/* TAB 2: PARTICIPANTS DIRECTORY */}
            {sidebarTab === 'participants' && (
              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2 min-h-0">
                <p className="text-[11px] font-bold uppercase tracking-wider text-white/40 mb-1">In This Meeting</p>
                
                {/* Self row */}
                <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white/5 border border-white/5">
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
                    {myName.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-white truncate">{myName} (You)</p>
                    <p className="text-[10px] text-white/50">{myRole === 'teacher' ? 'Host' : 'Student'}</p>
                  </div>
                  <div className="flex items-center gap-1.5 text-white/60">
                    {muted ? (
                      <Icon d="m19 10-1.39 4.5M9 5a3 3 0 0 1 5.3 1.8M12 19v4M8 23h8M1 1l22 22" size={14} className="text-red-400" />
                    ) : (
                      <Icon d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" size={14} className="text-emerald-400" />
                    )}
                    {camOff ? (
                      <Icon d="m2 2 20 20M21 16V8a2 2 0 0 0-2-2h-9.83 M22 8l-6 4 6 4V8Z" size={14} className="text-red-400" />
                    ) : (
                      <Icon d="m22 8-6 4 6 4V8Z M2 6h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z" size={14} className="text-blue-400" />
                    )}
                  </div>
                </div>

                {/* Remote peers list */}
                {peerList.length === 0 ? (
                  <p className="text-center text-white/30 text-xs py-8">Waiting for other participants to join…</p>
                ) : (
                  peerList.map(peer => (
                    <div key={peer.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                      <div className="w-8 h-8 rounded-full bg-slate-700 text-white font-bold text-xs flex items-center justify-center">
                        {peer.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-white truncate">{peer.name}</p>
                        <p className="text-[10px] text-white/50">{peer.role === 'teacher' ? 'Host' : 'Student'}</p>
                      </div>
                      <div className="flex items-center gap-1.5 text-white/60">
                        {peer.handRaised && <span className="text-sm">✋</span>}
                        {peer.muted ? (
                          <Icon d="m19 10-1.39 4.5M9 5a3 3 0 0 1 5.3 1.8M12 19v4M8 23h8M1 1l22 22" size={14} className="text-red-400" />
                        ) : (
                          <Icon d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" size={14} className="text-emerald-400" />
                        )}
                        {peer.camOff ? (
                          <Icon d="m2 2 20 20M21 16V8a2 2 0 0 0-2-2h-9.83 M22 8l-6 4 6 4V8Z" size={14} className="text-red-400" />
                        ) : (
                          <Icon d="m22 8-6 4 6 4V8Z M2 6h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z" size={14} className="text-blue-400" />
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* TAB 3: FOCUS & ENGAGEMENT TELEMETRY (TEACHER ONLY) */}
            {sidebarTab === 'analytics' && role === 'teacher' && (
              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-5 min-h-0">
                <div className="flex flex-col items-center border-b border-white/10 pb-5">
                  <CircularGauge value={cfi} />
                </div>

                <div className="flex flex-col gap-3 border-b border-white/10 pb-5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-white/50">Engagement Metrics</p>
                  <MetricBar label="Attention" value={metrics.attention} />
                  <MetricBar label="Confusion" value={metrics.confusion} />
                  <MetricBar label="Energy" value={metrics.energy} />
                </div>

                {/* Topic Marker Section */}
                <div className="border-b border-white/10 pb-5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-white/50 mb-2">Mark Topic Timestamp</p>
                  <div className="flex gap-2 mb-3">
                    <input
                      type="text"
                      placeholder="e.g. Chapter 3: Vector Spaces"
                      value={topicLabel}
                      onChange={e => setTopicLabel(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleMarkTopic()}
                      className="flex-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder:text-white/30 outline-none focus:border-blue-500"
                    />
                    <button
                      onClick={handleMarkTopic}
                      className="px-3.5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-md active:scale-95"
                    >
                      Mark
                    </button>
                  </div>

                  {topicMarkers.length > 0 && (
                    <div className="flex flex-col gap-1.5 max-h-[110px] overflow-y-auto">
                      {topicMarkers.map((m, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs py-1 px-2 rounded-lg bg-white/5">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                          <span className="text-white/80 truncate flex-1">{m.label}</span>
                          <span className="text-white/40 font-mono text-[10px]">{m.time}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Announcement Section */}
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-white/50 mb-2">Broadcast to Class</p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Broadcast instant notification…"
                      value={announcement}
                      onChange={e => setAnnouncement(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleBroadcastAnnouncement()}
                      className="flex-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder:text-white/30 outline-none focus:border-blue-500"
                    />
                    <button
                      onClick={handleBroadcastAnnouncement}
                      className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white transition-all active:scale-95"
                    >
                      Send
                    </button>
                  </div>
                </div>
              </div>
            )}
          </aside>
        )}
      </div>

      {/* ── GOOGLE MEET STYLE FLOATING BOTTOM CONTROL DOCK ── */}
      <footer className="h-20 bg-[#12151e]/90 backdrop-blur-xl border-t border-white/10 flex items-center justify-between px-6 z-40 flex-shrink-0">
        
        {/* Left: Meeting metadata */}
        <div className="hidden sm:flex items-center gap-3">
          <span className="text-xs font-mono font-bold text-white/50">{formatTime(elapsed)}</span>
          <span className="text-white/10">|</span>
          <span className="text-xs font-bold text-white truncate max-w-[180px]">{meetingTitle}</span>
        </div>

        {/* Center: Core Call Controls */}
        <div className="flex items-center gap-3 mx-auto sm:mx-0">
          
          {/* Microphone Toggle */}
          <button
            onClick={toggleMic}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 relative ${
              muted
                ? 'bg-red-500 text-white shadow-lg shadow-red-500/25 hover:bg-red-600'
                : 'bg-white/10 hover:bg-white/20 text-white border border-white/10'
            }`}
            title={muted ? 'Turn on microphone' : 'Turn off microphone'}
          >
            {isSpeaking && !muted && (
              <span className="absolute inset-0 rounded-full bg-blue-500/30 animate-ping pointer-events-none" style={{ animationDuration: '1.5s' }} />
            )}
            <Icon
              d={muted ? 'm12 19 3-3 M19 10v1a7.9 7.9 0 0 1-3.07 6.27M12 2a3 3 0 0 0-3 3v1.17M1 1l22 22' : 'M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z M19 10v2a7 7 0 0 1-14 0v-2 M12 19v4 M8 23h8'}
              size={19}
            />
          </button>

          {/* Camera Toggle */}
          <button
            onClick={toggleCam}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 ${
              camOff
                ? 'bg-red-500 text-white shadow-lg shadow-red-500/25 hover:bg-red-600'
                : 'bg-white/10 hover:bg-white/20 text-white border border-white/10'
            }`}
            title={camOff ? 'Turn on camera' : 'Turn off camera'}
          >
            <Icon
              d={camOff ? 'm2 2 20 20M21 16V8a2 2 0 0 0-2-2h-9.83 M22 8l-6 4 6 4V8Z' : 'm22 8-6 4 6 4V8Z M2 6h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z'}
              size={19}
            />
          </button>

          {/* Screen Share Toggle */}
          <button
            onClick={isScreenSharing ? stopScreenShare : startScreenShare}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 ${
              isScreenSharing
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 ring-2 ring-blue-400'
                : 'bg-white/10 hover:bg-white/20 text-white border border-white/10'
            }`}
            title={isScreenSharing ? 'Stop sharing screen' : 'Share your screen'}
          >
            <Icon d="M2 3h20a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z M12 17v4 M8 21h8" size={19} />
          </button>

          {/* Hand Raise Toggle (Students) */}
          {role === 'student' && (
            <button
              onClick={toggleHandRaise}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 ${
                handRaised
                  ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30 ring-2 ring-amber-400'
                  : 'bg-white/10 hover:bg-white/20 text-white border border-white/10'
              }`}
              title={handRaised ? 'Lower hand' : 'Raise hand'}
            >
              <span className="text-xl">✋</span>
            </button>
          )}

          {/* End Call / Leave Button */}
          <button
            onClick={handleEndOrLeave}
            className="px-6 py-3 rounded-full bg-red-600 hover:bg-red-500 text-white font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-red-600/25 active:scale-95 flex items-center gap-2"
            title={role === 'teacher' ? 'End meeting for all' : 'Leave meeting'}
          >
            <Icon d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.42 19.42 0 0 1-6-6 19.8 19.8 0 0 1-3.12-8.68A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91" size={16} />
            <span>{role === 'teacher' ? 'End Session' : 'Leave'}</span>
          </button>
        </div>

        {/* Right: Drawer Toggles */}
        <div className="flex items-center gap-2">
          
          {/* Analytics (Teacher) */}
          {role === 'teacher' && (
            <button
              onClick={() => setSidebarTab(prev => prev === 'analytics' ? null : 'analytics')}
              className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${
                sidebarTab === 'analytics'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/5'
              }`}
              title="Class Focus Analytics"
            >
              <Icon d="M18 20V10 M12 20V4 M6 20V14" size={17} />
            </button>
          )}

          {/* Participants */}
          <button
            onClick={() => setSidebarTab(prev => prev === 'participants' ? null : 'participants')}
            className={`w-11 h-11 rounded-full flex items-center justify-center transition-all relative ${
              sidebarTab === 'participants'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/5'
            }`}
            title="People"
          >
            <Icon d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M16 3.13a4 4 0 0 1 0 7.75" size={17} />
            <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center border-2 border-[#12151e]">
              {totalCount}
            </span>
          </button>

          {/* Chat */}
          <button
            onClick={() => {
              setSidebarTab(prev => prev === 'chat' ? null : 'chat');
              setUnreadChatCount(0);
            }}
            className={`w-11 h-11 rounded-full flex items-center justify-center transition-all relative ${
              sidebarTab === 'chat'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/5'
            }`}
            title="Chat"
          >
            <Icon d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" size={17} />
            {unreadChatCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center border-2 border-[#12151e] animate-pulse">
                {unreadChatCount}
              </span>
            )}
          </button>
        </div>
      </footer>

      {/* ── TEACHER END CLASS CONFIRMATION MODAL ── */}
      {isEndModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
          <div className="relative rounded-[24px] max-w-[420px] w-full p-8 bg-[#181d2a] border border-red-500/30 shadow-2xl animate-modal-in">
            <div className="w-12 h-12 rounded-2xl bg-red-500/15 border border-red-500/30 text-red-400 flex items-center justify-center mb-4">
              <Icon d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" size={24} />
            </div>
            <h3 className="text-lg font-black text-white mb-2">End Session for All?</h3>
            <p className="text-xs text-white/60 leading-relaxed mb-6">
              Ending this classroom session will immediately disconnect all students and finalize the engagement report.
            </p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsEndModalOpen(false)}
                className="flex-1 py-3 rounded-xl font-bold text-xs text-white/70 hover:bg-white/5 border border-white/10 transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmEndClass}
                className="flex-1 py-3 rounded-xl font-bold text-xs text-white bg-red-600 hover:bg-red-500 transition-all shadow-lg shadow-red-600/30 active:scale-95"
              >
                End Meeting
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── SESSION ENDED DISMISSED MODAL ── */}
      {isSessionEndedModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="relative rounded-[24px] max-w-[400px] w-full p-8 bg-[#181d2a] border border-blue-500/30 shadow-2xl animate-modal-in text-center">
            <div className="w-14 h-14 bg-blue-500/15 text-blue-400 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-black">
              ✓
            </div>
            <h3 className="text-lg font-black text-white mb-2">Classroom Session Ended</h3>
            <p className="text-xs text-white/60 leading-relaxed mb-6">
              The instructor has ended this live session. Your focus analytics have been saved.
            </p>
            <button
              type="button"
              onClick={() => router.push('/dashboard')}
              className="w-full py-3.5 rounded-xl font-black text-xs uppercase tracking-wider text-white bg-blue-600 hover:bg-blue-500 transition-all shadow-lg active:scale-95"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Main export with role detection ── */
function ClassroomContent() {
  const { sessionId } = useParams();
  const searchParams = useSearchParams();
  const role = searchParams.get('role') || 'student';

  return <ClassroomView sessionId={sessionId} role={role} />;
}

export default function ClassroomPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0d0f15] flex items-center justify-center">
        <div className="text-center animate-fadeIn">
          <div className="w-12 h-12 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/60 text-sm font-semibold">Initializing InsightEd Live Room…</p>
        </div>
      </div>
    }>
      <ClassroomContent />
    </Suspense>
  );
}
