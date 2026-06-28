'use client';

import { useState } from 'react';



const EyeIcon = ({ open }) =>
  open ? (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  ) : (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  );

function InputField({ id, label, type = 'text', placeholder, autoComplete, icon, showToggle, showValue, onToggle }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label htmlFor={id} className="text-[0.82rem] font-semibold text-snow/70 tracking-[0.02em]">{label}</label>}
      <div className="relative flex items-center">
        {icon && <span className="absolute left-4 text-snow/30 pointer-events-none">{icon}</span>}
        <input
          id={id}
          type={showToggle ? (showValue ? 'text' : 'password') : type}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required
          className={`neu-input w-full ${icon ? 'pl-11' : 'pl-4'} ${showToggle ? 'pr-11' : 'pr-4'} py-3.5 rounded-2xl text-[0.92rem] outline-none`}
        />
        {showToggle && (
          <button
            type="button"
            onClick={onToggle}
            className="absolute right-4 text-snow/30 hover:text-snow transition-colors"
            aria-label="Toggle password visibility"
          >
            <EyeIcon open={showValue} />
          </button>
        )}
      </div>
    </div>
  );
}

const MailIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
    <polyline points="22,6 12,13 2,6"/>
  </svg>
);

const LockIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);

const UserIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);

const ShieldIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    <path d="M9 12l2 2 4-4"/>
  </svg>
);

