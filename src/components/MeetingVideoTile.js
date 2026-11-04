'use client';

import { useEffect, useRef } from 'react';

export default function MeetingVideoTile({
  stream,
  name = 'Participant',
  role = 'student',
  isLocal = false,
  muted = false,
  camOff = false,
  isSpeaking = false,
  handRaised = false,
  isPinned = false,
  onPin
}) {
  const videoRef = useRef(null);
  const audioRef = useRef(null);

  // Bind video element
  useEffect(() => {
    if (videoRef.current) {
      if (stream) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      } else {
        videoRef.current.srcObject = null;
      }
    }
  }, [stream]);

  // Bind dedicated audio element for remote participants to guarantee voice playback
  useEffect(() => {
    if (audioRef.current) {
      if (stream && !isLocal) {
        audioRef.current.srcObject = stream;
        audioRef.current.play().catch(() => {});
      } else {
        audioRef.current.srcObject = null;
      }
    }
  }, [stream, isLocal]);

  const initials = name
    ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'P';

  // Check if video track is active
  const hasVideoTrack = stream && stream.getVideoTracks().length > 0 && stream.getVideoTracks()[0].enabled && !camOff;

  return (
    <div
      className={`relative rounded-2xl overflow-hidden aspect-video bg-[#181b24] border transition-all duration-300 group flex items-center justify-center select-none shadow-xl ${
        isSpeaking
          ? 'border-blue-500 ring-2 ring-blue-500/30 shadow-[0_0_24px_rgba(59,130,246,0.35)]'
          : handRaised
          ? 'border-amber-400 ring-2 ring-amber-400/30'
          : 'border-white/10 hover:border-white/20'
      }`}
    >
      {/* Dedicated audio element for remote stream (ensures voice is heard even if camera is off) */}
      {!isLocal && <audio ref={audioRef} autoPlay playsInline />}

      {/* Video Element */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={true} // Audio is handled with high priority by the dedicated audio element above
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          hasVideoTrack ? 'opacity-100' : 'opacity-0 absolute pointer-events-none'
        } ${isLocal ? 'scale-x-[-1]' : ''}`}
      />

      {/* Fallback Avatar when Camera is Off */}
      {!hasVideoTrack && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-[#1a1e2b] via-[#141722] to-[#0e1017]">
          {/* Speaking ripple aura */}
          {isSpeaking && (
            <div className="absolute w-28 h-28 rounded-full bg-blue-500/20 animate-ping" style={{ animationDuration: '1.8s' }} />
          )}
          <div
            className={`w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-black shadow-2xl transition-all duration-300 ${
              role === 'teacher'
                ? 'bg-gradient-to-br from-blue-600 to-indigo-700'
                : 'bg-gradient-to-br from-slate-600 to-slate-800'
            } ${isSpeaking ? 'ring-4 ring-blue-400 scale-105' : 'ring-2 ring-white/10'}`}
          >
            {initials}
          </div>
          <span className="text-[11px] font-semibold text-white/50 mt-3 tracking-wide flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-white/30" />
            Camera off
          </span>
        </div>
      )}

      {/* Bottom Name & Role Pill */}
      <div className="absolute bottom-3 left-3 flex items-center gap-2 max-w-[85%] z-10">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 text-white shadow-lg">
          {/* Speaking wave icon */}
          {isSpeaking && (
            <span className="flex items-center gap-0.5 h-3">
              <span className="w-0.5 h-3 bg-blue-400 rounded-full animate-pulse" />
              <span className="w-0.5 h-2 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '0.15s' }} />
              <span className="w-0.5 h-3.5 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '0.3s' }} />
            </span>
          )}

          <span className="text-xs font-bold truncate max-w-[140px]">
            {name} {isLocal && '(You)'}
          </span>

          {role === 'teacher' && (
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-400 bg-blue-500/20 px-2 py-0.5 rounded-md border border-blue-400/30">
              Host
            </span>
          )}
        </div>
      </div>

      {/* Top Right Status Badges (Muted, Hand Raised, Pin) */}
      <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10">
        {handRaised && (
          <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center text-sm shadow-lg shadow-amber-500/30 animate-bounce">
            ✋
          </div>
        )}

        {muted && (
          <div className="w-8 h-8 rounded-full bg-red-500/90 text-white flex items-center justify-center shadow-lg border border-red-400/40" title="Microphone Muted">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="1" y1="1" x2="23" y2="23" />
              <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
              <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23M12 19v4M8 23h8" />
            </svg>
          </div>
        )}

        {onPin && (
          <button
            onClick={onPin}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
              isPinned
                ? 'bg-blue-600 text-white'
                : 'bg-black/60 text-white/70 hover:text-white opacity-0 group-hover:opacity-100 backdrop-blur-md border border-white/10'
            }`}
            title={isPinned ? "Unpin tile" : "Pin tile to spotlight"}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill={isPinned ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
              <path d="M12 2v8m0 0l-3 4h6l-3-4zm0 8v4" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
