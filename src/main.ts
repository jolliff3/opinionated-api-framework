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
import { Logger } from "./lib/utils/logger.js";

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
  debug: (msg: string) => {
    console.debug(`DEBUG: ${msg}`);
  },
  info: (msg: string) => {
    console.log(`INFO: ${msg}`);
  },
  warn: (msg: string) => {
    console.warn(`WARN: ${msg}`);
  },
  error: (msg: string) => {
    console.error(`ERROR: ${msg}`);
  },
};

const server = new ApiServer({ logger });

server.registerApi(api).listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
