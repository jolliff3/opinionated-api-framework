import { UserRepo } from "../../infra/userRepo.js";
import { createLogger } from "../../infra/logger.js";
import { type Service } from "../../lib/service.js";
import { useAdminApi } from "../../apis/admin/index.js";
import { useUserApi } from "../../apis/user/index.js";
import { usePublicApi } from "../../apis/public/index.js";
import { ApiServer, DevelopmentOptions } from "../../lib/server.js";

const userRepo = new UserRepo();
const logger = createLogger();

const service: Service<{ userRepo: UserRepo }> = {
  id: "user-service",
  dependencies: { userRepo },
};

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

const adminApi = useAdminApi(service.id, service.dependencies);
const userApi = useUserApi(service.id, service.dependencies);
const publicApi = usePublicApi(service.id, service.dependencies);

let devOpts: DevelopmentOptions = {};

if (process.env.NODE_ENV === "development") {
  devOpts = { bypassHostCheck: true };
}

const server = new ApiServer({
  logging: { logger, internalLogger: logger },
  development: devOpts,
});

server.assignService(service);

server.registerApis([adminApi, userApi, publicApi]);

process.on("SIGINT", () => {
  logger.info("Shutting down server...");
  server.close(() => {
    logger.info("Server shut down gracefully.");
    process.exit(0);
  });
});

server.listen(PORT, () => {
  logger.debug(`Server listening on ${PORT}`);
});
