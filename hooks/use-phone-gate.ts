'use client';

import { createMemoryStore, usePersistentStore } from '@/lib/persistent-store';

interface PhoneGateState {
  resume?: () => void;
}

const phoneGateStore = createMemoryStore<PhoneGateState | null>(null);

export function requestPhoneAction(resume: () => void) {
  phoneGateStore.set({ resume });
}

export function usePhoneGate() {
  const [pendingAction] = usePersistentStore(phoneGateStore);

  function cancelPhoneAction() {
    phoneGateStore.set(null);
  }

  function resumePhoneAction() {
    const resume = phoneGateStore.get()?.resume;
    phoneGateStore.set(null);
    resume?.();
  }

  return {
    pending: pendingAction !== null,
    cancelPhoneAction,
    resumePhoneAction,
  };
}
