'use client';

import Link from 'next/link';

const TICKER = [
  '✦ Privacy-First Design', '✦ Edge Computing', '✦ Class Fatigue Index™',
  '✦ Real-Time AI Analysis', '✦ TensorFlow.js On-Device', '✦ Zero Biometric Uploads',
  '✦ Instant Break Alerts', '✦ Teacher Feedback Loop',
  '✦ Privacy-First Design', '✦ Edge Computing', '✦ Class Fatigue Index™',
  '✦ Real-Time AI Analysis', '✦ TensorFlow.js On-Device', '✦ Zero Biometric Uploads',
  '✦ Instant Break Alerts', '✦ Teacher Feedback Loop',
];

const STATS = [
  { num: '0%', label: 'Data Uploaded' },
  { num: '<2s', label: 'Alert Latency' },
  { num: '3x', label: 'Engagement Boost' },
];

export default function HeroSection() {
  return (
    <section id="hero" className="relative h-screen w-full flex flex-col items-center justify-between overflow-hidden pt-20 pb-0 hero-bg">

      {/* ── Background Clean Layer Orbs (Kept simple, no crowded extra boxes) ──────────────── */}
      <div className="absolute inset-0 mesh-grid opacity-40 pointer-events-none" />
      <div className="absolute -top-28 -right-20 w-[500px] h-[500px] rounded-full orb-copper animate-float pointer-events-none opacity-70" />
      <div className="absolute bottom-20 -left-28 w-[400px] h-[400px] rounded-full orb-navy animate-float-r pointer-events-none opacity-60" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(196,124,62,0.06) 0%, transparent 60%)' }} />

      {/* ── Split Content Grid Wrapper (Left Text, Right Glassmorphic Engine Mockup) ────────────────── */}
      <div className="relative z-10 flex-1 w-full max-w-6xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center justify-center my-auto">
        
        {/* LEFT COLUMN: Main Text & Access Flow Actions */}
        <div className="lg:col-span-7 flex flex-col text-left items-start justify-center animate-fadeUp">
          
          {/* Institutional Security Badge */}
          <div id="hero-badge" className="inline-flex items-center gap-2 px-4 py-1 rounded-full text-[0.68rem] font-bold tracking-[0.08em] uppercase mb-4 badge-copper shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full animate-pulse flex-shrink-0" style={{ background: '#c47c3e', boxShadow: '0 0 8px rgba(196,124,62,0.80)' }} />
            Centralized IT Provisioning Active
          </div>

          {/* Heading */}
          <h1 id="hero-heading" className="text-[clamp(1.6rem,4vw,2.6rem)] font-black leading-[1.15] text-[#f2f2f2] tracking-[-0.02em] mb-4">
            Restore the <span className="gradient-text">Teacher</span>
            <br />
            <span className="gradient-text">Student</span>
            <br />
            <span className="gradient-text">Engagement Loop</span>
          </h1>

          {/* Subheading */}
          <p id="hero-subheading" className="text-[0.88rem] sm:text-[0.94rem] text-[#f2f2f2]/70 max-w-[520px] leading-relaxed mb-6">
            AI-powered facial expression analysis detects class fatigue in real-time  <strong className="text-[#f2f2f2] font-bold">without compromising student privacy</strong>. All processing happens locally on each student&apos;s machine via Edge AI.
          </p>

          {/* Integrated Portal CTAs */}
          <div id="hero-cta" className="flex items-center gap-3.5 flex-wrap justify-start w-full">
            <Link
              href="/login"
              id="hero-cta-start"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-[#f2f2f2] font-black text-[0.85rem] uppercase tracking-wider btn-primary transition-all active:scale-95 shadow-md"
            >
              Access Portal Dashboard
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3"/>
              </svg>
            </Link>
            <a
              href="#how-it-works"
              id="hero-cta-learn"
              className="inline-flex items-center gap-2 px-5 py-[11px] rounded-full font-bold text-[0.82rem] uppercase tracking-wider btn-secondary transition-all active:scale-95"
            >
              System Specs
            </a>
          </div>
        </div>

        {/* RIGHT COLUMN: Sleek Glassmorphic Core UI Interactive Logo Simulation Card */}
        <div className="lg:col-span-5 hidden lg:flex justify-center items-center animate-fadeUp delay-200">
          <div className="w-full max-w-[360px] aspect-[4/3] rounded-2xl border border-white/10 card-navy shadow-2xl p-6 backdrop-blur-xl relative overflow-hidden flex flex-col justify-between">
            {/* Glossy sheen overlay reflection line */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none" 
                 style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, transparent 50%)' }} />
            
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div className="flex gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500/40" />
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/40" />
                <span className="w-2.5 h-2.5 rounded-full bg-green-500/40" />
              </div>
              <span className="text-[9px] font-mono tracking-widest text-[#c47c3e] uppercase font-black">InsightEd Core Engine</span>
            </div>

            {/* Neural Track UI Telemetry Simulation Wireframe Elements */}
            <div className="flex-1 flex flex-col items-center justify-center my-4 relative">
              <div className="w-16 h-16 rounded-full border border-[rgba(196,124,62,0.4)] flex items-center justify-center bg-black/20 text-white relative shadow-inner">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[#c47c3e]">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                  <circle cx="12" cy="13" r="4"/>
                </svg>
                {/* Simulated tracking bounds marker brackets */}
                <div className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-[#c47c3e]" />
                <div className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-[#c47c3e]" />
              </div>
              <span className="text-[10px] font-mono text-white/50 mt-3 uppercase tracking-[0.15em]">On-Device WebGL Thread</span>
            </div>

            <div className="p-2.5 rounded-xl bg-black/30 border border-white/5 text-center flex flex-col">
              <span className="text-[11px] font-bold text-emerald-400 font-mono tracking-tight">STATUS: SECURE EDGE PROMPT</span>
              <span className="text-[9px] text-white/40 mt-0.5 font-mono">Biometrics Encrypted inside Buffer Sandbox Memory</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── SCREEN BOTTOM BASE: Combined Static Metrics Card Bar Container ────────────────── */}
      <div className="w-full max-w-5xl px-6 mb-5 mt-auto z-10 animate-fadeUp delay-100">
        <div id="hero-stats" className="w-full grid grid-cols-3 items-center rounded-xl overflow-hidden card-navy border border-white/5 shadow-xl backdrop-blur-md">
          {STATS.map((s, i) => (
            <div key={i} className="flex items-center justify-between w-full relative">
              <div className="flex flex-col items-center justify-center py-3.5 w-full">
                <span className="text-[1.35rem] font-black text-[#f2f2f2] leading-none mb-1 tracking-tight">{s.num}</span>
                <span className="text-[0.65rem] font-black uppercase tracking-[0.1em] whitespace-nowrap text-mist">{s.label}</span>
              </div>
              {i < STATS.length - 1 && (
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-px h-6" style={{ background: 'rgba(196, 124, 62, 0.20)' }} />
              )}
            </div>
          ))}
        </div>
      </div>
          
      {/* ── BOTTOM MOST CLOSING COMPONENT: Ticker ─────────────────────────── */}
      <div className="w-full overflow-hidden py-2.5 border-t flex-shrink-0 mt-auto" style={{ background: 'rgba(15, 24, 36, 0.95)', borderColor: 'rgba(196, 124, 62, 0.15)', backdropFilter: 'blur(8px)' }}>
        <div className="flex w-max animate-marquee">
          {TICKER.map((item, i) => (
            <span key={i} className="text-[0.64rem] font-bold tracking-[0.16em] px-8 whitespace-nowrap uppercase" style={{ color: 'rgba(242, 242, 242, 0.45)' }}>
              {item}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}