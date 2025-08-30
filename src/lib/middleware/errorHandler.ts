import { type Middleware } from "koa";

class HandlerError extends Error {
  readonly responseStatus: number;
  readonly responseErrorMessage: string;

  constructor(
    message: string,
    responseStatus?: number,
    responseErrorMessage?: string
  ) {
    super(message);
    this.responseStatus = responseStatus ?? 500;
    this.responseErrorMessage = responseErrorMessage ?? "An error occurred";
  }
}

const defaultErrorHandler: Middleware = async (ctx, next) => {
  try {
    await next();
  } catch (err) {
    if (err instanceof HandlerError) {
      ctx.state.logger.warn("Handler error occurred", { error: err });
      ctx.status = err.responseStatus;
      ctx.body = { error: err.responseErrorMessage };
    } else {
      ctx.state.logger.error("Unhandled error occurred", { error: err });
      ctx.status = 500;
      ctx.body = { error: "An unknown error occurred" };
    }
  }
};

export { defaultErrorHandler, HandlerError };
