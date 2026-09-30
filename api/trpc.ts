import type { IncomingMessage, ServerResponse } from "node:http";
import { createHTTPHandler } from "@trpc/server/adapters/standalone";
import { appRouter } from "../server/routers";
import { createContext } from "../server/_core/context";

type VercelRequest = IncomingMessage & { body?: unknown };

export async function toWebRequest(req: VercelRequest) {
  const method = req.method ?? "GET";
  const host = req.headers.host ?? "localhost";
  const url = new URL(req.url ?? "/api/trpc", `https://${host}`);
  const headers = new Headers();
  for (const [name, value] of Object.entries(req.headers)) {
    if (value !== undefined) headers.set(name, Array.isArray(value) ? value.join(", ") : value);
  }
  let body: BodyInit | undefined;
  if (method !== "GET" && method !== "HEAD") {
    if (req.body !== undefined) {
      body = typeof req.body === "string" ? req.body : JSON.stringify(req.body);
    } else {
      const chunks: Buffer[] = [];
      for await (const chunk of req) chunks.push(Buffer.from(chunk));
      body = Buffer.concat(chunks);
    }
  }
  return new Request(url, { method, headers, body, ...(body ? { duplex: "half" } : {}) } as RequestInit & { duplex?: "half" });
}

const trpcHandler = createHTTPHandler({
  router: appRouter,
  basePath: "/api/trpc/",
  createContext: ({ req, res }) =>
    createContext({ req, res } as Parameters<typeof createContext>[0]),
});

export default function handler(req: IncomingMessage, res: ServerResponse) {
  return trpcHandler(req, res);
}
