'use client';

import { useState } from 'react';
import { Mail, Lock, User, Eye, EyeOff, ArrowRight, TriangleAlert } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import GoogleSignInButton from '@/components/GoogleSignInButton';
import BrandLockup from '@/components/BrandLockup';

type Tab = 'login' | 'register';
type Field = 'name' | 'email' | 'password';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

interface AuthScreenProps {
  initialTab?: Tab;
  contextReason?: string | null;
}

export default function AuthScreen({ initialTab = 'login', contextReason }: AuthScreenProps) {
  const { signIn, signUp, resetPassword } = useAuth();
  const [tab, setTab] = useState<Tab>(initialTab);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState('');

  function validate(): Partial<Record<Field, string>> {
    const next: Partial<Record<Field, string>> = {};

    if (tab === 'register' && name.trim().length < 3) {
      next.name = 'Unesi ime i prezime.';
    }
    const identifier = email.trim();
    if (!identifier) {
      next.email = 'Unesi email adresu.';
    } else if (!EMAIL_RE.test(identifier)) {
      next.email = 'Unesi ispravnu email adresu.';
    }

    if (password.length < 6) {
      next.password = 'Lozinka mora imati bar 6 karaktera.';
    }

    return next;
  }

  function switchTab(next: Tab) {
    setTab(next);
    setErrors({});
    setNotice('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSubmitting(true);
    setNotice('');
    const result = tab === 'login'
      ? await signIn(email.trim(), password)
      : await signUp(email.trim(), password, name.trim());
    setSubmitting(false);
    if (!result.ok) {
      setErrors({ password: result.message });
      return;
    }
    if (result.needsEmailConfirmation) {
      setNotice('Poslali smo ti link za potvrdu email adrese. Potvrdi adresu, pa se prijavi.');
      setPassword('');
    }
  }

  async function handlePasswordReset() {
    const address = email.trim();
    if (!EMAIL_RE.test(address)) {
      setErrors({ email: 'Prvo unesi ispravnu email adresu.' });
      return;
    }
    setSubmitting(true);
    const result = await resetPassword(address);
    setSubmitting(false);
    if (!result.ok) setErrors({ email: result.message });
    else setNotice('Ako nalog postoji, link za promenu lozinke stiže na email.');
  }

  const inputBase =
    'w-full rounded-xl border bg-white py-3 pl-10 text-sm text-zinc-950 outline-none transition-colors placeholder:text-zinc-400 focus-visible:border-brand-700 focus-visible:ring-4 focus-visible:ring-brand-500/15 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-500';
  const inputOk = 'border-zinc-200 dark:border-zinc-700';
  const inputBad = 'border-rose-500/70 focus-visible:border-rose-500 focus-visible:ring-rose-500/15';

  function fieldClass(field: Field, extra = 'pr-4') {
    return `${inputBase} ${extra} ${errors[field] ? inputBad : inputOk}`;
  }

  const title = tab === 'login' ? 'Dobrodošao nazad' : 'Pronađi svoju sledeću zamenu';
  const subtitle = tab === 'login'
    ? 'Prijavi se i nastavi sa pretragom zamene.'
    : 'Napravi nalog i poveži se sa vlasnicima koji traže zamenu.';
  const visibleContextReason = contextReason && ![
    'Prijavi se na AutoTrampu',
    'Napravi AutoTrampa nalog',
  ].includes(contextReason.trim())
    ? contextReason
    : null;

  return (
    <section className="relative mx-auto max-h-[calc(100dvh-2rem)] w-full max-w-[460px] overflow-y-auto overscroll-contain rounded-[1.75rem] border border-white/80 bg-white text-zinc-950 shadow-2xl shadow-zinc-950/25 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 sm:max-h-[calc(100dvh-3rem)]">
      <div className="p-5 sm:p-8">
        <div className="mb-5 flex justify-center sm:mb-6">
          <span className="inline-flex items-center gap-2" translate="no">
            <BrandLockup />
          </span>
        </div>

        <header className="mb-6 text-center sm:mb-7">
          <h1 id="auth-dialog-title" className="text-2xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50 sm:text-[1.75rem]">
            {title}
          </h1>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
            {subtitle}
          </p>
        </header>

        {visibleContextReason ? (
          <p className="mb-5 rounded-xl border border-brand-500/40 bg-brand-500/10 px-3.5 py-2.5 text-center text-sm font-semibold leading-snug text-zinc-800 dark:text-zinc-100">
            {visibleContextReason}
          </p>
        ) : null}

        <div className="mb-5 flex rounded-xl border border-zinc-200 bg-zinc-100/80 p-1 dark:border-zinc-700 dark:bg-zinc-800/80" role="group" aria-label="Izbor prijave">
          {(['login', 'register'] as const).map((key) => (
            <button
              key={key}
              type="button"
              aria-pressed={tab === key}
              onClick={() => switchTab(key)}
              className={`min-h-11 flex-1 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-zinc-900 ${
                tab === key
                  ? 'bg-brand-500 text-zinc-950 shadow-sm'
                  : 'text-zinc-600 hover:bg-white hover:text-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-700 dark:hover:text-white'
              }`}
            >
              {key === 'login' ? 'Prijavi se' : 'Registruj se'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-3.5">
          {tab === 'register' && (
            <div>
              <label htmlFor="auth-name" className="mb-1.5 block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Ime i prezime
              </label>
              <div className="relative">
                <User size={17} aria-hidden="true" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 dark:text-zinc-400" />
                <input
                  id="auth-name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="npr. Nikola Vuković"
                  aria-invalid={Boolean(errors.name)}
                  aria-describedby={errors.name ? 'auth-name-error' : undefined}
                  className={fieldClass('name')}
                />
              </div>
              <FieldError id="auth-name-error" message={errors.name} />
            </div>
          )}

          <div>
            <label htmlFor="auth-email" className="mb-1.5 block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Email adresa
            </label>
            <div className="relative">
              <Mail size={17} aria-hidden="true" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 dark:text-zinc-400" />
              <input
                id="auth-email"
                name="email"
                type="email"
                inputMode="email"
                autoComplete={tab === 'login' ? 'username' : 'email'}
                autoCapitalize="none"
                spellCheck={false}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ime@primer.rs"
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? 'auth-email-error' : undefined}
                className={fieldClass('email')}
              />
            </div>
            <FieldError id="auth-email-error" message={errors.email} />
          </div>

          <div>
            <label htmlFor="auth-password" className="mb-1.5 block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Lozinka
            </label>
            <div className="relative">
              <Lock size={17} aria-hidden="true" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 dark:text-zinc-400" />
              <input
                id="auth-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Unesi lozinku"
                aria-invalid={Boolean(errors.password)}
                aria-describedby={errors.password ? 'auth-password-error' : undefined}
                className={fieldClass('password', 'pr-12')}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Sakrij lozinku' : 'Prikaži lozinku'}
                aria-pressed={showPassword}
                className="absolute right-1 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
              >
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
            <FieldError id="auth-password-error" message={errors.password} />
          </div>

          {tab === 'login' && (
            <div className="flex justify-end -mt-1">
              <button
                type="button"
                onClick={handlePasswordReset}
                disabled={submitting}
                className="min-h-10 rounded-md px-2 text-sm font-medium text-brand-text transition-colors hover:underline disabled:cursor-not-allowed disabled:opacity-60"
              >
                Zaboravili ste lozinku?
              </button>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="btn-primary min-h-12 w-full text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-zinc-900"
          >
            {submitting ? 'Obrađujem…' : tab === 'login' ? 'Prijavi se' : 'Napravi nalog'}
            {!submitting && <ArrowRight size={17} strokeWidth={2.5} aria-hidden="true" />}
          </button>
        </form>

        <div className="relative my-5" aria-hidden="true">
          <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-zinc-200 dark:border-zinc-700" /></div>
          <div className="relative flex justify-center"><span className="bg-white px-3 text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">ili</span></div>
        </div>

        <GoogleSignInButton />

        {notice && (
          <p role="status" aria-live="polite" className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-3 text-sm leading-relaxed text-tone-positive">
            {notice}
          </p>
        )}

        <p className="mt-5 text-center text-sm text-zinc-600 dark:text-zinc-300">
          {tab === 'login' ? 'Nemaš nalog? ' : 'Već imaš nalog? '}
          <button
            type="button"
            onClick={() => switchTab(tab === 'login' ? 'register' : 'login')}
            className="min-h-10 rounded-md px-1 font-semibold text-brand-text transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700"
          >
            {tab === 'login' ? 'Registruj se' : 'Prijavi se'}
          </button>
        </p>

        <p className="mx-auto mt-3 max-w-sm text-center text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400">
          Registracijom prihvataš Uslove korišćenja i Politiku privatnosti.
        </p>
      </div>
    </section>
  );
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className="mt-1.5 flex items-start gap-1.5 text-xs font-medium leading-relaxed text-tone-negative">
      <TriangleAlert size={13} className="mt-0.5 flex-shrink-0" aria-hidden="true" />
      {message}
    </p>
  );
}
