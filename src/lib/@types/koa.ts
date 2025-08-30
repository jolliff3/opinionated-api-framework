import type { Logger } from "../utils/logger.js";

declare module "koa" {
  interface DefaultState {
    logger: Logger;
  }
}
