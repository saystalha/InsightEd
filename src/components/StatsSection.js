'use client';

import { useState } from 'react';

const FAQS = [
  {
    id: 'faq-1',
    question: "How does InsightEd analyze engagement without recording video?",
    answer: "InsightEd utilizes TensorFlow.js models that execute entirely within the client's local browser memory. It processes live frames to map vector data landmarks for eye movement and micro-expressions, then immediately discards the frame. No video streams or face prints are ever saved or uploaded."
  },
  {
    id: 'faq-2',
    question: "What exactly is transmitted to the instructor dashboard?",
    answer: "Only an anonymized, numeric text payload string (containing the calculated aggregate Class Fatigue Index metric) is securely broadcasted via WebSockets. The instructor sees an overall classroom attention graph, ensuring individual student privacy remains completely intact."
  },
  {
    id: 'faq-3',
    question: "Will running real-time AI models slow down weak machines or laptops?",
    answer: "No, our architecture is heavily optimized. By utilizing WebGL hardware acceleration via custom client-side hooks, model processing latency takes up minimal CPU overhead—making it completely seamless even on standard student Chromebooks."
  },
  {
    id: 'faq-4',
    question: "Does this require complex software integrations or extensions?",
    answer: "Not at all. InsightEd is designed to run natively out-of-the-box on standard, modern WebRTC browsers (Chrome, Edge, Safari, Firefox). Students simply click your invite link or paste an 8-digit session code to connect securely."
  }
];

export default function FaqsSection() {
  const [openId, setOpenId] = useState(null);

  const toggleFaq = (id) => {
    setOpenId(openId === id ? null : id);
  };

  return (
    <section
      id="faq"
      className="relative py-24 overflow-hidden"
      style={{ background: '#152038' }}
    >
      {/* Premium Copper Ambient Background Layer */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(circle at 50% 50%, rgba(196,124,62,0.06) 0%, transparent 70%)' }} />
      
      {/* Top & bottom subtle accent partition lines */}
      <div className="absolute top-0 left-0 right-0 h-px bg-white/5" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-white/5" />

      <div className="relative z-10 max-w-4xl mx-auto px-6">
        
        {/* Section Header Block */}
        <div className="text-center mb-16 flex flex-col items-center animate-fadeUp">
          <span className="badge-copper inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-bold tracking-widest uppercase mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-copper animate-pulse" style={{ backgroundColor: '#c47c3e' }} />
            Common Inquiries
          </span>
          <h2 className="text-[clamp(1.8rem,4vw,2.5rem)] font-black text-snow leading-tight tracking-tight mb-4">
            Frequently Asked <span className="gradient-text-shimmer">Questions</span>
          </h2>
          <p className="text-sm text-mist max-w-[480px] mx-auto leading-relaxed">
            Everything you need to know about our localized processing architecture, data privacy configurations, and deployment.
          </p>
        </div>

        {/* ── Interactive Accordion Framework List ── */}
        <div className="flex flex-col gap-3.5 max-w-3xl mx-auto animate-fadeUp [animation-delay:100ms]">
          {FAQS.map((faq) => {
            const isOpen = openId === faq.id;
            return (
              <div
                key={faq.id}
                className={`rounded-2xl transition-all duration-300 border ${
                  isOpen 
                    ? 'bg-[#1e3050] border-[rgba(196,124,62,0.30)] shadow-[0_12px_30px_rgba(10,14,22,0.25)]' 
                    : 'card-navy border-white/5 hover:border-white/10 hover:bg-[#243452]/20'
                }`}
              >
                {/* Accordion Toggle Header Trigger Button */}
                <button
                  type="button"
                  onClick={() => toggleFaq(faq.id)}
                  className="w-full flex items-center justify-between text-left px-6 py-5 gap-4 group"
                >
                  <span className={`text-[0.95rem] font-bold tracking-tight transition-colors duration-200 ${isOpen ? 'text-copper-lt' : 'text-snow group-hover:text-white'}`}>
                    {faq.question}
                  </span>
                  
                  {/* Plus / Minus interactive vector indicator */}
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center border transition-all duration-300 flex-shrink-0 ${
                    isOpen ? 'border-copper bg-copper text-white rotate-180' : 'border-white/10 bg-white/5 text-mist group-hover:text-white'
                  }`}>
                    {isOpen ? (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    ) : (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    )}
                  </div>
                </button>

                {/* Smooth Dropdown Dynamic Content wrapper */}
                <div 
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    isOpen ? 'max-h-[200px] opacity-100' : 'max-h-0 opacity-0 pointer-events-none'
                  }`}
                >
                  <div className="px-6 pb-5 text-xs sm:text-sm text-mist/90 leading-relaxed text-justify border-t border-white/5 pt-3">
                    {faq.answer}
                  </div>
                </div>

              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}