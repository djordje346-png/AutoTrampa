'use client';

import { useState, useEffect, useCallback } from 'react';

const AUTH_KEY = 'autotrampa_auth';

// 1. Globalne promenljive van komponente (dele ih svi ekrani)
let globalIsLoggedIn = false;
if (typeof window !== 'undefined') {
  globalIsLoggedIn = localStorage.getItem(AUTH_KEY) === 'true';
}

// Kolekcija funkcija koje slušaju promene
const listeners = new Set<(state: boolean) => void>();

// Centralna funkcija za promenu stanja
function setGlobalIsLoggedIn(state: boolean) {
  globalIsLoggedIn = state;
  if (typeof window !== 'undefined') {
    localStorage.setItem(AUTH_KEY, String(state));
  }
  // Obavesti sve ekrane koji koriste ovaj hook da se stanje promenilo
  listeners.forEach((listener) => listener(state));
}

// 2. Sam Hook
export function useAuth() {
  const [isLoggedIn, setIsLoggedIn] = useState(globalIsLoggedIn);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Prijavi ovu komponentu da sluša promene
    const listener = (newState: boolean) => {
      setIsLoggedIn(newState);
    };
    
    listeners.add(listener);
    
    // Odjavi je kada se komponenta uništi
    return () => {
      listeners.delete(listener);
    };
  }, []);

  const login = useCallback(() => {
    setGlobalIsLoggedIn(true);
  }, []);

  const logout = useCallback(() => {
    setGlobalIsLoggedIn(false);
  }, []);

  return { isLoggedIn, mounted, login, logout };
}