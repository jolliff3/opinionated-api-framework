import { AnyRoute } from "./lib/route.js";
import { UserRepo } from "./infra/userRepo.js";
import { defineApi } from "./lib/api.js";
import { ApiServer } from "./lib/server.js";
import { headerTokenExtractor } from "./utils/headerTokenExtractor.js";
import { bearerJwtAuthenticator } from "./utils/bearerJwtAuthenticator.js";
import { useGetUserRoute } from "./routes/getUser.js";
import { useGetCurrentUserRoute } from "./routes/getCurrentUser.js";
import { useListUsersRoute } from "./routes/listUsers.js";
import { useCreateUserRoute } from "./routes/createUser.js";
import { LogContext, Logger } from "./lib/utils/logger.js";

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

const userRepo = new UserRepo();

const userRoutes: AnyRoute[] = [
  useGetCurrentUserRoute(userRepo),
  useGetUserRoute(userRepo),
  useListUsersRoute(userRepo),
  useCreateUserRoute(userRepo),
];

const api = defineApi({
  restrictHosts: true,
  allowedHosts: ["localhost:3000"],
  tokenExtractor: headerTokenExtractor,
  authenticator: bearerJwtAuthenticator,
  allowUnauthenticated: false,
  routes: userRoutes,
});

const logger: Logger = {
  debug: (msg: string, ctx?: LogContext) => {
    console.debug(`DEBUG: ${msg} ${ctx ? JSON.stringify(ctx) : ""}`);
  },
  info: (msg: string, ctx?: LogContext) => {
    console.log(`INFO: ${msg} ${ctx ? JSON.stringify(ctx) : ""}`);
  },
  warn: (msg: string, ctx?: LogContext) => {
    console.warn(`WARN: ${msg} ${ctx ? JSON.stringify(ctx) : ""}`);
  },
  error: (msg: string, ctx?: LogContext) => {
    console.error(`ERROR: ${msg} ${ctx ? JSON.stringify(ctx) : ""}`);
  },
};

const server = new ApiServer({ logger });

server.registerApi(api).listen(PORT, () => {
  logger.debug(`Server running on http://localhost:${PORT}`);
});
