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
import fs from "fs";
import path from "path";
import { generateApiServerDocs } from "./lib/docs/generateDocs.js";
import { toJSONSchema } from "zod";

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
  version: "1.0.0",
  description: "Admin API for managing users",
  name: "admin.localhost",
  restrictHosts: true,
  allowedHosts: ["admin.localhost", "localhost:3000"],
  tokenExtractor: headerTokenExtractor,
  authenticator: bearerJwtAuthenticator,
  allowUnauthenticated: false,
  routes: adminRoutes,
});

const userApi = defineApi({
  version: "1.0.0",
  description: "User API for accessing user information",
  name: "user.localhost",
  restrictHosts: true,
  allowedHosts: ["user.localhost", "localhost:3000"],
  tokenExtractor: headerTokenExtractor,
  authenticator: bearerJwtAuthenticator,
  allowUnauthenticated: false,
  routes: userRoutes,
});

const publicApi = defineApi({
  version: "1.0.0",
  description: "Public API for accessing public information",
  name: "public.localhost",
  restrictHosts: true,
  allowedHosts: ["public.localhost", "localhost:3000"],
  tokenExtractor: (_, __) => null,
  authenticator: async () => ({ authenticated: false, authnClaims: null }),
  allowUnauthenticated: true,
  routes: publicRoutes,
});

const server = new ApiServer({ logging: { logger, internalLogger: logger } });

server.registerApi(userApi).registerApi(adminApi).registerApi(publicApi);

const docsDir = path.join(process.cwd(), "gen", "docs");
if (!fs.existsSync(docsDir)) {
  fs.mkdirSync(docsDir, { recursive: true });
}

const apiDocs = generateApiServerDocs(server, toJSONSchema as any);
// Write out OpenAPI docs for each API to fs
apiDocs.forEach((apiDoc, name) => {
  const filePath = path.join(docsDir, `${name}-openapi.json`);
  fs.writeFileSync(filePath, JSON.stringify(apiDoc, null, 2));
  logger.info(`Wrote OpenAPI docs for ${name} to ${filePath}`);
});

server.listen(PORT, () => {
  logger.debug(`Server running on http://localhost:${PORT}`);
});
