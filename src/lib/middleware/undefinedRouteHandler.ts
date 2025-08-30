import { type Middleware } from "koa";

const defaultUndefinedRouteHandler: Middleware = async (ctx) => {
  if (ctx.status === 404) {
    ctx.state.logger.warn(`Undefined route accessed: ${ctx.method} ${ctx.url}`);
    ctx.status = 404;
    ctx.body = { error: "Route not found" };
  }
};

export { defaultUndefinedRouteHandler };