export default function AuthModal({ type, onClose, onSwitch }) {
  const [showPw, setShowPw] = useState(false);
  const [showPw2, setShowPw2] = useState(false);
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState('teacher');

  const isLogin = type === 'login';

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      try {
        localStorage.setItem('userEmail', isLogin ? 'john.doe@example.com' : 'new.user@example.com');
        localStorage.setItem('userRole', role);
      } catch (err) {
        console.warn('localStorage is blocked or unavailable:', err);
      }
      window.location.href = '/dashboard';
    }, 1200);
  };

  const handleGoogleClick = () => {
    try {
      localStorage.setItem('userEmail', 'john.doe@example.com');
      localStorage.setItem('userRole', 'teacher');
    } catch (err) {
      console.warn('localStorage is blocked or unavailable:', err);
    }
    window.location.href = '/dashboard';
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-label={isLogin ? 'Login dialog' : 'Sign up dialog'}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[rgba(255, 255, 255,0.60)] backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        className="relative z-10 w-full max-w-[460px] rounded-[28px] p-9 shadow-[0_24px_64px_rgba(0,0,0,0.45)] animate-modal-in overflow-hidden max-h-[90vh] overflow-y-auto card-navy"
      >
        {/* Top glow */}
        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(59, 130, 246,0.18) 0%, transparent 70%)' }} aria-hidden="true" />

        {/* Close */}
        <button
          onClick={onClose}
          id="modal-close"
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full text-snow/40 hover:text-snow hover:bg-black/5 transition-all"
          aria-label="Close"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>

        <div className="flex items-center gap-2.5 mb-6 relative z-10">
          <div className="w-9 h-9 rounded-[10px] flex items-center justify-center overflow-hidden" style={{ border: '1.5px solid rgba(59, 130, 246, 0.28)' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.jpeg" alt="InsightEd Logo" className="w-full h-full object-cover" />
          </div>
          <span className="text-snow font-bold text-[1.05rem]">
            <span style={{ color: '#3B82F6' }}>IN</span>sightEd
          </span>
        </div>

        <div className="relative z-10">
          <h2 id={isLogin ? 'login-heading' : 'signup-heading'} className="text-[1.7rem] font-extrabold text-snow mb-1.5 tracking-[-0.02em]">
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h2>
          <p className="text-[0.88rem] text-mist mb-6">
            {isLogin ? 'Sign in to your classroom dashboard' : 'Start restoring classroom engagement today'}
          </p>

          {/* Role Selector (signup only) */}
          {!isLogin && (
            <div className="flex gap-2 mb-5 p-1 rounded-2xl bg-[rgba(255, 255, 255,0.60)] border border-[rgba(59, 130, 246,0.22)]" id="signup-role">
              {['teacher', 'student'].map(r => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  id={`signup-role-${r}`}
                  className="flex-1 py-2.5 text-[0.85rem] font-semibold rounded-xl capitalize transition-all"
                  style={{
                    background: role === r ? 'rgba(59, 130, 246,0.20)' : 'transparent',
                    color: role === r ? '#111827' : 'rgba(17, 24, 39,0.40)',
                    border: role === r ? '1.5px solid rgba(59, 130, 246,0.35)' : '1.5px solid transparent',
                  }}
                >
                  {r === 'teacher' ? '👩‍🏫 Teacher' : '🎓 Student'}
                </button>
              ))}
            </div>
          )}

          {/* Form */}
          <form id={isLogin ? 'login-form' : 'signup-form'} onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
            {/* Name row for signup */}
            {!isLogin && (
              <div className="grid grid-cols-2 gap-3">
                <InputField id="signup-firstname" label="First Name" placeholder="Jane" autoComplete="given-name" icon={<UserIcon />} />
                <InputField id="signup-lastname" label="Last Name" placeholder="Smith" autoComplete="family-name" icon={<UserIcon />} />
              </div>
            )}

            <InputField
              id={isLogin ? 'login-email' : 'signup-email'}
              label="Email Address"
              type="email"
              placeholder={role === 'teacher' ? 'teacher@school.edu' : 'student@school.edu'}
              autoComplete="email"
              icon={<MailIcon />}
            />

            <div className="flex flex-col gap-1.5">
              {isLogin && (
                <div className="flex items-center justify-between">
                  <label htmlFor="login-password" className="text-[0.82rem] font-semibold text-snow/70">Password</label>
                  <button type="button" className="text-[0.76rem] text-snow/40 hover:text-snow transition-colors">Forgot password?</button>
                </div>
              )}
              {!isLogin && <label htmlFor="signup-password" className="text-[0.81rem] font-semibold text-snow/70">Password</label>}
              <div className="relative flex items-center">
                <span className="absolute left-4 text-snow/30 pointer-events-none"><LockIcon /></span>
                <input
                  id={isLogin ? 'login-password' : 'signup-password'}
                  type={showPw ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete={isLogin ? 'current-password' : 'new-password'}
                  required
                  minLength={8}
                  className="neu-input w-full pl-11 pr-12 py-3.5 rounded-2xl text-[0.92rem] outline-none"
                />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-4 text-snow/30 hover:text-snow transition-colors" aria-label="Toggle password">
                  <EyeIcon open={showPw} />
                </button>
              </div>
            </div>

            {/* Confirm password for signup */}
            {!isLogin && (
              <div className="flex flex-col gap-1.5">
                <label htmlFor="signup-confirm" className="text-[0.81rem] font-semibold text-snow/70">Confirm Password</label>
                <div className="relative flex items-center">
                  <span className="absolute left-4 text-snow/30 pointer-events-none"><ShieldIcon /></span>
                  <input
                    id="signup-confirm"
                    type={showPw2 ? 'text' : 'password'}
                    placeholder="Repeat your password"
                    autoComplete="new-password"
                    required
                    className="neu-input w-full pl-11 pr-12 py-3.5 rounded-2xl text-[0.92rem] outline-none"
                  />
                  <button type="button" onClick={() => setShowPw2(!showPw2)} className="absolute right-4 text-snow/30 hover:text-snow transition-colors" aria-label="Toggle confirm password">
                    <EyeIcon open={showPw2} />
                  </button>
                </div>
              </div>
            )}

            {/* Terms */}
            {!isLogin && (
              <label htmlFor="signup-terms" className="flex items-start gap-2.5 cursor-pointer mt-1 select-none">
                <input id="signup-terms" type="checkbox" required className="w-4 h-4 mt-0.5 rounded cursor-pointer accent-copper flex-shrink-0" style={{ accentColor: '#3B82F6' }} />
                <span className="text-[0.79rem] text-mist leading-[1.55]">
                  I agree to the{' '}
                  <button type="button" className="font-semibold text-blue-500 hover:brightness-110">Terms</button>
                  {' '}and{' '}
                  <button type="button" className="font-semibold text-blue-500 hover:brightness-110">Privacy Policy</button>
                </span>
              </label>
            )}

            {/* Submit */}
            <button
              type="submit"
              id={isLogin ? 'login-submit' : 'signup-submit'}
              disabled={loading}
              className="btn-primary w-full py-4 rounded-2xl font-extrabold text-[1rem] flex items-center justify-center gap-2.5 mt-1 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <span className="w-5 h-5 border-2 border-[rgba(255,255,255,0.30)] border-t-white rounded-full animate-spin" />
                  {isLogin ? 'Signing In…' : 'Creating Account…'}
                </>
              ) : (
                <>
                  {isLogin ? 'Sign In' : 'Create Free Account'}
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-[rgba(59, 130, 246,0.14)]" />
            <span className="text-[0.74rem] text-mist font-medium">OR</span>
            <div className="flex-1 h-px bg-[rgba(59, 130, 246,0.14)]" />
          </div>

          {/* Google */}
          <button
            id={isLogin ? 'login-google' : 'signup-google'}
            onClick={handleGoogleClick}
            className="w-full flex items-center justify-center gap-3 py-3.5 rounded-2xl font-semibold text-[0.9rem] text-snow mb-5 transition-all hover:bg-black/5 border border-[rgba(59, 130, 246,0.25)] bg-[rgba(59, 130, 246,0.05)]"
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

          <p className="text-center text-[0.86rem] text-mist">
            {isLogin ? "Don't have an account? " : 'Already have an account? '}
            <button
              onClick={onSwitch}
              id={isLogin ? 'login-to-signup' : 'signup-to-login'}
              className="font-bold text-blue-500 transition-all hover:brightness-110"
            >
              {isLogin ? 'Sign up free →' : 'Sign in →'}
            </button>
          </p>

          <p className="text-center text-[0.72rem] text-mist/50 mt-4">
            🔒 Your biometric data is never stored or transmitted.
          </p>
        </div>
      </div>
    </div>
  );
}
