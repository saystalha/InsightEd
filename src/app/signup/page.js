'use client';

import Link from 'next/link';
import Navbar from '@/components/Navbar';

export default function SignupPage() {
  return (
    <>
      <Navbar />

      <div className="min-h-screen flex items-center justify-center p-4 pt-24 pb-10 relative overflow-hidden hero-bg">
        {/* Dark background graphic orbs */}
        <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full pointer-events-none orb-copper" />
        <div className="absolute -bottom-24 -left-24 w-[400px] h-[400px] rounded-full pointer-events-none orb-navy" />

        <div className="relative z-10 w-full max-w-[500px]">
          {/* Card Container */}
          <div className="card-navy rounded-[28px] p-9 text-center border border-[rgba(196,124,62,0.22)] flex flex-col items-center">
            {/* Lock/Security Graphic */}
            <div 
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-[#c47c3e] mb-6 animate-pulse"
              style={{
                background: 'rgba(196,124,62,0.10)',
                border: '1.5px solid rgba(196,124,62,0.30)',
              }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>

            <h1 className="text-[1.6rem] font-black text-snow mb-3">
              Centralized IT Provisioning
            </h1>
            <p className="text-[0.92rem] text-mist leading-[1.65] mb-8">
              Public user registration is disabled for InsightEd. To maintain academic integrity, teacher credentials and student academic accounts are provisioned directly by the system administrator.
            </p>

            <div className="w-full p-4 rounded-xl bg-white/[0.02] border border-[rgba(196,124,62,0.12)] mb-8 text-[0.82rem] text-mist text-left flex items-start gap-3">
              <span className="text-[#c47c3e] mt-0.5">ℹ</span>
              <span>
                Please contact your institution&apos;s Academic Coordinator or IT Helpdesk to request your portal login credentials.
              </span>
            </div>

            {/* Back to login trigger */}
            <Link 
              href="/login" 
              className="btn-primary w-full py-4 rounded-2xl font-extrabold text-[0.95rem] flex items-center justify-center gap-2.5 transition-all"
            >
              Go to Sign In
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          {/* Lower Secure Badging element tag */}
          <div className="flex justify-center mt-5">
            <span className="badge-copper flex items-center gap-2 text-[0.74rem] font-semibold px-4 py-2 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-copper" style={{ backgroundColor: "#c47c3e" }} />
              Authorized IT Provisioning Portal
            </span>
          </div>
        </div>
      </div>
    </>
  );
}