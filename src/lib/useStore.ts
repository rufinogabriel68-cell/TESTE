import { useCallback, useEffect, useRef, useState } from 'react';
import type { Session, SupabaseClient } from '@supabase/supabase-js';
import { emptyDB, type DB } from '../types';
import { getSupabase, getDeviceId, getDeviceName, getStoredCreds } from './supabase';

export type SyncState = 'synced' | 'syncing' | 'offline';
export type LockState = {
  /** Este dispositivo detém a trava de edição? */
  isEditor: boolean;
  /** Há outro dispositivo editando agora? */
  otherDevice: string | null;
};

const LOCK_TTL_MS = 30_000; // trava expira após 30s sem heartbeat
const HEARTBEAT_MS = 10_000;

const LOCAL_KEY = 'gbr_v3_supabase';

function loadLocal(): DB {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...emptyDB(), ...parsed, config: { ...emptyDB().config, ...(parsed.config || {}) },
        financeiro: { receitas: parsed.financeiro?.receitas || [], despesas: parsed.financeiro?.despesas || [] } };
    }
  } catch { /* ignore */ }
  return emptyDB();
}

function saveLocal(db: DB) {
  try { localStorage.setItem(LOCAL_KEY, JSON.stringify(db)); } catch { /* ignore */ }
}

