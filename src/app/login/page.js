'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Script from 'next/script';

export default function LoginPage() {
  const router = useRouter();
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  // Forgot Password flow states
  const [isForgotOpen, setIsForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState('');
  const [forgotError, setForgotError] = useState('');

  // Google flow states
  const googleInitializedRef = useRef(false);

  /**
   * Configures local storage user metadata and routes the user to the dashboard.
   * Runs upon successful authentication.
   * 
   * @param {object} userObj - The user profile metadata returned by the login API
   */
  const executeNavigationRoute = (userObj) => {
    try {
      // SAFE BOUNDARY CHECK: Safeguards variables even if object properties names differ from server response
      const storageEmail = userObj?.email || email;
      const storageRole = userObj?.role || 'student';
      const storageName = userObj?.name || `${userObj?.firstName || ''} ${userObj?.lastName || ''}`.trim() || 'Portal User';

      localStorage.setItem('userEmail', storageEmail);
      localStorage.setItem('userRole', storageRole);
      localStorage.setItem('userName', storageName);
      
      // Store session-persistence flags to support Keep me signed in
      localStorage.setItem('insighted_remember_me', rememberMe ? 'true' : 'false');
      if (!rememberMe) {
        sessionStorage.setItem('insighted_session_active', 'true');
      } else {
        sessionStorage.removeItem('insighted_session_active');
      }
      
      console.log('🔄 LocalStorage configured. Launching dashboard routing pipelines...');
      
      // Preferred Next.js routing pathway
      router.push('/dashboard');
      
    } catch (e) {
      console.warn('localStorage is unavailable, executing hardware swap bypass:', e);
      window.location.replace('/dashboard');
    }
  };

  /**
   * Validates and submits the email/password form data to the server for authentication.
   * Sets local storage, cookie sessions, and triggers dashboard routing on success.
   */
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
          rememberMe,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Invalid email or password.');
        setLoading(false);
        return;
      }

      // We maintain the loading state active until routing navigation fully captures control
      executeNavigationRoute(data.user || data);
    } catch (err) {
      console.error('Login submit error:', err);
      setError('An error occurred during sign-in. Please check your connection and try again.');
      setLoading(false);
    }
  };

  /**
   * Submits a password recovery request for the specified email address.
   * Triggers a verification reset link email to be sent by the server.
   * 
   * @param {React.FormEvent} e - The form submission event
   */
  const handleForgotPasswordSubmit = async (e) => {
    e.preventDefault();
    setForgotError('');
    setForgotSuccess('');
    if (!forgotEmail.trim()) {
      setForgotError('Please enter your email address.');
      return;
    }
    setForgotLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setForgotError(data.error || 'Failed to request password reset.');
        return;
      }
      setForgotSuccess(data.message || 'Verification link sent to email!');
      setForgotEmail('');
    } catch (err) {
      console.error(err);
      setForgotError('A connection error occurred. Please try again.');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleGoogleCredentialResponse = async (response) => {
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: response.credential }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to authenticate with Google.');
        setLoading(false);
        return;
      }

      executeNavigationRoute(data.user);

    } catch (err) {
      console.error('Google Sign-in error:', err);
      setError('A connection error occurred during Google login.');
      setLoading(false);
    }
  };

  const initGoogleSignIn = () => {
    if (typeof window !== 'undefined' && window.google) {
      if (googleInitializedRef.current) {
        console.log("ℹ️ Google Sign-In already initialized.");
        return;
      }
      
      console.log("🔑 Initializing Google Sign-In SDK...");
      window.google.accounts.id.initialize({
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '338421886576-9d6uph4p72kdtff1oag6kqq5uopm42l2.apps.googleusercontent.com',
        callback: handleGoogleCredentialResponse,
      });

      const btnParent = document.getElementById('google-signin-btn-container');
      if (btnParent) {
        window.google.accounts.id.renderButton(btnParent, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text: 'continue_with',
          shape: 'pill',
          width: 382,
        });
        console.log("🎯 Google Sign-In button successfully rendered in container.");
        googleInitializedRef.current = true;
      } else {
        console.warn("⚠️ google-signin-btn-container not found in DOM yet. Retrying in 100ms...");
        setTimeout(initGoogleSignIn, 100);
      }
    } else {
      console.warn("⚠️ window.google is not available yet.");
    }
  };

  const handleGoogleLoginClick = () => {
    setLoading(true);
    setError('');
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '338421886576-9d6uph4p72kdtff1oag6kqq5uopm42l2.apps.googleusercontent.com';
    const redirectUri = typeof window !== 'undefined' ? `${window.location.origin}/login` : '';
    const nonce = Math.random().toString(36).substring(2);
    
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${clientId}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&response_type=id_token` +
      `&scope=openid%20email%20profile` +
      `&nonce=${nonce}`;
      
    window.location.href = googleAuthUrl;
  };

  useEffect(() => {
    // Check if redirect has returned an ID Token in URL hash
    if (typeof window !== 'undefined' && window.location.hash) {
      const hash = window.location.hash.substring(1);
      const params = new URLSearchParams(hash);
      const idToken = params.get('id_token');
      if (idToken) {
        // Clear URL hash immediately for visual cleanliness
        window.history.replaceState(null, null, window.location.pathname);
        handleGoogleCredentialResponse({ credential: idToken });
      }
    }

    // Poll for window.google to ensure we initialize even if onLoad doesn't fire
    const interval = setInterval(() => {
      if (typeof window !== 'undefined' && window.google) {
        initGoogleSignIn();
        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <Navbar />

      <div className="min-h-screen flex items-center justify-center p-4 pt-24 relative overflow-hidden hero-bg">
        
        {/* Background Decorative Layer Glow Orbs */}
        <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full pointer-events-none orb-navy" />
        <div className="absolute -bottom-24 -left-24 w-[400px] h-[400px] rounded-full pointer-events-none orb-navy" />

        <div className="relative z-10 w-full max-w-[460px]">
          <div className="card-navy rounded-[28px] p-9">
            <h1 className="text-[1.8rem] font-black text-snow mb-1">Welcome back</h1>
            <p className="text-[0.88rem] text-mist mb-7">Sign in to your classroom dashboard</p>

            {/* Google Access button */}
            <button
              type="button"
              onClick={handleGoogleLoginClick}
              disabled={loading}
              className="w-full py-3.5 rounded-2xl font-bold text-[0.88rem] flex items-center justify-center gap-3 border border-[rgba(59,130,246,0.18)] bg-[rgba(59,130,246,0.06)] hover:bg-[rgba(59,130,246,0.12)] text-snow transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed mb-6"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" className="shrink-0">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              Continue with Google
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="flex-1 h-px bg-[rgba(59, 130, 246,0.14)]" />
              <span className="text-[0.74rem] text-mist font-medium">OR</span>
              <div className="flex-1 h-px bg-[rgba(59, 130, 246,0.14)]" />
            </div>

            {error && (
              <div className="mb-4 px-4 py-3 rounded-xl text-[0.83rem] font-semibold text-blue-500 bg-[rgba(59, 130, 246,0.1)] border border-[rgba(59, 130, 246,0.2)]">
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
                    onChange={e => { setEmail(e.target.value); setError(''); setLoading(false); }}
                    className="neu-input w-full pl-11 pr-4 py-3.5 rounded-2xl text-[0.92rem] outline-none"
                  />
                </div>
              </div>

              {/* Input Field: Password */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="login-password" className="text-[0.82rem] font-semibold text-snow/70">Password</label>
                  <button
                    type="button"
                    onClick={() => {
                      setForgotError('');
                      setForgotSuccess('');
                      setForgotEmail('');
                      setIsForgotOpen(true);
                    }}
                    className="text-[0.76rem] text-snow/40 hover:text-snow transition-colors"
                  >
                    Forgot password?
                  </button>
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
                    onChange={e => { setPassword(e.target.value); setError(''); setLoading(false); }}
                    className="neu-input w-full pl-11 pr-12 py-3.5 rounded-2xl text-[0.92rem] outline-none"
                  />
                  <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-4 top-1/2 -translate-y-1/2 text-snow/30 hover:text-snow transition-colors z-10">
                    {showPw
                      ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                      : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                    }
                  </button>
                </div>
              </div>

              {/* Checkbox */}
              <label htmlFor="login-remember" className="flex items-center gap-2 cursor-pointer -mt-1 select-none">
                <input 
                  id="login-remember" 
                  type="checkbox" 
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded cursor-pointer accent-copper" 
                  style={{ accentColor: '#3B82F6' }} 
                />
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
                  <><span className="w-4 h-4 border-2 border-[rgba(255,255,255,0.30)] border-t-white rounded-full animate-spin" /> Redirecting...</>
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
              <span className="w-1.5 h-1.5 rounded-full bg-copper animate-pulse" style={{ backgroundColor: "#3B82F6" }} />
              Privacy-First by Design
            </span>
          </div>
        </div>
      </div>

      {/* ── FORGOT PASSWORD MODAL ─────────────────── */}
      {isForgotOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="fixed inset-0" onClick={() => setIsForgotOpen(false)} />
          <div className="relative card-navy rounded-[24px] max-w-[420px] w-full p-8 border border-[rgba(59, 130, 246,0.25)] shadow-2xl animate-modal-in z-10">
            <h3 className="text-[1.25rem] font-black text-snow mb-1">Recover Password</h3>
            <p className="text-[0.8rem] text-mist mb-6">Enter your registered email address below, and we will send you a secure link to reset your password.</p>
            
            {forgotSuccess && (
              <div className="mb-4 px-4 py-3 rounded-xl text-[0.82rem] font-semibold text-blue-500 bg-[rgba(59,130,246,0.10)] border border-[rgba(59,130,246,0.20)]">
                ✓ {forgotSuccess}
              </div>
            )}
            {forgotError && (
              <div className="mb-4 px-4 py-3 rounded-xl text-[0.82rem] font-semibold text-red-400 bg-red-500/10 border border-red-500/20">
                ⚠ {forgotError}
              </div>
            )}

            <form onSubmit={handleForgotPasswordSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="forgot-email" className="text-[0.78rem] font-semibold text-snow/70">Email Address</label>
                <input
                  id="forgot-email"
                  type="email"
                  required
                  placeholder="name@school.edu"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  className="neu-input px-4 py-2.5 rounded-xl text-[0.88rem] outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => setIsForgotOpen(false)}
                  className="px-5 py-2.5 rounded-xl text-[0.85rem] font-bold text-mist hover:text-snow hover:bg-black/5 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="btn-primary px-5 py-2.5 rounded-xl text-[0.85rem] font-bold disabled:opacity-50"
                >
                  {forgotLoading ? "Sending..." : "Send Recovery Link"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <Script 
        src="https://accounts.google.com/gsi/client" 
        onLoad={initGoogleSignIn}
        strategy="afterInteractive"
      />
    </>
  );
}