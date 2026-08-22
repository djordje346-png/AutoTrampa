'use client';

import { useState } from 'react';
import { Mail, Lock, User, Eye, EyeOff, ArrowRight, ArrowLeftRight } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

export default function AuthScreen() {
  const { login } = useAuth();
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    login();
  }

  return (
    <div className="flex flex-col min-h-screen px-6">
      {/* Brand section */}
      <div className="flex-1 flex flex-col items-center justify-center pt-12 pb-8">
        <div className="w-16 h-16 rounded-2xl bg-amber-500 flex items-center justify-center mb-4 shadow-lg shadow-amber-500/20">
          <ArrowLeftRight size={30} className="text-black" strokeWidth={2.5} />
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">AutoTrampa</h1>
        <p className="text-sm text-slate-500 mt-1">Pronađi sledeću zamenu</p>
      </div>

      {/* Auth form card */}
      <div className="pb-10 space-y-5">
        {/* Tab switcher */}
        <div className="flex bg-slate-900 rounded-xl p-1 border border-slate-800">
          <button
            onClick={() => setTab('login')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
              tab === 'login' ? 'bg-amber-500 text-black' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Prijavi se
          </button>
          <button
            onClick={() => setTab('register')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
              tab === 'register' ? 'bg-amber-500 text-black' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Registruj se
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {tab === 'register' && (
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Ime i prezime</label>
              <div className="relative">
                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Nikola Vukovic"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Email ili broj telefona</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="nikola@example.com"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Lozinka</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-10 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {tab === 'login' && (
            <div className="flex justify-end">
              <button type="button" className="text-xs text-amber-400 hover:text-amber-300 transition-colors">
                Zaboravili ste lozinku?
              </button>
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-amber-500 hover:bg-amber-400 text-black font-bold py-3.5 rounded-xl text-sm transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2 mt-1"
          >
            {tab === 'login' ? 'Prijavi se' : 'Napravi nalog'}
            <ArrowRight size={16} strokeWidth={2.5} />
          </button>
        </form>

        {tab === 'login' && (
          <p className="text-center text-xs text-slate-600">
            Nemate nalog?{' '}
            <button onClick={() => setTab('register')} className="text-amber-400 font-medium hover:text-amber-300 transition-colors">
              Registruj se
            </button>
          </p>
        )}

        {tab === 'register' && (
          <p className="text-center text-xs text-slate-600">
            Već imate nalog?{' '}
            <button onClick={() => setTab('login')} className="text-amber-400 font-medium hover:text-amber-300 transition-colors">
              Prijavi se
            </button>
          </p>
        )}

        <p className="text-center text-[10px] text-slate-700 leading-relaxed pt-2">
          Registracijom prihvatate Uslove korišćenja i Politiku privatnosti.
        </p>
      </div>
    </div>
  );
}
