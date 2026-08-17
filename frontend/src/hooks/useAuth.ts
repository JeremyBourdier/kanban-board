'use client';

import { useState, useEffect, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

const allowedEmailsStr = process.env.NEXT_PUBLIC_ALLOWED_EMAILS || 'bourdierestrellajeremy@gmail.com';
const allowedUsersStr = process.env.NEXT_PUBLIC_ALLOWED_USERS || 'JeremyBourdier';

const allowedEmails = allowedEmailsStr.split(',').map((e) => e.trim().toLowerCase()).filter(Boolean);
const allowedUsers = allowedUsersStr.split(',').map((u) => u.trim().toLowerCase()).filter(Boolean);

export function isUserAuthorized(user: User | null): boolean {
  if (!user) return false;
  const email = (user.email || '').trim().toLowerCase();
  const userName = (
    user.user_metadata?.user_name ||
    user.user_metadata?.preferred_username ||
    user.user_metadata?.name ||
    ''
  ).trim().toLowerCase();

  const isEmailMatch = Boolean(email && allowedEmails.includes(email));
  const isUserMatch = Boolean(userName && allowedUsers.includes(userName));

  return isEmailMatch || isUserMatch;
}

function getStoredSession(): { user: User | null; session: Session | null } {
  if (typeof window === 'undefined') return { user: null, session: null };
  try {
    const keys = [
      'sb-rchvwzvrnnulmfzwmozc-auth-token',
      'supabase.auth.token',
      'sb-auth-token',
    ];
    for (const key of keys) {
      const item = localStorage.getItem(key);
      if (item) {
        const parsed = JSON.parse(item);
        if (parsed?.user) {
          return { user: parsed.user, session: parsed };
        }
      }
    }
  } catch (e) {}
  return { user: null, session: null };
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(() => getStoredSession().user);
  const [session, setSession] = useState<Session | null>(() => getStoredSession().session);
  const [loading, setLoading] = useState(!getStoredSession().user);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    let isMounted = true;

    // Get initial session from Supabase client
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        if (isMounted) {
          setSession(session);
          setUser(session?.user ?? null);
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) setLoading(false);
      });

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (isMounted) {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signInWithGitHub = useCallback(async () => {
    if (!supabase) {
      throw new Error('Supabase client is not configured');
    }

    const redirectTo = typeof window !== 'undefined'
      ? `${window.location.origin}/auth/callback`
      : undefined;

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo,
      },
    });

    if (error) throw error;
  }, []);

  const signOut = useCallback(async () => {
    try {
      const keys = [
        'sb-rchvwzvrnnulmfzwmozc-auth-token',
        'supabase.auth.token',
        'sb-auth-token',
      ];
      keys.forEach((k) => {
        try {
          localStorage.removeItem(k);
        } catch (e) {}
      });
    } catch (e) {}

    if (supabase) {
      try {
        await supabase.auth.signOut();
      } catch (e) {}
    }
    setUser(null);
    setSession(null);
  }, []);

  return {
    user,
    session,
    loading,
    isAuthenticated: Boolean(user),
    isAuthorized: isUserAuthorized(user),
    signInWithGitHub,
    signInWithOAuth: signInWithGitHub,
    signOut,
  };
}
