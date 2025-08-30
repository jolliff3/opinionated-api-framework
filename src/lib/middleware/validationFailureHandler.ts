import { type Context } from "koa";

type ValidationFailureError = {
  success: false;
  errors: Map<"body" | "query" | "path", any>;
};

const defaultValidationFailureHandler = (
  err: ValidationFailureError,
  ctx: Context
): void => {
  ctx.status = 400;
  const errorDetails: Record<string, any> = {};
  err.errors.forEach((error, key) => {
    errorDetails[key] = error;
  });
  ctx.body = { errors: errorDetails };
};

export { type ValidationFailureError, defaultValidationFailureHandler };
