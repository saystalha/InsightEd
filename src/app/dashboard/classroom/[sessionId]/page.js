'use client';

import { useState, useEffect, useRef, useMemo, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter, useParams } from 'next/navigation';
import { useClassroomWebRTC } from '@/lib/useClassroomWebRTC';
import MeetingVideoTile from '@/components/MeetingVideoTile';

/* ─── SVG Icon Helper ─────────────────────────── */
function Icon({ d, size = 18, fill = 'none', className = '', ...rest }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} {...rest}>
      {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p} />) : <path d={d} />}
    </svg>
  );
}

function ScreenShareTile({ share, featured = false, isPinned = false, onPin, onStop }) {
  const videoRef = useRef(null);
  const audioRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.srcObject = share.stream;
    video.play().catch(() => {});
    return () => {
      video.srcObject = null;
    };
  }, [share.stream]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || share.isLocal || !share.stream.getAudioTracks().length) return;
    audio.srcObject = share.stream;
    audio.play().catch(() => {});
    return () => {
      audio.srcObject = null;
    };
  }, [share.isLocal, share.stream]);

  return (
    <div className={`relative w-full h-full min-h-0 overflow-hidden rounded-xl sm:rounded-2xl bg-black border shadow-lg ${
      isPinned ? 'border-blue-500 ring-2 ring-blue-500/40' : 'border-slate-800'
    }`}>
      {!share.isLocal && (
        <audio
          ref={audioRef}
          autoPlay
          playsInline
          className="absolute w-px h-px opacity-0 pointer-events-none"
        />
      )}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-contain"
      />
      <div className="absolute top-2 left-2 px-2.5 py-1 rounded-lg bg-black/75 text-white text-[11px] font-bold">
        {share.name}{share.isLocal ? ' (You)' : ''} is presenting
      </div>
      <div className="absolute top-2 right-2 flex gap-1.5">
        <button
          onClick={onPin}
          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors ${
            isPinned ? 'bg-blue-600 text-white' : 'bg-black/70 text-white hover:bg-black'
          }`}
          aria-pressed={isPinned}
          title={isPinned ? 'Unpin presentation' : 'Pin presentation'}
        >
          {isPinned ? 'Pinned' : 'Pin'}
        </button>
        {share.isLocal && onStop && (
          <button
            onClick={onStop}
            className="px-2.5 py-1 rounded-lg bg-red-600 hover:bg-red-700 text-white text-[11px] font-bold"
            title="Stop presenting"
          >
            Stop
          </button>
        )}
      </div>
      {featured && (
        <div className="absolute bottom-2 left-2 px-2 py-1 rounded-lg bg-black/60 text-white/80 text-[10px]">
          Click Pin on another presentation to bring it to the front
        </div>
      )}
    </div>
  );
}

/* ─── Circular Gauge (CFI) ─────────────── */
function CircularGauge({ value = 75, size = 100 }) {
  const r = size / 2 - 9;
  const circ = 2 * Math.PI * r;
  const dash = (value / 100) * circ;
  const color = value > 65 ? '#1D5BF1' : value > 40 ? '#3B82F6' : '#EF4444';
  const label = value > 65 ? 'High Focus' : value > 40 ? 'Moderate Attention' : 'Needs Engagement';

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#E2E8F0" strokeWidth="6" />
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="6"
            strokeDasharray={`${dash} ${circ - dash}`} strokeDashoffset={circ / 4} strokeLinecap="round"
            style={{ transition: 'stroke-dasharray 0.8s ease, stroke 0.5s' }} />
        </svg>
        <div className="absolute text-center">
          <p className="text-lg font-black text-slate-800 leading-none">{value}%</p>
          <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">CFI</p>
        </div>
      </div>
      <p className="text-[11px] font-bold text-blue-600">{label}</p>
    </div>
  );
}

/* ─── Metric Bar ─────────────────────── */
function MetricBar({ label, value }) {
  const gradient = label === 'Attention'
    ? 'linear-gradient(90deg, #1D4ED8, #1D5BF1)'
    : label === 'Confusion'
      ? 'linear-gradient(90deg, #EF4444, #F87171)'
      : 'linear-gradient(90deg, #10B981, #34D399)';

  return (
    <div className="flex flex-col gap-1 w-full">
      <div className="flex justify-between items-center text-xs">
        <span className="text-slate-600 font-medium">{label}</span>
        <span className="font-bold text-slate-800">{Math.round(value * 100)}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-slate-200 overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${value * 100}%`, background: gradient }} />
      </div>
    </div>
  );
}

