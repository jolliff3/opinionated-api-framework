import { createLogger } from "../../infra/logger.js";
import { type Service } from "../../lib/service.js";
import { useAdminApi } from "../../apis/admin/index.js";
import { useUserApi } from "../../apis/user/index.js";
import { usePublicApi } from "../../apis/public/index.js";
import { ApiServer } from "../../lib/server.js";
import { MessageRepo } from "../../infra/messageRepo.js";

const messageRepo = new MessageRepo();
const logger = createLogger();

const service: Service<{ messageRepo: MessageRepo }> = {
  id: "message-service",
  dependencies: { messageRepo },
};

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

const adminApi = useAdminApi(service.id, service.dependencies);
const userApi = useUserApi(service.id, service.dependencies);
const publicApi = usePublicApi(service.id, service.dependencies);

const server = new ApiServer({ logging: { logger, internalLogger: logger } });

server.assignService(service);

server.registerApis([adminApi, userApi, publicApi]);

server.listen(PORT, () => {
  logger.debug(`Server running on http://localhost:${PORT}`);
});
