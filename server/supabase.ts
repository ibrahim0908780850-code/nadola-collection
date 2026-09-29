import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { ENV } from "./_core/env";

let supabaseAdmin: SupabaseClient;
try {
  supabaseAdmin = createClient(ENV.supabaseUrl, ENV.supabaseServiceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });
} catch (error) {
  console.error("[Supabase] Invalid server configuration", error instanceof Error ? error.message : "unknown error");
  supabaseAdmin = createClient("https://placeholder.supabase.co", "sb_publishable_placeholder", { auth: { autoRefreshToken: false, persistSession: false } });
}
export { supabaseAdmin };

export async function getSupabaseUser(accessToken: string) {
  if (!ENV.supabaseUrl || !ENV.supabaseServiceRoleKey) return null;
  const { data, error } = await supabaseAdmin.auth.getUser(accessToken);
  if (error || !data.user) return null;
  return data.user;
}
