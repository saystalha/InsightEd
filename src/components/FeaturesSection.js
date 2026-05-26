"use client";

const FEATURES = [
  {
    id: "feature-local-ai",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2L2 7l10 5 10-5-10-5z" />
        <path d="M2 17l10 5 10-5" />
        <path d="M2 12l10 5 10-5" />
      </svg>
    ),
    tag: "Local Processing",
    title: "On-Device AI Analysis",
    description: "TensorFlow.js execution threads run client-side inside native hardware browser cycles. Webcam input frames are isolated locally — bypassing cloud latency overhead entirely.",
    metric: "100%",
    metricLabel: "Local Computing",
    isAccent: false,
  },
  {
    id: "feature-privacy",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="M9 12l2 2 4-4" />
      </svg>
    ),
    tag: "Privacy First",
    title: "Zero Biometric Upload",
    description: "Biometric node coordinates and face maps remain completely anonymous. Only a lightweight cryptographic telemetry JSON matrix packet is transmitted across sync sockets.",
    metric: "0 Bytes",
    metricLabel: "Cloud Video Transfers",
    isAccent: true, // Accents the middle card to break visual monotony
  },
  {
    id: "feature-fatigue",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
        <path d="M12 18v-2" />
      </svg>
    ),
    tag: "Smart Alerting",
    title: "Class Fatigue Index™",
    description: "An aggregate attention density score calculates attention data in real-time. Direct instructor micro-dashboard alerts trigger immediately when focus metrics fall below thresholds.",
    metric: "<2s",
    metricLabel: "Network Alert Latency",
    isAccent: false,
  },
];

export default function FeaturesSection() {
  return (
    <section id="features" className="relative py-16 overflow-hidden features-bg">
      
      {/* Ambient background glows */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 55% 40% at 15% 50%, rgba(196,124,62,0.08) 0%, transparent 60%), radial-gradient(ellipse 50% 35% at 85% 60%, rgba(36,52,82,0.40) 0%, transparent 60%)",
        }}
      />
      <div className="absolute top-0 left-0 right-0 h-px bg-white/5" />

      <div className="relative z-10 max-w-6xl mx-auto px-6">
        
        {/* ── Header Block (Compressed vertical parameters to prevent element overflow) ── */}
        <div className="text-center mb-10 flex flex-col items-center">
          <span className="badge-copper inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-bold tracking-widest uppercase mb-3.5">
            <span className="w-1.5 h-1.5 rounded-full bg-copper animate-pulse" style={{ backgroundColor: "#c47c3e" }} />
            Core Technology
          </span>
          <h2 className="text-[clamp(1.8rem,4vw,2.5rem)] font-black text-snow leading-tight tracking-tight mb-3">
            The Faceless <span className="gradient-text-shimmer">Feedback Loop</span>
          </h2>
          <p className="text-xs sm:text-sm text-mist max-w-[500px] mx-auto leading-relaxed">
            Three pillars of privacy-preserving engagement intelligence that work silently behind every virtual lecture.
          </p>
        </div>

        {/* ── Feature Cards Row ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch">
          {FEATURES.map((f) => (
            <article
              key={f.id}
              id={f.id}
              className={`relative flex flex-col p-6 sm:p-7 rounded-[22px] overflow-hidden group transition-all duration-300 border ${
                f.isAccent
                  ? "bg-gradient-to-br from-[#1e3050] to-[#152038] border-[rgba(196,124,62,0.35)] shadow-[0_20px_50px_rgba(196,124,62,0.1)] -translate-y-1 md:-translate-y-2"
                  : "card-navy border-white/5 hover:border-[rgba(196,124,62,0.22)] hover:bg-[#243452]/40"
              }`}
            >
              {/* Decorative Subtle Hover Glow Orb */}
              <div
                className="absolute -top-10 -right-10 w-32 h-32 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                style={{
                  background: "radial-gradient(circle, rgba(196,124,62,0.15) 0%, transparent 70%)",
                }}
              />

              {/* Icon Container block */}
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center border mb-4 transition-transform duration-300 group-hover:scale-105 ${
                  f.isAccent
                    ? "bg-gradient-to-br from-[#c47c3e] to-[#8c5828] text-white border-white/10"
                    : "bg-[#152038] text-copper border-white/5"
                }`}
              >
                {f.icon}
              </div>

              {/* Tag Label */}
              <span className={`inline-block px-2.5 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider mb-3 self-start border ${
                f.isAccent
                  ? "bg-white/10 text-white border-white/10"
                  : "badge-copper"
              }`}>
                {f.tag}
              </span>

              {/* Title and Narrative Description */}
              <h3 className="text-base font-black text-white mb-2 leading-snug tracking-tight">
                {f.title}
              </h3>
              <p className="text-xs text-mist leading-relaxed flex-1 mb-5 text-justify">
                {f.description}
              </p>

              {/* Enhanced Micro Metric Slate Block */}
              <div
                className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl mb-4 border"
                style={{
                  background: "rgba(15, 24, 36, 0.25)",
                  borderColor: "rgba(255, 255, 255, 0.04)",
                }}
              >
                <span className="text-base font-black text-white leading-none tracking-tight">
                  {f.metric}
                </span>
                <span className="text-[10px] text-mist/60 font-bold uppercase tracking-wide">
                  {f.metricLabel}
                </span>
              </div>

              {/* Bottom Action Rule Link */}
              <div className="border-t pt-3.5 border-white/5 mt-auto">
                <span className="text-xs font-bold transition-colors cursor-pointer text-mist group-hover:text-copper-lt">
                  Learn configuration details →
                </span>
              </div>
            </article>
          ))}
        </div>

      </div>
    </section>
  );
}