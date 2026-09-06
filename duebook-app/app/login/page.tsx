'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';
import { Eye, EyeOff, BookOpen, ArrowLeft } from 'lucide-react';
import GoogleAuthButton from './GoogleAuthButton';

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';

type View = 'signin' | 'signup' | 'forgot' | 'reset';

const SECURITY_QUESTIONS = [
  "What is your mother's maiden name?",
  "What was the name of your first pet?",
  'What city were you born in?',
  'What was your first school name?',
  'What is your favourite food?',
  'Custom question…',
];

export default function LoginPage() {
  const { login, signup, forgotPassword, resetPassword, googleLogin, user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [view, setView] = useState<View>('signin');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPw, setShowPw] = useState(false);

  // shared
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // signup
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [shopName, setShopName] = useState('');
  const [questionPreset, setQuestionPreset] = useState(SECURITY_QUESTIONS[0]);
  const [customQuestion, setCustomQuestion] = useState('');
  const [securityAnswer, setSecurityAnswer] = useState('');

  // reset
  const [resetQuestion, setResetQuestion] = useState('');
  const [resetAnswer, setResetAnswer] = useState('');
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    if (!authLoading && user) router.replace('/due-book');
  }, [user, authLoading, router]);

  const clearError = () => setError('');
  const switchTo = (v: View) => { clearError(); setView(v); };

  const currentQuestion = questionPreset === 'Custom question…' ? customQuestion.trim() : questionPreset;

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    if (!email || !password) { setError('Enter email and password'); return; }
    setLoading(true);
    try {
      await login(email, password);
      router.replace('/due-book');
    } catch (err: unknown) {
      const e2 = err as { response?: { data?: { error?: string; message?: string } } };
      setError(e2?.response?.data?.error || e2?.response?.data?.message || 'Login failed. Check your credentials.');
    } finally { setLoading(false); }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    if (!name.trim() || !email.trim() || !password) { setError('Fill name, email, password'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    if (!currentQuestion || currentQuestion.length < 4) { setError('Pick or type a security question'); return; }
    if (!securityAnswer.trim() || securityAnswer.trim().length < 2) { setError('Enter a security answer'); return; }
    setLoading(true);
    try {
      await signup({
        name: name.trim(), email: email.trim(), password,
        phone: phone.trim() || undefined, shopName: shopName.trim() || undefined,
        securityQuestion: currentQuestion, securityAnswer: securityAnswer.trim(),
      });
      toast.success('Account created — welcome!');
      router.replace('/due-book');
    } catch (err: unknown) {
      const e2 = err as { response?: { data?: { error?: string } } };
      const msg = e2?.response?.data?.error;
      setError(typeof msg === 'string' ? msg : 'Signup failed');
    } finally { setLoading(false); }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    if (!email.trim()) { setError('Enter your email'); return; }
    setLoading(true);
    try {
      const res = await forgotPassword(email.trim());
      if (!res.ok || !res.question) {
        setError(res.message || 'No recovery configured for this account');
        return;
      }
      setResetQuestion(res.question);
      setResetAnswer('');
      setNewPassword('');
      setView('reset');
    } catch (err: unknown) {
      const e2 = err as { response?: { data?: { error?: string } } };
      setError(typeof e2?.response?.data?.error === 'string' ? e2.response!.data!.error! : 'Failed to look up account');
    } finally { setLoading(false); }
  };

  const handleGoogle = useCallback(async (credential: string) => {
    clearError();
    setLoading(true);
    try {
      await googleLogin(credential, shopName.trim() || undefined);
      toast.success('Signed in with Google');
      router.replace('/due-book');
    } catch (err: unknown) {
      const e2 = err as { response?: { data?: { error?: string } } };
      setError(typeof e2?.response?.data?.error === 'string' ? e2.response!.data!.error! : 'Google sign-in failed');
    } finally { setLoading(false); }
  }, [googleLogin, router, shopName]);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    if (!resetAnswer.trim() || !newPassword) { setError('Answer and new password required'); return; }
    if (newPassword.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      await resetPassword(email.trim(), resetAnswer.trim(), newPassword);
      toast.success('Password updated — signed in');
      router.replace('/due-book');
    } catch (err: unknown) {
      const e2 = err as { response?: { data?: { error?: string } } };
      setError(typeof e2?.response?.data?.error === 'string' ? e2.response!.data!.error! : 'Reset failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
      <div className="w-full max-w-[300px]">
        <div className="flex flex-col items-center mb-5">
          <div className="w-11 h-11 rounded-xl bg-sky-500 flex items-center justify-center shadow-md mb-2.5">
            <BookOpen size={22} className="text-white" />
          </div>
          <h1 className="text-[17px] font-bold text-gray-900">DueBook</h1>
          <p className="text-[11px] text-gray-400 mt-0.5">Track money owed &amp; given</p>
        </div>

        {(view === 'signin' || view === 'signup') && (
          <div className="flex bg-gray-100 rounded-xl p-0.5 mb-3">
            <button
              onClick={() => switchTo('signin')}
              className={`flex-1 py-1.5 rounded-lg text-[12px] font-bold transition ${view === 'signin' ? 'bg-white text-sky-600 shadow-sm' : 'text-gray-500'}`}>
              Sign In
            </button>
            <button
              onClick={() => switchTo('signup')}
              className={`flex-1 py-1.5 rounded-lg text-[12px] font-bold transition ${view === 'signup' ? 'bg-white text-sky-600 shadow-sm' : 'text-gray-500'}`}>
              Sign Up
            </button>
          </div>
        )}

        {view === 'signin' && (
          <form onSubmit={handleSignIn} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-3">
            {GOOGLE_CLIENT_ID && (
              <>
                <GoogleAuthButton clientId={GOOGLE_CLIENT_ID} onCredential={handleGoogle} text="signin_with" disabled={loading} />
                <div className="flex items-center gap-2 py-1">
                  <div className="flex-1 h-px bg-gray-200" />
                  <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">or</span>
                  <div className="flex-1 h-px bg-gray-200" />
                </div>
              </>
            )}
            <div>
              <label className="text-[11px] font-semibold text-gray-600 block mb-1">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com" autoComplete="email"
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-[13px] text-gray-900 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 bg-gray-50 focus:bg-white transition"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-gray-600 block mb-1">Password</label>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••" autoComplete="current-password"
                  className="w-full px-3 py-2 pr-9 border border-gray-200 rounded-xl text-[13px] text-gray-900 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 bg-gray-50 focus:bg-white transition"
                />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400">
                  {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
            {error && <div className="text-[12px] text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-center">{error}</div>}
            <button type="submit" disabled={loading}
              className="w-full py-2.5 rounded-xl bg-sky-500 text-white text-[13px] font-bold shadow-sm disabled:opacity-60 flex items-center justify-center gap-2 active:scale-[0.98] transition-all">
              {loading ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Sign In'}
            </button>
            <div className="flex justify-between items-center pt-1">
              <button type="button" onClick={() => switchTo('forgot')}
                className="text-[11px] text-sky-500 font-semibold">
                Forgot password?
              </button>
              <button type="button" onClick={() => switchTo('signup')}
                className="text-[11px] text-gray-500">
                Create account
              </button>
            </div>
          </form>
        )}

        {view === 'signup' && (
          <form onSubmit={handleSignUp} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-2.5">
            {GOOGLE_CLIENT_ID && (
              <>
                <GoogleAuthButton clientId={GOOGLE_CLIENT_ID} onCredential={handleGoogle} text="signup_with" disabled={loading} />
                <p className="text-[10px] text-center text-gray-400 -mt-1">
                  Fastest way — no password needed
                </p>
                <div className="flex items-center gap-2 py-1">
                  <div className="flex-1 h-px bg-gray-200" />
                  <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">or sign up with email</span>
                  <div className="flex-1 h-px bg-gray-200" />
                </div>
              </>
            )}
            <div>
              <label className="text-[11px] font-semibold text-gray-600 block mb-1">Your Name *</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)}
                placeholder="Full name"
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-[13px] text-gray-900 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 bg-gray-50 focus:bg-white transition"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-gray-600 block mb-1">Shop Name (optional)</label>
              <input type="text" value={shopName} onChange={e => setShopName(e.target.value)}
                placeholder="e.g. Karim Store"
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-[13px] text-gray-900 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 bg-gray-50 focus:bg-white transition"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-gray-600 block mb-1">Email *</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com" autoComplete="email"
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-[13px] text-gray-900 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 bg-gray-50 focus:bg-white transition"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-gray-600 block mb-1">Phone (optional)</label>
              <input type="tel" inputMode="tel" value={phone} onChange={e => setPhone(e.target.value)}
                placeholder="01xxxxxxxxx"
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-[13px] text-gray-900 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 bg-gray-50 focus:bg-white transition"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-gray-600 block mb-1">Password *</label>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="At least 6 characters" autoComplete="new-password"
                  className="w-full px-3 py-2 pr-9 border border-gray-200 rounded-xl text-[13px] text-gray-900 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 bg-gray-50 focus:bg-white transition"
                />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400">
                  {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            <div className="rounded-xl bg-amber-50 border border-amber-200 p-2.5 space-y-2">
              <p className="text-[11px] font-bold text-amber-800">Account recovery</p>
              <p className="text-[10px] text-amber-700">
                We&apos;ll ask this if you ever forget your password. Nobody can reset your password without answering it.
              </p>
              <select
                value={questionPreset}
                onChange={e => setQuestionPreset(e.target.value)}
                className="w-full px-2 py-1.5 border border-amber-200 rounded-lg text-[12px] text-gray-900 bg-white outline-none focus:border-amber-400">
                {SECURITY_QUESTIONS.map(q => <option key={q} value={q}>{q}</option>)}
              </select>
              {questionPreset === 'Custom question…' && (
                <input type="text" value={customQuestion} onChange={e => setCustomQuestion(e.target.value)}
                  placeholder="Type your question"
                  className="w-full px-2 py-1.5 border border-amber-200 rounded-lg text-[12px] text-gray-900 bg-white outline-none focus:border-amber-400"
                />
              )}
              <input type="text" value={securityAnswer} onChange={e => setSecurityAnswer(e.target.value)}
                placeholder="Your answer"
                className="w-full px-2 py-1.5 border border-amber-200 rounded-lg text-[12px] text-gray-900 bg-white outline-none focus:border-amber-400"
              />
            </div>

            {error && <div className="text-[12px] text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-center">{error}</div>}
            <button type="submit" disabled={loading}
              className="w-full py-2.5 rounded-xl bg-sky-500 text-white text-[13px] font-bold shadow-sm disabled:opacity-60 flex items-center justify-center gap-2 active:scale-[0.98] transition-all mt-1">
              {loading ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Create Account'}
            </button>
            <p className="text-[10px] text-gray-400 text-center pt-1">
              A separate shop workspace will be created for you.
            </p>
          </form>
        )}

        {view === 'forgot' && (
          <form onSubmit={handleForgot} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-3">
            <button type="button" onClick={() => switchTo('signin')}
              className="flex items-center gap-1 text-[11px] text-gray-500 font-semibold">
              <ArrowLeft size={12} /> Back to sign in
            </button>
            <h3 className="text-[14px] font-bold text-gray-900">Forgot password</h3>
            <p className="text-[11px] text-gray-500">
              Enter your email. We&apos;ll show your security question — answer it correctly to set a new password.
            </p>
            <div>
              <label className="text-[11px] font-semibold text-gray-600 block mb-1">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-[13px] text-gray-900 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 bg-gray-50 focus:bg-white transition"
              />
            </div>
            {error && <div className="text-[12px] text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-center">{error}</div>}
            <button type="submit" disabled={loading}
              className="w-full py-2.5 rounded-xl bg-sky-500 text-white text-[13px] font-bold shadow-sm disabled:opacity-60 flex items-center justify-center gap-2 active:scale-[0.98] transition-all">
              {loading ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Continue'}
            </button>
          </form>
        )}

        {view === 'reset' && (
          <form onSubmit={handleReset} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-3">
            <button type="button" onClick={() => switchTo('signin')}
              className="flex items-center gap-1 text-[11px] text-gray-500 font-semibold">
              <ArrowLeft size={12} /> Back to sign in
            </button>
            <h3 className="text-[14px] font-bold text-gray-900">Reset password</h3>
            <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 space-y-0.5">
              <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wide">Your security question</p>
              <p className="text-[12px] text-gray-900">{resetQuestion}</p>
            </div>
            <div>
              <label className="text-[11px] font-semibold text-gray-600 block mb-1">Your answer</label>
              <input type="text" value={resetAnswer} onChange={e => setResetAnswer(e.target.value)}
                placeholder="Type your answer"
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-[13px] text-gray-900 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 bg-gray-50 focus:bg-white transition"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-gray-600 block mb-1">New password</label>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} value={newPassword} onChange={e => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters" autoComplete="new-password"
                  className="w-full px-3 py-2 pr-9 border border-gray-200 rounded-xl text-[13px] text-gray-900 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 bg-gray-50 focus:bg-white transition"
                />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400">
                  {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
            {error && <div className="text-[12px] text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-center">{error}</div>}
            <button type="submit" disabled={loading}
              className="w-full py-2.5 rounded-xl bg-sky-500 text-white text-[13px] font-bold shadow-sm disabled:opacity-60 flex items-center justify-center gap-2 active:scale-[0.98] transition-all">
              {loading ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Update Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
