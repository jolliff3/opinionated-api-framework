import { type Middleware } from "koa";

const defaultErrorHandler: Middleware = async (ctx, next) => {
  try {
    await next();
  } catch (err) {
    const error = err as Error;
    ctx.status = 500;
    ctx.body = { error: error.message };
  }
};

export { defaultErrorHandler };
