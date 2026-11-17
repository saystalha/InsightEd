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
    const videoEl = videoRef.current;
    if (!videoEl) return;

    if (stream) {
      videoEl.srcObject = stream;
      // Force play (needed after autoplay policy blocks)
      const playPromise = videoEl.play();
      if (playPromise) playPromise.catch(() => {});
    } else {
      videoEl.srcObject = null;
    }

    return () => {
      if (videoEl) videoEl.srcObject = null;
    };
  }, [stream]);

  // Bind dedicated audio element for remote participants to guarantee voice playback.
  // This is separate from video because video.muted=true (we don't want echo for local),
  // so remote audio needs its own element.
  useEffect(() => {
    const audioEl = audioRef.current;
    if (!audioEl) return;

    if (stream && !isLocal) {
      audioEl.srcObject = stream;
      audioEl.volume = 1.0;
      const playPromise = audioEl.play();
      if (playPromise) {
        playPromise.catch(() => {
          // Autoplay blocked — will be unblocked by user interaction handler in page.js
        });
      }
    } else {
      audioEl.srcObject = null;
    }

    // Also listen for new audio tracks being added to the stream
    if (stream && !isLocal) {
      const handleTrackAdded = () => {
        if (audioEl.srcObject !== stream) {
          audioEl.srcObject = stream;
        }
        audioEl.play().catch(() => {});
      };
      stream.addEventListener('addtrack', handleTrackAdded);
      return () => {
        stream.removeEventListener('addtrack', handleTrackAdded);
      };
    }
  }, [stream, isLocal]);

  const initials = name
    ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'P';

  const hasVideoTrack = stream && stream.getVideoTracks().length > 0 && stream.getVideoTracks()[0].enabled && !camOff;

  return (
    <div
      className={`relative rounded-xl sm:rounded-2xl overflow-hidden bg-[#0F172A] border transition-all duration-300 group flex items-center justify-center select-none shadow-md w-full h-full max-h-full ${
        isSpeaking
          ? 'border-blue-500 ring-2 ring-blue-500/40 shadow-[0_0_20px_rgba(59,130,246,0.30)]'
          : handRaised
          ? 'border-amber-400 ring-2 ring-amber-400/40'
          : 'border-slate-800 hover:border-slate-700'
      }`}
    >
      {/* Dedicated audio element for remote stream — ensures voice is heard even if camera is off */}
      {!isLocal && (
        <audio
          ref={audioRef}
          autoPlay
          playsInline
          style={{ position: 'absolute', width: 0, height: 0, opacity: 0 }}
        />
      )}

      {/* Video Element */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={true}  /* Audio is handled by the dedicated audio element above */
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          hasVideoTrack ? 'opacity-100' : 'opacity-0 absolute pointer-events-none'
        } ${isLocal ? 'scale-x-[-1]' : ''}`}
      />

      {/* Fallback Avatar when Camera is Off */}
      {!hasVideoTrack && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-[#1E293B] via-[#0F172A] to-[#020617] p-2">
          {/* Speaking ripple aura */}
          {isSpeaking && (
            <div className="absolute w-20 h-20 sm:w-28 sm:h-28 rounded-full bg-blue-500/20 animate-ping" style={{ animationDuration: '1.8s' }} />
          )}
          <div
            className={`w-14 h-14 sm:w-20 sm:h-20 rounded-full flex items-center justify-center text-white text-lg sm:text-2xl font-black shadow-xl transition-all duration-300 ${
              role === 'teacher'
                ? 'bg-gradient-to-br from-blue-600 to-indigo-700'
                : 'bg-gradient-to-br from-slate-600 to-slate-800'
            } ${isSpeaking ? 'ring-3 ring-blue-400 scale-105' : 'ring-2 ring-white/10'}`}
          >
            {initials}
          </div>
          <span className="text-[10px] sm:text-[11px] font-semibold text-slate-400 mt-2 tracking-wide flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
            Camera off
          </span>
        </div>
      )}

      {/* Bottom Name & Role Pill */}
      <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1.5 max-w-[85%] z-10">
        <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 py-1 sm:py-1.5 rounded-lg sm:rounded-xl bg-black/65 backdrop-blur-md border border-white/10 text-white shadow-md">
          {/* Speaking wave icon */}
          {isSpeaking && (
            <span className="flex items-center gap-0.5 h-2.5 sm:h-3">
              <span className="w-0.5 h-2.5 bg-blue-400 rounded-full animate-pulse" />
              <span className="w-0.5 h-1.5 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '0.15s' }} />
              <span className="w-0.5 h-3 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '0.3s' }} />
            </span>
          )}

          <span className="text-[11px] sm:text-xs font-bold truncate max-w-[100px] sm:max-w-[140px]">
            {name} {isLocal && '(You)'}
          </span>

          {role === 'teacher' && (
            <span className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider text-blue-300 bg-blue-500/25 px-1.5 py-0.2 rounded border border-blue-400/30">
              Host
            </span>
          )}
        </div>
      </div>

      {/* Top Right Status Badges (Muted, Hand Raised, Pin) */}
      <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 z-10">
        {handRaised && (
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-amber-500 text-white flex items-center justify-center text-xs sm:text-sm shadow-md animate-bounce">
            ✋
          </div>
        )}

        {muted && (
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-red-500/90 text-white flex items-center justify-center shadow-md border border-red-400/40" title="Microphone Muted">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="1" y1="1" x2="23" y2="23" />
              <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
              <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23M12 19v4M8 23h8" />
            </svg>
          </div>
        )}

        {onPin && (
          <button
            onClick={onPin}
            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all ${
              isPinned
                ? 'bg-blue-600 text-white'
                : 'bg-black/60 text-white/70 hover:text-white opacity-0 group-hover:opacity-100 backdrop-blur-md border border-white/10'
            }`}
            title={isPinned ? "Unpin tile" : "Pin tile"}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill={isPinned ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
              <path d="M12 2v8m0 0l-3 4h6l-3-4zm0 8v4" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
