import type { IncomingMessage, ServerResponse } from "node:http";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "../server/routers";
import { createContext } from "../server/_core/context";

async function toRequest(req: IncomingMessage) {
  const protocol = (req.headers["x-forwarded-proto"] as string | undefined) ?? "https";
  const host = (req.headers.host as string | undefined) ?? "nadola-collection.vercel.app";
  const url = new URL(req.url ?? "/", `${protocol}://${host}`);
  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (value) headers.set(key, Array.isArray(value) ? value.join(", ") : value);
  }
  let body: Uint8Array | undefined;
  if (req.method !== "GET" && req.method !== "HEAD") {
    const chunks: Buffer[] = [];
    for await (const chunk of req) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    body = Buffer.concat(chunks);
  }
  return new Request(url, { method: req.method, headers, body: body as BodyInit | undefined, duplex: "half" } as RequestInit & { duplex: "half" });
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  try {
    const request = await toRequest(req);
    const response = await fetchRequestHandler({
      endpoint: "/api/trpc",
      req: request,
      router: appRouter,
      createContext: async ({ req: fetchReq }) => createContext({ req: fetchReq, res } as never),
    });
    res.statusCode = response.status;
    response.headers.forEach((value, key) => res.setHeader(key, value));
    res.end(Buffer.from(await response.arrayBuffer()));
  } catch (error) {
    console.error("[Vercel tRPC] request failed", error);
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "API request failed" }));
  }
}
