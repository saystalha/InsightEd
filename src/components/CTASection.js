import Link from 'next/link';

export default function CTASection() {
  return (
    <section id="cta" className="relative py-24 overflow-hidden cta-bg">

      {/* Orbs */}
      <div className="absolute -top-20 -left-20 w-[380px] h-[380px] rounded-full pointer-events-none orb-navy" />
      <div className="absolute -bottom-16 -right-16 w-[320px] h-[320px] rounded-full pointer-events-none orb-navy" />

      <div className="relative z-10 max-w-6xl mx-auto px-6">
        <div className="card-navy relative text-center flex flex-col items-center px-10 py-20 rounded-[36px] overflow-hidden">

          {/* Inner glow */}
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[500px] h-[300px] rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(ellipse, rgba(59, 130, 246,0.15) 0%, transparent 70%)' }} />

          {/* Tag */}
          <span className="badge-copper relative z-10 inline-flex items-center gap-2 px-5 py-1.5 rounded-full text-[0.75rem] font-bold tracking-[0.12em] uppercase mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-copper animate-pulse" style={{ backgroundColor: '#3B82F6' }} />
            Get Started Today
          </span>

          {/* Heading */}
          <h2 id="cta-heading" className="relative z-10 text-[clamp(1.9rem,4.5vw,3rem)] font-black text-snow leading-[1.18] tracking-tight mb-5">
            Restore the Feedback Loop.
            <br />
            <span className="gradient-text">Transform Virtual Learning.</span>
          </h2>

          {/* Description */}
          <p id="cta-desc" className="relative z-10 text-[1.02rem] text-mist max-w-[520px] leading-[1.75] mb-10">
            Join thousands of educators bringing classroom energy back to virtual sessions — without sacrificing student privacy.
          </p>

          {/* Buttons */}
          <div id="cta-actions" className="relative z-10 flex gap-4 flex-wrap justify-center mb-10">
            <Link href="/login" id="cta-signup"
              className="inline-flex items-center gap-2.5 px-10 py-[18px] text-white text-[1rem] font-extrabold btn-primary rounded-full animate-pulse-glow">
              Login to Portal
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
            <button id="cta-demo"
              className="inline-flex items-center gap-2.5 px-9 py-[17px] text-[1rem] font-semibold btn-secondary rounded-full">
              Watch Demo
            </button>
          </div>

          {/* Trust */}
          <div id="cta-trust" className="relative z-10 flex items-center gap-8 flex-wrap justify-center">
            {['No credit card required', 'FERPA Compliant', 'Setup in 2 minutes'].map(label => (
              <div key={label} className="flex items-center gap-2 text-[0.8rem] font-medium text-mist">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                {label}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
