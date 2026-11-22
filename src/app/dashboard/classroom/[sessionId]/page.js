'use client';

import { useState, useEffect, useRef, useMemo, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter, useParams } from 'next/navigation';
import { useClassroomWebRTC } from '@/lib/useClassroomWebRTC';
import MeetingVideoTile from '@/components/MeetingVideoTile';
import { getCleanVoiceConstraints, playTestChime } from '@/lib/webrtcAudio';

/* ─── SVG Icon Helper ─────────────────────────── */
function Icon({ d, size = 18, fill = 'none', className = '', ...rest }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...rest}
    >
      {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p} />) : <path d={d} />}
    </svg>
  );
}

/* ─── Dedicated Remote Audio Track (Prevents Echo & Routes Output Speaker) ─── */
function RemoteAudioTrack({ stream, sinkId }) {
  const audioRef = useRef(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !stream) return;

    const audioTracks = stream.getAudioTracks();
    if (audioTracks.length === 0) return;

    const audioOnlyStream = new MediaStream(audioTracks);
    audio.srcObject = audioOnlyStream;
    audio.volume = 1.0;

    if (sinkId && typeof audio.setSinkId === 'function') {
      audio.setSinkId(sinkId).catch(() => {});
    }

    audio.play().catch(() => {});

    return () => {
      audio.srcObject = null;
    };
  }, [stream, sinkId]);

  return <audio ref={audioRef} autoPlay playsInline className="hidden" />;
}

/* ─── Screen Share Tile ─────────────────────────── */
function ScreenShareTile({ share, featured = false, isPinned = false, onPin, onStop }) {
  const videoRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.srcObject = share.stream;
    video.play().catch(() => {});
    return () => {
      video.srcObject = null;
    };
  }, [share.stream]);

  return (
    <div
      className={`relative w-full h-full min-h-0 overflow-hidden rounded-2xl bg-[#131314] border transition-all shadow-xl ${
        isPinned ? 'border-[#8AB4F8] ring-2 ring-[#8AB4F8]/40' : 'border-white/10'
      }`}
    >
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={share.isLocal}
        className="w-full h-full object-contain"
      />
      <div className="absolute top-3 left-3 flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#202124]/85 backdrop-blur-md border border-white/10 text-white text-xs font-medium">
        <span className="w-2 h-2 rounded-full bg-[#8AB4F8] animate-pulse" />
        <span>
          {share.name}
          {share.isLocal ? ' (You)' : ''} is presenting
        </span>
      </div>
      <div className="absolute top-3 right-3 flex gap-2">
        <button
          onClick={onPin}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all backdrop-blur-md ${
            isPinned
              ? 'bg-[#8AB4F8] text-[#202124]'
              : 'bg-[#202124]/85 text-white hover:bg-[#3C4043] border border-white/10'
          }`}
          aria-pressed={isPinned}
        >
          {isPinned ? 'Unpin' : 'Pin screen'}
        </button>
        {share.isLocal && onStop && (
          <button
            onClick={onStop}
            className="px-3 py-1.5 rounded-full bg-[#EA4335] hover:bg-[#D93025] text-white text-xs font-semibold shadow-md transition-all"
          >
            Stop presenting
          </button>
        )}
      </div>
      {featured && (
        <div className="absolute bottom-3 left-3 px-3 py-1 rounded-full bg-[#202124]/80 text-white/75 text-[11px]">
          Select another presentation thumbnail to switch view
        </div>
      )}
    </div>
  );
}

/* ─── Circular Gauge (CFI) ─────────────── */
function CircularGauge({ value = 75, size = 104 }) {
  const r = size / 2 - 9;
  const circ = 2 * Math.PI * r;
  const dash = (value / 100) * circ;
  const color = value > 65 ? '#8AB4F8' : value > 40 ? '#FBBF24' : '#F87171';
  const label = value > 65 ? 'High Focus' : value > 40 ? 'Moderate Attention' : 'Needs Break';

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="6" />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth="6"
            strokeDasharray={`${dash} ${circ - dash}`}
            strokeDashoffset={circ / 4}
            strokeLinecap="round"
            style={{ transition: 'stroke-dasharray 0.8s ease, stroke 0.5s' }}
          />
        </svg>
        <div className="absolute text-center">
          <p className="text-lg font-bold text-white leading-none">{value}%</p>
          <p className="text-[9px] text-white/60 font-semibold uppercase tracking-wider mt-0.5">CFI</p>
        </div>
      </div>
      <p className="text-xs font-semibold" style={{ color }}>
        {label}
      </p>
    </div>
  );
}

/* ─── Metric Bar ─────────────────────── */
function MetricBar({ label, value }) {
  const barColor =
    label === 'Attention' ? '#8AB4F8' : label === 'Confusion' ? '#F87171' : '#34D399';

  return (
    <div className="flex flex-col gap-1.5 w-full">
      <div className="flex justify-between items-center text-xs">
        <span className="text-white/75 font-medium">{label}</span>
        <span className="font-semibold text-white">{Math.round(value * 100)}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${Math.round(value * 100)}%`, backgroundColor: barColor }}
        />
      </div>
    </div>
  );
}

const formatTime = (s) =>
  `${String(Math.floor(s / 3600)).padStart(2, '0')}:${String(Math.floor((s % 3600) / 60)).padStart(
    2,
    '0'
  )}:${String(s % 60).padStart(2, '0')}`;

