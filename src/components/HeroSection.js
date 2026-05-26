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
  { num: '3×', label: 'Engagement Boost' },
];

export default function HeroSection() {
  return (
    <section id="hero" className="relative h-screen w-full flex flex-col items-center justify-center overflow-hidden pt-24 pb-12 hero-bg">

      {/* ── Background Layers ──────────────── */}
      <div className="absolute inset-0 mesh-grid opacity-60 pointer-events-none" />
      <div className="absolute -top-28 -right-20 w-[560px] h-[560px] rounded-full orb-copper animate-float pointer-events-none" />
      <div className="absolute bottom-10 -left-28 w-[460px] h-[460px] rounded-full orb-navy animate-float-r pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(196,124,62,0.08) 0%, transparent 60%)' }} />

      {/* ── Content Wrapper ────────────────── */}
      {/* FIXED: Expanded wrapper max-w to 5xl to accommodate the wider metrics card bar layout below seamlessly */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center max-w-[1000px] w-full px-6 animate-fadeUp flex-1">

        {/* Badge */}
        <div id="hero-badge" className="inline-flex items-center gap-2.5 px-5 py-1.5 rounded-full text-[0.7rem] sm:text-[0.75rem] font-bold tracking-[0.08em] uppercase mb-4 badge-copper shadow-sm"
          style={{ backdropFilter: 'blur(12px)' }}>
          <span className="w-2 h-2 rounded-full animate-pulse flex-shrink-0" style={{ background: '#c47c3e', boxShadow: '0 0 8px rgba(196,124,62,0.80)' }} />
          Privacy-First Virtual Learning Platform
        </div>

        {/* Heading */}
        <h1 id="hero-heading" className="text-[clamp(2rem,5vw,3.3rem)] font-black leading-[1.12] text-[#f2f2f2] tracking-[-0.02em] mb-5">
          Restore the&nbsp;
          <span className="gradient-text">Teacher-Student</span>
          <br />
          <span className="gradient-text">Engagement Loop</span>
        </h1>

        {/* Subheading */}
        <p id="hero-subheading" className="text-[0.92rem] sm:text-[1rem] text-[#f2f2f2]/70 max-w-[560px] leading-relaxed mb-9">
          AI-powered facial expression analysis detects class fatigue in real-time — <strong className="text-[#f2f2f2] font-bold">without compromising student privacy</strong>. All AI processing happens locally on each student&apos;s device.
        </p>

        {/* CTAs */}
        <div id="hero-cta" className="flex items-center gap-3.5 flex-wrap justify-center mb-12">
          <Link
            href="/login"
            id="hero-cta-start"
            className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-full text-[#f2f2f2] font-bold text-[0.9rem] btn-primary transition-all active:scale-95"
          >
            Start a New Meeting
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
          <a
            href="#how-it-works"
            id="hero-cta-learn"
            className="inline-flex items-center gap-2.5 px-6 py-[13px] rounded-full font-semibold text-[0.88rem] btn-secondary transition-all active:scale-95"
          >
            See How It Works
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M5 12l7 7 7-7" />
            </svg>
          </a>
        </div>

        {/* ── EXTENDED STATS CARD (Utilizes whitespace as per image markings) ── */}
        {/* FIXED: Changed to 'w-full max-w-4xl' and mapped elements into an equally proportioned 3-column tracking grid layout */}
        <div id="hero-stats" className="w-full max-w-4xl grid grid-cols-3 items-center rounded-xl overflow-hidden card-navy border border-white/5 shadow-lg backdrop-blur-md">
          {STATS.map((s, i) => (
            <div key={i} className="flex items-center justify-between w-full relative">
              
              {/* Dynamic Metric Box */}
              <div className="flex flex-col items-center justify-center py-4 w-full">
                <span className="text-[1.5rem] font-black text-[#f2f2f2] leading-none mb-1.5 tracking-tight">{s.num}</span>
                <span className="text-[0.68rem] font-bold uppercase tracking-[0.1em] whitespace-nowrap text-mist">{s.label}</span>
              </div>
              
              {/* Subtle copper layout dividers separating column metrics block nodes */}
              {i < STATS.length - 1 && (
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-px h-8" style={{ background: 'rgba(196, 124, 62, 0.20)' }} />
              )}
            </div>
          ))}
        </div>
      </div>
          
      {/* ── Ticker ─────────────────────────── */}
      <div className="w-full overflow-hidden py-3 border-t flex-shrink-0" style={{ background: 'rgba(15, 24, 36, 0.85)', borderColor: 'rgba(196, 124, 62, 0.15)', backdropFilter: 'blur(8px)' }}>
        <div className="flex w-max animate-marquee">
          {TICKER.map((item, i) => (
            <span key={i} className="text-[0.68rem] font-bold tracking-[0.16em] px-8 whitespace-nowrap uppercase" style={{ color: 'rgba(242, 242, 242, 0.45)' }}>
              {item}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}