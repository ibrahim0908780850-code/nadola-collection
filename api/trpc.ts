import type { IncomingMessage, ServerResponse } from "node:http";

type VercelResponse = ServerResponse & { headersSent?: boolean };

type ExpressRequest = IncomingMessage & { path?: string };

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  try {
    const [{ createExpressMiddleware }, { appRouter }, { createContext }] = await Promise.all([
      import("@trpc/server/adapters/express"),
      import("../server/routers"),
      import("../server/_core/context"),
    ]);
    const expressRequest = req as ExpressRequest;
    expressRequest.path = (req.url ?? "/").split("?", 1)[0];
    const trpcHandler = createExpressMiddleware({ router: appRouter, createContext });
    trpcHandler(req as never, res as never, () => {
      res.statusCode = 404;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: "tRPC route not found" }));
    });
  } catch (error) {
    console.error("[Vercel tRPC] handler failed", error);
    const response = res as VercelResponse;
    if (response.headersSent) return;
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: { message: "تعذر تشغيل خدمة المصادقة حالياً", code: "INTERNAL_SERVER_ERROR" } }));
  }
}