export function useStore() {
  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [db, setDb] = useState<DB>(loadLocal);
  const [sync, setSync] = useState<SyncState>('synced');
  const [lock, setLock] = useState<LockState>({ isEditor: false, otherDevice: null });
  const [hasSupabase, setHasSupabase] = useState<boolean>(!!getStoredCreds().url);

  const dbRef = useRef(db);
  dbRef.current = db;
  const sb = useRef<SupabaseClient | null>(getSupabase());
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const heartbeatTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const lockPollTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const deviceId = getDeviceId();

  /* ── AUTH ── */
  useEffect(() => {
    const client = sb.current;
    if (!client) { setAuthReady(true); return; }
    client.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthReady(true);
    });
    const { data: listener } = client.auth.onAuthStateChange((_e, s) => {
      setSession(s);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  /* ── CARREGA dados do servidor (servidor é a fonte da verdade) ── */
  const pullFromServer = useCallback(async () => {
    const client = sb.current;
    if (!client || !session) return;
    setSync('syncing');
    const { data, error } = await client
      .from('workspaces')
      .select('data')
      .eq('user_id', session.user.id)
      .maybeSingle();
    if (error) {
      setSync('offline');
      return;
    }
    if (data?.data && Object.keys(data.data).length) {
      const remote = data.data as DB;
      const merged: DB = { ...emptyDB(), ...remote,
        config: { ...emptyDB().config, ...(remote.config || {}) },
        financeiro: { receitas: remote.financeiro?.receitas || [], despesas: remote.financeiro?.despesas || [] } };
      setDb(merged);
      saveLocal(merged);
    } else {
      // Nenhum dado no servidor: faz upload do local (primeira sincronização)
      await client.from('workspaces').upsert({
        user_id: session.user.id,
        data: dbRef.current,
        updated_at: new Date().toISOString(),
      });
    }
    setSync('synced');
  }, [session]);

  /* ── TRAVA DE EDIÇÃO ── */
  const checkLock = useCallback(async (): Promise<boolean> => {
    const client = sb.current;
    if (!client || !session) return false;
    const { data } = await client
      .from('edit_locks')
      .select('device_id, device_name, heartbeat')
      .eq('user_id', session.user.id)
      .maybeSingle();

    if (!data) {
      setLock({ isEditor: false, otherDevice: null });
      return true; // sem trava → disponível
    }
    const age = Date.now() - new Date(data.heartbeat).getTime();
    const expired = age > LOCK_TTL_MS;
    if (data.device_id === deviceId) {
      setLock({ isEditor: true, otherDevice: null });
      return true;
    }
    if (expired) {
      setLock({ isEditor: false, otherDevice: null });
      return true; // trava de outro expirou → disponível
    }
    setLock({ isEditor: false, otherDevice: data.device_name || 'Outro dispositivo' });
    return false;
  }, [session, deviceId]);

  const acquireLock = useCallback(async (): Promise<boolean> => {
    const client = sb.current;
    if (!client || !session) return false;
    const available = await checkLock();
    if (!available) return false;
    const { error } = await client.from('edit_locks').upsert({
      user_id: session.user.id,
      device_id: deviceId,
      device_name: getDeviceName(),
      heartbeat: new Date().toISOString(),
    });
    if (error) return false;
    setLock({ isEditor: true, otherDevice: null });
    return true;
  }, [session, deviceId, checkLock]);

  const releaseLock = useCallback(async () => {
    const client = sb.current;
    if (!client || !session) return;
    // só libera se for nossa
    await client.from('edit_locks').delete()
      .eq('user_id', session.user.id)
      .eq('device_id', deviceId);
    setLock({ isEditor: false, otherDevice: null });
  }, [session, deviceId]);

  /* ── Após login: pull + checa trava + heartbeat ── */
  useEffect(() => {
    if (!session || !sb.current) return;
    pullFromServer();
    acquireLock();

    heartbeatTimer.current = setInterval(async () => {
      const client = sb.current;
      if (!client || !session) return;
      if (lockRef.current.isEditor) {
        await client.from('edit_locks').update({ heartbeat: new Date().toISOString() })
          .eq('user_id', session.user.id)
          .eq('device_id', deviceId);
      }
    }, HEARTBEAT_MS);

    lockPollTimer.current = setInterval(async () => {
      const wasEditor = lockRef.current.isEditor;
      const available = await checkLock();
      // se ganhamos disponibilidade e não éramos editor, tenta adquirir
      if (available && !lockRef.current.isEditor && !wasEditor) {
        await acquireLock();
      }
      // se somos viewer, atualiza dados do servidor periodicamente
      if (!lockRef.current.isEditor) {
        await pullFromServer();
      }
    }, HEARTBEAT_MS);

    const onUnload = () => {
      const client = sb.current;
      if (client && session && lockRef.current.isEditor) {
        // best-effort
        navigator.sendBeacon?.(
          `${getStoredCreds().url}/rest/v1/edit_locks?user_id=eq.${session.user.id}&device_id=eq.${deviceId}`,
        );
      }
    };
    window.addEventListener('beforeunload', onUnload);

    return () => {
      if (heartbeatTimer.current) clearInterval(heartbeatTimer.current);
      if (lockPollTimer.current) clearInterval(lockPollTimer.current);
      window.removeEventListener('beforeunload', onUnload);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  const lockRef = useRef(lock);
  lockRef.current = lock;

  /* ── SALVAR no servidor (autoritativo, sem merge → deleções persistem) ── */
  const pushToServer = useCallback(async (next: DB) => {
    const client = sb.current;
    if (!client || !session) {
      setSync('offline');
      return;
    }
    if (!lockRef.current.isEditor) {
      setSync('offline');
      return;
    }
    setSync('syncing');
    const { error } = await client.from('workspaces').upsert({
      user_id: session.user.id,
      data: next,
      updated_at: new Date().toISOString(),
    });
    setSync(error ? 'offline' : 'synced');
  }, [session]);

  /* ── Mutação central: aplica localmente e agenda push ── */
  const mutate = useCallback((updater: (prev: DB) => DB) => {
    setDb(prev => {
      const next = updater(prev);
      saveLocal(next);
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => pushToServer(next), 900);
      return next;
    });
  }, [pushToServer]);

  const refreshCreds = useCallback(() => {
    sb.current = getSupabase();
    setHasSupabase(!!getStoredCreds().url);
  }, []);

  return {
    session, authReady, db, sync, lock, hasSupabase,
    supabase: sb.current,
    mutate, setDb,
    pullFromServer, acquireLock, releaseLock, checkLock,
    refreshCreds,
    canEdit: lock.isEditor,
  };
}
