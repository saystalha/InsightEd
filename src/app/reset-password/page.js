'use client';

import { Suspense, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [showPw, setShowPw] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!token) {
      setError('Reset token is missing from the URL.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to reset password.');
        return;
      }
      setSuccess(data.message || 'Password reset successfully!');
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (err) {
      console.error(err);
      setError('A connection error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="card-navy rounded-[28px] p-9 text-center">
        <h1 className="text-[1.8rem] font-black text-snow mb-3">Invalid Link</h1>
        <p className="text-[0.88rem] text-mist mb-6">This password reset link is invalid or missing the required recovery token.</p>
        <Link href="/login" className="btn-primary inline-block py-3 px-6 rounded-2xl font-extrabold text-[0.85rem] uppercase tracking-wider">
          Go to Login
        </Link>
      </div>
    );
  }

  return (
    <div className="card-navy rounded-[28px] p-9">
      <h1 className="text-[1.8rem] font-black text-snow mb-1">Reset Password</h1>
      <p className="text-[0.88rem] text-mist mb-7">Enter and confirm your new account password</p>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-xl text-[0.83rem] font-semibold text-red-400 bg-red-500/10 border border-red-500/20">
          ⚠ {error}
        </div>
      )}
      {success && (
        <div className="mb-4 px-4 py-3 rounded-xl text-[0.83rem] font-semibold text-blue-500 bg-[rgba(59,130,246,0.10)] border border-[rgba(59,130,246,0.20)]">
          ✓ {success} Redirecting to login...
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-[0.82rem] font-semibold text-snow/70">New Password</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-snow/30">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </span>
            <input
              type={showPw ? 'text' : 'password'}
              required
              placeholder="•••••••• (Min. 6 chars)"
              value={password}
              onChange={e => setPassword(e.target.value)}
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

        <div className="flex flex-col gap-1.5">
          <label className="text-[0.82rem] font-semibold text-snow/70">Confirm New Password</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-snow/30">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </span>
            <input
              type={showPw ? 'text' : 'password'}
              required
              placeholder="••••••••"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
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

        <button
          type="submit"
          disabled={loading || success}
          className="btn-primary w-full py-4 rounded-2xl font-extrabold text-[1rem] flex items-center justify-center gap-2.5 mt-2 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
        >
          {loading ? 'Resetting Password...' : 'Save and Update Password'}
        </button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <>
      <Navbar />

      <div className="min-h-screen flex items-center justify-center p-4 pt-24 relative overflow-hidden hero-bg">
        <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full pointer-events-none orb-navy" />
        <div className="absolute -bottom-24 -left-24 w-[400px] h-[400px] rounded-full pointer-events-none orb-navy" />

        <div className="relative z-10 w-full max-w-[460px]">
          <Suspense fallback={
            <div className="card-navy rounded-[28px] p-9 text-center">
              <p className="text-mist">Loading password reset context...</p>
            </div>
          }>
            <ResetPasswordForm />
          </Suspense>
        </div>
      </div>
    </>
  );
}
