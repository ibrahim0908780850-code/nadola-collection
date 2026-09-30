const clean = (value: string | undefined) =>
  (value ?? "").trim().replace(/^(['"])(.*)\1$/, "$2");

export const ENV = {
  supabaseDatabaseUrl: clean(process.env.SUPABASE_DATABASE_URL),
  supabaseUrl: clean(
    process.env.SUPABASE_URL ??
      process.env.VITE_SUPABASE_URL ??
      process.env.NEXT_PUBLIC_SUPABASE_URL
  ),
  supabasePublishableKey: clean(
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
      process.env.VITE_SUPABASE_ANON_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ),
  supabaseSecretKey: clean(
    process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY
  ),
  ownerOpenId: clean(process.env.OWNER_OPEN_ID),
  ownerEmail: clean(process.env.OWNER_EMAIL),
  isProduction: process.env.NODE_ENV === "production",
};
