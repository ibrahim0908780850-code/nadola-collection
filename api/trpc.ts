import type { IncomingMessage, ServerResponse } from "node:http";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "../server/routers";
import { createFetchContext } from "../server/_core/context";

type VercelRequest = IncomingMessage & { body?: unknown };

type WebRequestInit = RequestInit & { duplex?: "half" };

export async function toWebRequest(req: VercelRequest) {
  const method = req.method ?? "GET";
  const host = req.headers.host ?? "localhost";
  const url = new URL(req.url ?? "/api/trpc", `https://${host}`);
  if (url.pathname.endsWith(".ts")) url.pathname = url.pathname.slice(0, -3);

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

  const init: WebRequestInit = { method, headers, body };
  if (body) init.duplex = "half";
  return new Request(url, init);
}

export default async function handler(req: VercelRequest, res: ServerResponse) {
  try {
    const response = await fetchRequestHandler({
      endpoint: "/api/trpc/",
      req: await toWebRequest(req),
      router: appRouter,
      createContext: createFetchContext,
    });
    res.statusCode = response.status;
    response.headers.forEach((value, key) => res.setHeader(key, value));
    res.end(Buffer.from(await response.arrayBuffer()));
  } catch (error) {
    console.error("[tRPC] unhandled request error", error);
    res.statusCode = 500;
    res.setHeader("content-type", "application/json; charset=utf-8");
    res.end(JSON.stringify({ error: { message: "Internal server error" } }));
  }
}
