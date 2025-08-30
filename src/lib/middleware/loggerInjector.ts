import { type Middleware } from "koa";
import { type Logger } from "../utils/logger.js";

const loggerInjector = (logger: Logger): Middleware => {
  return (ctx, next) => {
    ctx.state.logger = logger;
    return next();
  };
};

export { loggerInjector };
