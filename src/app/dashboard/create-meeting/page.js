'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import NotificationCenter from '@/components/NotificationCenter';

export default function CreateMeetingPage() {
  const router = useRouter();
  const [threshold, setThreshold] = useState(40);
  const [loading, setLoading] = useState(false);
  const [generatedCode, setGeneratedCode] = useState('');
  const [step, setStep] = useState(1);
  const [copiedType, setCopiedType] = useState('');
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    title: '',
    description: '',
  });

  const setField = (k, v) => setForm((prev) => ({ ...prev, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;

    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/classroom/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title.trim(),
          description: form.description.trim(),
          threshold,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setGeneratedCode(data.code);
        setStep(2);
      } else {
        setError(data.error || 'Failed to initialize session');
      }
    } catch (err) {
      setError('Network error initializing session');
    } finally {
      setLoading(false);
    }
  };

  const handleStart = () => {
    router.push(`/dashboard/classroom/${generatedCode}?role=teacher`);
  };

  const handleCopy = (type) => {
    const textToCopy =
      type === 'link'
        ? `${window.location.origin}/dashboard/join-meeting?code=${generatedCode}`
        : generatedCode;
    navigator.clipboard?.writeText(textToCopy);
    setCopiedType(type);
    setTimeout(() => setCopiedType(''), 2000);
  };

  if (step === 2) {
    return (
      <div className="min-h-screen hero-bg flex items-center justify-center p-4 relative overflow-hidden">
        <div className="relative z-10 w-full max-w-[460px] animate-fadeUp">
          <div className="card-navy rounded-[24px] p-8 text-center border border-black/5 shadow-2xl">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5"
              style={{
                background: 'rgba(59, 130, 246,0.14)',
                border: '1.5px solid rgba(59, 130, 246,0.35)',
              }}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#3B82F6"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>

            <h2 className="text-xl font-black text-snow tracking-tight mb-1">
              Classroom Ready
            </h2>
            <p className="text-xs text-mist mb-6">
              Share this 6-character code or invite link with your students. Only you can end this
              session.
            </p>

            <div className="mb-6">
              <p className="text-[10px] font-bold uppercase tracking-widest text-mist mb-2.5">
                Access Code
              </p>
              <div className="flex items-center justify-center gap-1.5 mb-3.5">
                {generatedCode.split('').map((ch, i) => (
                  <div
                    key={i}
                    className="w-10 h-12 rounded-xl flex items-center justify-center text-xl font-mono font-black text-[#111827] bg-[#F3F5F6] border border-[#EAECEB]"
                  >
                    {ch}
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={() => handleCopy('code')}
                  className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200 transition-all"
                >
                  {copiedType === 'code' ? '✓ Code Copied' : 'Copy Code'}
                </button>
                <button
                  onClick={() => handleCopy('link')}
                  className="flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 transition-all"
                >
                  {copiedType === 'link' ? '✓ Invite Link Copied' : 'Copy Invite Link'}
                </button>
              </div>
            </div>

            <div className="text-left rounded-xl p-4 mb-6 bg-[#F3F5F6] border border-[#EAECEB]">
              <p className="text-xs font-bold text-snow mb-0.5 truncate">{form.title}</p>
              <p className="text-[11px] text-mist leading-relaxed line-clamp-2">
                {form.description || 'Live interactive classroom session.'}
              </p>
              <div className="mt-2.5 pt-2 border-t border-black/5 flex justify-between text-[10px] font-bold text-mist/70 uppercase tracking-wider">
                <span>Focus Alert Threshold:</span>
                <span className="text-blue-600">&lt; {threshold}% Attention</span>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={handleStart}
                className="w-full py-3.5 rounded-xl text-white font-black text-xs uppercase tracking-wider btn-primary flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
              >
                Enter Pre-Join Lobby & Start
              </button>
              <Link
                href="/dashboard"
                className="text-xs font-bold text-mist hover:text-[#111827] transition-colors mt-1"
              >
                ← Return to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen dashboard-bg relative overflow-hidden text-snow flex flex-col justify-between">
      <header className="sticky top-0 z-30 px-6 sm:px-8 py-4 flex items-center justify-between glass-topbar">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 text-mist hover:text-snow transition-colors text-xs font-bold uppercase tracking-wider"
          >
            ← Dashboard
          </Link>
          <div className="h-4 w-px bg-black/10" />
          <span className="text-xs font-black uppercase tracking-wider text-snow">
            New Classroom Session
          </span>
        </div>
        <NotificationCenter />
      </header>

      <div className="max-w-xl w-full mx-auto px-6 py-10 flex-1 flex flex-col justify-center relative z-10">
        <div className="mb-6">
          <h1 className="text-[1.65rem] font-black text-snow tracking-tight mb-1.5">
            Start a New Class
          </h1>
          <p className="text-xs text-mist">
            Create a room and get a 6-character access code. Students can join and leave freely; the
            session remains live until you end it.
          </p>
        </div>

        {error && (
          <div className="mb-4 px-4 py-3 rounded-xl text-[0.83rem] font-semibold text-red-600 bg-red-50 border border-red-200">
            ⚠ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="p-6 rounded-[22px] flex flex-col gap-4 card-navy border border-black/5 shadow-xl">
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="meeting-title"
                className="text-[11px] font-bold uppercase tracking-wider text-mist"
              >
                Class Title <span className="text-blue-500 font-black">*</span>
              </label>
              <input
                id="meeting-title"
                type="text"
                required
                placeholder="e.g. Data Structures & Algorithms — Lecture 05"
                value={form.title}
                onChange={(e) => setField('title', e.target.value)}
                className="px-4 py-3 rounded-xl text-xs neu-input transition-all"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="meeting-desc"
                className="text-[11px] font-bold uppercase tracking-wider text-mist"
              >
                Agenda / Description <span className="text-mist/50 lowercase">(optional)</span>
              </label>
              <textarea
                id="meeting-desc"
                rows={3}
                placeholder="Topics covered, reference chapters, or class instructions..."
                value={form.description}
                onChange={(e) => setField('description', e.target.value)}
                className="px-4 py-3 rounded-xl text-xs neu-input resize-none transition-all leading-relaxed"
              />
            </div>
          </div>

          <div className="p-6 rounded-[22px] flex flex-col gap-3.5 card-navy border border-black/5 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xs font-black text-snow uppercase tracking-wider">
                  Engagement Alert Threshold
                </h2>
                <p className="text-[11px] text-mist mt-0.5">
                  Prompts you to call a short break if class focus drops below this score.
                </p>
              </div>
              <span className="text-xl font-mono font-black text-blue-500 min-w-[48px] text-right">
                {threshold}%
              </span>
            </div>

            <input
              type="range"
              min={10}
              max={80}
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value))}
              className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(90deg, #3B82F6 ${
                  ((threshold - 10) / 70) * 100
                }%, rgba(0,0,0,0.08) ${((threshold - 10) / 70) * 100}%)`,
              }}
            />

            <div className="flex justify-between text-[10px] font-bold tracking-wide text-mist/60 uppercase px-0.5">
              <span>10% (Lenient)</span>
              <span>40% (Default)</span>
              <span>80% (Strict)</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !form.title.trim()}
            className="w-full py-4 rounded-xl text-white text-xs font-black uppercase tracking-wider btn-primary flex items-center justify-center gap-2 mt-1 disabled:opacity-40 transition-all"
          >
            {loading ? 'Creating Classroom…' : 'Create & Get Access Code →'}
          </button>
        </form>
      </div>
    </div>
  );
}