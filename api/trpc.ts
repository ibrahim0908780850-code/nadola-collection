import type { IncomingMessage, ServerResponse } from "node:http";

type Handler = (req: IncomingMessage, res: ServerResponse) => void | Promise<void>;
let cachedHandler: Handler | undefined;

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  try {
    if (!cachedHandler) {
      const [{ createHTTPHandler }, { appRouter }, { createContext }] = await Promise.all([
        import("@trpc/server/adapters/standalone"),
        import("../server/routers"),
        import("../server/_core/context"),
      ]);
      cachedHandler = createHTTPHandler({
        router: appRouter,
        createContext: async ({ req: request, res: response }) => createContext({ req: request, res: response } as never),
      }) as unknown as Handler;
    }
    await cachedHandler(req, res);
  } catch (error) {
    console.error("[Vercel tRPC] handler initialization failed", error);
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "API initialization failed", detail: error instanceof Error ? error.message : String(error) }));
  }
}
