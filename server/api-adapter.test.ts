import { Readable } from "node:stream";
import { describe, expect, it } from "vitest";
import { toWebRequest } from "../api/trpc";

describe("Vercel tRPC request adapter", () => {
  it("preserves URL, method, authorization and body", async () => {
    const req = Object.assign(
      Readable.from([JSON.stringify({ json: null })]),
      {
        method: "POST",
        url: "/api/trpc/auth.me?batch=1",
        headers: {
          host: "example.test",
          authorization: "Bearer test-token",
          "content-type": "application/json",
        },
      }
    );

    const request = await toWebRequest(req as never);
    expect(request.url).toBe("https://example.test/api/trpc/auth.me?batch=1");
    expect(request.method).toBe("POST");
    expect(request.headers.get("authorization")).toBe("Bearer test-token");
    expect(await request.text()).toBe('{"json":null}');
  });
});
