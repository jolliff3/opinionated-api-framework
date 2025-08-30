import type { Authorizer } from "./auth/authz.js";
import type { Logger } from "./utils/logger.js";
import type { InferSchema, RequestSchema } from "./utils/schemas.js";

type RouteHandler<T, U> = (req: T, logger: Logger) => Promise<U>;

type SuccessStatus = 200 | 201;

type Route<TSchema extends RequestSchema, TRes = unknown> = {
  operationId: string;
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  route: string;
  schema: TSchema;
  successStatus: SuccessStatus;
  notFoundValues: Array<null | undefined>;
  authorizer: Authorizer;
  handler: RouteHandler<
    {
      body: InferSchema<TSchema["body"]>;
      query: InferSchema<TSchema["query"]>;
      path: InferSchema<TSchema["path"]>;
      authnClaims?: Record<string, any>;
    },
    TRes
  >;
};

function defineRoute<TSchema extends RequestSchema, TRes = unknown>(config: {
  operationId: string;
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  route: string;
  schema: TSchema;
  successStatus: SuccessStatus;
  notFoundValues?: Array<null | undefined>;
  authorizer: Authorizer;
  handler: RouteHandler<
    {
      body: InferSchema<TSchema["body"]>;
      query: InferSchema<TSchema["query"]>;
      path: InferSchema<TSchema["path"]>;
      authnClaims?: Record<string, any>;
    },
    TRes
  >;
}): Route<TSchema, TRes> {
  return {
    ...config,
    notFoundValues: config.notFoundValues ?? [], // Default will return any values as found (i.e. no 404s with [])
  };
}

type AnyRoute = Route<RequestSchema<any, any, any>, any>;

export {
  type Route,
  type RequestSchema as RouteSchema,
  type RouteHandler,
  type AnyRoute,
  defineRoute,
};
