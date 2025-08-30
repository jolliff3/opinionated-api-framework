import { type Middleware } from "koa";
import { LogContext, type Logger } from "../utils/logger.js";

const withContext = (logger: Logger, context: LogContext): Logger => {
  return {
    debug: (msg: string, meta?: Record<string, unknown>) =>
      logger.debug(msg, { ...context, ...meta }),
    info: (msg: string, meta?: Record<string, unknown>) =>
      logger.info(msg, { ...context, ...meta }),
    warn: (msg: string, meta?: Record<string, unknown>) =>
      logger.warn(msg, { ...context, ...meta }),
    error: (msg: string, meta?: Record<string, unknown>) =>
      logger.error(msg, { ...context, ...meta }),
  };
};

const loggerInjector = (logger: Logger): Middleware => {
  return (ctx, next) => {
    const defaultLogContext: LogContext = {
      host: ctx.host,
      method: ctx.method,
      url: ctx.originalUrl,
      remoteIp: ctx.ip,
    };
    ctx.state.logger = withContext(logger, defaultLogContext);
    return next();
  };
};

export { loggerInjector };
