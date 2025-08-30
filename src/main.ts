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
import { createLogger } from "./infra/logger.js";
import { useGetPublicUserCountRoute } from "./routes/getPublicUserCount.js";

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

const userRepo = new UserRepo();
const logger = createLogger();

const adminRoutes: AnyRoute[] = [
  useGetUserRoute(userRepo),
  useListUsersRoute(userRepo),
  useCreateUserRoute(userRepo),
];

const userRoutes: AnyRoute[] = [useGetCurrentUserRoute(userRepo)];

const publicRoutes: AnyRoute[] = [useGetPublicUserCountRoute(userRepo)];

const adminApi = defineApi({
  name: "admin.localhost",
  restrictHosts: true,
  allowedHosts: ["admin.localhost", "localhost:3000"],
  tokenExtractor: headerTokenExtractor,
  authenticator: bearerJwtAuthenticator,
  allowUnauthenticated: false,
  routes: adminRoutes,
});

const userApi = defineApi({
  name: "user.localhost",
  restrictHosts: true,
  allowedHosts: ["user.localhost", "localhost:3000"],
  tokenExtractor: headerTokenExtractor,
  authenticator: bearerJwtAuthenticator,
  allowUnauthenticated: false,
  routes: userRoutes,
});

const publicApi = defineApi({
  name: "public.localhost",
  restrictHosts: true,
  allowedHosts: ["public.localhost", "localhost:3000"],
  tokenExtractor: (_, __) => null,
  authenticator: async () => ({ authenticated: false, authnClaims: null }),
  allowUnauthenticated: true,
  routes: publicRoutes,
});

const server = new ApiServer({ logging: { logger, internalLogger: logger } });

server
  .registerApi(userApi)
  .registerApi(adminApi)
  .registerApi(publicApi)
  .listen(PORT, () => {
    logger.debug(`Server running on http://localhost:${PORT}`);
  });
