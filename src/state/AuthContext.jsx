/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from 'react';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

const LOCAL_AUTH_KEY = 'n4-daily-local-user-v1';
const LOCAL_DEVICE_ID_KEY = 'n4-daily-local-device-id-v1';
const AuthContext = createContext(null);

const readLocalUser = () => {
  if (isSupabaseConfigured) return null;
  try {
    return JSON.parse(localStorage.getItem(LOCAL_AUTH_KEY));
  } catch {
    return null;
  }
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readLocalUser);
  const [loading, setLoading] = useState(isSupabaseConfigured);

  useEffect(() => {
    if (!supabase) return undefined;
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setUser(data.session?.user || null);
      setLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      setLoading(false);
    });
    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const signIn = async ({ email, password }) => {
    if (!supabase) return { error: new Error('Supabase is not configured.') };
    return supabase.auth.signInWithPassword({ email, password });
  };

  const signUp = async ({ email, password, displayName }) => {
    if (!supabase) return { error: new Error('Supabase is not configured.') };
    return supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName.trim() } },
    });
  };

  const continueLocally = (displayName) => {
    const saved = readLocalUser();
    const deviceId = localStorage.getItem(LOCAL_DEVICE_ID_KEY) || `local-${crypto.randomUUID()}`;
    localStorage.setItem(LOCAL_DEVICE_ID_KEY, deviceId);
    const localUser = saved || {
      id: deviceId,
      email: '',
      user_metadata: { display_name: displayName.trim() || 'Learner' },
      isLocal: true,
    };
    localStorage.setItem(LOCAL_AUTH_KEY, JSON.stringify(localUser));
    setUser(localUser);
  };

  const signOut = async () => {
    if (supabase && !user?.isLocal) {
      return supabase.auth.signOut();
    }
    localStorage.removeItem(LOCAL_AUTH_KEY);
    setUser(null);
    return { error: null };
  };

  const value = {
    user,
    loading,
    configured: isSupabaseConfigured,
    signIn,
    signUp,
    signOut,
    continueLocally,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
};
