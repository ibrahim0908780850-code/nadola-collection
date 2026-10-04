import { supabase } from "@/lib/supabase";
import { useCallback, useEffect, useState } from "react";

type UseAuthOptions = { redirectOnUnauthenticated?: boolean; redirectPath?: string };
type ClientUser = { id: number; openId: string; name: string | null; email: string | null; role: "admin" | "user"; loginMethod: string };

function toUser(authUser: { id: string; email?: string; user_metadata?: Record<string, unknown> } | null): ClientUser | null {
  if (!authUser) return null;
  const email = authUser.email ?? null;
  return {
    id: 0,
    openId: `supabase:${authUser.id}`,
    name: (authUser.user_metadata?.full_name as string | undefined) ?? (authUser.user_metadata?.name as string | undefined) ?? email,
    email,
    role: email?.toLowerCase() === "ibrahimahmed@gmail.com" ? "admin" : "user",
    loginMethod: "supabase",
  };
}

export function useAuth(options?: UseAuthOptions) {
  const { redirectOnUnauthenticated = false, redirectPath } = options ?? {};
  const [user, setUser] = useState<ClientUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    if (!supabase) { setLoading(false); return; }
    supabase.auth.getSession().then(({ data }) => { if (active) { setUser(toUser(data.session?.user ?? null)); setLoading(false); } });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => { if (active) { setUser(toUser(session?.user ?? null)); setLoading(false); } });
    return () => { active = false; data.subscription.unsubscribe(); };
  }, []);

  const logout = useCallback(async () => { if (supabase) await supabase.auth.signOut(); setUser(null); }, []);

  useEffect(() => {
    if (!redirectOnUnauthenticated || loading || user || typeof window === "undefined") return;
    if (redirectPath && window.location.pathname === redirectPath) return;
    window.location.href = redirectPath ?? "/login";
  }, [redirectOnUnauthenticated, redirectPath, loading, user]);

  return { user, loading, error: null, isAuthenticated: Boolean(user), refresh: async () => undefined, logout };
}
