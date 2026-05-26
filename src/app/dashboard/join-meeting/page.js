'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function JoinMeetingPage() {
  const router = useRouter();
  const videoRef = useRef(null);
  const [codeDigits, setCodeDigits] = useState(['', '', '', '', '', '']);
  const [step, setStep] = useState(1); // 1=enter code/browse, 2=camera check, 3=joining
  const [camAllowed, setCamAllowed] = useState(false);
  const [camError, setCamError] = useState('');
  const [consentChecked, setConsentChecked] = useState(false);
  const [micMuted, setMicMuted] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [stream, setStream] = useState(null);
  const [liveClasses, setLiveClasses] = useState([]);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [checkingCode, setCheckingCode] = useState(false);
  const [codeError, setCodeError] = useState('');
  const inputRefs = useRef([]);

  // Fetch active meetings from MongoDB
  useEffect(() => {
    fetch('/api/classroom')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setLiveClasses(data.meetings);
        }
      })
      .catch(err => console.error('Failed to load active meetings:', err))
      .finally(() => setLoadingClasses(false));
  }, []);

  const fullCode = codeDigits.join('');
  const codeComplete = fullCode.length === 6;

  /* Auto-advance digit inputs */
  const handleDigit = (idx, val) => {
    const clean = val.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(-1);
    const next = [...codeDigits];
    next[idx] = clean;
    setCodeDigits(next);
    if (clean && idx < 5) inputRefs.current[idx + 1]?.focus();
    if (!clean && idx > 0) inputRefs.current[idx - 1]?.focus();
  };

  const handleKeyDown = (idx, e) => {
    if (e.key === 'Backspace' && !codeDigits[idx] && idx > 0) inputRefs.current[idx - 1]?.focus();
    if (e.key === 'ArrowLeft' && idx > 0) inputRefs.current[idx - 1]?.focus();
    if (e.key === 'ArrowRight' && idx < 5) inputRefs.current[idx + 1]?.focus();
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 6);
    const arr = pasted.split('').concat(Array(6).fill('')).slice(0, 6);
    setCodeDigits(arr);
    const focusIdx = Math.min(pasted.length, 5);
    inputRefs.current[focusIdx]?.focus();
  };

  /* Request camera */
  const requestCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setStream(mediaStream);
      setCamAllowed(true);
      setCamError('');
    } catch {
      setCamError('Camera access denied. Please allow camera access in your browser settings.');
    }
  };

  useEffect(() => {
    if (step === 2) {
      const timer = setTimeout(() => {
        requestCamera();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [step]);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream, camAllowed]);

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(t => t.stop());
      }
    };
  }, [stream]);

  const proceedToCamera = async (cls = null) => {
    setCodeError('');
    const targetCode = cls ? cls.code : fullCode;
    
    setCheckingCode(true);
    try {
      const res = await fetch(`/api/classroom/${targetCode}`);
      const data = await res.json();
      if (res.ok && data.success) {
        if (cls) {
          setSelectedClass(cls);
        } else {
          setSelectedClass({ code: targetCode, title: data.meeting.title });
        }
        setStep(2);
      } else {
        setCodeError(data.error || 'Session not found or has ended');
      }
    } catch (err) {
      console.error(err);
      setCodeError('Network error checking code');
    } finally {
      setCheckingCode(false);
    }
  };

  const handleJoin = () => {
    if (!consentChecked) return;
    setStep(3);
    setTimeout(() => {
      router.push(`/dashboard/classroom/${selectedClass?.code || fullCode}?role=student`);
    }, 1500);
  };

  /* ── Step 3: Joining animation ──────── */
  if (step === 3) {
    return (
      <div className="min-h-screen hero-bg flex items-center justify-center relative overflow-hidden text-snow">
        <div className="absolute inset-0 mesh-grid pointer-events-none opacity-40" />
        <div className="relative z-10 text-center animate-fadeUp">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ background: 'rgba(196,124,62,0.15)', border: '2px solid rgba(196,124,62,0.35)' }}>
            <span className="w-8 h-8 border-2 border-[rgba(196,124,62,0.25)] border-t-copper rounded-full animate-spin-slow" />
          </div>
          <h2 className="text-[1.5rem] font-black text-snow mb-2">Joining Classroom…</h2>
          <p className="text-[0.9rem] text-mist font-medium">Setting up your AI-powered engagement analysis locally</p>
          <div className="flex items-center justify-center gap-2 mt-5 text-[0.8rem] text-mist/60">
            <span className="w-1.5 h-1.5 rounded-full bg-copper animate-pulse" />
            <span>AI processing stays on your device</span>
          </div>
        </div>
      </div>
    );
  }

  /* ── Step 2: Camera check ───────────── */
  if (step === 2) {
    return (
      <div className="min-h-screen dashboard-bg relative overflow-hidden text-snow">
        <div className="absolute -top-24 -right-24 w-[400px] h-[400px] rounded-full orb-copper animate-float pointer-events-none" />
        <div className="absolute inset-0 mesh-grid pointer-events-none opacity-40" />

        <header className="sticky top-0 z-30 px-8 py-4 flex items-center gap-4 glass-topbar">
          <button onClick={() => setStep(1)} className="flex items-center gap-2 text-mist hover:text-snow transition-colors text-[0.85rem] font-semibold">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <div className="w-px h-4 bg-[rgba(196,124,62,0.25)]" />
          <span className="text-[0.9rem] font-bold text-snow">Device Check</span>
        </header>

        <div className="max-w-xl mx-auto px-6 py-10 animate-fadeUp">
          <div className="mb-6">
            <h1 id="camera-check-title" className="text-[1.6rem] font-black text-snow mb-1.5">
              {selectedClass ? `Joining: ${selectedClass.title}` : `Joining: ${fullCode}`}
            </h1>
            <p className="text-[0.88rem] text-mist">Check your camera and microphone before entering class</p>
          </div>

          {/* Camera preview */}
          <div id="camera-preview-card" className="rounded-[20px] overflow-hidden mb-5 card-navy">
            <div className="relative aspect-video bg-navy-dark/45 flex items-center justify-center">
              {camAllowed ? (
                <video ref={videoRef} autoPlay muted={micMuted} playsInline className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center gap-3 p-8 text-center">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center"
                    style={{ background: 'rgba(196,124,62,0.12)', border: '1px solid rgba(196,124,62,0.30)' }}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#c47c3e" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                    </svg>
                  </div>
                  {camError ? (
                    <p className="text-[0.84rem] text-mist">{camError}</p>
                  ) : (
                    <p className="text-[0.84rem] text-mist">Camera permission needed for AI analysis</p>
                  )}
                  <button id="request-camera-btn" onClick={requestCamera}
                    className="px-5 py-2.5 rounded-xl text-[0.85rem] font-bold text-[#f2f2f2] btn-primary">
                    Allow Camera
                  </button>
                </div>
              )}

              {camAllowed && (
                <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[0.72rem] font-bold badge-copper">
                  <span className="w-1.5 h-1.5 rounded-full bg-copper animate-pulse" />
                  <span className="text-snow">Camera active</span>
                </div>
              )}
            </div>

            {camAllowed && (
              <div className="px-5 py-3 flex items-center gap-4 border-t border-[rgba(196,124,62,0.14)]">
                <button id="toggle-mic-btn" onClick={() => setMicMuted(!micMuted)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[0.8rem] font-semibold transition-all ${micMuted ? 'text-mist/40' : 'text-snow'}`}
                  style={{
                    background: micMuted ? 'rgba(196,124,62,0.06)' : 'rgba(196,124,62,0.15)',
                    border: '1px solid rgba(196,124,62,0.30)'
                  }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    {micMuted
                      ? <><line x1="1" y1="1" x2="23" y2="23" /><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" /><path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23M12 19v4M8 23h8" /></>
                      : <><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8" /></>
                    }
                  </svg>
                  {micMuted ? 'Mic Off' : 'Mic On'}
                </button>
                <span className="text-[0.78rem] text-mist/60">You can change this during class too</span>
              </div>
            )}
          </div>

          {/* Privacy info */}
          <div className="p-5 rounded-[18px] mb-5 flex gap-3"
            style={{ background: 'rgba(196,124,62,0.08)', border: '1px solid rgba(196,124,62,0.22)' }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-copper flex-shrink-0 mt-0.5"
              style={{ background: 'rgba(196,124,62,0.12)' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="M9 12l2 2 4-4" />
              </svg>
            </div>
            <div>
              <p className="text-[0.85rem] font-bold text-snow mb-1">🔒 AI runs locally on your device</p>
              <p className="text-[0.78rem] text-mist leading-[1.55]">
                Your camera video <strong>never leaves your browser</strong>. MediaPipe FaceMesh analyzes expressions locally every 3 seconds. Only a tiny anonymous engagement score (200 bytes) is sent to the server — no images, no recordings.
              </p>
            </div>
          </div>

          {/* Consent */}
          <label id="consent-checkbox-label" htmlFor="consent-cb" className="flex items-start gap-2.5 cursor-pointer p-4 rounded-[14px] mb-5 transition-colors card-navy"
            style={{ borderColor: consentChecked ? 'rgba(196,124,62,0.60)' : 'rgba(196,124,62,0.18)' }}>
            <input id="consent-cb" type="checkbox" checked={consentChecked} onChange={e => setConsentChecked(e.target.checked)}
              className="w-4.5 h-4.5 mt-0.5 rounded accent-copper flex-shrink-0 cursor-pointer" />
            <span className="text-[0.83rem] text-mist leading-[1.55] font-medium">
              I understand my camera is <strong>analyzed locally only</strong>. No video data is transmitted. My engagement score is shared anonymously with the teacher.
            </span>
          </label>

          <button id="join-class-btn" onClick={handleJoin} disabled={!camAllowed || !consentChecked}
            className="w-full py-4 rounded-2xl text-[#f2f2f2] font-extrabold btn-primary flex items-center justify-center gap-2.5 disabled:opacity-40 disabled:cursor-not-allowed">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
            </svg>
            Join Classroom
          </button>
          {!camAllowed && <p className="text-center text-[0.78rem] text-mist/50 mt-3">Allow camera access above to continue</p>}
          {camAllowed && !consentChecked && <p className="text-center text-[0.78rem] text-mist/50 mt-3">Check the consent box above to continue</p>}
        </div>
      </div>
    );
  }

  /* ── Step 1: Enter code + browse ─────── */
  return (
    <div className="min-h-screen dashboard-bg relative overflow-hidden text-snow">
      <div className="absolute -top-24 -right-24 w-[400px] h-[400px] rounded-full orb-copper animate-float pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-[320px] h-[320px] rounded-full orb-navy animate-float-r pointer-events-none" />
      <div className="absolute inset-0 mesh-grid pointer-events-none opacity-40" />

      {/* Header */}
      <header className="sticky top-0 z-30 px-8 py-4 flex items-center gap-4 glass-topbar">
        <Link href="/dashboard" className="flex items-center gap-2 text-mist hover:text-snow transition-colors text-[0.85rem] font-semibold">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Dashboard
        </Link>
        <div className="w-px h-4 bg-[rgba(196,124,62,0.25)]" />
        <span className="text-[0.9rem] font-bold text-snow">Join a Meeting</span>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-10 flex flex-col gap-6">

        {/* Enter code */}
        <div id="join-by-code-card" className="p-7 rounded-[20px] animate-fadeUp card-navy">
          <h1 id="join-title" className="text-[1.35rem] font-black text-snow mb-1">Join by Class Code</h1>
          <p className="text-[0.85rem] text-mist mb-6">Enter the 6-digit code shared by your teacher</p>

          {/* 6-digit inputs */}
          <div id="code-input-row" className="flex gap-2.5 justify-center mb-6">
            {codeDigits.map((d, i) => (
              <input
                key={i}
                id={`code-digit-${i}`}
                ref={el => inputRefs.current[i] = el}
                type="text"
                inputMode="text"
                maxLength={1}
                value={d}
                onChange={e => handleDigit(i, e.target.value)}
                onKeyDown={e => handleKeyDown(i, e)}
                onPaste={i === 0 ? handlePaste : undefined}
                className="w-12 h-14 text-center text-[1.35rem] font-black text-snow rounded-xl border-2 outline-none transition-all focus:scale-105"
                style={{
                  background: d ? 'rgba(196,124,62,0.15)' : 'rgba(15,24,36,0.60)',
                  borderColor: d ? 'rgba(196,124,62,0.60)' : 'rgba(196,124,62,0.22)',
                  boxShadow: d ? '0 0 12px rgba(196,124,62,0.20)' : 'none',
                }}
              />
            ))}
          </div>

          {codeError && (
            <p id="code-error-msg" className="text-center text-xs font-bold text-red-400 mt-2 mb-3 animate-pulse">
              ⚠️ {codeError}
            </p>
          )}

          <button id="join-by-code-btn" onClick={() => proceedToCamera(null)} disabled={!codeComplete || checkingCode}
            className="w-full py-3.5 rounded-2xl text-[#f2f2f2] font-extrabold btn-primary flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed">
            {checkingCode ? (
              <>
                <span className="w-4 h-4 border-2 border-[rgba(255,255,255,0.3)] border-t-white rounded-full animate-spin" />
                Verifying Access Token…
              </>
            ) : (
              <>
                Continue with Code
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </>
            )}
          </button>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-4">
          <div className="flex-1 h-px bg-[rgba(196,124,62,0.20)]" />
          <span className="text-[0.78rem] font-bold text-mist/70 uppercase tracking-[0.1em]">or browse live classes</span>
          <div className="flex-1 h-px bg-[rgba(196,124,62,0.20)]" />
        </div>

        {/* Browse live classes */}
        <div id="browse-classes-card" className="rounded-[20px] overflow-hidden animate-fadeUp card-navy">
          <div className="flex items-center gap-2.5 px-6 py-4 border-b border-[rgba(196,124,62,0.15)]">
            <span className="w-2 h-2 rounded-full bg-copper animate-pulse" />
            <h2 className="text-[0.93rem] font-bold text-snow">Live Right Now</h2>
            <span className="text-[0.72rem] font-bold px-2 py-0.5 rounded-full badge-copper">{liveClasses.length} classes</span>
          </div>

          <div className="divide-y divide-[rgba(196,124,62,0.10)]">
            {loadingClasses ? (
              <div className="p-8 text-center text-mist text-xs">
                <span className="inline-block w-5 h-5 border-2 border-[rgba(196,124,62,0.20)] border-t-copper rounded-full animate-spin mr-2 align-middle" />
                Syncing active directories…
              </div>
            ) : liveClasses.length === 0 ? (
              <div className="p-8 text-center text-mist text-xs">
                <p className="font-semibold text-snow/60 mb-1">No active classes found</p>
                <p className="text-[11px] text-mist/40">Ask your teacher to launch a session or configure one in the dashboard.</p>
              </div>
            ) : (
              liveClasses.map(cls => {
                const studentsCount = cls.participants ? cls.participants.filter(p => p.role === 'student').length : 0;
                return (
                  <div key={cls._id || cls.code} id={`browse-${cls.code}`} className="flex items-center gap-4 px-6 py-4 hover:bg-[rgba(196,124,62,0.06)] transition-colors">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center font-black text-[0.82rem] text-copper flex-shrink-0"
                      style={{
                        background: 'linear-gradient(135deg, rgba(196,124,62,0.15), rgba(196,124,62,0.05))',
                        border: '1px solid rgba(196,124,62,0.30)'
                      }}>
                      {cls.title.slice(0, 3).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[0.9rem] font-semibold text-snow truncate">{cls.title}</p>
                      <p className="text-[0.76rem] text-mist">{cls.teacherName || 'Teacher'} · active now</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-[0.7rem] text-mist/60">{studentsCount} student(s) connected</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5 flex-shrink-0">
                      <code className="text-[0.78rem] font-mono font-bold px-2.5 py-1 rounded-lg badge-copper">{cls.code}</code>
                      <button id={`join-btn-${cls.code}`} onClick={() => proceedToCamera(cls)} disabled={checkingCode}
                        className="px-4 py-2 rounded-xl text-[0.82rem] font-bold text-[#f2f2f2] btn-primary">
                        Join
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
