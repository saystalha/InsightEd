'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';

export default function SignupPage() {
  const router = useRouter();
  const [role, setRole] = useState('teacher');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', confirm: '' });

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const executeNavigationRoute = (userObj) => {
    try {
      localStorage.setItem('userEmail', userObj.email);
      localStorage.setItem('userRole', userObj.role);
      localStorage.setItem('userName', `${userObj.firstName} ${userObj.lastName}`);
    } catch (e) {
      console.warn('localStorage is blocked or unavailable:', e);
    }
    // Preferred Next.js routing pathway
    router.push('/dashboard');
    
    // Fallback pathway in case routing is delayed
    setTimeout(() => {
      if (window.location.pathname !== '/dashboard') {
        window.location.replace('/dashboard');
      }
    }, 300);
  };

  const handleGoogleMockMessage = () => {
    alert("Google authentication is currently under construction. Please use the email and password form.");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const trimmedFirstName = form.firstName.trim();
    const trimmedLastName = form.lastName.trim();
    const trimmedEmail = form.email.trim();
    const trimmedPassword = form.password.trim();

    if (!trimmedFirstName || !trimmedLastName || !trimmedEmail || !trimmedPassword) {
      setError('Please fill in all required fields.');
      return;
    }
    if (form.password !== form.confirm) {
      setError('Passwords do not match.');
      return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: trimmedFirstName,
          lastName: trimmedLastName,
          email: trimmedEmail,
          password: trimmedPassword,
          role,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Registration failed. Please try again.');
        setLoading(false);
        return;
      }

      setLoading(false);
      executeNavigationRoute(data.user);
    } catch (err) {
      console.error('Registration submit error:', err);
      setError('An error occurred. Please check your connection and try again.');
      setLoading(false);
    }
  };

  return (
    <>
      {/* Full Navbar — same as homepage */}
      <Navbar />

      <div className="min-h-screen flex items-center justify-center p-4 pt-24 pb-10 relative overflow-hidden hero-bg">
      
      {/* Dark background luxury graphic orbs */}
      <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full pointer-events-none orb-copper" />
      <div className="absolute -bottom-24 -left-24 w-[400px] h-[400px] rounded-full pointer-events-none orb-navy" />

      <div className="relative z-10 w-full max-w-[480px]">

        {/* Form Panel Container Card - Matte Slate Theme */}
        <div className="card-navy rounded-[28px] p-9">
          <h1 className="text-[1.8rem] font-black text-snow mb-1">Create account</h1>
          <p className="text-[0.88rem] text-mist mb-6">Start restoring classroom engagement today</p>

          {/* Role selection switcher */}
          <div className="flex gap-2 mb-5 p-1 rounded-2xl bg-[rgba(15,24,36,0.60)] border border-[rgba(196,124,62,0.22)]">
            {[{ key: 'teacher', label: '👩‍🏫 Teacher' }, { key: 'student', label: '🎓 Student' }].map(({ key, label }) => (
              <button key={key} type="button" onClick={() => setRole(key)}
                className="flex-1 py-2.5 text-[0.85rem] font-semibold rounded-xl transition-all"
                style={{
                  background: role === key ? 'rgba(196,124,62,0.20)' : 'transparent',
                  color: role === key ? '#f2f2f2' : 'rgba(242,242,242,0.40)',
                  border: role === key ? '1.5px solid rgba(196,124,62,0.35)' : '1.5px solid transparent',
                }}>
                {label}
              </button>
            ))}
          </div>

          {/* Google Register Trigger */}
          <button
            type="button"
            onClick={handleGoogleMockMessage}
            className="w-full flex items-center justify-center gap-3 py-3.5 rounded-2xl font-semibold text-[0.9rem] text-snow mb-5 transition-all hover:bg-white/5 border border-[rgba(196,124,62,0.25)] bg-[rgba(196,124,62,0.05)]"
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Sign up with Google
          </button>

          {/* Divider grid blocks */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-[rgba(196,124,62,0.14)]" />
            <span className="text-[0.74rem] text-mist font-medium">OR</span>
            <div className="flex-1 h-px bg-[rgba(196,124,62,0.14)]" />
          </div>

          {/* Validation Failure Alert */}
          {error && (
            <div className="mb-4 px-4 py-3 rounded-xl text-[0.83rem] font-semibold text-copper bg-[rgba(196,124,62,0.1)] border border-[rgba(196,124,62,0.2)]">
              ⚠ {error}
            </div>
          )}

          {/* Sign Up Form contextual payload */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Input fields: First & Last name row */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { id: 'signup-first', key: 'firstName', label: 'First Name', ph: 'Jane' },
                { id: 'signup-last', key: 'lastName', label: 'Last Name', ph: 'Smith' },
              ].map(f => (
                <div key={f.id} className="flex flex-col gap-1.5">
                  <label htmlFor={f.id} className="text-[0.81rem] font-semibold text-snow/70">{f.label}</label>
                  <input id={f.id} type="text" placeholder={f.ph} value={form[f.key]} onChange={e => set(f.key, e.target.value)}
                    className="neu-input px-4 py-3 rounded-xl text-[0.9rem] outline-none" />
                </div>
              ))}
            </div>

            {/* Input Box: Email */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="signup-email" className="text-[0.81rem] font-semibold text-snow/70">Email Address</label>
              <input id="signup-email" type="email" placeholder={role === 'teacher' ? 'teacher@school.edu' : 'student@school.edu'}
                value={form.email} onChange={e => set('email', e.target.value)}
                className="neu-input w-full px-4 py-3.5 rounded-2xl text-[0.92rem] outline-none" />
            </div>

            {/* Input Box: Password block inside relative eye mask */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="signup-password" className="text-[0.81rem] font-semibold text-snow/70">Password</label>
              <div className="relative">
                <input id="signup-password" type={showPw ? 'text' : 'password'} placeholder="Min 6 characters"
                  value={form.password} onChange={e => set('password', e.target.value)}
                  className="neu-input w-full px-4 pr-12 py-3.5 rounded-2xl text-[0.92rem] outline-none" />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-4 top-1/2 -translate-y-1/2 text-snow/30 hover:text-snow transition-colors">
                  {showPw
                    ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                    : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                  }
                </button>
              </div>
            </div>

            {/* Input Box: Password confirmations */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="signup-confirm" className="text-[0.81rem] font-semibold text-snow/70">Confirm Password</label>
              <input id="signup-confirm" type="password" placeholder="Repeat your password"
                value={form.confirm} onChange={e => set('confirm', e.target.value)}
                className="neu-input w-full px-4 py-3.5 rounded-2xl text-[0.92rem] outline-none" />
            </div>

            {/* Terms checkpoint link switches */}
            <label htmlFor="signup-terms" className="flex items-start gap-2.5 cursor-pointer select-none">
              <input id="signup-terms" type="checkbox" required className="w-4 h-4 mt-0.5 rounded cursor-pointer accent-copper flex-shrink-0" style={{ accentColor: '#c47c3e' }} />
              <span className="text-[0.79rem] text-mist leading-[1.55]">
                I agree to the <button type="button" className="font-semibold text-copper hover:brightness-110">Terms of Service</button> and <button type="button" className="font-semibold text-copper hover:brightness-110">Privacy Policy</button>
              </span>
            </label>

            {/* Form Master Registration Trigger button */}
            <button type="submit" id="signup-submit" disabled={loading}
              className="btn-primary w-full py-4 rounded-2xl font-extrabold text-[1rem] flex items-center justify-center gap-2.5 mt-1 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading
                ? <><span className="w-5 h-5 border-2 border-[rgba(255,255,255,0.30)] border-t-white rounded-full animate-spin" /> Creating Account…</>
                : <>Create Free Account <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg></>
              }
            </button>
          </form>

          <p className="text-center text-[0.86rem] text-mist mt-6">
            Already have an account?{' '}
            <Link href="/login" className="font-bold text-copper transition-all hover:brightness-110">Sign in →</Link>
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