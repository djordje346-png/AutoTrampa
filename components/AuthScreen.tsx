'use client';

import { useState } from 'react';
import { Mail, Lock, User, Eye, EyeOff, ArrowRight, ArrowLeftRight, TriangleAlert } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

type Tab = 'login' | 'register';
type Field = 'name' | 'email' | 'password';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^\+?[\d\s/-]{6,}$/;

export default function AuthScreen() {
  const { login } = useAuth();
  const [tab, setTab] = useState<Tab>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [submitting, setSubmitting] = useState(false);

  function validate(): Partial<Record<Field, string>> {
    const next: Partial<Record<Field, string>> = {};

    if (tab === 'register' && name.trim().length < 3) {
      next.name = 'Unesi ime i prezime.';
    }

    const identifier = email.trim();
    if (!identifier) {
      next.email = 'Unesi email ili broj telefona.';
    } else if (!EMAIL_RE.test(identifier) && !PHONE_RE.test(identifier)) {
      next.email = 'Format nije ispravan. Npr. nikola@example.com ili +381641234567.';
    }

    if (password.length < 6) {
      next.password = 'Lozinka mora imati bar 6 karaktera.';
    }

    return next;
  }

  function switchTab(next: Tab) {
    setTab(next);
    setErrors({});
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSubmitting(true);
    const identifier = email.trim();
    login({
      ...(tab === 'register' && name.trim() ? { name: name.trim() } : {}),
      ...(EMAIL_RE.test(identifier) ? { email: identifier } : { phone: identifier }),
    });
  }

  const inputBase =
    'w-full rounded-xl border bg-elevated py-3 pl-10 text-sm text-app-primary outline-none transition-colors placeholder:text-app-muted focus:ring-2 focus:ring-orange-500/10';
  const inputOk = 'border-surface focus:border-orange-500';
  const inputBad = 'border-rose-500/70 focus:border-rose-500';

  function fieldClass(field: Field, extra = 'pr-4') {
    return `${inputBase} ${extra} ${errors[field] ? inputBad : inputOk}`;
  }

  return (
    <div className="flex min-h-screen flex-col px-6">
      <div className="flex flex-1 flex-col items-center justify-center pb-8 pt-12">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-500 shadow-lg shadow-orange-500/20">
          <ArrowLeftRight size={30} className="text-white" strokeWidth={2.5} />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-app-primary">AutoTrampa</h1>
        <p className="mt-1 text-sm text-app-muted">Pronađi sledeću zamenu</p>
      </div>

      <div className="space-y-5 pb-10">
        <div className="flex rounded-xl border border-surface bg-elevated p-1" role="tablist">
          {(['login', 'register'] as const).map((key) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={tab === key}
              onClick={() => switchTab(key)}
              className={`flex-1 rounded-lg py-2.5 text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 ${
                tab === key
                  ? 'bg-orange-500 text-white'
                  : 'text-app-secondary hover:text-app-primary'
              }`}
            >
              {key === 'login' ? 'Prijavi se' : 'Registruj se'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-3">
          {tab === 'register' && (
            <div>
              <label htmlFor="auth-name" className="mb-1.5 block text-xs font-medium text-app-secondary">
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

          <div>
            <label htmlFor="auth-email" className="mb-1.5 block text-xs font-medium text-app-secondary">
              Email ili broj telefona
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
            <label htmlFor="auth-password" className="mb-1.5 block text-xs font-medium text-app-secondary">
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
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-app-muted transition-colors hover:text-app-secondary"
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
                onClick={() => setErrors({ email: 'Resetovanje lozinke stiže uz nalog na serveru.' })}
                className="text-xs text-orange-400 transition-colors hover:text-orange-300"
              >
                Zaboravili ste lozinku?
              </button>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 py-3.5 text-sm font-bold text-white transition-all duration-200 hover:bg-orange-400 active:scale-[0.98] disabled:opacity-70"
          >
            {tab === 'login' ? 'Prijavi se' : 'Napravi nalog'}
            <ArrowRight size={16} strokeWidth={2.5} />
          </button>
        </form>

        <p className="text-center text-xs text-app-muted">
          {tab === 'login' ? 'Nemate nalog? ' : 'Već imate nalog? '}
          <button
            type="button"
            onClick={() => switchTab(tab === 'login' ? 'register' : 'login')}
            className="font-medium text-orange-400 transition-colors hover:text-orange-300"
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
