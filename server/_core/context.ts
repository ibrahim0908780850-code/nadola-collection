import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { getUserByOpenId, upsertUser } from "../db";
import { ENV } from "./env";
import { getSupabaseUser } from "../supabase";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

function bearerToken(req: CreateExpressContextOptions["req"]) {
  const header = req.headers.authorization;
  const fetchHeader = typeof (req.headers as unknown as { get?: (name: string) => string | null }).get === "function"
    ? (req.headers as unknown as { get: (name: string) => string | null }).get("authorization")
    : undefined;
  const value = header ?? fetchHeader ?? undefined;
  return value?.startsWith("Bearer ") ? value.slice(7) : undefined;
}

async function authenticateSupabase(req: CreateExpressContextOptions["req"]): Promise<User | undefined> {
  const token = bearerToken(req);
  if (!token) return undefined;
  const authUser = await getSupabaseUser(token);
  if (!authUser?.id) return undefined;
  const openId = `supabase:${authUser.id}`;
  const existing = await getUserByOpenId(openId);
  if (!existing) {
    await upsertUser({
      openId,
      email: authUser.email ?? null,
      name: (authUser.user_metadata?.full_name as string | undefined) ?? (authUser.user_metadata?.name as string | undefined) ?? null,
      loginMethod: "supabase",
      role: ENV.ownerEmail && authUser.email === ENV.ownerEmail ? "admin" : "user",
      lastSignedIn: new Date(),
    });
    return getUserByOpenId(openId);
  }
  return existing;
}

export async function createContext(opts: CreateExpressContextOptions): Promise<TrpcContext> {
  let user: User | null = null;
  try { user = await authenticateSupabase(opts.req) ?? null; } catch { user = null; }
  return { req: opts.req, res: opts.res, user };
}
