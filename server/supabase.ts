import { createClient } from "@supabase/supabase-js";
import { ENV } from "./_core/env";

export const supabaseAdmin = createClient(ENV.supabaseUrl, ENV.supabaseServiceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

export async function getSupabaseUser(accessToken: string) {
  if (!ENV.supabaseUrl || !ENV.supabaseServiceRoleKey) return null;
  const { data, error } = await supabaseAdmin.auth.getUser(accessToken);
  if (error || !data.user) return null;
  return data.user;
}
