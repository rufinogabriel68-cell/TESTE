import { createContext, useContext } from 'react';
import type { useStore } from './useStore';

type ToastType = 'info' | 'success' | 'error' | 'warn';

export interface AppCtx extends ReturnType<typeof useStore> {
  toast: (msg: string, type?: ToastType) => void;
  guardEdit: () => boolean;
}

export const AppContext = createContext<AppCtx | null>(null);

export function useApp(): AppCtx {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppContext');
  return ctx;
}
