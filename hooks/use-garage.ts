'use client';

import { useState, useEffect, useCallback } from 'react';
import { MyGarageCar } from '@/types';
import { DEFAULT_GARAGE_CARS } from '@/lib/cars';

const STORAGE_KEY = 'autotrampa_garage';
const SELECTED_KEY = 'autotrampa_selected_car';

function loadCars(): MyGarageCar[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return DEFAULT_GARAGE_CARS;
}

function loadSelectedId(): string {
  try {
    return localStorage.getItem(SELECTED_KEY) || DEFAULT_GARAGE_CARS[0].id;
  } catch {
    return DEFAULT_GARAGE_CARS[0].id;
  }
}

export function useGarage() {
  const [cars, setCars] = useState<MyGarageCar[]>(DEFAULT_GARAGE_CARS);
  const [selectedId, setSelectedId] = useState<string>(DEFAULT_GARAGE_CARS[0].id);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setCars(loadCars());
    setSelectedId(loadSelectedId());
    setMounted(true);
  }, []);

  const persist = useCallback((next: MyGarageCar[]) => {
    setCars(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {}
  }, []);

  const selectCar = useCallback((id: string) => {
    setSelectedId(id);
    try {
      localStorage.setItem(SELECTED_KEY, id);
    } catch {}
  }, []);

  const addCar = useCallback((car: MyGarageCar) => {
    setCars(prev => {
      const next = [...prev, car];
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  const updateCar = useCallback((car: MyGarageCar) => {
    setCars(prev => {
      const next = prev.map(c => (c.id === car.id ? car : c));
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  const removeCar = useCallback((id: string) => {
    setCars(prev => {
      const next = prev.filter(c => c.id !== id);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {}
      // If removing selected, pick the first remaining
      setSelectedId(curr => {
        if (curr !== id) return curr;
        const newId = next[0]?.id || DEFAULT_GARAGE_CARS[0].id;
        try {
          localStorage.setItem(SELECTED_KEY, newId);
        } catch {}
        return newId;
      });
      return next;
    });
  }, []);

  const selectedCar = cars.find(c => c.id === selectedId) || cars[0] || DEFAULT_GARAGE_CARS[0];

  return {
    cars,
    selectedCar,
    selectedId,
    selectCar,
    addCar,
    updateCar,
    removeCar,
    persist,
    mounted,
  };
}
