import React from 'react';

const STEPS = [
  {
    id: 'step-analyze',
    num: '01',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
      </svg>
    ),
    title: 'Capture & Analyze',
    description: "Student webcams are accessed strictly within local client browser threads. TensorFlow.js models map facial micro-expressions directly via hardware acceleration — zero raw media streams leave the device.",
    tags: ['TensorFlow.js', 'WebGL Thread', 'Local Only'],
    isActive: true, // Highlights the pipeline initiation card
  },
  {
    id: 'step-compute',
    num: '02',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/><polyline points="8 10 11 13 16 8"/>
      </svg>
    ),
    title: 'Compute Fatigue Index',
    description: 'Calculated attention vectors are processed into anonymous, lightweight telemetry payloads. Only encrypted, pure numeric JSON data parameters are broadcast over the secure server socket connection.',
    tags: ['Edge Telemetry', 'JSON API', 'Anonymized'],
    isActive: false,
  },
  {
    id: 'step-alert',
    num: '03',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
      </svg>
    ),
    title: 'Trigger Break Alert',
    description: 'When aggregate focus indices drop below the configured threshold, real-time alert notifications sync instantly onto the instructor dashboard UI to restore the classroom interaction loop.',
    tags: ['Break Alert', 'Instructor Deck', 'Real-Time'],
    isActive: false,
  },
];

export default function HowItWorksSection() {
  return (
    <section id="how-it-works" className="relative py-24 hiw-bg overflow-hidden">
      
      {/* Sleek top/bottom divider rules */}
      <div className="absolute top-0 left-0 right-0 h-px bg-white/5" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-white/5" />

      <div className="relative z-10 max-w-6xl mx-auto px-6">

        {/* Section Header */}
        <div className="text-center mb-16 flex flex-col items-center">
          <span className="badge-copper inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-bold tracking-widest uppercase mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-copper animate-pulse" style={{ backgroundColor: '#c47c3e' }} />
            Pipeline Framework
          </span>
          <h2 className="text-[clamp(1.8rem,4vw,2.6rem)] font-black text-snow leading-tight tracking-tight mb-4">
            Three Steps to Restore <br />
            <span className="gradient-text-shimmer">Classroom Connection</span>
          </h2>
          <p className="text-sm sm:text-base text-mist max-w-[500px] mx-auto leading-relaxed">
            A high-performance pipeline running processing loops from local on-device metrics straight to instructional tools.
          </p>
        </div>

        {/* Steps Grid System */}
        <div className="flex flex-col lg:flex-row items-stretch gap-3">
          {STEPS.map((step, i) => (
            <React.Fragment key={step.id}>
              
              {/* Card Container Element */}
              <div className="flex-1 flex flex-col relative group">
                <article
                  id={step.id}
                  className={`flex-1 rounded-[24px] p-7 transition-all duration-400 relative overflow-hidden border ${
                    step.isActive 
                      ? 'bg-gradient-to-br from-[#1e3050] to-[#152038] border-[rgba(196,124,62,0.35)] shadow-[0_20px_50px_rgba(196,124,62,0.1)]' 
                      : 'card-navy border-white/5 hover:border-[rgba(196,124,62,0.22)] hover:bg-[#243452]/40'
                  }`}
                >
                  
                  {/* Premium Translucent Monospace Background Numbers */}
                  <span className="absolute -top-4 -right-2 text-[6.5rem] font-mono font-black select-none pointer-events-none text-white/[0.02] tracking-tighter group-hover:text-white/[0.04] transition-colors duration-400">
                    {step.num}
                  </span>

                  {/* Card Header Info */}
                  <div className="flex items-center justify-between mb-6 relative z-10">
                    <div 
                      className={`w-11 h-11 rounded-xl flex items-center justify-center transition-transform duration-400 group-hover:scale-105 border ${
                        step.isActive
                          ? 'bg-gradient-to-br from-[#c47c3e] to-[#8c5828] text-white border-white/10'
                          : 'bg-[#152038] text-copper border-white/5'
                      }`}
                    >
                      {step.icon}
                    </div>
                    
                    <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-white/20">
                      Phase {step.num}
                    </span>
                  </div>

                  {/* Card Content Elements */}
                  <div className="relative z-10 flex flex-col justify-between h-[calc(100%-68px)]">
                    <div>
                      <h3 className="text-base font-black text-white tracking-tight mb-2.5 group-hover:text-copper-lt transition-colors">
                        {step.title}
                      </h3>
                      <p className="text-xs text-mist leading-[1.65] mb-5 text-justify">
                        {step.description}
                      </p>
                    </div>

                    {/* Meta Tags Layer Mapping array */}
                    <div className="flex flex-wrap gap-1.5 mt-auto">
                      {step.tags.map(tag => (
                        <span 
                          key={tag} 
                          className={`px-2.5 py-1 text-[9px] font-bold tracking-wider uppercase rounded-md ${
                            step.isActive
                              ? 'bg-white/10 text-white border border-white/5'
                              : 'bg-black/20 text-white/40 border border-white/5'
                          }`}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                </article>
              </div>

              {/* Clean Tech Timeline Connective Bridges (Hidden on mobile/tablet) */}
              {i < STEPS.length - 1 && (
                <div className="hidden lg:flex items-center justify-center flex-shrink-0 opacity-25 pointer-events-none select-none px-1">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#c47c3e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                    <polyline points="12 5 19 12 12 19"></polyline>
                  </svg>
                </div>
              )}

            </React.Fragment>
          ))}
        </div>
      </div>
    </section>
  );
}