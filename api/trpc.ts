import type { IncomingMessage, ServerResponse } from "node:http";
import { createHTTPHandler } from "@trpc/server/adapters/standalone";
import { appRouter } from "../server/routers";
import { createContext } from "../server/_core/context";

const trpcHandler = createHTTPHandler({
  router: appRouter,
  basePath: "/api/trpc/",
  createContext: (opts) => createContext(opts as never),
});

export default function handler(req: IncomingMessage, res: ServerResponse) {
  return trpcHandler(req, res);
}
