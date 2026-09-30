import { describe, expect, it } from "vitest";
import { bearerTokenFromHeaders } from "./_core/context";

describe("tRPC authentication context", () => {
  it("extracts a bearer token without exposing it", () => {
    expect(bearerTokenFromHeaders(new Headers({ authorization: "Bearer test-token" }))).toBe("test-token");
  });

  it("rejects missing or malformed authorization headers", () => {
    expect(bearerTokenFromHeaders(new Headers())).toBeUndefined();
    expect(bearerTokenFromHeaders(new Headers({ authorization: "Basic test-token" }))).toBeUndefined();
  });
});
