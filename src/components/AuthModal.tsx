import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, Check, Mail, Lock, UserPlus, X, ShieldCheck, LogOut, Sparkles, UserRound } from 'lucide-react';
import { AuthCredentials, AuthMode, AuthSession, login, signOut, signup } from '../auth';

interface AuthModalProps {
  isOpen: boolean;
  mode: AuthMode;
  onClose: () => void;
  onModeChange: (mode: AuthMode) => void;
  onAuthenticated: (session: AuthSession) => void;
  onLoggedOut: () => void;
  currentSession: AuthSession | null;
}

const emptyForm = {
  email: '',
  password: '',
  displayName: '',
};

export default function AuthModal({
  isOpen,
  mode,
  onClose,
  onModeChange,
  onAuthenticated,
  onLoggedOut,
  currentSession,
}: AuthModalProps) {
  const [form, setForm] = useState(emptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setError('');
    setIsSubmitting(false);
    setForm((current) => ({
      ...emptyForm,
      displayName: mode === 'signup' ? current.displayName : '',
      email: currentSession?.user.email ?? current.email,
    }));
  }, [isOpen, mode, currentSession]);

  const heading = useMemo(() => (mode === 'login' ? 'Secure Entry' : 'Create Access'), [mode]);
  const subtitle = useMemo(
    () => (mode === 'login' ? 'Enter your credentials to restore the dashboard.' : 'Create a controlled local account for this vault.'),
    [mode]
  );

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    const payload: AuthCredentials = {
      email: form.email,
      password: form.password,
      displayName: form.displayName,
    };

    try {
      const session = mode === 'login' ? await login(payload) : await signup(payload);
      onAuthenticated(session);
      onClose();
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : 'Authentication failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = () => {
    signOut();
    onLoggedOut();
    onModeChange('login');
    setForm(emptyForm);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-[18px]"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 18 }}
            transition={{ type: 'spring', duration: 0.45, bounce: 0.12 }}
            className="relative z-10 w-full max-w-4xl overflow-hidden rounded-[28px] border border-white/10 bg-[#0b0b0b]/95 shadow-[0_20px_80px_rgba(0,0,0,0.75)]"
          >
            <div className="grid min-h-[560px] lg:grid-cols-[1.1fr_0.9fr]">
              <div className="relative border-b border-white/5 lg:border-b-0 lg:border-r lg:border-white/5 bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.16),transparent_35%),linear-gradient(180deg,rgba(255,255,255,0.03),transparent)] p-8 lg:p-10">
                <div className="absolute inset-0 opacity-80 [background-image:linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] [background-size:24px_24px]" />
                <div className="relative flex h-full flex-col justify-between gap-8">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-white/65">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 shadow-[0_0_30px_rgba(255,255,255,0.08)]">
                        <ShieldCheck className="h-5 w-5 stroke-[1.6] text-white" />
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.35em] text-white/35">Onelive Access</p>
                        <h2 className="mt-1 text-lg font-semibold tracking-tight text-white">{heading}</h2>
                      </div>
                    </div>

                    <button
                      onClick={onClose}
                      className="rounded-full border border-white/10 bg-white/5 p-2 text-white/40 transition-colors hover:bg-white/10 hover:text-white"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="max-w-lg space-y-5">
                    <p className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                      Quiet authentication for a private bookmark vault.
                    </p>
                    <p className="max-w-md text-sm leading-6 text-white/55">
                      {subtitle} Private content stays hidden until a session is established, while the rest of the dashboard keeps its glassmorphic frame.
                    </p>

                    <div className="grid gap-3 sm:grid-cols-2">
                      {[
                        'Private cards remain hidden while logged out.',
                        'Login persists through refresh in this browser.',
                        'Signup creates a local protected account.',
                        'The dashboard keeps the same visual quietness.',
                      ].map((item) => (
                        <div key={item} className="flex items-start gap-3 rounded-2xl border border-white/8 bg-white/[0.03] p-4 text-sm text-white/60 backdrop-blur-md">
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-white/80" />
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {currentSession ? (
                    <div className="relative rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-md">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white">
                          <UserRound className="h-5 w-5 stroke-[1.6]" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] uppercase tracking-[0.32em] text-white/35">Active session</p>
                          <p className="truncate text-sm font-medium text-white">{currentSession.user.displayName}</p>
                          <p className="truncate text-xs text-white/45">{currentSession.user.email}</p>
                        </div>
                      </div>

                      <button
                        onClick={handleLogout}
                        className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.25em] text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                      >
                        <LogOut className="h-3.5 w-3.5" />
                        Sign out
                      </button>
                    </div>
                  ) : (
                    <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[10px] uppercase tracking-[0.35em] text-white/45">
                      <Sparkles className="h-3.5 w-3.5 text-white/70" />
                      Local vault session
                    </div>
                  )}
                </div>
              </div>

              <div className="p-6 sm:p-8 lg:p-10">
                <div className="mb-6 flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] p-1 text-[10px] uppercase tracking-[0.35em] text-white/40">
                  <button
                    onClick={() => onModeChange('login')}
                    className={`flex-1 rounded-full px-4 py-2 transition-colors ${mode === 'login' ? 'bg-white text-black' : 'hover:text-white'}`}
                  >
                    Login
                  </button>
                  <button
                    onClick={() => onModeChange('signup')}
                    className={`flex-1 rounded-full px-4 py-2 transition-colors ${mode === 'signup' ? 'bg-white text-black' : 'hover:text-white'}`}
                  >
                    Signup
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="mb-2 block text-[10px] uppercase tracking-[0.32em] text-white/35">Email</label>
                    <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 transition-colors focus-within:border-white/20">
                      <Mail className="h-4 w-4 text-white/30" />
                      <input
                        value={form.email}
                        onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                        type="email"
                        placeholder="name@domain.com"
                        className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/20"
                        autoComplete="email"
                      />
                    </div>
                  </div>

                  {mode === 'signup' && (
                    <div>
                      <label className="mb-2 block text-[10px] uppercase tracking-[0.32em] text-white/35">Display name</label>
                      <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 transition-colors focus-within:border-white/20">
                        <UserPlus className="h-4 w-4 text-white/30" />
                        <input
                          value={form.displayName}
                          onChange={(event) => setForm((current) => ({ ...current, displayName: event.target.value }))}
                          type="text"
                          placeholder="Your name"
                          className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/20"
                          autoComplete="name"
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="mb-2 block text-[10px] uppercase tracking-[0.32em] text-white/35">Password</label>
                    <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 transition-colors focus-within:border-white/20">
                      <Lock className="h-4 w-4 text-white/30" />
                      <input
                        value={form.password}
                        onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                        type="password"
                        placeholder="••••••••"
                        className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/20"
                        autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3.5 text-sm font-medium text-black transition-transform hover:scale-[1.01] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {isSubmitting ? 'Processing...' : mode === 'login' ? 'Enter vault' : 'Create account'}
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </form>

                <p className="mt-5 text-center text-xs text-white/35">
                  {mode === 'login' ? 'New here?' : 'Already have access?'}{' '}
                  <button
                    onClick={() => onModeChange(mode === 'login' ? 'signup' : 'login')}
                    className="font-medium text-white transition-colors hover:text-white/80"
                  >
                    {mode === 'login' ? 'Create a local account' : 'Return to login'}
                  </button>
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}