import type { IncomingMessage, ServerResponse } from "node:http";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "../server/routers";
import { createFetchContext } from "../server/_core/context";

type VercelRequest = IncomingMessage & { body?: unknown };

type VercelResponse = ServerResponse & {
  status?: (code: number) => VercelResponse;
  json?: (body: unknown) => void;
};

function headersFromRequest(req: IncomingMessage) {
  const headers = new Headers();
  for (const [name, value] of Object.entries(req.headers)) {
    if (value === undefined) continue;
    headers.set(name, Array.isArray(value) ? value.join(", ") : value);
  }
  return headers;
}

async function requestBody(req: VercelRequest, method: string) {
  if (method === "GET" || method === "HEAD") return undefined;
  if (req.body !== undefined) {
    return typeof req.body === "string" ? req.body : JSON.stringify(req.body);
  }
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks);
}

export async function toWebRequest(req: VercelRequest) {
  const method = req.method ?? "GET";
  const host = req.headers.host ?? "localhost";
  const url = new URL(req.url ?? "/api/trpc", `https://${host}`);
  const body = await requestBody(req, method);
  return new Request(url, {
    method,
    headers: headersFromRequest(req),
    body,
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const request = await toWebRequest(req);
    const response = await fetchRequestHandler({
      endpoint: "/api/trpc",
      req: request,
      router: appRouter,
      createContext: createFetchContext,
    });

    res.statusCode = response.status;
    response.headers.forEach((value, key) => res.setHeader(key, value));
    res.end(Buffer.from(await response.arrayBuffer()));
  } catch (error) {
    console.error("[tRPC] unhandled request error", error);
    const payload = JSON.stringify({ error: { message: "Internal server error" } });
    res.statusCode = 500;
    res.setHeader("content-type", "application/json; charset=utf-8");
    res.end(payload);
  }
}
