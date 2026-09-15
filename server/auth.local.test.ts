import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "./db";

describe("local password authentication", () => {
  it("stores passwords as salted hashes and verifies them", () => {
    const hash = hashPassword("ibrahim");
    expect(hash).not.toContain("ibrahim");
    expect(verifyPassword("ibrahim", hash)).toBe(true);
    expect(verifyPassword("wrong-password", hash)).toBe(false);
  });
});