const formatTime = (s) => `${String(Math.floor(s / 3600)).padStart(2, '0')}:${String(Math.floor((s % 3600) / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

/* ─── Main Unified Classroom Component ─── */
function ClassroomView({ sessionId, role = 'student' }) {
  const router = useRouter();

  // Profile and Session Data
  const [userProfile, setUserProfile] = useState(null);
  const [meetingTitle, setMeetingTitle] = useState('InsightEd Live Classroom');
  const [cfi, setCfi] = useState(75);
  const [metrics, setMetrics] = useState({ attention: 0.75, confusion: 0.20, energy: 0.70 });
  const [elapsed, setElapsed] = useState(0);

  // Sidebar Drawer state
  const [sidebarTab, setSidebarTab] = useState(null); // 'chat' | 'participants' | 'analytics' | null
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const chatScrollRef = useRef(null);

  // Alerts & Toasts
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
  const [pinnedScreenShareId, setPinnedScreenShareId] = useState(null);

  const prevHandsRef = useRef({});

  // Show Toast
  const showToast = useCallback((message, icon = 'ℹ️') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, icon }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  }, []);

  // Retrieve user profile
  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.authenticated && data.user) {
          setUserProfile(data.user);
          localStorage.setItem('userName', `${data.user.firstName} ${data.user.lastName}`);
        }
      })
      .catch(() => {});
  }, []);

  // Stable user profile
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

  // WebRTC multi-peer connection hook
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
    screenShares,
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
    onPeerLeave,
    onMediaError: message => showToast(message, '⚠️'),
    onSessionEnded: () => setIsSessionEndedModalOpen(true)
  });

  // Timer
  useEffect(() => {
    const timer = setInterval(() => setElapsed(s => s + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  // Audio autoplay recovery on first interaction
  useEffect(() => {
    const unlockMediaAudio = () => {
      document.querySelectorAll('audio, video').forEach(el => {
        if (el.paused && el.srcObject && !el.muted) {
          el.play().catch(() => {});
        }
      });
    };
    window.addEventListener('click', unlockMediaAudio, { passive: true });
    window.addEventListener('touchstart', unlockMediaAudio, { passive: true });
    window.addEventListener('keydown', unlockMediaAudio, { passive: true });
    return () => {
      window.removeEventListener('click', unlockMediaAudio);
      window.removeEventListener('touchstart', unlockMediaAudio);
      window.removeEventListener('keydown', unlockMediaAudio);
    };
  }, []);

  // Meeting sync loop with MongoDB
  useEffect(() => {
    if (!sessionId) return;
    let isMounted = true;

    async function fetchSessionState() {
      try {
        const res = await fetch(`/api/classroom/${sessionId}`);
        if (res.status === 410 || res.status === 404) {
          setIsSessionEndedModalOpen(true);
          return;
        }
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

    // Register participant in room
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

  // Filter out self and duplicate participant names
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

  // Hand raised alert debouncer
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

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (sidebarTab === 'chat' && chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages, sidebarTab]);

  // Send in-call chat
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

    setChatMessages(prev => [...prev, localMsg]);
    sendChatMessage(text);

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
    } catch (err) {}
  };

  // Topic marker
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
    } catch (e) {}
  };

  // Broadcast announcement
  const handleBroadcastAnnouncement = () => {
    if (!announcement.trim()) return;
    const text = announcement.trim();
    setAnnouncement('');
    sendChatMessage(`📢 ANNOUNCEMENT: ${text}`);
    showToast('Announcement sent to class', '📢');
  };

  // Tab close & disconnect lifecycle management
  useEffect(() => {
    if (!sessionId) return;

    const handleTabClose = () => {
      const payload = JSON.stringify({
        action: role === 'teacher' ? 'end' : 'leave',
        peerId: myId,
        userName: myName,
        role: myRole,
        guestRole: role
      });

      if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
        const blob = new Blob([payload], { type: 'application/json' });
        navigator.sendBeacon(`/api/classroom/${sessionId}`, blob);
      } else {
        fetch(`/api/classroom/${sessionId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: payload,
          keepalive: true
        }).catch(() => {});
      }
    };

    window.addEventListener('beforeunload', handleTabClose);
    window.addEventListener('pagehide', handleTabClose);

    return () => {
      window.removeEventListener('beforeunload', handleTabClose);
      window.removeEventListener('pagehide', handleTabClose);
    };
  }, [sessionId, role, myId, myName, myRole]);

  // End or Leave meeting
  const handleEndOrLeave = async () => {
    if (role === 'teacher') {
      setIsEndModalOpen(true);
    } else {
      try {
        await fetch(`/api/classroom/${sessionId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'leave',
            peerId: myId,
            userName: myName,
            role: myRole
          })
        });
      } catch (err) {}
      router.push('/dashboard');
    }
  };

  const confirmEndClass = async () => {
    setIsEndModalOpen(false);
    try {
      await fetch(`/api/classroom/${sessionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'end',
          peerId: myId,
          userName: myName,
          role: myRole,
          guestRole: role
        })
      });
    } catch (err) {}
    router.push('/dashboard');
  };

  const handleCopyCode = () => {
    navigator.clipboard?.writeText(sessionId);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const totalCount = peerList.length + 1; // +1 for self
  const screenShareList = Object.values(screenShares);
  const featuredScreenShare = screenShareList.find(
    share => share.shareId === pinnedScreenShareId
  ) || screenShareList[0];
  const otherScreenShares = screenShareList.filter(
    share => share.shareId !== featuredScreenShare?.shareId
  );

  return (
    <div className="fixed inset-0 w-full h-[100dvh] max-h-[100dvh] flex flex-col overflow-hidden bg-[#F8FAFC] text-slate-800 font-sans select-none">
      
      {/* ── TOAST NOTIFICATIONS ────────────────── */}
      <div className="fixed bottom-20 sm:bottom-24 left-4 sm:left-6 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map(t => (
          <div key={t.id} className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl shadow-lg bg-white border border-slate-200 text-slate-800 font-medium text-xs backdrop-blur-md animate-fadeUp">
            <span className="text-sm">{t.icon}</span>
            <p className="tracking-wide">{t.message}</p>
          </div>
        ))}
      </div>

      {/* ── BREAK ALERT BANNER ────────────────── */}
      {breakAlert && (
        <div className="flex-shrink-0 flex items-center justify-between px-4 sm:px-6 py-2.5 z-50 bg-blue-50 border-b border-blue-200 animate-slide-down">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-ping" />
            <div>
              <p className="text-xs font-bold text-slate-900">Engagement Alert: Class Focus Index dropped to {cfi}%</p>
              <p className="text-[11px] text-slate-600 hidden sm:block">A 5-minute break is recommended to restore student focus.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                sendChatMessage('☕ Instructor announced a 5-minute break. Grab water and stretch!');
                setBreakAlert(false);
              }}
              className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-sm active:scale-95"
            >
              Call Break
            </button>
            <button onClick={() => setBreakAlert(false)} className="text-slate-400 hover:text-slate-700 p-1">
              <Icon d="M18 6 6 18M6 6l12 12" size={15} />
            </button>
          </div>
        </div>
      )}

      {/* ── TOP HEADER BAR (MATCHES INSIGHTED NAVBAR) ── */}
      <header className="h-13 sm:h-14 px-3 sm:px-6 flex items-center justify-between border-b border-[#E2E8F0] bg-white flex-shrink-0 z-30 shadow-xs">
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Logo */}
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg overflow-hidden border border-slate-200 flex-shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.jpeg" alt="InsightEd Logo" className="w-full h-full object-cover" />
          </div>

          <div className="flex items-center gap-2 min-w-0">
            <h1 className="text-xs sm:text-sm font-black text-slate-900 tracking-tight truncate max-w-[140px] sm:max-w-[280px]">
              {meetingTitle}
            </h1>
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-red-50 border border-red-200 text-[10px] font-black uppercase text-red-600 tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              Live
            </span>
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Meeting Code Copy */}
          <button
            onClick={handleCopyCode}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-xs font-mono font-bold text-blue-600 transition-all active:scale-95"
            title="Click to copy meeting code"
          >
            <Icon d="M9 9h13v13H9z M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" size={12} />
            <span>{sessionId}</span>
            {copiedCode && <span className="text-[10px] text-emerald-600 ml-0.5">Copied!</span>}
          </button>

          {/* CFI Indicator for Teacher */}
          {role === 'teacher' && (
            <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200 text-xs font-bold text-blue-700">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
              <span>CFI: {cfi}%</span>
            </div>
          )}

          {/* Elapsed Timer */}
          <div className="text-[11px] sm:text-xs font-mono font-bold text-slate-600 bg-slate-100 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg border border-slate-200">
            {formatTime(elapsed)}
          </div>
        </div>
      </header>

      {/* ── MAIN STAGE WORKSPACE ── */}
      <div className="flex-1 flex overflow-hidden relative min-h-0">
        
        {/* Video Canvas Workspace */}
        <div className="flex-1 flex flex-col justify-center items-center p-2 sm:p-4 overflow-hidden relative min-h-0 w-full">
          
          {screenShareList.length > 0 ? (
            /* ── PRESENTATION / SCREEN SHARING MODE ── */
            <div className="w-full h-full flex flex-col gap-2 min-h-0">
              <div className="flex-1 min-h-0">
                <ScreenShareTile
                  share={featuredScreenShare}
                  featured={screenShareList.length > 1}
                  isPinned={featuredScreenShare.shareId === pinnedScreenShareId}
                  onPin={() => setPinnedScreenShareId(current => (
                    current === featuredScreenShare.shareId ? null : featuredScreenShare.shareId
                  ))}
                  onStop={featuredScreenShare.isLocal ? stopScreenShare : null}
                />
              </div>

              {otherScreenShares.length > 0 && (
                <div className="h-[90px] sm:h-[110px] flex gap-2 overflow-x-auto pb-1 flex-shrink-0 w-full">
                  {otherScreenShares.map(share => (
                    <div key={share.shareId} className="w-[180px] sm:w-[240px] h-full flex-shrink-0">
                      <ScreenShareTile
                        share={share}
                        isPinned={share.shareId === pinnedScreenShareId}
                        onPin={() => setPinnedScreenShareId(current => (
                          current === share.shareId ? null : share.shareId
                        ))}
                        onStop={share.isLocal ? stopScreenShare : null}
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Participant video strip */}
              <div className="h-[90px] sm:h-[110px] flex gap-2 overflow-x-auto pb-1 flex-shrink-0 w-full">
                <div className="w-[120px] sm:w-[160px] h-full flex-shrink-0">
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

                {peerList.map(peer => (
                  <div key={peer.id} className="w-[120px] sm:w-[160px] h-full flex-shrink-0">
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
            /* ── BALANCED GRID: FITS ON MOBILE WITHOUT SCROLLING ── */
            <div className={`w-full h-full flex items-center justify-center min-h-0 ${
              totalCount === 1
                ? 'max-w-3xl aspect-[4/3] sm:aspect-video'
                : totalCount === 2
                ? 'flex flex-col sm:grid sm:grid-cols-2 max-w-5xl gap-2 sm:gap-3 w-full h-full'
                : totalCount <= 4
                ? 'grid grid-cols-2 max-w-5xl gap-2 sm:gap-3 w-full h-full'
                : 'grid grid-cols-2 md:grid-cols-3 max-w-6xl gap-2 sm:gap-3 w-full h-full'
            }`}>
              
              {/* Local Video Tile */}
              <div className={totalCount === 2 ? 'flex-1 w-full h-[calc(50%-4px)] sm:h-full max-h-full' : 'w-full h-full max-h-full'}>
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
              </div>

              {/* Remote Peer Video Tiles */}
              {peerList.map(peer => (
                <div key={peer.id} className={totalCount === 2 ? 'flex-1 w-full h-[calc(50%-4px)] sm:h-full max-h-full' : 'w-full h-full max-h-full'}>
                  <MeetingVideoTile
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
                </div>
              ))}
            </div>
          )}

        </div>

        {/* ── SIDEBAR DRAWER (CHAT & PARTICIPANTS) ──────── */}
        {sidebarTab !== null && (
          <aside className="fixed inset-y-0 right-0 sm:relative sm:inset-auto w-full sm:w-[330px] flex-shrink-0 flex flex-col bg-white border-l border-[#E2E8F0] h-full z-50 animate-slide-down shadow-xl">
            
            {/* Header Tabs */}
            <div className="flex items-center justify-between border-b border-[#E2E8F0] px-4 pt-3 pb-2 bg-slate-50/50">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => { setSidebarTab('chat'); setUnreadChatCount(0); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    sidebarTab === 'chat'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  Chat
                </button>
                <button
                  onClick={() => setSidebarTab('participants')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    sidebarTab === 'participants'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  People ({totalCount})
                </button>
                {role === 'teacher' && (
                  <button
                    onClick={() => setSidebarTab('analytics')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      sidebarTab === 'analytics'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                    }`}
                  >
                    Focus
                  </button>
                )}
              </div>

              <button
                onClick={() => setSidebarTab(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
                title="Close panel"
              >
                <Icon d="M18 6 6 18M6 6l12 12" size={16} />
              </button>
            </div>

            {/* TAB 1: IN-CALL CHAT */}
            {sidebarTab === 'chat' && (
              <div className="flex-1 flex flex-col min-h-0 bg-white">
                <div ref={chatScrollRef} className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 min-h-0">
                  <div className="p-2.5 rounded-lg bg-blue-50/80 border border-blue-100 text-[11px] text-blue-700 text-center font-medium">
                    In-call messages are visible to everyone in this session.
                  </div>

                  {chatMessages.length === 0 ? (
                    <div className="text-center text-slate-400 text-xs my-auto py-8">
                      No messages yet. Say hello! 👋
                    </div>
                  ) : (
                    chatMessages.map((m, idx) => {
                      const isMe = m.sender === myName || m.sender === 'You';
                      const isHost = m.role === 'teacher';

                      return (
                        <div key={m.id || idx} className={`flex flex-col gap-1 ${isMe ? 'items-end' : 'items-start'}`}>
                          <div className="flex items-center gap-1.5 px-1 text-[11px] text-slate-500">
                            <span className="font-semibold text-slate-700">{m.sender}</span>
                            {isHost && (
                              <span className="text-[9px] font-extrabold uppercase text-blue-700 bg-blue-100 px-1.5 py-0.2 rounded border border-blue-200">
                                Host
                              </span>
                            )}
                            <span className="font-mono text-[10px] text-slate-400">{m.time}</span>
                          </div>
                          
                          <div
                            className={`px-3.5 py-2 rounded-2xl max-w-[85%] text-xs font-medium leading-relaxed shadow-xs ${
                              isMe
                                ? 'bg-blue-600 text-white rounded-br-none'
                                : isHost
                                ? 'bg-blue-50 text-blue-900 border border-blue-200 rounded-bl-none'
                                : 'bg-slate-100 text-slate-800 border border-slate-200 rounded-bl-none'
                            }`}
                          >
                            {m.msg}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Chat Input */}
                <div className="p-3 border-t border-slate-200 bg-slate-50 flex gap-2">
                  <input
                    type="text"
                    placeholder="Send message to everyone…"
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSendChat()}
                    className="flex-1 px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all shadow-xs"
                  />
                  <button
                    onClick={handleSendChat}
                    disabled={!chatInput.trim()}
                    className="w-9 h-9 rounded-xl flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-xs active:scale-95 flex-shrink-0"
                  >
                    <Icon d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" size={14} />
                  </button>
                </div>
              </div>
            )}

            {/* TAB 2: PARTICIPANTS DIRECTORY */}
            {sidebarTab === 'participants' && (
              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2 min-h-0 bg-white">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">In This Meeting</p>
                
                {/* Self row */}
                <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
                    {myName.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">{myName} (You)</p>
                    <p className="text-[10px] text-slate-500 font-medium">{myRole === 'teacher' ? 'Host' : 'Student'}</p>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-500">
                    {muted ? (
                      <Icon d="m19 10-1.39 4.5M9 5a3 3 0 0 1 5.3 1.8M12 19v4M8 23h8M1 1l22 22" size={14} className="text-red-500" />
                    ) : (
                      <Icon d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" size={14} className="text-emerald-600" />
                    )}
                    {camOff ? (
                      <Icon d="m2 2 20 20M21 16V8a2 2 0 0 0-2-2h-9.83 M22 8l-6 4 6 4V8Z" size={14} className="text-red-500" />
                    ) : (
                      <Icon d="m22 8-6 4 6 4V8Z M2 6h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z" size={14} className="text-blue-600" />
                    )}
                  </div>
                </div>

                {/* Remote peers list */}
                {peerList.length === 0 ? (
                  <p className="text-center text-slate-400 text-xs py-8">Waiting for other participants to join…</p>
                ) : (
                  peerList.map(peer => (
                    <div key={peer.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-colors">
                      <div className="w-8 h-8 rounded-full bg-slate-700 text-white font-bold text-xs flex items-center justify-center">
                        {peer.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">{peer.name}</p>
                        <p className="text-[10px] text-slate-500 font-medium">{peer.role === 'teacher' ? 'Host' : 'Student'}</p>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-500">
                        {peer.handRaised && <span className="text-sm">✋</span>}
                        {peer.muted ? (
                          <Icon d="m19 10-1.39 4.5M9 5a3 3 0 0 1 5.3 1.8M12 19v4M8 23h8M1 1l22 22" size={14} className="text-red-500" />
                        ) : (
                          <Icon d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" size={14} className="text-emerald-600" />
                        )}
                        {peer.camOff ? (
                          <Icon d="m2 2 20 20M21 16V8a2 2 0 0 0-2-2h-9.83 M22 8l-6 4 6 4V8Z" size={14} className="text-red-500" />
                        ) : (
                          <Icon d="m22 8-6 4 6 4V8Z M2 6h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z" size={14} className="text-blue-600" />
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* TAB 3: FOCUS TELEMETRY (TEACHER) */}
            {sidebarTab === 'analytics' && role === 'teacher' && (
              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 min-h-0 bg-white">
                <div className="flex flex-col items-center border-b border-slate-200 pb-4">
                  <CircularGauge value={cfi} />
                </div>

                <div className="flex flex-col gap-2.5 border-b border-slate-200 pb-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Telemetry Bars</p>
                  <MetricBar label="Attention" value={metrics.attention} />
                  <MetricBar label="Confusion" value={metrics.confusion} />
                  <MetricBar label="Energy" value={metrics.energy} />
                </div>

                {/* Mark Topic */}
                <div className="border-b border-slate-200 pb-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">Mark Topic Timestamp</p>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      placeholder="e.g. Chapter 3: Derivations"
                      value={topicLabel}
                      onChange={e => setTopicLabel(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleMarkTopic()}
                      className="flex-1 px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-600"
                    />
                    <button
                      onClick={handleMarkTopic}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition-all active:scale-95 shadow-xs"
                    >
                      Mark
                    </button>
                  </div>

                  {topicMarkers.length > 0 && (
                    <div className="flex flex-col gap-1 max-h-[90px] overflow-y-auto">
                      {topicMarkers.map((m, i) => (
                        <div key={i} className="flex items-center gap-1.5 text-xs py-1 px-2 rounded-md bg-slate-50 border border-slate-100">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                          <span className="text-slate-700 truncate flex-1 font-medium">{m.label}</span>
                          <span className="text-slate-400 font-mono text-[10px]">{m.time}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Broadcast */}
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">Broadcast to Class</p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Broadcast message…"
                      value={announcement}
                      onChange={e => setAnnouncement(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleBroadcastAnnouncement()}
                      className="flex-1 px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-600"
                    />
                    <button
                      onClick={handleBroadcastAnnouncement}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-200 hover:bg-slate-300 text-slate-800 transition-all active:scale-95"
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

      {/* ── BOTTOM DOCK CONTROLS (ALWAYS VISIBLE ON MOBILE) ── */}
      <footer className="h-16 sm:h-20 bg-white border-t border-[#E2E8F0] flex items-center justify-between px-3 sm:px-6 z-40 flex-shrink-0 shadow-sm">
        
        {/* Left: Metadata */}
        <div className="hidden md:flex items-center gap-2.5">
          <span className="text-xs font-mono font-bold text-slate-500">{formatTime(elapsed)}</span>
          <span className="text-slate-300">|</span>
          <span className="text-xs font-bold text-slate-800 truncate max-w-[160px]">{meetingTitle}</span>
        </div>

        {/* Center: Main Controls */}
        <div className="flex items-center gap-2 sm:gap-3 mx-auto md:mx-0">
          
          {/* Microphone */}
          <button
            onClick={toggleMic}
            className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all duration-200 relative ${
              muted
                ? 'bg-red-500 text-white shadow-md hover:bg-red-600'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
            }`}
            title={muted ? 'Turn on microphone' : 'Turn off microphone'}
          >
            {isSpeaking && !muted && (
              <span className="absolute inset-0 rounded-full bg-blue-500/30 animate-ping pointer-events-none" style={{ animationDuration: '1.5s' }} />
            )}
            <Icon
              d={muted ? 'm12 19 3-3 M19 10v1a7.9 7.9 0 0 1-3.07 6.27M12 2a3 3 0 0 0-3 3v1.17M1 1l22 22' : 'M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z M19 10v2a7 7 0 0 1-14 0v-2 M12 19v4 M8 23h8'}
              size={17}
            />
          </button>

          {/* Camera */}
          <button
            onClick={toggleCam}
            className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all duration-200 ${
              camOff
                ? 'bg-red-500 text-white shadow-md hover:bg-red-600'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
            }`}
            title={camOff ? 'Turn on camera' : 'Turn off camera'}
          >
            <Icon
              d={camOff ? 'm2 2 20 20M21 16V8a2 2 0 0 0-2-2h-9.83 M22 8l-6 4 6 4V8Z' : 'm22 8-6 4 6 4V8Z M2 6h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z'}
              size={17}
            />
          </button>

          {/* Screen Share */}
          <button
            onClick={isScreenSharing ? stopScreenShare : startScreenShare}
            className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all duration-200 ${
              isScreenSharing
                ? 'bg-blue-600 text-white shadow-md ring-2 ring-blue-400'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
            }`}
            title={isScreenSharing ? 'Stop sharing screen' : 'Share your screen'}
          >
            <Icon d="M2 3h20a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z M12 17v4 M8 21h8" size={17} />
          </button>

          {/* Hand Raise (Students) */}
          {role === 'student' && (
            <button
              onClick={toggleHandRaise}
              className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all duration-200 ${
                handRaised
                  ? 'bg-amber-500 text-white shadow-md ring-2 ring-amber-300'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
              }`}
              title={handRaised ? 'Lower hand' : 'Raise hand'}
            >
              <span className="text-base sm:text-lg">✋</span>
            </button>
          )}

          {/* End Call / Leave Button */}
          <button
            onClick={handleEndOrLeave}
            className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-full bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase tracking-wider transition-all shadow-md shadow-red-500/20 active:scale-95 flex items-center gap-1.5"
            title={role === 'teacher' ? 'End meeting for all' : 'Leave meeting'}
          >
            <Icon d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.42 19.42 0 0 1-6-6 19.8 19.8 0 0 1-3.12-8.68A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91" size={15} />
            <span>{role === 'teacher' ? 'End' : 'Leave'}</span>
          </button>
        </div>

        {/* Right Drawer Toggles */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          
          {/* Analytics (Teacher) */}
          {role === 'teacher' && (
            <button
              onClick={() => setSidebarTab(prev => prev === 'analytics' ? null : 'analytics')}
              className={`w-9 h-9 sm:w-11 sm:h-11 rounded-full flex items-center justify-center transition-all ${
                sidebarTab === 'analytics'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
              }`}
              title="Class Focus Analytics"
            >
              <Icon d="M18 20V10 M12 20V4 M6 20V14" size={16} />
            </button>
          )}

          {/* Participants */}
          <button
            onClick={() => setSidebarTab(prev => prev === 'participants' ? null : 'participants')}
            className={`w-9 h-9 sm:w-11 sm:h-11 rounded-full flex items-center justify-center transition-all relative ${
              sidebarTab === 'participants'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
            }`}
            title="People"
          >
            <Icon d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M16 3.13a4 4 0 0 1 0 7.75" size={16} />
            <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center border-2 border-white">
              {totalCount}
            </span>
          </button>

          {/* Chat */}
          <button
            onClick={() => {
              setSidebarTab(prev => prev === 'chat' ? null : 'chat');
              setUnreadChatCount(0);
            }}
            className={`w-9 h-9 sm:w-11 sm:h-11 rounded-full flex items-center justify-center transition-all relative ${
              sidebarTab === 'chat'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
            }`}
            title="Chat"
          >
            <Icon d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" size={16} />
            {unreadChatCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center border-2 border-white animate-pulse">
                {unreadChatCount}
              </span>
            )}
          </button>
        </div>
      </footer>

      {/* ── TEACHER END CLASS CONFIRMATION MODAL ── */}
      {isEndModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="relative rounded-2xl max-w-[400px] w-full p-6 bg-white border border-slate-200 shadow-2xl animate-modal-in">
            <div className="w-11 h-11 rounded-xl bg-red-50 border border-red-200 text-red-600 flex items-center justify-center mb-3.5">
              <Icon d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" size={22} />
            </div>
            <h3 className="text-base font-black text-slate-900 mb-1.5">End Meeting for All?</h3>
            <p className="text-xs text-slate-600 leading-relaxed mb-5">
              Ending this classroom session will immediately disconnect all students and finalize the lecture telemetry.
            </p>
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setIsEndModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl font-bold text-xs text-slate-700 hover:bg-slate-100 border border-slate-200 transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmEndClass}
                className="flex-1 py-2.5 rounded-xl font-bold text-xs text-white bg-red-600 hover:bg-red-700 transition-all shadow-sm active:scale-95"
              >
                End Meeting
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── SESSION ENDED MODAL (STUDENT) ── */}
      {isSessionEndedModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="relative rounded-2xl max-w-[380px] w-full p-6 bg-white border border-slate-200 shadow-2xl animate-modal-in text-center">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3.5 text-xl font-black">
              ✓
            </div>
            <h3 className="text-base font-black text-slate-900 mb-1.5">Classroom Session Ended</h3>
            <p className="text-xs text-slate-600 leading-relaxed mb-5">
              The instructor has ended this live session. Your focus analytics have been saved.
            </p>
            <button
              type="button"
              onClick={() => router.push('/dashboard')}
              className="w-full py-2.5 rounded-xl font-black text-xs uppercase tracking-wider text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-sm active:scale-95"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Role detection export ── */
function ClassroomContent() {
  const { sessionId } = useParams();
  const searchParams = useSearchParams();
  const role = searchParams.get('role') || 'student';

  return <ClassroomView sessionId={sessionId} role={role} />;
}

export default function ClassroomPage() {
  return (
    <Suspense fallback={
      <div className="fixed inset-0 bg-[#F8FAFC] flex items-center justify-center">
        <div className="text-center animate-fadeIn">
          <div className="w-10 h-10 border-2 border-blue-600/20 border-t-blue-600 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-600 text-xs font-semibold">Connecting to classroom…</p>
        </div>
      </div>
    }>
      <ClassroomContent />
    </Suspense>
  );
}
