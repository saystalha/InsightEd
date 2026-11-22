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
  onPin,
}) {
  const videoRef = useRef(null);

  // Bind video stream (always muted at <video> level; RemoteAudioTrack handles audio)
  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl) return;

    videoEl.muted = true;

    if (stream) {
      videoEl.srcObject = stream;
      const playPromise = videoEl.play();
      if (playPromise) playPromise.catch(() => {});
    } else {
      videoEl.srcObject = null;
    }

    return () => {
      if (videoEl) videoEl.srcObject = null;
    };
  }, [stream]);

  const cleanName = name.replace(/\s*\(You\)\s*$/i, '').trim() || 'Participant';

  const initials = cleanName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const hasVideoTrack =
    Boolean(stream) &&
    stream.getVideoTracks().length > 0 &&
    stream.getVideoTracks()[0].enabled &&
    !camOff;

  return (
    <div
      className={`relative rounded-2xl overflow-hidden bg-[#292A2D] border transition-all duration-300 group flex items-center justify-center select-none shadow-lg w-full h-full max-h-full ${
        isSpeaking
          ? 'border-[#8AB4F8] ring-2 ring-[#8AB4F8]/50 shadow-[0_0_24px_rgba(138,180,248,0.25)]'
          : handRaised
          ? 'border-amber-400 ring-2 ring-amber-400/40'
          : isPinned
          ? 'border-[#8AB4F8]/70'
          : 'border-white/10 hover:border-white/20'
      }`}
    >
      {/* Video Element (visuals only) */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={true}
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          hasVideoTrack ? 'opacity-100' : 'opacity-0 absolute pointer-events-none'
        } ${isLocal ? 'scale-x-[-1]' : ''}`}
      />

      {/* Google Meet Avatar Fallback when Camera is Off */}
      {!hasVideoTrack && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#292A2D] p-3">
          {isSpeaking && (
            <div
              className="absolute w-20 h-20 sm:w-28 sm:h-28 rounded-full bg-[#8AB4F8]/20 animate-ping"
              style={{ animationDuration: '1.8s' }}
            />
          )}
          <div
            className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center text-xl sm:text-2xl font-bold shadow-xl transition-all duration-300 ${
              role === 'teacher'
                ? 'bg-[#8AB4F8]/20 text-[#8AB4F8] border border-[#8AB4F8]/40'
                : 'bg-[#3C4043] text-white border border-white/10'
            } ${isSpeaking ? 'ring-4 ring-[#8AB4F8]/50 scale-105' : ''}`}
          >
            {initials}
          </div>
          <span className="text-[11px] font-medium text-white/55 mt-2.5 tracking-wide">
            Camera off
          </span>
        </div>
      )}

      {/* Bottom Name & Host Pill */}
      <div className="absolute bottom-3 left-3 flex items-center gap-1.5 max-w-[85%] z-10">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#202124]/80 backdrop-blur-md border border-white/10 text-white shadow-md">
          {isSpeaking && !muted && (
            <span className="flex items-center gap-0.5 h-3">
              <span className="w-0.5 h-2.5 bg-[#8AB4F8] rounded-full animate-pulse" />
              <span
                className="w-0.5 h-1.5 bg-[#8AB4F8] rounded-full animate-pulse"
                style={{ animationDelay: '0.15s' }}
              />
              <span
                className="w-0.5 h-3 bg-[#8AB4F8] rounded-full animate-pulse"
                style={{ animationDelay: '0.3s' }}
              />
            </span>
          )}

          <span className="text-xs font-medium truncate max-w-[120px] sm:max-w-[170px]">
            {cleanName}
            {isLocal ? ' (You)' : ''}
          </span>

          {role === 'teacher' && (
            <span className="text-[9px] font-bold uppercase tracking-wider text-[#8AB4F8] bg-[#8AB4F8]/15 px-1.5 py-0.5 rounded">
              Host
            </span>
          )}
        </div>
      </div>

      {/* Top Right Status Badges (Hand Raised, Muted, Pin) */}
      <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10">
        {handRaised && (
          <div
            className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center text-sm shadow-md animate-bounce"
            title="Hand raised"
          >
            ✋
          </div>
        )}

        {muted && (
          <div
            className="w-8 h-8 rounded-full bg-[#202124]/85 text-[#F28B82] flex items-center justify-center shadow-md border border-white/10"
            title="Microphone muted"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="1" y1="1" x2="23" y2="23" />
              <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
              <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23M12 19v4M8 23h8" />
            </svg>
          </div>
        )}

        {onPin && (
          <button
            type="button"
            onClick={onPin}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
              isPinned
                ? 'bg-[#8AB4F8] text-[#202124] shadow-md'
                : 'bg-[#202124]/80 text-white/80 hover:text-white opacity-100 sm:opacity-0 sm:group-hover:opacity-100 backdrop-blur-md border border-white/10'
            }`}
            title={isPinned ? 'Unpin from screen' : 'Pin to screen'}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill={isPinned ? 'currentColor' : 'none'}
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 17v5" />
              <path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}