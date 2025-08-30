import type { Context } from "koa";
import type { RequestValidationError } from "../utils/schemas.js";

const defaultValidationFailureHandler = (
  err: RequestValidationError,
  ctx: Context
): void => {
  ctx.state.logger.warn("Validation failed", { errors: err.errors });
  ctx.status = 400;
  const errorDetails: Record<string, any> = {};
  err.errors.forEach((error, key) => {
    errorDetails[key] = error;
  });
  ctx.body = { errors: errorDetails };
};

export { defaultValidationFailureHandler };
