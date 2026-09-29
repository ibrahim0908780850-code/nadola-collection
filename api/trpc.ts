import type { IncomingMessage, ServerResponse } from "node:http";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "../server/routers";
import { createContext } from "../server/_core/context";

const trpcHandler = createExpressMiddleware({
  router: appRouter,
  createContext,
});

export default function handler(req: IncomingMessage, res: ServerResponse) {
  const expressRequest = req as IncomingMessage & { path?: string };
  expressRequest.path = (req.url ?? "/").split("?", 1)[0];
  return trpcHandler(req as never, res as never, () => {
    res.statusCode = 404;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "tRPC route not found" }));
  });
}
