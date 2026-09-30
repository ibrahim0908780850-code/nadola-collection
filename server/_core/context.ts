import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import type { User } from "../../drizzle/schema";
import { getUserByOpenId, upsertUser } from "../db";
import { ENV } from "./env";
import { getSupabaseUser } from "../supabase";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"] | Request;
  res?: CreateExpressContextOptions["res"];
  resHeaders?: Headers;
  user: User | null;
};

function authorizationHeader(headers: Headers): string | undefined {
  const value = headers.get("authorization");
  return value?.startsWith("Bearer ") ? value.slice(7).trim() : undefined;
}

export function bearerTokenFromHeaders(headers: Headers) {
  return authorizationHeader(headers);
}

function ownerIsAdmin(email: string | undefined) {
  const ownerEmail = ENV.ownerEmail.trim().toLowerCase();
  return Boolean(ownerEmail && email?.trim().toLowerCase() === ownerEmail);
}

async function authenticate(headers: Headers): Promise<User | null> {
  const token = authorizationHeader(headers);
  if (!token) return null;

  const authUser = await getSupabaseUser(token);
  if (!authUser?.id) return null;

  const openId = `supabase:${authUser.id}`;
  try {
    const existing = await getUserByOpenId(openId);
    if (existing) return existing;

    await upsertUser({
      openId,
      email: authUser.email ?? null,
      name:
        (authUser.user_metadata?.full_name as string | undefined) ??
        (authUser.user_metadata?.name as string | undefined) ??
        null,
      loginMethod: "supabase",
      role: ownerIsAdmin(authUser.email) ? "admin" : "user",
      lastSignedIn: new Date(),
    });
    const created = await getUserByOpenId(openId);
    if (!created) throw new Error("User profile was not returned after creation");
    return created;
  } catch (error) {
    console.error("[Auth] user profile synchronization failed", error);
    throw error;
  }
}

export async function createContext(opts: CreateExpressContextOptions): Promise<TrpcContext> {
  let user: User | null = null;
  try {
    const headers: Array<[string, string]> = Object.entries(opts.req.headers).flatMap(
      ([key, value]): Array<[string, string]> =>
        value === undefined
          ? []
          : [[key, Array.isArray(value) ? value.join(", ") : value]]
    );
    user = await authenticate(
      new Headers(headers)
    );
  } catch (error) {
    console.error("[Auth] context authentication failed", error);
  }
  return { req: opts.req, res: opts.res, user };
}

export async function createFetchContext({
  req,
  resHeaders,
}: FetchCreateContextFnOptions): Promise<TrpcContext> {
  let user: User | null = null;
  try {
    user = await authenticate(req.headers);
  } catch (error) {
    console.error("[Auth] context authentication failed", error);
    throw error;
  }
  return { req, resHeaders, user };
}
