'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';



export default function CreateMeetingPage() {
  const router = useRouter();
  const [threshold, setThreshold] = useState(40);
  const [loading, setLoading] = useState(false);
  const [generatedCode, setGeneratedCode] = useState('');
  const [step, setStep] = useState(1); // 1 = input form, 2 = code delivery card
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    title: '',
    description: '',
  });

  const setField = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  /**
   * Submits the classroom configuration details to the API route to initialize
   * a fresh meeting session and generate a unique join code.
   * 
   * @param {React.FormEvent} e - The form submission event
   */
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
          title: form.title,
          description: form.description
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setGeneratedCode(data.code);
        setStep(2);
      } else {
        setError(data.error || 'Failed to initialize session');
      }
    } catch (err) {
      console.error(err);
      setError('Network error initializing session');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Navigates the teacher to the newly created live classroom page.
   */
  const handleStart = () => {
    router.push(`/dashboard/classroom/${generatedCode}?role=teacher`);
  };

  /**
   * Copies the 6-character classroom access token code to the user's clipboard.
   */
  const handleCopyCode = () => {
    navigator.clipboard?.writeText(generatedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  /* ── STEP 2: PREMIUM CODE CONFIRMATION SCREEN ── */
  if (step === 2) {
    return (
      <div className="min-h-screen hero-bg flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-[450px] h-[450px] rounded-full orb-navy animate-float pointer-events-none opacity-50" />
        <div className="absolute -bottom-20 -left-20 w-[350px] h-[350px] rounded-full orb-navy animate-float-r pointer-events-none opacity-40" />
        <div className="absolute inset-0 mesh-grid pointer-events-none opacity-40" />

        <div className="relative z-10 w-full max-w-[440px] animate-fadeUp">
          <div className="card-navy rounded-[24px] p-8 text-center border border-black/5 shadow-[0_24px_64px_rgba(10,14,22,0.5)]">
            
            {/* Animated Success ring marker */}
            <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5 transition-transform duration-500 scale-100 hover:scale-105"
              style={{ background: 'rgba(59, 130, 246,0.14)', border: '1.5px solid rgba(59, 130, 246,0.35)' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>

            <h2 id="meeting-created-title" className="text-xl font-black text-snow tracking-tight mb-1">Classroom Initialized</h2>
            <p className="text-xs text-mist mb-6">Your real-time feedback environment is active. Share this token code.</p>

            {/* Generated Code Blocks */}
            <div id="class-code-display" className="mb-6">
              <p className="text-[10px] font-bold uppercase tracking-widest text-mist mb-2.5">Access Code</p>
              <div className="flex items-center justify-center gap-1.5 mb-3.5">
                {generatedCode.split('').map((ch, i) => (
                  <div key={i} className="w-10 h-12 rounded-xl flex items-center justify-center text-xl font-mono font-black text-[#111827] bg-[#F3F5F6] border border-[#EAECEB] shadow-inner">
                    {ch}
                  </div>
                ))}
              </div>
              
              <button 
                id="copy-code-btn"
                onClick={handleCopyCode}
                className="flex items-center gap-1.5 mx-auto text-xs font-bold transition-all text-blue-400 hover:brightness-110 active:scale-95 px-3 py-1 rounded-md bg-black/5 border border-black/5"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
                {copied ? 'Copied Token!' : 'Copy Code'}
              </button>
            </div>

            {/* Micro Session Manifest metadata badge */}
            <div className="text-left rounded-xl p-4 mb-6 bg-[#F3F5F6] border border-[#EAECEB]">
              <p className="text-xs font-bold text-snow mb-0.5 truncate">{form.title}</p>
              <p className="text-[11px] text-mist leading-relaxed line-clamp-2">{form.description || 'No description agenda defined for this lecture.'}</p>
              <div className="mt-2.5 pt-2 border-t border-black/5 flex justify-between text-[10px] font-bold text-mist/60 uppercase tracking-wider">
                <span>Alert Condition:</span>
                <span className="text-blue-400">&lt; {threshold}% Attention</span>
              </div>
            </div>

            {/* Launch Actions Terminal */}
            <div className="flex flex-col gap-3">
              <button 
                id="enter-classroom-btn" 
                onClick={handleStart}
                className="w-full py-3.5 rounded-xl text-white font-black text-xs uppercase tracking-wider btn-primary flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="23 7 16 12 23 17 23 7" />
                  <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                </svg>
                Launch Live Session
              </button>
              
              <Link href="/dashboard" className="text-xs font-bold text-mist/60 hover:text-[#111827] transition-colors mt-2">
                ← Return to Dashboard
              </Link>
            </div>

          </div>
        </div>
      </div>
    );
  }

  /* ── STEP 1: CLEAN PROFESSIONAL CREATE MEETING FORM ── */
  return (
    <div className="min-h-screen dashboard-bg relative overflow-hidden text-snow flex flex-col justify-between">
      <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full orb-navy animate-float pointer-events-none opacity-40" />
      <div className="absolute inset-0 mesh-grid pointer-events-none opacity-30" />

      {/* Embedded Top Navigation Bar */}
      <header className="sticky top-0 z-30 px-6 sm:px-8 py-4 flex items-center gap-4 glass-topbar">
        <Link href="/dashboard" className="flex items-center gap-1.5 text-mist hover:text-snow transition-colors text-xs font-bold uppercase tracking-wider group">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:-translate-x-0.5">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Dashboard
        </Link>
        <div className="w-flow h-4 w-px bg-black/5" />
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center border border-[rgba(59,130,246,0.30)] overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.jpeg"
              alt="InsightEd Logo"
              className="w-full h-full object-cover"
            />
          </div>
          <span className="text-xs font-black uppercase tracking-wider text-snow">New Session Configuration</span>
        </div>
      </header>

      {/* Main Core Form Block */}
      <div className="max-w-xl w-full mx-auto px-6 py-10 flex-1 flex flex-col justify-center relative z-10">
        
        <div className="mb-6 animate-fadeUp">
          <h1 id="create-meeting-title" className="text-[1.65rem] font-black text-snow tracking-tight mb-1.5">Start a New Class</h1>
          <p className="text-xs text-mist">Configure your edge analytics telemetry rules. Students join instantly using a single 6-digit access code.</p>
        </div>

        {error && (
          <div className="mb-4 px-4 py-3 rounded-xl text-[0.83rem] font-semibold text-blue-500 bg-[rgba(59, 130, 246,0.1)] border border-[rgba(59, 130, 246,0.2)] animate-fadeUp">
            ⚠ {error}
          </div>
        )}

        <form id="create-meeting-form" onSubmit={handleSubmit} className="flex flex-col gap-4 animate-fadeUp [animation-delay:80ms]">

          {/* Core Configuration Panel */}
          <div className="p-6 rounded-[22px] flex flex-col gap-4 card-navy border border-black/5 shadow-xl">
            
            {/* Input Element Container: Class Title */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="meeting-title" className="text-[11px] font-bold uppercase tracking-wider text-mist">
                Class Title <span className="text-blue-500 font-black">*</span>
              </label>
              <input 
                id="meeting-title" 
                type="text" 
                required 
                placeholder="e.g. Advanced Machine Learning — Lecture 04"
                value={form.title} 
                onChange={e => setField('title', e.target.value)}
                className="px-4 py-3 rounded-xl text-xs neu-input transition-all" 
              />
            </div>

            {/* Input Element Container: Description */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="meeting-desc" className="text-[11px] font-bold uppercase tracking-wider text-mist">
                Description <span className="text-mist/40 font-medium lowercase">(optional)</span>
              </label>
              <textarea 
                id="meeting-desc" 
                rows={3} 
                placeholder="Define brief lecture outlines, reference chapters, or meeting context metrics layout..."
                value={form.description} 
                onChange={e => setField('description', e.target.value)}
                className="px-4 py-3 rounded-xl text-xs neu-input resize-none transition-all leading-relaxed" 
              />
            </div>
          </div>

          {/* Interactive Engagement Alert Threshold Panel */}
          <div className="p-6 rounded-[22px] flex flex-col gap-3.5 card-navy border border-black/5 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xs font-black text-snow uppercase tracking-wider">Engagement Alert Threshold</h2>
                <p className="text-[11px] text-mist mt-0.5 leading-normal">Fires an automated break prompt to your deck when class attention metrics drop below limit.</p>
              </div>
              <span id="threshold-value" className="text-xl font-mono font-black text-blue-500 min-w-[48px] text-right">{threshold}%</span>
            </div>
            
            <input 
              id="threshold-slider" 
              type="range" 
              min={10} 
              max={80} 
              value={threshold}
              onChange={e => setThreshold(Number(e.target.value))}
              className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-copper transition-all"
              style={{ background: `linear-gradient(90deg, #3B82F6 ${((threshold - 10) / 70) * 100}%, rgba(0,0,0,0.06) ${((threshold - 10) / 70) * 100}%)` }} 
            />
            
            <div className="flex justify-between text-[10px] font-bold tracking-wide text-mist/50 uppercase px-0.5">
              <span>10% (Lenient)</span>
              <span>40% (Default)</span>
              <span>80% (Strict)</span>
            </div>
          </div>

          {/* Master Form Submission Action Trigger */}
          <button 
            type="submit" 
            id="create-meeting-submit" 
            disabled={loading || !form.title.trim()}
            className="w-full py-4 rounded-xl text-white text-xs font-black uppercase tracking-wider btn-primary flex items-center justify-center gap-2 mt-1 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-[0.99]"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-[rgba(255,255,255,0.30)] border-t-white rounded-full animate-spin" />
                Configuring Sync Pipeline…
              </>
            ) : (
              <>
                Initialize & Start Session Now
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </>
            )}
          </button>

        </form>
      </div>

      {/* Micro-Branded Footer Status Bar */}
      <footer className="w-full flex justify-center py-4 border-t border-black/5 flex-shrink-0 bg-white border-t border-black/10 z-10">
        <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-mist/50 px-3 py-1 rounded-full bg-black/5 border border-black/5">
          <span className="w-1 h-1 rounded-full bg-copper animate-pulse" />
          InsightEd Edge Portal Security Module Active
        </span>
      </footer>
    </div>
  );
}