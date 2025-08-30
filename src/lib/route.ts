import type { Authorizer } from "./auth/authz.js";
import type { Logger } from "./utils/logger.js";
import type { InferSchema, RequestSchema } from "./utils/schemas.js";

type RouteHandler<T, U> = (req: T, logger: Logger) => Promise<U>;

type SuccessStatus = 200 | 201;

type Route<TSchema extends RequestSchema, TRes = unknown> = {
  serviceId: string;
  operationId: string;
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  route: string;
  schema: TSchema;
  successStatus: SuccessStatus;
  notFoundValues: Array<null | undefined>;
  bypassProxyAuth: boolean; // Used to bypass proxy auth - mainly for development and testing
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
  serviceId: string;
  operationId: string;
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  route: string;
  schema: TSchema;
  successStatus: SuccessStatus;
  notFoundValues?: Array<null | undefined>;
  bypassProxyAuth?: boolean;
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
    bypassProxyAuth: config.bypassProxyAuth ?? false, // Default will enforce proxy auth
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
