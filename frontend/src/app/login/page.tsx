'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Eye, EyeOff, ArrowRight, Loader2, CheckCircle } from 'lucide-react';

type Tab = 'login' | 'register';

function PasswordStrength({ password }: { password: string }) {
  const strength = password.length === 0 ? 0
    : password.length < 6 ? 1
    : password.length < 10 || !/[A-Z]/.test(password) || !/[0-9]/.test(password) ? 2
    : 3;

  const labels = ['', 'Weak', 'Medium', 'Strong'];
  const colors = ['', 'bg-red-500', 'bg-amber-500', 'bg-green-500'];
  const textColors = ['', 'text-red-500', 'text-amber-500', 'text-green-500'];

  if (!password) return null;
  return (
    <div className="mt-2">
      <div className="flex gap-1 mb-1">
        {[1, 2, 3].map((i) => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= strength ? colors[strength] : 'bg-slate-200'}`} />
        ))}
      </div>
      <p className={`text-xs font-medium ${textColors[strength]}`}>{labels[strength]}</p>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
}

export default function AuthPage() {
  const { login, register } = useAuth();
  const [tab, setTab] = useState<Tab>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [regForm, setRegForm] = useState({ name: '', email: '', password: '', confirm: '', agreed: false });

  const validateEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setFieldErrors({});
    const errs: Record<string, string> = {};
    if (!validateEmail(loginForm.email)) errs.email = 'Invalid email address';
    if (!loginForm.password) errs.password = 'Password is required';
    if (Object.keys(errs).length) return setFieldErrors(errs);

    setLoading(true);
    try {
      await login(loginForm.email, loginForm.password);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Incorrect email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setFieldErrors({});
    const errs: Record<string, string> = {};
    if (!regForm.name.trim()) errs.name = 'Full name is required';
    if (!validateEmail(regForm.email)) errs.email = 'Invalid email address';
    if (regForm.password.length < 6) errs.password = 'Password must be at least 6 characters';
    if (regForm.password !== regForm.confirm) errs.confirm = 'Passwords do not match';
    if (!regForm.agreed) errs.agreed = 'You must agree to the Terms of Service';
    if (Object.keys(errs).length) return setFieldErrors(errs);

    setLoading(true);
    try {
      await register(regForm.name, regForm.email, regForm.password);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Registration failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = (field: string) =>
    `w-full px-4 py-3 rounded-lg border text-sm outline-none transition-all duration-200 bg-white
    focus:ring-2 focus:ring-indigo-300 focus:border-indigo-500 disabled:bg-slate-50 disabled:cursor-not-allowed
    ${fieldErrors[field] ? 'border-red-400 focus:ring-red-200 focus:border-red-400' : 'border-slate-200'}`;

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-100 rounded-full opacity-40 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-amber-100 rounded-full opacity-40 blur-3xl" />
      </div>

      <div className="w-full max-w-[420px] fade-in">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-slate-100">
          {/* Logo */}
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-indigo-600 tracking-tight">Wandr ✈</h1>
            <p className="text-slate-500 text-sm mt-1">AI-powered travel planning</p>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-slate-200 mb-6">
            {(['login', 'register'] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => { setTab(t); setError(''); setFieldErrors({}); }}
                className={`flex-1 pb-3 text-sm font-medium transition-all duration-200 border-b-2 -mb-px
                  ${tab === t ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
              >
                {t === 'login' ? 'Sign in' : 'Create account'}
              </button>
            ))}
          </div>

          {/* Error banner */}
          {error && (
            <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* LOGIN FORM */}
          {tab === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
                <input
                  type="email"
                  placeholder="you@email.com"
                  className={inputClass('email')}
                  value={loginForm.email}
                  onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                  disabled={loading}
                  autoComplete="email"
                />
                {fieldErrors.email && <p className="text-xs text-red-500 mt-1">{fieldErrors.email}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    className={`${inputClass('password')} pr-12`}
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                    disabled={loading}
                    autoComplete="current-password"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {fieldErrors.password && <p className="text-xs text-red-500 mt-1">{fieldErrors.password}</p>}
                <div className="text-right mt-1.5">
                  <button type="button" className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">Forgot password?</button>
                </div>
              </div>

              <button type="submit" disabled={loading || success}
                className="w-full py-3 px-4 rounded-lg bg-indigo-600 text-white font-semibold text-sm
                  hover:bg-indigo-700 active:scale-[0.98] transition-all duration-200
                  disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                {success ? <><CheckCircle size={18} /> Signed in!</>
                  : loading ? <><Loader2 size={18} className="animate-spin" /> Signing in...</>
                  : <>Sign in <ArrowRight size={18} /></>}
              </button>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-xs text-slate-500 bg-white px-3">or</div>
              </div>

              <button type="button"
                className="w-full py-3 px-4 rounded-lg border border-slate-200 bg-white text-slate-700 font-medium text-sm
                  hover:bg-slate-50 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-3">
                <GoogleIcon /> Continue with Google
              </button>
            </form>
          )}

          {/* REGISTER FORM */}
          {tab === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Name</label>
                <input type="text" placeholder="Alex Johnson" className={inputClass('name')}
                  value={regForm.name} onChange={(e) => setRegForm({ ...regForm, name: e.target.value })}
                  disabled={loading} autoComplete="name" />
                {fieldErrors.name && <p className="text-xs text-red-500 mt-1">{fieldErrors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
                <input type="email" placeholder="you@email.com" className={inputClass('email')}
                  value={regForm.email} onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
                  disabled={loading} autoComplete="email" />
                {fieldErrors.email && <p className="text-xs text-red-500 mt-1">{fieldErrors.email}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
                <div className="relative">
                  <input type={showPassword ? 'text' : 'password'} placeholder="Min. 6 characters"
                    className={`${inputClass('password')} pr-12`}
                    value={regForm.password} onChange={(e) => setRegForm({ ...regForm, password: e.target.value })}
                    disabled={loading} autoComplete="new-password" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <PasswordStrength password={regForm.password} />
                {fieldErrors.password && <p className="text-xs text-red-500 mt-1">{fieldErrors.password}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Confirm Password</label>
                <div className="relative">
                  <input type={showConfirm ? 'text' : 'password'} placeholder="Re-enter password"
                    className={`${inputClass('confirm')} pr-12`}
                    value={regForm.confirm} onChange={(e) => setRegForm({ ...regForm, confirm: e.target.value })}
                    disabled={loading} autoComplete="new-password" />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                    {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {fieldErrors.confirm && <p className="text-xs text-red-500 mt-1">{fieldErrors.confirm}</p>}
              </div>

              <div>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" className="mt-0.5 accent-indigo-600 w-4 h-4 rounded"
                    checked={regForm.agreed} onChange={(e) => setRegForm({ ...regForm, agreed: e.target.checked })}
                    disabled={loading} />
                  <span className="text-sm text-slate-600">
                    I agree to the{' '}
                    <a href="#" className="text-indigo-600 hover:underline font-medium">Terms of Service</a>
                    {' '}and{' '}
                    <a href="#" className="text-indigo-600 hover:underline font-medium">Privacy Policy</a>
                  </span>
                </label>
                {fieldErrors.agreed && <p className="text-xs text-red-500 mt-1">{fieldErrors.agreed}</p>}
              </div>

              <button type="submit" disabled={loading || success}
                className="w-full py-3 px-4 rounded-lg bg-indigo-600 text-white font-semibold text-sm
                  hover:bg-indigo-700 active:scale-[0.98] transition-all duration-200
                  disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                {success ? <><CheckCircle size={18} /> Account created!</>
                  : loading ? <><Loader2 size={18} className="animate-spin" /> Creating account...</>
                  : 'Create account'}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          © 2025 Wandr. Powered by Gemini AI.
        </p>
      </div>
    </div>
  );
}
