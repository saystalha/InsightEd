'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
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

  // Google Identity Services states & refs
  const googleInitializedRef = useRef(false);
  const googleBtnRef = useRef(null);
  const [googleStatus, setGoogleStatus] = useState('loading'); // 'loading' | 'ready' | 'error'

  const executeNavigationRoute = useCallback(
    (userObj) => {
      try {
        const storageEmail = userObj?.email || email;
        const storageRole = userObj?.role || 'student';
        const storageName =
          userObj?.name ||
          `${userObj?.firstName || ''} ${userObj?.lastName || ''}`.trim() ||
          'Portal User';

        localStorage.setItem('userEmail', storageEmail);
        localStorage.setItem('userRole', storageRole);
        localStorage.setItem('userName', storageName);

        localStorage.setItem('insighted_remember_me', rememberMe ? 'true' : 'false');
        if (!rememberMe) {
          sessionStorage.setItem('insighted_session_active', 'true');
        } else {
          sessionStorage.removeItem('insighted_session_active');
        }

        router.push('/dashboard');
      } catch (e) {
        console.warn('localStorage unavailable, falling back to hard redirect:', e);
        window.location.replace('/dashboard');
      }
    },
    [email, rememberMe, router]
  );

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

      executeNavigationRoute(data.user || data);
    } catch (err) {
      console.error('Login submit error:', err);
      setError('An error occurred during sign-in. Please check your connection and try again.');
      setLoading(false);
    }
  };

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

  const handleGoogleCredentialResponse = useCallback(
    async (response) => {
      if (!response?.credential) {
        setError('Google did not return a valid credential token.');
        return;
      }

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
          setError(data.error || 'Google account is not authorized. Contact your administrator.');
          setLoading(false);
          return;
        }

        executeNavigationRoute(data.user || data);
      } catch (err) {
        console.error('Google Sign-in error:', err);
        setError('A connection error occurred during Google login.');
        setLoading(false);
      }
    },
    [executeNavigationRoute]
  );

  const initGoogleSignIn = useCallback(() => {
    if (typeof window === 'undefined' || !window.google?.accounts?.id) {
      return false;
    }

    const container = googleBtnRef.current;
    if (!container) {
      return false;
    }

    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim();
    if (!clientId) {
      setGoogleStatus('error');
      setError('Google Client ID is missing. Add NEXT_PUBLIC_GOOGLE_CLIENT_ID to .env.local and restart the server.');
      return true;
    }

    try {
      if (!googleInitializedRef.current) {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleGoogleCredentialResponse,
        });
        googleInitializedRef.current = true;
      }

      if (container.childElementCount === 0) {
        window.google.accounts.id.renderButton(container, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text: 'continue_with',
          shape: 'pill',
          width: 360,
        });
      }

      setGoogleStatus('ready');
      return true;
    } catch (err) {
      console.error('Failed to render Google Sign-In button:', err);
      setGoogleStatus('error');
      return true;
    }
  }, [handleGoogleCredentialResponse]);

  useEffect(() => {
    if (initGoogleSignIn()) return;

    let attempts = 0;
    const interval = setInterval(() => {
      attempts += 1;
      if (initGoogleSignIn()) {
        clearInterval(interval);
      } else if (attempts >= 40) {
        clearInterval(interval);
        setGoogleStatus('error');
      }
    }, 150);

    return () => clearInterval(interval);
  }, [initGoogleSignIn]);

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

            {/* Google Sign-In Button Area */}
            <div className="w-full mb-6 flex flex-col items-center justify-center min-h-[46px]">
              {googleStatus === 'loading' && (
                <div className="w-full py-3 rounded-2xl font-semibold text-[0.85rem] flex items-center justify-center gap-2.5 border border-[rgba(59,130,246,0.18)] bg-[rgba(59,130,246,0.05)] text-mist">
                  <span className="w-4 h-4 border-2 border-blue-400/30 border-t-blue-500 rounded-full animate-spin" />
                  Loading Google Sign-In...
                </div>
              )}

              {googleStatus === 'error' && (
                <div className="w-full py-3 px-4 rounded-2xl text-[0.8rem] font-medium text-center border border-[rgba(59,130,246,0.2)] bg-[rgba(59,130,246,0.06)] text-mist">
                  Google Sign-In unavailable. Verify your Client ID or disable ad-blockers.
                </div>
              )}

              <div
                ref={googleBtnRef}
                className={`flex justify-center transition-opacity ${
                  googleStatus === 'ready' ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden'
                } ${loading ? 'pointer-events-none opacity-50' : ''}`}
              />
            </div>

            <div className="flex items-center gap-3 mb-5">
              <div className="flex-1 h-px bg-[rgba(59,130,246,0.14)]" />
              <span className="text-[0.74rem] text-mist font-medium">OR</span>
              <div className="flex-1 h-px bg-[rgba(59,130,246,0.14)]" />
            </div>

            {error && (
              <div className="mb-4 px-4 py-3 rounded-xl text-[0.83rem] font-semibold text-blue-500 bg-[rgba(59,130,246,0.1)] border border-[rgba(59,130,246,0.2)]">
                ⚠ {error}
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleManualValidationSubmit();
              }}
              className="flex flex-col gap-4"
            >
              {/* Input Field: Email */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="login-email" className="text-[0.82rem] font-semibold text-snow/70">
                  Email Address
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-snow/30">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                      <polyline points="22,6 12,13 2,6" />
                    </svg>
                  </span>
                  <input
                    id="login-email"
                    type="email"
                    placeholder="you@school.edu"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError('');
                      setLoading(false);
                    }}
                    className="neu-input w-full pl-11 pr-4 py-3.5 rounded-2xl text-[0.92rem] outline-none"
                  />
                </div>
              </div>

              {/* Input Field: Password */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="login-password" className="text-[0.82rem] font-semibold text-snow/70">
                    Password
                  </label>
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
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </span>
                  <input
                    id="login-password"
                    type={showPw ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError('');
                      setLoading(false);
                    }}
                    className="neu-input w-full pl-11 pr-12 py-3.5 rounded-2xl text-[0.92rem] outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-snow/30 hover:text-snow transition-colors z-10"
                  >
                    {showPw ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Checkbox */}
              <label htmlFor="login-remember" className="flex items-center gap-2 cursor-pointer -mt-1 select-none">
                <input
                  id="login-remember"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded cursor-pointer accent-copper"
                  style={{ accentColor: '#3B82F6' }}
                />
                <span className="text-[0.81rem] text-mist">Keep me signed in</span>
              </label>

              {/* Submit button */}
              <button
                type="submit"
                id="login-submit"
                disabled={loading}
                className="btn-primary w-full py-4 rounded-2xl font-extrabold text-[1rem] flex items-center justify-center gap-2.5 mt-1 disabled:opacity-60 disabled:cursor-not-allowed transition-all active:scale-95"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-[rgba(255,255,255,0.30)] border-t-white rounded-full animate-spin" />
                    Redirecting...
                  </>
                ) : (
                  <>
                    Sign In
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </>
                )}
              </button>
            </form>

            <p className="text-center text-[0.84rem] text-mist mt-6">
              Need access? Contact your administrator to request portal credentials.
            </p>
            <p className="text-center text-[0.72rem] text-mist/50 mt-3">🔒 Your data is never stored or transmitted</p>
          </div>

          <div className="flex justify-center mt-5">
            <span className="badge-copper flex items-center gap-2 text-[0.74rem] font-semibold px-4 py-2 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-copper animate-pulse" style={{ backgroundColor: '#3B82F6' }} />
              Privacy-First by Design
            </span>
          </div>
        </div>
      </div>

      {/* ── FORGOT PASSWORD MODAL ── */}
      {isForgotOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="fixed inset-0" onClick={() => setIsForgotOpen(false)} />
          <div className="relative card-navy rounded-[24px] max-w-[420px] w-full p-8 border border-[rgba(59,130,246,0.25)] shadow-2xl animate-modal-in z-10">
            <h3 className="text-[1.25rem] font-black text-snow mb-1">Recover Password</h3>
            <p className="text-[0.8rem] text-mist mb-6">
              Enter your registered email address below, and we will send you a secure link to reset your password.
            </p>

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
                <label htmlFor="forgot-email" className="text-[0.78rem] font-semibold text-snow/70">
                  Email Address
                </label>
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
                  {forgotLoading ? 'Sending...' : 'Send Recovery Link'}
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