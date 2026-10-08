'use client';

import { useState } from 'react';
import { Mail, Lock, User, Phone, Eye, EyeOff, ArrowRight, ArrowLeftRight, TriangleAlert } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { isValidPhoneNumber } from '@/lib/phone';
import GoogleSignInButton from '@/components/GoogleSignInButton';

type Tab = 'login' | 'register';
type Field = 'name' | 'email' | 'password' | 'phone';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
interface AuthScreenProps {
  /** Shrinks the hero when the overlay already explains why we are asking. */
  compact?: boolean;
}

export default function AuthScreen({ compact = false }: AuthScreenProps) {
  const { signIn, signUp, resetPassword } = useAuth();
  const [tab, setTab] = useState<Tab>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState('');

  function validate(): Partial<Record<Field, string>> {
    const next: Partial<Record<Field, string>> = {};

    if (tab === 'register' && name.trim().length < 3) {
      next.name = 'Unesi ime i prezime.';
    }
    if (tab === 'register' && !isValidPhoneNumber(phone)) {
      next.phone = 'Unesi ispravan broj telefona.';
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
      : await signUp(email.trim(), password, name.trim(), phone.trim());
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
    'w-full rounded-xl border bg-elevated py-3 pl-10 text-sm text-app-primary dark:text-zinc-100 outline-none transition-colors placeholder:text-app-muted focus:ring-2 focus:ring-brand-500/10';
  const inputOk = 'border-surface dark:border-zinc-800 focus:border-brand-500';
  const inputBad = 'border-rose-500/70 focus:border-rose-500';

  function fieldClass(field: Field, extra = 'pr-4') {
    return `${inputBase} ${extra} ${errors[field] ? inputBad : inputOk}`;
  }

  return (
    <div className="flex min-h-screen flex-col px-6">
      <div
        className={`flex flex-col items-center justify-center ${
          compact ? 'pb-6 pt-8' : 'flex-1 pb-8 pt-12'
        }`}
      >
        <div
          className={`mb-4 flex items-center justify-center rounded-2xl bg-brand-500 shadow-lg shadow-brand-500/20 ${
            compact ? 'h-12 w-12' : 'h-16 w-16'
          }`}
        >
          <ArrowLeftRight size={compact ? 22 : 30} className="text-zinc-950" strokeWidth={2.5} />
        </div>
        <h1
          className={`font-bold tracking-tight text-app-primary dark:text-zinc-100 ${
            compact ? 'text-xl' : 'text-2xl'
          }`}
        >
          AutoTrampa
        </h1>
        <p className="mt-1 text-sm text-app-muted">Pronađi sledeću zamenu</p>
      </div>

      <div className="space-y-5 pb-10">
        <div className="flex rounded-xl border border-surface dark:border-zinc-800 bg-elevated p-1" role="tablist">
          {(['login', 'register'] as const).map((key) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={tab === key}
              onClick={() => switchTab(key)}
              className={`flex-1 rounded-lg py-2.5 text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${
                tab === key
                  ? 'bg-brand-500 text-zinc-950'
                  : 'text-app-secondary dark:text-zinc-400 hover:text-app-primary dark:text-zinc-100'
              }`}
            >
              {key === 'login' ? 'Prijavi se' : 'Registruj se'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-3">
          {tab === 'register' && (
            <div>
              <label htmlFor="auth-name" className="mb-1.5 block text-xs font-medium text-app-secondary dark:text-zinc-400">
                Ime i prezime
              </label>
              <div className="relative">
                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-app-muted" />
                <input
                  id="auth-name"
                  type="text"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nikola Vukovic"
                  aria-invalid={Boolean(errors.name)}
                  className={fieldClass('name')}
                />
              </div>
              <FieldError message={errors.name} />
            </div>
          )}

          {tab === 'register' && (
            <div>
              <label htmlFor="auth-phone" className="mb-1.5 block text-xs font-medium text-app-secondary dark:text-zinc-400">
                Broj telefona <span className="text-brand-400">(obavezno)</span>
              </label>
              <div className="relative">
                <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-app-muted" />
                <input
                  id="auth-phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+381 64 123 4567"
                  aria-invalid={Boolean(errors.phone)}
                  required
                  className={fieldClass('phone')}
                />
              </div>
              <FieldError message={errors.phone} />
            </div>
          )}

          <div>
            <label htmlFor="auth-email" className="mb-1.5 block text-xs font-medium text-app-secondary dark:text-zinc-400">
              Email adresa
            </label>
            <div className="relative">
              <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-app-muted" />
              <input
                id="auth-email"
                type="text"
                inputMode="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              placeholder="nikola@example.com"
                aria-invalid={Boolean(errors.email)}
                className={fieldClass('email')}
              />
            </div>
            <FieldError message={errors.email} />
          </div>

          <div>
            <label htmlFor="auth-password" className="mb-1.5 block text-xs font-medium text-app-secondary dark:text-zinc-400">
              Lozinka
            </label>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-app-muted" />
              <input
                id="auth-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                aria-invalid={Boolean(errors.password)}
                className={fieldClass('password', 'pr-10')}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Sakrij lozinku' : 'Prikaži lozinku'}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-app-muted transition-colors hover:text-app-secondary dark:text-zinc-400"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <FieldError message={errors.password} />
          </div>

          {tab === 'login' && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handlePasswordReset}
                disabled={submitting}
                className="text-xs text-brand-400 transition-colors hover:text-brand-400"
              >
                Zaboravili ste lozinku?
              </button>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="btn-primary mt-1 w-full text-sm"
          >
            {tab === 'login' ? 'Prijavi se' : 'Napravi nalog'}
            <ArrowRight size={16} strokeWidth={2.5} />
          </button>
        </form>

        <div className="relative py-1" aria-hidden="true">
          <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-surface dark:border-zinc-800" /></div>
          <div className="relative flex justify-center"><span className="bg-app px-3 text-[10px] uppercase tracking-wider text-app-muted dark:bg-zinc-950">ili</span></div>
        </div>
        <GoogleSignInButton />

        {notice && <p role="status" className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2.5 text-sm text-emerald-400">{notice}</p>}

        <p className="text-center text-xs text-app-muted">
          {tab === 'login' ? 'Nemate nalog? ' : 'Već imate nalog? '}
          <button
            type="button"
            onClick={() => switchTab(tab === 'login' ? 'register' : 'login')}
            className="font-medium text-brand-400 transition-colors hover:text-brand-400"
          >
            {tab === 'login' ? 'Registruj se' : 'Prijavi se'}
          </button>
        </p>

        <p className="pt-2 text-center text-[10px] leading-relaxed text-app-muted opacity-70">
          Registracijom prihvatate Uslove korišćenja i Politiku privatnosti.
        </p>
      </div>
    </div>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-rose-400">
      <TriangleAlert size={12} className="flex-shrink-0" />
      {message}
    </p>
  );
}
