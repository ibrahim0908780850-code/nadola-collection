import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { getUserByOpenId, upsertUser } from "../db";
import { jwtVerify } from "jose";
import { LOCAL_AUTH_COOKIE } from "@shared/const";
import { sdk } from "./sdk";
import { ENV } from "./env";
import { getSupabaseUser } from "../supabase";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

function bearerToken(req: CreateExpressContextOptions["req"]) {
  const header = req.headers.authorization;
  return header?.startsWith("Bearer ") ? header.slice(7) : undefined;
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

async function authenticateLocal(req: CreateExpressContextOptions["req"]): Promise<User | undefined> {
  const token = (req.headers.cookie ?? "").split(";").map((part) => part.trim().split("=")).find(([name]) => name === LOCAL_AUTH_COOKIE)?.[1];
  if (!token || !ENV.cookieSecret) return undefined;
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(ENV.cookieSecret));
    const openId = typeof payload.sub === "string" ? payload.sub : undefined;
    return openId ? getUserByOpenId(openId) : undefined;
  } catch { return undefined; }
}

export async function createContext(opts: CreateExpressContextOptions): Promise<TrpcContext> {
  let user: User | null = null;
  try { user = await authenticateSupabase(opts.req) ?? null; } catch { user = null; }
  if (!user) { try { user = await sdk.authenticateRequest(opts.req); } catch { user = null; } }
  if (!user) user = (await authenticateLocal(opts.req)) ?? null;
  return { req: opts.req, res: opts.res, user };
}

export { LOCAL_AUTH_COOKIE };
