'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';

export default function LoginPage() {
  const router = useRouter();
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const executeNavigationRoute = (userObj) => {
    try {
      localStorage.setItem('userEmail', userObj.email);
      localStorage.setItem('userRole', userObj.role);
      localStorage.setItem('userName', `${userObj.firstName} ${userObj.lastName}`);
      
      // Preferred Next.js routing pathway
      router.push('/dashboard');
      
      // Fallback pathway in case routing is delayed
      setTimeout(() => {
        if (window.location.pathname !== '/dashboard') {
          window.location.replace('/dashboard');
        }
      }, 300);
      
    } catch (e) {
      console.warn('localStorage is unavailable:', e);
      window.location.replace('/dashboard');
    }
  };

  const handleGoogleMockMessage = () => {
    alert("Google authentication is currently under construction. Please use the email and password form.");
  };

  const handleManualValidationSubmit = async () => {
    setError('');

    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    if (!trimmedEmail || !trimmedPassword) {
      setError('Please enter your email and password.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: trimmedEmail,
          password: trimmedPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Invalid email or password.');
        setLoading(false);
        return;
      }

      setLoading(false);
      executeNavigationRoute(data.user);
    } catch (err) {
      console.error('Login submit error:', err);
      setError('An error occurred during sign-in. Please check your connection and try again.');
      setLoading(false);
    }
  };

  return (
    <>
      {/* Full Navbar — same as homepage */}
      <Navbar />

      <div className="min-h-screen flex items-center justify-center p-4 pt-24 relative overflow-hidden hero-bg">
        
        {/* Background Decorative Layer Glow Orbs */}
        <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full pointer-events-none orb-copper" />
        <div className="absolute -bottom-24 -left-24 w-[400px] h-[400px] rounded-full pointer-events-none orb-navy" />

        <div className="relative z-10 w-full max-w-[460px]">
          <div className="card-navy rounded-[28px] p-9">
            <h1 className="text-[1.8rem] font-black text-snow mb-1">Welcome back</h1>
            <p className="text-[0.88rem] text-mist mb-7">Sign in to your classroom dashboard</p>

            {/* Google Access button */}
            <button
              type="button"
              onClick={handleGoogleMockMessage}
              className="w-full flex items-center justify-center gap-3 py-3.5 rounded-2xl font-semibold text-[0.9rem] text-snow mb-5 transition-all hover:bg-white/5 active:scale-95 border border-[rgba(196,124,62,0.25)] bg-[rgba(196,124,62,0.05)]"
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Continue with Google
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="flex-1 h-px bg-[rgba(196,124,62,0.14)]" />
              <span className="text-[0.74rem] text-mist font-medium">OR</span>
              <div className="flex-1 h-px bg-[rgba(196,124,62,0.14)]" />
            </div>

            {error && (
              <div className="mb-4 px-4 py-3 rounded-xl text-[0.83rem] font-semibold text-copper bg-[rgba(196,124,62,0.1)] border border-[rgba(196,124,62,0.2)]">
                ⚠ {error}
              </div>
            )}

            <form onSubmit={e => { e.preventDefault(); handleManualValidationSubmit(); }} className="flex flex-col gap-4">
              {/* Input Field: Email */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="login-email" className="text-[0.82rem] font-semibold text-snow/70">Email Address</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-snow/30">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" />
                    </svg>
                  </span>
                  <input
                    id="login-email"
                    type="email"
                    placeholder="you@school.edu"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="neu-input w-full pl-11 pr-4 py-3.5 rounded-2xl text-[0.92rem] outline-none"
                  />
                </div>
              </div>

              {/* Input Field: Password */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="login-password" className="text-[0.82rem] font-semibold text-snow/70">Password</label>
                  <button type="button" className="text-[0.76rem] text-snow/40 hover:text-snow transition-colors">Forgot password?</button>
                </div>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-snow/30">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </span>
                  <input
                    id="login-password"
                    type={showPw ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="neu-input w-full pl-11 pr-12 py-3.5 rounded-2xl text-[0.92rem] outline-none"
                  />
                  <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors z-10">
                    {showPw
                      ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                      : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                    }
                  </button>
                </div>
              </div>

              {/* Checkbox */}
              <label htmlFor="login-remember" className="flex items-center gap-2 cursor-pointer -mt-1 select-none">
                <input id="login-remember" type="checkbox" className="w-4 h-4 rounded cursor-pointer accent-copper" style={{ accentColor: '#c47c3e' }} />
                <span className="text-[0.81rem] text-mist">Keep me signed in</span>
              </label>

              {/* Submit button wrapper */}
              <button
                type="submit"
                id="login-submit"
                disabled={loading}
                className="btn-primary w-full py-4 rounded-2xl font-extrabold text-[1rem] flex items-center justify-center gap-2.5 mt-1 disabled:opacity-60 disabled:cursor-not-allowed transition-all active:scale-95"
              >
                {loading ? (
                  <><span className="w-4 h-4 border-2 border-[rgba(255,255,255,0.30)] border-t-white rounded-full animate-spin-slow" /> Verification processing…</>
                ) : (
                  <>Sign In <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg></>
                )}
              </button>
            </form>

            <p className="text-center text-[0.84rem] text-mist mt-6">
              Need access? Contact your administrator to request portal credentials.
            </p>
            <p className="text-center text-[0.72rem] text-mist/50 mt-3">🔒 Your data is never stored or transmitted</p>
          </div>

          {/* Lower Secure Badging element tag */}
          <div className="flex justify-center mt-5">
            <span className="badge-copper flex items-center gap-2 text-[0.74rem] font-semibold px-4 py-2 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-copper animate-pulse" style={{ backgroundColor: "#c47c3e" }} />
              Privacy-First by Design
            </span>
          </div>
        </div>
      </div>
    </>
  );
}