import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

describe("auth.logout", () => {
  it("returns success while Supabase owns the client session", async () => {
    const ctx = { user: null, req: {} as TrpcContext["req"], res: {} as TrpcContext["res"] } satisfies TrpcContext;
    const result = await appRouter.createCaller(ctx).auth.logout();
    expect(result).toEqual({ success: true });
  });
});
