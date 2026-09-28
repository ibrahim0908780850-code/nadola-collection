export const ENV = {
  supabaseDatabaseUrl: process.env.SUPABASE_DATABASE_URL ?? "",
  supabaseUrl: process.env.VITE_SUPABASE_URL ?? "",
  supabasePublishableKey: process.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? "",
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  ownerEmail: process.env.OWNER_EMAIL ?? "",
  isProduction: process.env.NODE_ENV === "production",
};
