import { createHTTPHandler } from "@trpc/server/adapters/standalone";
import { appRouter } from "../../server/routers";
import { createContext } from "../../server/_core/context";

const handler = createHTTPHandler({
  router: appRouter,
  createContext: async ({ req, res }) => createContext({ req, res } as never),
});

export default handler;
