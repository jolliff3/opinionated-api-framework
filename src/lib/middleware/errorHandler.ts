import { type Middleware } from "koa";

const defaultErrorHandler: Middleware = async (ctx, next) => {
  try {
    await next();
  } catch (err) {
    ctx.state.logger.error("Unhandled error occurred", { error: err });
    ctx.status = 500;
    ctx.body = { error: "An unknown error occurred" };
  }
};

export { defaultErrorHandler };
