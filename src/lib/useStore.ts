import { useCallback, useEffect, useRef, useState } from 'react';
import type { Session, SupabaseClient } from '@supabase/supabase-js';
import { emptyDB, type DB } from '../types';
import { getSupabase, getStoredCreds } from './supabase';

export type SyncState = 'synced' | 'syncing' | 'offline';

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
  const [hasSupabase, setHasSupabase] = useState<boolean>(!!getStoredCreds().url);

  const dbRef = useRef(db);
  dbRef.current = db;
  const sb = useRef<SupabaseClient | null>(getSupabase());
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  /* ── Após login: pull de dados ── */
  useEffect(() => {
    if (!session || !sb.current) return;
    pullFromServer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  /* ── SALVAR no servidor (autoritativo, sem merge → deleções persistem) ── */
  const pushToServer = useCallback(async (next: DB) => {
    const client = sb.current;
    if (!client || !session) {
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
    session, authReady, db, sync, hasSupabase,
    supabase: sb.current,
    mutate, setDb,
    pullFromServer,
    refreshCreds,
    canEdit: true,
  };
}
