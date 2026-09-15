import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { getUserByOpenId } from "../db";
import { jwtVerify } from "jose";
import { LOCAL_AUTH_COOKIE } from "@shared/const";
import { sdk } from "./sdk";
import { ENV } from "./env";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

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
  try { user = await sdk.authenticateRequest(opts.req); } catch { user = null; }
  if (!user) user = (await authenticateLocal(opts.req)) ?? null;
  return { req: opts.req, res: opts.res, user };
}

export { LOCAL_AUTH_COOKIE };
