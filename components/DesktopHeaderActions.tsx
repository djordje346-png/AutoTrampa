'use client';

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

interface DesktopHeaderActionsValue {
  action: ReactNode;
  setAction: (action: ReactNode) => void;
}

const DesktopHeaderActionsContext = createContext<DesktopHeaderActionsValue | null>(null);

export function DesktopHeaderActionsProvider({ children }: { children: ReactNode }) {
  const [action, setActionState] = useState<ReactNode>(null);
  const setAction = useCallback((nextAction: ReactNode) => setActionState(nextAction), []);
  const value = useMemo(() => ({ action, setAction }), [action, setAction]);

  return (
    <DesktopHeaderActionsContext.Provider value={value}>
      {children}
    </DesktopHeaderActionsContext.Provider>
  );
}

export function useDesktopHeaderActions() {
  const context = useContext(DesktopHeaderActionsContext);
  if (!context) throw new Error('useDesktopHeaderActions mora biti unutar DesktopHeaderActionsProvider.');
  return context;
}
