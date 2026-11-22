'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

function JoinMeetingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [activeMeetings, setActiveMeetings] = useState([]);
  const [loadingMeetings, setLoadingMeetings] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');
  const inputRefs = useRef([]);

  useEffect(() => {
    const prefill = searchParams.get('code');
    if (prefill && prefill.length === 6) {
      setDigits(prefill.toUpperCase().split(''));
    }
  }, [searchParams]);

  useEffect(() => {
    let mounted = true;
    async function loadLive() {
      try {
        const res = await fetch('/api/classroom');
        if (res.ok) {
          const data = await res.json();
          if (mounted && data.success) {
            setActiveMeetings(data.meetings || []);
          }
        }
      } catch (e) {
      } finally {
        if (mounted) setLoadingMeetings(false);
      }
    }
    loadLive();
    const interval = setInterval(loadLive, 8000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const handleDigitChange = (idx, val) => {
    const clean = val.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    if (!clean) {
      const next = [...digits];
      next[idx] = '';
      setDigits(next);
      return;
    }

    if (clean.length > 1) {
      const chars = clean.slice(0, 6).split('');
      const next = ['', '', '', '', '', ''];
      chars.forEach((c, i) => {
        next[i] = c;
      });
      setDigits(next);
      const focusIdx = Math.min(5, chars.length);
      inputRefs.current[focusIdx]?.focus();
      return;
    }

    const next = [...digits];
    next[idx] = clean;
    setDigits(next);
    if (idx < 5) {
      inputRefs.current[idx + 1]?.focus();
    }
  };

  const handleKeyDown = (idx, e) => {
    if (e.key === 'Backspace' && !digits[idx] && idx > 0) {
      inputRefs.current[idx - 1]?.focus();
    }
  };

  const joinByCode = async (rawCode) => {
    const code = rawCode.trim().toUpperCase();
    if (code.length < 4) {
      setError('Please enter a valid 6-character classroom code.');
      return;
    }

    setError('');
    setJoining(true);
    try {
      const res = await fetch(`/api/classroom/${code}`);
      if (!res.ok) {
        setError('Classroom not found or has already ended.');
        setJoining(false);
        return;
      }
      const data = await res.json();
      if (!data.success || data.meeting?.active === false) {
        setError('This classroom session has already ended.');
        setJoining(false);
        return;
      }
      router.push(`/dashboard/classroom/${code}`);
    } catch (err) {
      setError('Unable to verify classroom code. Check your connection.');
      setJoining(false);
    }
  };

  const codeString = digits.join('');

  return (
    <div className="min-h-screen dashboard-bg text-snow flex flex-col justify-between">
      <header className="sticky top-0 z-30 px-6 sm:px-8 py-4 flex items-center gap-4 glass-topbar">
        <Link
          href="/dashboard"
          className="flex items-center gap-1.5 text-mist hover:text-snow transition-colors text-xs font-bold uppercase tracking-wider"
        >
          ← Dashboard
        </Link>
        <div className="h-4 w-px bg-black/10" />
        <span className="text-xs font-black uppercase tracking-wider text-snow">
          Join Live Classroom
        </span>
      </header>

      <main className="max-w-4xl w-full mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start my-auto">
        <div className="lg:col-span-6 card-navy rounded-[24px] p-8 border border-black/5 shadow-xl">
          <h1 className="text-xl font-black text-snow mb-1.5">Join with a Code</h1>
          <p className="text-xs text-mist mb-6">
            Enter or paste the 6-character access code shared by your instructor.
          </p>

          {error && (
            <div className="mb-4 px-4 py-3 rounded-xl text-xs font-semibold text-red-600 bg-red-50 border border-red-200">
              ⚠ {error}
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              joinByCode(codeString);
            }}
            className="flex flex-col gap-5"
          >
            <div className="flex items-center justify-between gap-2">
              {digits.map((ch, idx) => (
                <input
                  key={idx}
                  ref={(el) => (inputRefs.current[idx] = el)}
                  type="text"
                  maxLength={6}
                  value={ch}
                  onChange={(e) => handleDigitChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  className="w-11 h-13 sm:w-12 sm:h-14 rounded-xl text-center text-lg font-mono font-black neu-input uppercase focus:ring-2 focus:ring-blue-500 outline-none"
                />
              ))}
            </div>

            <button
              type="submit"
              disabled={joining || codeString.length < 4}
              className="w-full py-3.5 rounded-xl text-white font-black text-xs uppercase tracking-wider btn-primary disabled:opacity-40 transition-all"
            >
              {joining ? 'Verifying Room…' : 'Continue to Pre-Join Lobby →'}
            </button>
          </form>
        </div>

        <div className="lg:col-span-6 card-navy rounded-[24px] p-8 border border-black/5 shadow-xl flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
              <h2 className="text-base font-black text-snow">Live Classrooms Now</h2>
            </div>
            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full">
              {activeMeetings.length} active
            </span>
          </div>

          {loadingMeetings ? (
            <p className="text-xs text-mist py-8 text-center">Scanning active sessions…</p>
          ) : activeMeetings.length === 0 ? (
            <div className="py-10 text-center text-xs text-mist bg-slate-50 rounded-2xl border border-slate-100">
              No live classes running right now. Enter a code on the left when your host starts a
              room.
            </div>
          ) : (
            <div className="flex flex-col gap-3 max-h-[320px] overflow-y-auto pr-1">
              {activeMeetings.map((m) => {
                const count = (m.participants || []).length;
                return (
                  <div
                    key={m._id}
                    className="flex items-center justify-between gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-blue-300 transition-all"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-snow truncate">{m.title}</p>
                      <p className="text-[11px] text-mist mt-0.5">
                        {m.teacherName} · {count} in call ·{' '}
                        <span className="font-mono font-bold text-blue-600">{m.code}</span>
                      </p>
                    </div>
                    <button
                      onClick={() => joinByCode(m.code)}
                      className="px-4 py-2 rounded-xl btn-primary text-white text-xs font-bold flex-shrink-0"
                    >
                      Join
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function JoinMeetingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen dashboard-bg flex items-center justify-center text-xs text-mist">
          Loading…
        </div>
      }
    >
      <JoinMeetingContent />
    </Suspense>
  );
}