/* ─── Pre-Join Lobby (Google Meet Green Room) ─── */
function PreJoinLobby({
  sessionId,
  meetingMeta,
  userName,
  isCreator,
  devices,
  selectedMicId,
  setSelectedMicId,
  selectedCamId,
  setSelectedCamId,
  selectedSpeakerId,
  setSelectedSpeakerId,
  onJoinCall,
  onBack,
}) {
  const previewVideoRef = useRef(null);
  const [previewStream, setPreviewStream] = useState(null);
  const [micEnabled, setMicEnabled] = useState(true);
  const [camEnabled, setCamEnabled] = useState(true);
  const [audioLevel, setAudioLevel] = useState(0);
  const [mediaWarning, setMediaWarning] = useState('');

  useEffect(() => {
    let active = true;
    let currentStream = null;
    let audioCtx = null;
    let animId = null;

    async function initPreview() {
      setMediaWarning('');
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: getCleanVoiceConstraints(selectedMicId),
          video: selectedCamId
            ? { deviceId: { exact: selectedCamId }, width: { ideal: 1280 }, height: { ideal: 720 } }
            : { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
        });

        if (!active) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        currentStream = stream;
        setPreviewStream(stream);
        if (previewVideoRef.current) {
          previewVideoRef.current.srcObject = stream;
        }

        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        audioCtx = new AudioCtx();
        const source = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);
        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        const updateMeter = () => {
          if (!active) return;
          analyser.getByteFrequencyData(dataArray);
          const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
          setAudioLevel(Math.min(100, Math.round((avg / 90) * 100)));
          animId = requestAnimationFrame(updateMeter);
        };
        updateMeter();
      } catch (err) {
        setMediaWarning('Camera or microphone permission blocked. You can still join in listen-only mode.');
        setCamEnabled(false);
      }
    }

    initPreview();

    return () => {
      active = false;
      if (animId) cancelAnimationFrame(animId);
      if (audioCtx) audioCtx.close().catch(() => {});
      if (currentStream) currentStream.getTracks().forEach((t) => t.stop());
    };
  }, [selectedMicId, selectedCamId]);

  const togglePreviewMic = () => {
    const next = !micEnabled;
    setMicEnabled(next);
    previewStream?.getAudioTracks().forEach((t) => (t.enabled = next));
  };

  const togglePreviewCam = () => {
    const next = !camEnabled;
    setCamEnabled(next);
    previewStream?.getVideoTracks().forEach((t) => (t.enabled = next));
  };

  const handleEnter = () => {
    previewStream?.getTracks().forEach((t) => t.stop());
    onJoinCall({ initialMuted: !micEnabled, initialCamOff: !camEnabled });
  };

  const activeParticipants = meetingMeta?.participants || [];

  return (
    <div className="min-h-[100dvh] bg-[#202124] text-white flex flex-col justify-between p-4 sm:p-8">
      <header className="max-w-6xl w-full mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl overflow-hidden border border-white/15">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.jpeg" alt="InsightEd" className="w-full h-full object-cover" />
          </div>
          <div>
            <span className="font-bold text-base tracking-tight text-white">InsightEd Meet</span>
            <p className="text-xs text-white/60">Code: {sessionId}</p>
          </div>
        </div>
        <button
          onClick={onBack}
          className="px-4 py-2 rounded-full text-xs font-medium text-white/80 hover:text-white hover:bg-white/10 transition-colors"
        >
          ← Back to Dashboard
        </button>
      </header>

      <main className="max-w-5xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center my-auto py-8">
        <div className="lg:col-span-7 flex flex-col gap-3">
          <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-[#131314] border border-white/10 shadow-2xl">
            <video
              ref={previewVideoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover scale-x-[-1] transition-opacity duration-300 ${
                camEnabled && previewStream ? 'opacity-100' : 'opacity-0'
              }`}
            />

            {(!camEnabled || !previewStream) && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#1E1F20]">
                <div className="w-20 h-20 rounded-full bg-[#8AB4F8]/20 border border-[#8AB4F8]/40 text-[#8AB4F8] flex items-center justify-center text-2xl font-bold">
                  {userName.slice(0, 2).toUpperCase()}
                </div>
                <p className="text-sm text-white/70 font-medium">Camera is off</p>
              </div>
            )}

            <div className="absolute top-3.5 left-3.5 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-xs font-medium text-white">
              {userName}
            </div>

            <div className="absolute top-3.5 right-3.5 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md">
              <span
                className={`w-2 h-2 rounded-full ${
                  micEnabled ? 'bg-[#34D399]' : 'bg-[#EA4335]'
                }`}
              />
              <div className="w-12 h-1.5 rounded-full bg-white/20 overflow-hidden">
                <div
                  className="h-full bg-[#8AB4F8] transition-all duration-75"
                  style={{ width: `${micEnabled ? audioLevel : 0}%` }}
                />
              </div>
            </div>

            <div className="absolute bottom-4 inset-x-0 flex items-center justify-center gap-4">
              <button
                type="button"
                onClick={togglePreviewMic}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-lg ${
                  micEnabled
                    ? 'bg-[#3C4043]/90 hover:bg-[#4A4E52] text-white border border-white/15'
                    : 'bg-[#EA4335] hover:bg-[#D93025] text-white'
                }`}
                title={micEnabled ? 'Mute microphone' : 'Unmute microphone'}
              >
                <Icon
                  d={
                    micEnabled
                      ? 'M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z M19 10v2a7 7 0 0 1-14 0v-2 M12 19v4 M8 23h8'
                      : 'm12 19 3-3 M19 10v1a7.9 7.9 0 0 1-3.07 6.27M12 2a3 3 0 0 0-3 3v1.17M1 1l22 22'
                  }
                  size={20}
                />
              </button>

              <button
                type="button"
                onClick={togglePreviewCam}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-lg ${
                  camEnabled
                    ? 'bg-[#3C4043]/90 hover:bg-[#4A4E52] text-white border border-white/15'
                    : 'bg-[#EA4335] hover:bg-[#D93025] text-white'
                }`}
                title={camEnabled ? 'Turn off camera' : 'Turn on camera'}
              >
                <Icon
                  d={
                    camEnabled
                      ? 'm22 8-6 4 6 4V8Z M2 6h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z'
                      : 'm2 2 20 20M21 16V8a2 2 0 0 0-2-2h-9.83 M22 8l-6 4 6 4V8Z'
                  }
                  size={20}
                />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <select
              value={selectedMicId}
              onChange={(e) => setSelectedMicId(e.target.value)}
              className="px-3 py-2 rounded-xl bg-[#292A2D] border border-white/10 text-xs text-white/90 outline-none truncate"
              title="Select Microphone"
            >
              <option value="">Default Microphone</option>
              {devices.mics.map((d, i) => (
                <option key={d.deviceId || i} value={d.deviceId}>
                  🎙 {d.label || `Microphone ${i + 1}`}
                </option>
              ))}
            </select>

            <select
              value={selectedSpeakerId}
              onChange={(e) => setSelectedSpeakerId(e.target.value)}
              className="px-3 py-2 rounded-xl bg-[#292A2D] border border-white/10 text-xs text-white/90 outline-none truncate"
              title="Select Speaker"
            >
              <option value="">Default Speaker</option>
              {devices.speakers.map((d, i) => (
                <option key={d.deviceId || i} value={d.deviceId}>
                  🔊 {d.label || `Speaker ${i + 1}`}
                </option>
              ))}
            </select>

            <select
              value={selectedCamId}
              onChange={(e) => setSelectedCamId(e.target.value)}
              className="px-3 py-2 rounded-xl bg-[#292A2D] border border-white/10 text-xs text-white/90 outline-none truncate"
              title="Select Camera"
            >
              <option value="">Default Camera</option>
              {devices.cams.map((d, i) => (
                <option key={d.deviceId || i} value={d.deviceId}>
                  📹 {d.label || `Camera ${i + 1}`}
                </option>
              ))}
            </select>
          </div>

          {mediaWarning && (
            <p className="text-xs text-amber-300 bg-amber-500/10 border border-amber-500/25 px-3.5 py-2 rounded-xl">
              {mediaWarning}
            </p>
          )}
        </div>

        <div className="lg:col-span-5 flex flex-col items-center lg:items-start text-center lg:text-left gap-4">
          <span className="px-3 py-1 rounded-full bg-[#8AB4F8]/15 border border-[#8AB4F8]/30 text-[#8AB4F8] text-xs font-semibold">
            {isCreator ? 'Host / Creator Session' : 'Live Classroom'}
          </span>

          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            {meetingMeta?.title || 'Ready to join?'}
          </h1>

          <p className="text-sm text-white/70">
            {meetingMeta?.teacherName
              ? `Hosted by ${meetingMeta.teacherName}`
              : 'Wideband noise-suppressed audio is active.'}
          </p>

          <div className="flex items-center gap-2 text-xs text-white/60 bg-white/5 px-3.5 py-2 rounded-full border border-white/10">
            <span className="w-2 h-2 rounded-full bg-[#34D399] animate-pulse" />
            <span>
              {activeParticipants.length === 0
                ? 'No one else is in the room yet'
                : `${activeParticipants.length} participant${
                    activeParticipants.length > 1 ? 's' : ''
                  } currently in call`}
            </span>
          </div>

          <div className="flex items-center gap-3 mt-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleEnter}
              className="flex-1 sm:flex-initial px-8 py-3.5 rounded-full bg-[#8AB4F8] hover:bg-[#A8C7FA] text-[#202124] font-bold text-sm transition-all shadow-lg active:scale-95"
            >
              {isCreator ? 'Start Classroom' : 'Join Now'}
            </button>
            <button
              type="button"
              onClick={() => playTestChime(selectedSpeakerId)}
              className="px-4 py-3.5 rounded-full bg-[#3C4043] hover:bg-[#4A4E52] text-white text-xs font-semibold border border-white/10 transition-all"
              title="Play test sound"
            >
              Test Audio
            </button>
          </div>
        </div>
      </main>

      <footer className="text-center text-[11px] text-white/40">
        Echo cancellation & 48 kHz Opus voice optimization enabled
      </footer>
    </div>
  );
}

/* ─── Active Classroom Stage ─── */
function ActiveClassroomStage({
  sessionId,
  userProfile,
  meetingMeta,
  isCreator,
  initialMediaPrefs,
  devices,
  selectedMicId,
  setSelectedMicId,
  selectedCamId,
  setSelectedCamId,
  selectedSpeakerId,
  setSelectedSpeakerId,
}) {
  const router = useRouter();

  const [meetingTitle, setMeetingTitle] = useState(meetingMeta?.title || 'InsightEd Live Classroom');
  const [cfi, setCfi] = useState(meetingMeta?.cfi || 75);
  const [alertThreshold, setAlertThreshold] = useState(meetingMeta?.threshold || 40);
  const [metrics, setMetrics] = useState({
    attention: meetingMeta?.attention ?? 0.75,
    confusion: meetingMeta?.confusion ?? 0.2,
    energy: meetingMeta?.energy ?? 0.7,
  });
  const [elapsed, setElapsed] = useState(0);

  const [sidebarTab, setSidebarTab] = useState(null); // 'chat' | 'participants' | 'analytics' | null
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState(
    () =>
      (meetingMeta?.messages || []).map((m, idx) => ({
        id: m._id || m.id || `init_${idx}`,
        clientMsgId: m.clientMsgId || m._id || m.id,
        sender: m.sender,
        role: m.role,
        msg: m.msg,
        time: m.time,
      }))
  );
  const chatScrollRef = useRef(null);

  const [toasts, setToasts] = useState([]);
  const [breakAlert, setBreakAlert] = useState(false);
  const [topicLabel, setTopicLabel] = useState('');
  const [topicMarkers, setTopicMarkers] = useState(meetingMeta?.topicMarkers || []);
  const [announcement, setAnnouncement] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);

  const [isEndModalOpen, setIsEndModalOpen] = useState(false);
  const [isSessionEndedModalOpen, setIsSessionEndedModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [pinnedPeerId, setPinnedPeerId] = useState(null);
  const [pinnedScreenShareId, setPinnedScreenShareId] = useState(null);

  const prevHandsRef = useRef({});
  const hasEndedExplicitlyRef = useRef(false);
  const prevMicIdRef = useRef(selectedMicId);
  const prevCamIdRef = useRef(selectedCamId);

  const showToast = useCallback((message, icon = 'ℹ️') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, icon }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const currentUser = useMemo(() => {
    const storedName = typeof window !== 'undefined' ? localStorage.getItem('userName') : null;
    if (userProfile) {
      return {
        id: String(userProfile._id),
        name: `${userProfile.firstName} ${userProfile.lastName}`,
        role: isCreator ? 'teacher' : userProfile.role || 'student',
      };
    }
    return {
      id: storedName
        ? `usr_${storedName.replace(/\s+/g, '_').toLowerCase()}`
        : isCreator
        ? 'usr_teacher'
        : 'usr_student',
      name: storedName || (isCreator ? 'Instructor' : 'Student'),
      role: isCreator ? 'teacher' : 'student',
    };
  }, [userProfile, isCreator]);

  /* ── Deduplicated Chat Ingestion ── */
  const upsertChatMessage = useCallback(
    (incoming) => {
      setChatMessages((prev) => {
        const incomingKey = incoming._id || incoming.id || incoming.clientMsgId;

        const existingIdx = prev.findIndex(
          (m) =>
            (incomingKey && (m.id === incomingKey || m.clientMsgId === incomingKey)) ||
            (incoming.clientMsgId && m.clientMsgId === incoming.clientMsgId)
        );

        if (existingIdx !== -1) {
          if (incoming._id && prev[existingIdx].id !== incoming._id) {
            const copy = [...prev];
            copy[existingIdx] = { ...copy[existingIdx], id: incoming._id };
            return copy;
          }
          return prev;
        }

        const contentMatchIdx = prev.findIndex(
          (m) =>
            m.sender === incoming.sender &&
            m.msg === incoming.msg &&
            (m.time === incoming.time ||
              Math.abs((m.timestamp || 0) - (incoming.timestamp || Date.now())) < 15000)
        );

        if (contentMatchIdx !== -1) {
          if (incoming._id) {
            const copy = [...prev];
            copy[contentMatchIdx] = { ...copy[contentMatchIdx], id: incoming._id };
            return copy;
          }
          return prev;
        }

        if (sidebarTab !== 'chat' && incoming.sender !== currentUser.name) {
          setUnreadChatCount((c) => c + 1);
        }

        return [
          ...prev,
          {
            id: incoming._id || incoming.id || `msg_${Date.now()}_${Math.random()}`,
            clientMsgId: incoming.clientMsgId || incoming.id,
            sender: incoming.sender,
            role: incoming.role,
            msg: incoming.msg,
            time: incoming.time,
            timestamp: incoming.timestamp || Date.now(),
          },
        ];
      });
    },
    [sidebarTab, currentUser.name]
  );

  const onPeerJoin = useCallback(
    (peer) => {
      showToast(`${peer.name} joined the meeting`, '👤');
    },
    [showToast]
  );

  const onPeerLeave = useCallback(
    (peer) => {
      showToast(`${peer.name} left the meeting`, '👋');
      setPinnedPeerId((curr) => (curr === peer.id ? null : curr));
    },
    [showToast]
  );

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
    switchAudioDevice,
    switchVideoDevice,
    startScreenShare,
    stopScreenShare,
    sendChatMessage,
  } = useClassroomWebRTC({
    sessionId,
    user: currentUser,
    audioDeviceId: selectedMicId,
    videoDeviceId: selectedCamId,
    initialMuted: initialMediaPrefs.initialMuted,
    initialCamOff: initialMediaPrefs.initialCamOff,
    onChatMessage: upsertChatMessage,
    onPeerJoin,
    onPeerLeave,
    onMediaError: (message) => showToast(message, '⚠️'),
    onSessionEnded: () => setIsSessionEndedModalOpen(true),
  });

  // Hot-swap microphone when changed in Settings modal
  useEffect(() => {
    if (prevMicIdRef.current !== selectedMicId) {
      prevMicIdRef.current = selectedMicId;
      switchAudioDevice(selectedMicId);
    }
  }, [selectedMicId, switchAudioDevice]);

  // Hot-swap camera when changed in Settings modal
  useEffect(() => {
    if (prevCamIdRef.current !== selectedCamId) {
      prevCamIdRef.current = selectedCamId;
      switchVideoDevice(selectedCamId);
    }
  }, [selectedCamId, switchVideoDevice]);

  // Call timer
  useEffect(() => {
    const timer = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  // Unlock audio autoplay on first user interaction
  useEffect(() => {
    const unlockMediaAudio = () => {
      document.querySelectorAll('audio').forEach((el) => {
        if (el.paused && el.srcObject) {
          el.play().catch(() => {});
        }
      });
    };
    window.addEventListener('click', unlockMediaAudio, { passive: true });
    window.addEventListener('touchstart', unlockMediaAudio, { passive: true });
    return () => {
      window.removeEventListener('click', unlockMediaAudio);
      window.removeEventListener('touchstart', unlockMediaAudio);
    };
  }, []);

  // Join room & sync session state with MongoDB
  useEffect(() => {
    if (!sessionId) return;
    let isMounted = true;

    async function fetchSessionState() {
      try {
        const res = await fetch(`/api/classroom/${sessionId}`);
        if (res.status === 410 || res.status === 404) {
          if (isMounted) setIsSessionEndedModalOpen(true);
          return;
        }
        if (!res.ok) return;
        const data = await res.json();
        if (!isMounted) return;

        if (data.success && data.meeting) {
          const meeting = data.meeting;
          if (meeting.active === false) {
            setIsSessionEndedModalOpen(true);
            return;
          }
          setMeetingTitle(meeting.title || 'InsightEd Classroom');
          setCfi(meeting.cfi || 75);
          if (meeting.threshold) setAlertThreshold(meeting.threshold);
          setMetrics({
            attention: meeting.attention ?? 0.75,
            confusion: meeting.confusion ?? 0.2,
            energy: meeting.energy ?? 0.7,
          });
          setTopicMarkers(meeting.topicMarkers || []);

          if (Array.isArray(meeting.messages)) {
            meeting.messages.forEach((m) => upsertChatMessage(m));
          }

          if (meeting.cfi < (meeting.threshold || alertThreshold) && isCreator) {
            setBreakAlert(true);
          }
        } else if (data.active === false) {
          setIsSessionEndedModalOpen(true);
        }
      } catch (err) {}
    }

    fetch(`/api/classroom/${sessionId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'join',
        peerId: myId,
        userName: myName,
        role: myRole,
      }),
    })
      .then(() => fetchSessionState())
      .catch(() => {});

    const pollInterval = setInterval(fetchSessionState, 4000);
    return () => {
      isMounted = false;
      clearInterval(pollInterval);
    };
  }, [sessionId, myId, myName, myRole, isCreator, alertThreshold, upsertChatMessage]);

  // Heartbeat loop
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
          score: Math.round(metrics.attention * 100),
        }),
      }).catch(() => {});
    }, 4500);
    return () => clearInterval(hbInterval);
  }, [sessionId, myId, myName, myRole, camOff, muted, handRaised, isSpeaking, metrics.attention]);

  // Deduplicate peers strictly by peerId
  const peerList = useMemo(() => {
    const seenIds = new Set([myId]);
    const unique = [];
    for (const p of Object.values(peers)) {
      if (p && p.id && !seenIds.has(p.id)) {
        seenIds.add(p.id);
        unique.push(p);
      }
    }
    return unique;
  }, [peers, myId]);

  // Hand-raise notification for host
  useEffect(() => {
    if (isCreator) {
      peerList.forEach((p) => {
        if (p.handRaised && !prevHandsRef.current[p.id]) {
          showToast(`${p.name} raised their hand`, '✋');
        }
        prevHandsRef.current[p.id] = p.handRaised;
      });
    }
  }, [peerList, isCreator, showToast]);

  // Auto-scroll chat
  useEffect(() => {
    if (sidebarTab === 'chat' && chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages, sidebarTab]);

  // Send chat message
  const handleSendChat = async () => {
    if (!chatInput.trim()) return;
    const text = chatInput.trim();
    setChatInput('');

    const timeStr = new Date().toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' });
    const clientMsgId = `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    const outgoingMsg = {
      id: clientMsgId,
      clientMsgId,
      sender: myName,
      role: myRole,
      msg: text,
      time: timeStr,
      timestamp: Date.now(),
    };

    upsertChatMessage(outgoingMsg);
    sendChatMessage(text, outgoingMsg);

    try {
      const res = await fetch(`/api/classroom/${sessionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'chat',
          clientMsgId,
          msg: text,
          userName: myName,
          role: myRole,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.message?._id) {
          upsertChatMessage({ ...outgoingMsg, _id: data.message._id });
        }
      }
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
          cfi,
        }),
      });
      if (res.ok) {
        showToast(`Topic marked: "${label}"`, '📌');
      }
    } catch (e) {}
  };

  // Broadcast announcement
  const handleBroadcastAnnouncement = async () => {
    if (!announcement.trim()) return;
    const text = `📢 ANNOUNCEMENT: ${announcement.trim()}`;
    setAnnouncement('');
    const timeStr = new Date().toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' });
    const clientMsgId = `ann_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const msgObj = {
      id: clientMsgId,
      clientMsgId,
      sender: myName,
      role: myRole,
      msg: text,
      time: timeStr,
      timestamp: Date.now(),
    };
    upsertChatMessage(msgObj);
    sendChatMessage(text, msgObj);
    try {
      await fetch(`/api/classroom/${sessionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'chat',
          clientMsgId,
          msg: text,
          userName: myName,
          role: myRole,
        }),
      });
    } catch (e) {}
    showToast('Announcement sent to class', '📢');
  };

  // Tab close / refresh: ALWAYS send 'leave' so refreshing never ends the meeting
  useEffect(() => {
    if (!sessionId) return;

    const handleTabClose = () => {
      if (hasEndedExplicitlyRef.current) return;
      const payload = JSON.stringify({
        action: 'leave',
        peerId: myId,
        userName: myName,
        role: myRole,
      });

      if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
        const blob = new Blob([payload], { type: 'application/json' });
        navigator.sendBeacon(`/api/classroom/${sessionId}`, blob);
      } else {
        fetch(`/api/classroom/${sessionId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: payload,
          keepalive: true,
        }).catch(() => {});
      }
    };

    window.addEventListener('beforeunload', handleTabClose);
    window.addEventListener('pagehide', handleTabClose);
    return () => {
      window.removeEventListener('beforeunload', handleTabClose);
      window.removeEventListener('pagehide', handleTabClose);
    };
  }, [sessionId, myId, myName, myRole]);

  // Leave call without ending the session
  const handleLeaveCall = async () => {
    hasEndedExplicitlyRef.current = true;
    localStream?.getTracks().forEach((t) => t.stop());
    try {
      await fetch(`/api/classroom/${sessionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'leave',
          peerId: myId,
          userName: myName,
          role: myRole,
        }),
      });
    } catch (err) {}
    router.push('/dashboard');
  };

  const handleEndButtonClick = () => {
    if (isCreator) {
      setIsEndModalOpen(true);
    } else {
      handleLeaveCall();
    }
  };

  // Creator permanently ends the meeting for everyone
  const confirmEndClass = async () => {
    setIsEndModalOpen(false);
    hasEndedExplicitlyRef.current = true;
    localStream?.getTracks().forEach((t) => t.stop());
    try {
      await fetch(`/api/classroom/${sessionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'end',
          peerId: myId,
          userName: myName,
          role: myRole,
        }),
      });
    } catch (err) {}
    router.push('/dashboard');
  };

  const handleCopyCode = () => {
    navigator.clipboard?.writeText(sessionId);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const allParticipants = useMemo(() => {
    const selfTile = {
      id: myId,
      name: myName,
      role: myRole,
      isLocal: true,
      stream: localStream,
      muted,
      camOff,
      isSpeaking,
      handRaised,
    };

    const remoteTiles = peerList.map((p) => ({
      id: p.id,
      name: p.name,
      role: p.role,
      isLocal: false,
      stream: remoteStreams[p.id],
      muted: p.muted,
      camOff: p.camOff,
      isSpeaking: p.isSpeaking,
      handRaised: p.handRaised,
    }));

    return [selfTile, ...remoteTiles];
  }, [myId, myName, myRole, localStream, muted, camOff, isSpeaking, handRaised, peerList, remoteStreams]);

  const totalCount = allParticipants.length;
  const pinnedParticipant = allParticipants.find((p) => p.id === pinnedPeerId) || null;
  const unpinnedParticipants = pinnedParticipant
    ? allParticipants.filter((p) => p.id !== pinnedParticipant.id)
    : allParticipants;

  const screenShareList = Object.values(screenShares);
  const featuredScreenShare =
    screenShareList.find((share) => share.shareId === pinnedScreenShareId) || screenShareList[0];
  const otherScreenShares = screenShareList.filter(
    (share) => share.shareId !== featuredScreenShare?.shareId
  );

  return (
    <div className="fixed inset-0 w-full h-[100dvh] max-h-[100dvh] flex flex-col overflow-hidden bg-[#202124] text-white font-sans select-none">
      {/* Hidden dedicated audio elements for crystal-clear remote voice */}
      {peerList.map((peer) =>
        remoteStreams[peer.id] ? (
          <RemoteAudioTrack
            key={`audio_${peer.id}`}
            stream={remoteStreams[peer.id]}
            sinkId={selectedSpeakerId}
          />
        ) : null
      )}

      {/* ── TOAST NOTIFICATIONS ────────────────── */}
      <div className="fixed bottom-24 left-4 sm:left-6 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl shadow-2xl bg-[#292A2D]/95 border border-white/15 text-white font-medium text-xs backdrop-blur-md"
          >
            <span className="text-sm">{t.icon}</span>
            <p className="tracking-wide">{t.message}</p>
          </div>
        ))}
      </div>

      {/* ── BREAK ALERT BANNER ────────────────── */}
      {breakAlert && (
        <div className="flex-shrink-0 flex items-center justify-between px-4 sm:px-6 py-2.5 z-50 bg-[#1E293B] border-b border-[#8AB4F8]/30">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#8AB4F8] animate-ping" />
            <div>
              <p className="text-xs font-semibold text-white">
                Engagement Alert: Class Focus Index dropped to {cfi}%
              </p>
              <p className="text-[11px] text-white/70 hidden sm:block">
                A 5-minute break is recommended to restore student focus.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const timeStr = new Date().toLocaleTimeString('en', {
                  hour: '2-digit',
                  minute: '2-digit',
                });
                const msg = {
                  id: `brk_${Date.now()}`,
                  clientMsgId: `brk_${Date.now()}`,
                  sender: myName,
                  role: myRole,
                  msg: '☕ Instructor announced a 5-minute break. Grab water and stretch!',
                  time: timeStr,
                  timestamp: Date.now(),
                };
                upsertChatMessage(msg);
                sendChatMessage(msg.msg, msg);
                setBreakAlert(false);
              }}
              className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-[#8AB4F8] hover:bg-[#A8C7FA] text-[#202124] transition-all"
            >
              Announce Break
            </button>
            <button
              onClick={() => setBreakAlert(false)}
              className="text-white/60 hover:text-white p-1"
            >
              <Icon d="M18 6 6 18M6 6l12 12" size={15} />
            </button>
          </div>
        </div>
      )}

      {/* ── TOP MINIMAL HEADER BAR ── */}
      <header className="h-14 px-4 sm:px-6 flex items-center justify-between bg-[#202124] flex-shrink-0 z-30">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg overflow-hidden border border-white/15 flex-shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.jpeg" alt="InsightEd Logo" className="w-full h-full object-cover" />
          </div>
          <div className="flex items-center gap-2.5 min-w-0">
            <h1 className="text-sm sm:text-base font-semibold text-white tracking-tight truncate max-w-[160px] sm:max-w-[320px]">
              {meetingTitle}
            </h1>
            <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#EA4335]/15 border border-[#EA4335]/35 text-[10px] font-bold uppercase text-[#F28B82] tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-[#EA4335] animate-pulse" />
              Live
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleCopyCode}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#292A2D] hover:bg-[#3C4043] border border-white/10 text-xs font-mono font-semibold text-[#8AB4F8] transition-all active:scale-95"
            title="Click to copy meeting code"
          >
            <Icon
              d="M9 9h13v13H9z M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"
              size={13}
            />
            <span>{sessionId}</span>
            {copiedCode && <span className="text-[10px] text-[#81C995] ml-1">Copied</span>}
          </button>

          {isCreator && (
            <button
              onClick={() => setSidebarTab((prev) => (prev === 'analytics' ? null : 'analytics'))}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#8AB4F8]/15 hover:bg-[#8AB4F8]/25 border border-[#8AB4F8]/30 text-xs font-semibold text-[#8AB4F8] transition-colors"
            >
              <span className="w-2 h-2 rounded-full bg-[#8AB4F8] animate-pulse" />
              <span>CFI: {cfi}%</span>
            </button>
          )}
        </div>
      </header>

      {/* ── MAIN VIDEO STAGE + SIDE DRAWER ── */}
      <div className="flex-1 flex overflow-hidden relative min-h-0 px-3 sm:px-5 pb-2 gap-4">
        <div className="flex-1 flex flex-col justify-center items-center overflow-hidden relative min-h-0 w-full">
          {screenShareList.length > 0 ? (
            <div className="w-full h-full flex flex-col lg:flex-row gap-3 min-h-0">
              <div className="flex-1 flex flex-col gap-2 min-h-0">
                <div className="flex-1 min-h-0">
                  <ScreenShareTile
                    share={featuredScreenShare}
                    featured={screenShareList.length > 1}
                    isPinned={featuredScreenShare.shareId === pinnedScreenShareId}
                    onPin={() =>
                      setPinnedScreenShareId((current) =>
                        current === featuredScreenShare.shareId ? null : featuredScreenShare.shareId
                      )
                    }
                    onStop={featuredScreenShare.isLocal ? stopScreenShare : null}
                  />
                </div>
                {otherScreenShares.length > 0 && (
                  <div className="h-[96px] flex gap-2 overflow-x-auto flex-shrink-0">
                    {otherScreenShares.map((share) => (
                      <div key={share.shareId} className="w-[200px] h-full flex-shrink-0">
                        <ScreenShareTile
                          share={share}
                          isPinned={share.shareId === pinnedScreenShareId}
                          onPin={() =>
                            setPinnedScreenShareId((current) =>
                              current === share.shareId ? null : share.shareId
                            )
                          }
                          onStop={share.isLocal ? stopScreenShare : null}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="h-[104px] lg:h-full lg:w-[220px] flex lg:flex-col gap-2.5 overflow-x-auto lg:overflow-y-auto flex-shrink-0">
                {allParticipants.map((p) => (
                  <div
                    key={p.id}
                    className="w-[150px] lg:w-full h-full lg:h-[135px] flex-shrink-0 rounded-2xl overflow-hidden"
                  >
                    <MeetingVideoTile
                      stream={p.stream}
                      name={p.name}
                      role={p.role}
                      isLocal={p.isLocal}
                      muted={p.muted}
                      camOff={p.camOff}
                      isSpeaking={p.isSpeaking}
                      handRaised={p.handRaised}
                      isPinned={pinnedPeerId === p.id}
                      onPin={() => setPinnedPeerId((curr) => (curr === p.id ? null : p.id))}
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : pinnedParticipant ? (
            <div className="w-full h-full flex flex-col lg:flex-row gap-3 min-h-0 max-w-7xl mx-auto">
              <div className="flex-1 min-h-0 rounded-2xl overflow-hidden">
                <MeetingVideoTile
                  stream={pinnedParticipant.stream}
                  name={pinnedParticipant.name}
                  role={pinnedParticipant.role}
                  isLocal={pinnedParticipant.isLocal}
                  muted={pinnedParticipant.muted}
                  camOff={pinnedParticipant.camOff}
                  isSpeaking={pinnedParticipant.isSpeaking}
                  handRaised={pinnedParticipant.handRaised}
                  isPinned={true}
                  onPin={() => setPinnedPeerId(null)}
                />
              </div>

              {unpinnedParticipants.length > 0 && (
                <div className="h-[110px] lg:h-full lg:w-[240px] flex lg:flex-col gap-2.5 overflow-x-auto lg:overflow-y-auto flex-shrink-0">
                  {unpinnedParticipants.map((p) => (
                    <div
                      key={p.id}
                      className="w-[160px] lg:w-full h-full lg:h-[145px] flex-shrink-0 rounded-2xl overflow-hidden"
                    >
                      <MeetingVideoTile
                        stream={p.stream}
                        name={p.name}
                        role={p.role}
                        isLocal={p.isLocal}
                        muted={p.muted}
                        camOff={p.camOff}
                        isSpeaking={p.isSpeaking}
                        handRaised={p.handRaised}
                        isPinned={false}
                        onPin={() => setPinnedPeerId(p.id)}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div
              className={`w-full h-full flex items-center justify-center min-h-0 ${
                totalCount === 1
                  ? 'max-w-4xl aspect-video'
                  : totalCount === 2
                  ? 'grid grid-cols-1 sm:grid-cols-2 max-w-6xl gap-3 w-full h-full'
                  : totalCount <= 4
                  ? 'grid grid-cols-2 max-w-6xl gap-3 w-full h-full'
                  : totalCount <= 6
                  ? 'grid grid-cols-2 md:grid-cols-3 max-w-7xl gap-3 w-full h-full'
                  : 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 max-w-7xl gap-2.5 w-full h-full'
              }`}
            >
              {allParticipants.map((p) => (
                <div key={p.id} className="w-full h-full min-h-0 rounded-2xl overflow-hidden">
                  <MeetingVideoTile
                    stream={p.stream}
                    name={p.name}
                    role={p.role}
                    isLocal={p.isLocal}
                    muted={p.muted}
                    camOff={p.camOff}
                    isSpeaking={p.isSpeaking}
                    handRaised={p.handRaised}
                    isPinned={pinnedPeerId === p.id}
                    onPin={() => setPinnedPeerId((curr) => (curr === p.id ? null : p.id))}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── GOOGLE MEET STYLE SIDEBAR DRAWER ──────── */}
        {sidebarTab !== null && (
          <aside className="fixed inset-0 sm:relative sm:inset-auto w-full sm:w-[360px] flex-shrink-0 flex flex-col bg-[#292A2D] sm:rounded-2xl border border-white/10 h-full z-50 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/10">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => {
                    setSidebarTab('chat');
                    setUnreadChatCount(0);
                  }}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    sidebarTab === 'chat'
                      ? 'bg-[#8AB4F8] text-[#202124]'
                      : 'text-white/70 hover:text-white hover:bg-white/10'
                  }`}
                >
                  In-call messages
                </button>
                <button
                  onClick={() => setSidebarTab('participants')}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    sidebarTab === 'participants'
                      ? 'bg-[#8AB4F8] text-[#202124]'
                      : 'text-white/70 hover:text-white hover:bg-white/10'
                  }`}
                >
                  People ({totalCount})
                </button>
                {isCreator && (
                  <button
                    onClick={() => setSidebarTab('analytics')}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                      sidebarTab === 'analytics'
                        ? 'bg-[#8AB4F8] text-[#202124]'
                        : 'text-white/70 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    Focus
                  </button>
                )}
              </div>

              <button
                onClick={() => setSidebarTab(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                title="Close"
              >
                <Icon d="M18 6 6 18M6 6l12 12" size={16} />
              </button>
            </div>

            {/* TAB 1: CHAT */}
            {sidebarTab === 'chat' && (
              <div className="flex-1 flex flex-col min-h-0">
                <div
                  ref={chatScrollRef}
                  className="flex-1 overflow-y-auto p-4 flex flex-col gap-3.5 min-h-0"
                >
                  <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-[11px] text-white/70 text-center">
                    Messages can only be seen by people in the call and are saved to the session log.
                  </div>

                  {chatMessages.length === 0 ? (
                    <div className="text-center text-white/45 text-xs my-auto py-8">
                      No messages yet. Start the conversation!
                    </div>
                  ) : (
                    chatMessages.map((m, idx) => {
                      const isMe = m.sender === myName || m.sender === 'You';
                      const isHost = m.role === 'teacher';

                      return (
                        <div
                          key={m.id || idx}
                          className={`flex flex-col gap-1 ${isMe ? 'items-end' : 'items-start'}`}
                        >
                          <div className="flex items-center gap-1.5 px-1 text-[11px] text-white/60">
                            <span className="font-semibold text-white/90">
                              {isMe ? 'You' : m.sender}
                            </span>
                            {isHost && (
                              <span className="text-[9px] font-bold uppercase text-[#8AB4F8] bg-[#8AB4F8]/15 px-1.5 py-0.5 rounded">
                                Host
                              </span>
                            )}
                            <span className="text-[10px] text-white/45">{m.time}</span>
                          </div>

                          <div
                            className={`px-3.5 py-2.5 rounded-2xl max-w-[85%] text-xs leading-relaxed break-words ${
                              isMe
                                ? 'bg-[#8AB4F8] text-[#202124] font-medium rounded-br-sm'
                                : 'bg-[#3C4043] text-white rounded-bl-sm'
                            }`}
                          >
                            {m.msg}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="p-3 border-t border-white/10 bg-[#202124]/60 flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Send a message to everyone"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
                    className="flex-1 px-4 py-2.5 rounded-full bg-[#3C4043] border border-white/10 text-xs text-white placeholder:text-white/45 outline-none focus:border-[#8AB4F8] transition-all"
                  />
                  <button
                    onClick={handleSendChat}
                    disabled={!chatInput.trim()}
                    className="w-9 h-9 rounded-full flex items-center justify-center bg-[#8AB4F8] hover:bg-[#A8C7FA] text-[#202124] disabled:opacity-35 disabled:cursor-not-allowed transition-all flex-shrink-0"
                    title="Send message"
                  >
                    <Icon d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" size={15} />
                  </button>
                </div>
              </div>
            )}

            {/* TAB 2: PARTICIPANTS */}
            {sidebarTab === 'participants' && (
              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2.5 min-h-0">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-white/50 mb-1">
                  In call ({totalCount})
                </p>

                {allParticipants.map((person) => (
                  <div
                    key={person.id}
                    className="flex items-center gap-3 p-2.5 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors"
                  >
                    <div
                      className={`w-9 h-9 rounded-full font-bold text-xs flex items-center justify-center flex-shrink-0 ${
                        person.isLocal
                          ? 'bg-[#8AB4F8] text-[#202124]'
                          : 'bg-[#3C4043] text-white'
                      }`}
                    >
                      {person.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-white truncate">
                        {person.name}
                        {person.isLocal ? ' (You)' : ''}
                      </p>
                      <p className="text-[10px] text-white/55">
                        {person.role === 'teacher' ? 'Meeting Host' : 'Student'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {person.handRaised && <span className="text-sm">✋</span>}
                      <button
                        onClick={() =>
                          setPinnedPeerId((curr) => (curr === person.id ? null : person.id))
                        }
                        className={`p-1.5 rounded-full text-xs transition-colors ${
                          pinnedPeerId === person.id
                            ? 'bg-[#8AB4F8] text-[#202124]'
                            : 'text-white/60 hover:text-white hover:bg-white/10'
                        }`}
                        title={pinnedPeerId === person.id ? 'Unpin' : 'Pin to screen'}
                      >
                        <Icon
                          d="M12 17v5 M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z"
                          size={13}
                        />
                      </button>
                      {person.muted ? (
                        <Icon
                          d="m19 10-1.39 4.5M9 5a3 3 0 0 1 5.3 1.8M12 19v4M8 23h8M1 1l22 22"
                          size={14}
                          className="text-[#F28B82]"
                        />
                      ) : (
                        <Icon
                          d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"
                          size={14}
                          className="text-[#81C995]"
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* TAB 3: FOCUS TELEMETRY (CREATOR ONLY) */}
            {sidebarTab === 'analytics' && isCreator && (
              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 min-h-0">
                <div className="flex flex-col items-center border-b border-white/10 pb-4">
                  <CircularGauge value={cfi} />
                </div>

                <div className="flex flex-col gap-3 border-b border-white/10 pb-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-white/50">
                    Real-Time Class Telemetry
                  </p>
                  <MetricBar label="Attention" value={metrics.attention} />
                  <MetricBar label="Confusion" value={metrics.confusion} />
                  <MetricBar label="Energy" value={metrics.energy} />
                </div>

                <div className="border-b border-white/10 pb-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-white/50 mb-2">
                    Mark Lecture Topic
                  </p>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      placeholder="e.g. Neural Backpropagation"
                      value={topicLabel}
                      onChange={(e) => setTopicLabel(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleMarkTopic()}
                      className="flex-1 px-3 py-2 rounded-xl bg-[#3C4043] border border-white/10 text-xs text-white placeholder:text-white/45 outline-none focus:border-[#8AB4F8]"
                    />
                    <button
                      onClick={handleMarkTopic}
                      className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[#8AB4F8] hover:bg-[#A8C7FA] text-[#202124] transition-all"
                    >
                      Mark
                    </button>
                  </div>

                  {topicMarkers.length > 0 && (
                    <div className="flex flex-col gap-1.5 max-h-[100px] overflow-y-auto">
                      {topicMarkers.map((m, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-2 text-xs py-1.5 px-2.5 rounded-lg bg-white/5"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-[#8AB4F8]" />
                          <span className="text-white/90 truncate flex-1">{m.label}</span>
                          <span className="text-white/50 font-mono text-[10px]">{m.time}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-white/50 mb-2">
                    Broadcast Announcement
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Message entire class…"
                      value={announcement}
                      onChange={(e) => setAnnouncement(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleBroadcastAnnouncement()}
                      className="flex-1 px-3 py-2 rounded-xl bg-[#3C4043] border border-white/10 text-xs text-white placeholder:text-white/45 outline-none focus:border-[#8AB4F8]"
                    />
                    <button
                      onClick={handleBroadcastAnnouncement}
                      className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[#3C4043] hover:bg-[#4A4E52] text-white border border-white/10 transition-all"
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

      {/* ── GOOGLE MEET BOTTOM CONTROL BAR ── */}
      <footer className="h-20 bg-[#202124] flex items-center justify-between px-4 sm:px-6 z-40 flex-shrink-0">
        <div className="hidden md:flex items-center gap-3 text-sm font-medium text-white/85">
          <span className="font-mono text-xs">{formatTime(elapsed)}</span>
          <span className="text-white/25">|</span>
          <span className="font-mono text-xs text-white/75">{sessionId}</span>
        </div>

        <div className="flex items-center gap-2.5 sm:gap-3 mx-auto md:mx-0">
          <button
            onClick={toggleMic}
            className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all relative ${
              muted
                ? 'bg-[#EA4335] hover:bg-[#D93025] text-white'
                : 'bg-[#3C4043] hover:bg-[#4A4E52] text-white'
            }`}
            title={muted ? 'Turn on microphone' : 'Turn off microphone'}
          >
            {isSpeaking && !muted && (
              <span className="absolute inset-0 rounded-full ring-2 ring-[#8AB4F8] animate-ping pointer-events-none" />
            )}
            <Icon
              d={
                muted
                  ? 'm12 19 3-3 M19 10v1a7.9 7.9 0 0 1-3.07 6.27M12 2a3 3 0 0 0-3 3v1.17M1 1l22 22'
                  : 'M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z M19 10v2a7 7 0 0 1-14 0v-2 M12 19v4 M8 23h8'
              }
              size={19}
            />
          </button>

          <button
            onClick={toggleCam}
            className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all ${
              camOff
                ? 'bg-[#EA4335] hover:bg-[#D93025] text-white'
                : 'bg-[#3C4043] hover:bg-[#4A4E52] text-white'
            }`}
            title={camOff ? 'Turn on camera' : 'Turn off camera'}
          >
            <Icon
              d={
                camOff
                  ? 'm2 2 20 20M21 16V8a2 2 0 0 0-2-2h-9.83 M22 8l-6 4 6 4V8Z'
                  : 'm22 8-6 4 6 4V8Z M2 6h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z'
              }
              size={19}
            />
          </button>

          <button
            onClick={isScreenSharing ? stopScreenShare : startScreenShare}
            className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all ${
              isScreenSharing
                ? 'bg-[#8AB4F8] text-[#202124]'
                : 'bg-[#3C4043] hover:bg-[#4A4E52] text-white'
            }`}
            title={isScreenSharing ? 'Stop presenting' : 'Present now'}
          >
            <Icon
              d="M2 3h20a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z M12 17v4 M8 21h8"
              size={19}
            />
          </button>

          {!isCreator && (
            <button
              onClick={toggleHandRaise}
              className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all ${
                handRaised
                  ? 'bg-[#8AB4F8] text-[#202124]'
                  : 'bg-[#3C4043] hover:bg-[#4A4E52] text-white'
              }`}
              title={handRaised ? 'Lower hand' : 'Raise hand'}
            >
              <span className="text-lg">✋</span>
            </button>
          )}

          <button
            onClick={() => setIsSettingsModalOpen(true)}
            className="w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center bg-[#3C4043] hover:bg-[#4A4E52] text-white transition-all"
            title="Audio & video settings"
          >
            <Icon
              d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"
              size={18}
            />
          </button>

          <button
            onClick={handleEndButtonClick}
            className="px-5 py-3 rounded-full bg-[#EA4335] hover:bg-[#D93025] text-white font-semibold text-xs transition-all shadow-lg active:scale-95 flex items-center gap-2"
            title={isCreator ? 'End or leave call' : 'Leave call'}
          >
            <Icon
              d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.42 19.42 0 0 1-6-6 19.8 19.8 0 0 1-3.12-8.68A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91"
              size={16}
            />
            <span className="hidden sm:inline">{isCreator ? 'End' : 'Leave'}</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {isCreator && (
            <button
              onClick={() => setSidebarTab((prev) => (prev === 'analytics' ? null : 'analytics'))}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                sidebarTab === 'analytics'
                  ? 'bg-[#8AB4F8] text-[#202124]'
                  : 'hover:bg-white/10 text-white/80'
              }`}
              title="Class Focus Analytics"
            >
              <Icon d="M18 20V10 M12 20V4 M6 20V14" size={18} />
            </button>
          )}

          <button
            onClick={() =>
              setSidebarTab((prev) => (prev === 'participants' ? null : 'participants'))
            }
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all relative ${
              sidebarTab === 'participants'
                ? 'bg-[#8AB4F8] text-[#202124]'
                : 'hover:bg-white/10 text-white/80'
            }`}
            title="Show everyone"
          >
            <Icon d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M16 3.13a4 4 0 0 1 0 7.75" size={18} />
            <span className="absolute -top-0.5 -right-0.5 bg-[#3C4043] text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
              {totalCount}
            </span>
          </button>

          <button
            onClick={() => {
              setSidebarTab((prev) => (prev === 'chat' ? null : 'chat'));
              setUnreadChatCount(0);
            }}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all relative ${
              sidebarTab === 'chat'
                ? 'bg-[#8AB4F8] text-[#202124]'
                : 'hover:bg-white/10 text-white/80'
            }`}
            title="Chat with everyone"
          >
            <Icon d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" size={18} />
            {unreadChatCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-[#8AB4F8] text-[#202124] text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {unreadChatCount}
              </span>
            )}
          </button>
        </div>
      </footer>

      {/* ── AUDIO & VIDEO SETTINGS MODAL ── */}
      {isSettingsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="rounded-2xl max-w-md w-full p-6 bg-[#292A2D] border border-white/15 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white">Audio & Video Settings</h3>
              <button
                onClick={() => setIsSettingsModalOpen(false)}
                className="p-1.5 rounded-full text-white/60 hover:text-white hover:bg-white/10"
              >
                <Icon d="M18 6 6 18M6 6l12 12" size={16} />
              </button>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-white/70">Microphone</label>
                <select
                  value={selectedMicId}
                  onChange={(e) => setSelectedMicId(e.target.value)}
                  className="px-3.5 py-2.5 rounded-xl bg-[#3C4043] border border-white/10 text-xs text-white outline-none"
                >
                  <option value="">System Default Microphone</option>
                  {devices.mics.map((d, i) => (
                    <option key={d.deviceId || i} value={d.deviceId}>
                      {d.label || `Microphone ${i + 1}`}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-white/70">Speakers / Headphones</label>
                <div className="flex gap-2">
                  <select
                    value={selectedSpeakerId}
                    onChange={(e) => setSelectedSpeakerId(e.target.value)}
                    className="flex-1 px-3.5 py-2.5 rounded-xl bg-[#3C4043] border border-white/10 text-xs text-white outline-none"
                  >
                    <option value="">System Default Speaker</option>
                    {devices.speakers.map((d, i) => (
                      <option key={d.deviceId || i} value={d.deviceId}>
                        {d.label || `Speaker ${i + 1}`}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => playTestChime(selectedSpeakerId)}
                    className="px-3.5 py-2 rounded-xl bg-[#8AB4F8]/20 hover:bg-[#8AB4F8]/30 text-[#8AB4F8] text-xs font-semibold"
                  >
                    Test
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-white/70">Camera</label>
                <select
                  value={selectedCamId}
                  onChange={(e) => setSelectedCamId(e.target.value)}
                  className="px-3.5 py-2.5 rounded-xl bg-[#3C4043] border border-white/10 text-xs text-white outline-none"
                >
                  <option value="">System Default Camera</option>
                  {devices.cams.map((d, i) => (
                    <option key={d.deviceId || i} value={d.deviceId}>
                      {d.label || `Camera ${i + 1}`}
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-[11px] text-white/70 flex items-center justify-between">
                <span>AI Echo Cancellation & Noise Suppression</span>
                <span className="text-[#81C995] font-bold">Active (48 kHz)</span>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setIsSettingsModalOpen(false)}
                className="px-5 py-2 rounded-full bg-[#8AB4F8] text-[#202124] text-xs font-bold"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── CREATOR END / LEAVE CHOICE MODAL ── */}
      {isEndModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="rounded-2xl max-w-[420px] w-full p-6 bg-[#292A2D] border border-white/15 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-1.5">Leave or End Classroom?</h3>
            <p className="text-xs text-white/70 leading-relaxed mb-5">
              As the creator of this classroom, you can either leave temporarily while keeping the
              room active, or end the session for everyone.
            </p>
            <div className="flex flex-col gap-2.5">
              <button
                type="button"
                onClick={confirmEndClass}
                className="w-full py-2.5 rounded-full font-bold text-xs text-white bg-[#EA4335] hover:bg-[#D93025] transition-all"
              >
                End Meeting for Everyone
              </button>
              <button
                type="button"
                onClick={handleLeaveCall}
                className="w-full py-2.5 rounded-full font-semibold text-xs text-white bg-[#3C4043] hover:bg-[#4A4E52] transition-all"
              >
                Just Leave Call (Keep Room Open)
              </button>
              <button
                type="button"
                onClick={() => setIsEndModalOpen(false)}
                className="w-full py-2 rounded-full font-medium text-xs text-white/60 hover:text-white transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── SESSION ENDED MODAL ── */}
      {isSessionEndedModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="rounded-2xl max-w-[380px] w-full p-6 bg-[#292A2D] border border-white/15 shadow-2xl text-center">
            <div className="w-12 h-12 bg-[#8AB4F8]/15 text-[#8AB4F8] rounded-full flex items-center justify-center mx-auto mb-3.5 text-xl font-bold">
              ✓
            </div>
            <h3 className="text-base font-bold text-white mb-1.5">Classroom Session Ended</h3>
            <p className="text-xs text-white/70 leading-relaxed mb-5">
              The host has ended this live session. Your participation and focus summary have been
              saved.
            </p>
            <button
              type="button"
              onClick={() => router.push('/dashboard')}
              className="w-full py-2.5 rounded-full font-bold text-xs text-[#202124] bg-[#8AB4F8] hover:bg-[#A8C7FA] transition-all"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Root Orchestrator (Auth + Creator Verification + Lobby -> Stage) ─── */
function ClassroomContent() {
  const router = useRouter();
  const { sessionId } = useParams();
  const searchParams = useSearchParams();
  const requestedRole = searchParams.get('role') || 'student';

  const [authReady, setAuthReady] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [meetingMeta, setMeetingMeta] = useState(null);
  const [sessionGone, setSessionGone] = useState(false);

  const [inCall, setInCall] = useState(false);
  const [initialMediaPrefs, setInitialMediaPrefs] = useState({
    initialMuted: false,
    initialCamOff: false,
  });

  const [devices, setDevices] = useState({ mics: [], speakers: [], cams: [] });
  const [selectedMicId, setSelectedMicId] = useState('');
  const [selectedCamId, setSelectedCamId] = useState('');
  const [selectedSpeakerId, setSelectedSpeakerId] = useState('');

  useEffect(() => {
    let active = true;
    async function init() {
      try {
        const [meRes, meetRes] = await Promise.all([
          fetch('/api/auth/me'),
          fetch(`/api/classroom/${sessionId}`),
        ]);

        if (meRes.ok) {
          const meData = await meRes.json();
          if (active && meData.authenticated && meData.user) {
            setUserProfile(meData.user);
            localStorage.setItem('userName', `${meData.user.firstName} ${meData.user.lastName}`);
          }
        }

        if (meetRes.status === 404 || meetRes.status === 410) {
          if (active) setSessionGone(true);
        } else if (meetRes.ok) {
          const meetData = await meetRes.json();
          if (active && meetData.meeting) {
            if (meetData.meeting.active === false) {
              setSessionGone(true);
            } else {
              setMeetingMeta(meetData.meeting);
            }
          }
        }
      } catch (e) {
      } finally {
        if (active) setAuthReady(true);
      }
    }
    init();
    return () => {
      active = false;
    };
  }, [sessionId]);

  useEffect(() => {
    async function loadDevices() {
      try {
        const list = await navigator.mediaDevices.enumerateDevices();
        setDevices({
          mics: list.filter((d) => d.kind === 'audioinput'),
          speakers: list.filter((d) => d.kind === 'audiooutput'),
          cams: list.filter((d) => d.kind === 'videoinput'),
        });
      } catch (e) {}
    }
    loadDevices();
    navigator.mediaDevices?.addEventListener?.('devicechange', loadDevices);
    return () => navigator.mediaDevices?.removeEventListener?.('devicechange', loadDevices);
  }, []);

  if (!authReady) {
    return (
      <div className="fixed inset-0 bg-[#202124] flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-white/15 border-t-[#8AB4F8] rounded-full animate-spin mx-auto mb-3" />
          <p className="text-white/70 text-xs font-medium">Preparing classroom…</p>
        </div>
      </div>
    );
  }

  if (sessionGone) {
    return (
      <div className="fixed inset-0 bg-[#202124] flex items-center justify-center p-4">
        <div className="rounded-2xl max-w-[380px] w-full p-6 bg-[#292A2D] border border-white/15 text-center shadow-2xl">
          <h2 className="text-base font-bold text-white mb-2">Session Unavailable</h2>
          <p className="text-xs text-white/70 mb-5">
            This classroom session has already ended or the meeting code is invalid.
          </p>
          <button
            onClick={() => router.push('/dashboard')}
            className="w-full py-2.5 rounded-full bg-[#8AB4F8] text-[#202124] text-xs font-bold"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const resolvedName = userProfile
    ? `${userProfile.firstName} ${userProfile.lastName}`
    : (typeof window !== 'undefined' && localStorage.getItem('userName')) || 'Participant';

  const isCreator = Boolean(
    meetingMeta?.teacherId && userProfile?._id
      ? String(meetingMeta.teacherId) === String(userProfile._id)
      : meetingMeta?.teacherName
      ? meetingMeta.teacherName === resolvedName &&
        (userProfile?.role === 'teacher' || userProfile?.role === 'admin')
      : requestedRole === 'teacher' &&
        (userProfile?.role === 'teacher' || userProfile?.role === 'admin')
  );

  if (!inCall) {
    return (
      <PreJoinLobby
        sessionId={sessionId}
        meetingMeta={meetingMeta}
        userName={resolvedName}
        isCreator={isCreator}
        devices={devices}
        selectedMicId={selectedMicId}
        setSelectedMicId={setSelectedMicId}
        selectedCamId={selectedCamId}
        setSelectedCamId={setSelectedCamId}
        selectedSpeakerId={selectedSpeakerId}
        setSelectedSpeakerId={setSelectedSpeakerId}
        onJoinCall={(prefs) => {
          setInitialMediaPrefs(prefs);
          setInCall(true);
        }}
        onBack={() => router.push('/dashboard')}
      />
    );
  }

  return (
    <ActiveClassroomStage
      sessionId={sessionId}
      userProfile={userProfile}
      meetingMeta={meetingMeta}
      isCreator={isCreator}
      initialMediaPrefs={initialMediaPrefs}
      devices={devices}
      selectedMicId={selectedMicId}
      setSelectedMicId={setSelectedMicId}
      selectedCamId={selectedCamId}
      setSelectedCamId={setSelectedCamId}
      selectedSpeakerId={selectedSpeakerId}
      setSelectedSpeakerId={setSelectedSpeakerId}
    />
  );
}

export default function ClassroomPage() {
  return (
    <Suspense
      fallback={
        <div className="fixed inset-0 bg-[#202124] flex items-center justify-center">
          <div className="w-10 h-10 border-2 border-white/15 border-t-[#8AB4F8] rounded-full animate-spin" />
        </div>
      }
    >
      <ClassroomContent />
    </Suspense>
  );
}