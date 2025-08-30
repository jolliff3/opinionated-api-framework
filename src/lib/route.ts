import type z from "zod";
import { Authorizer } from "./middleware/auth/authz.js";

type RouteSchema<
  TBody extends z.ZodTypeAny = z.ZodTypeAny,
  TQuery extends z.ZodTypeAny = z.ZodTypeAny,
  TPath extends z.ZodTypeAny = z.ZodTypeAny
> = {
  body: TBody;
  query: TQuery;
  path: TPath;
};

type RouteHandler<T, U> = (req: T) => Promise<U>;

type SuccessStatus = 200 | 201;

type Route<TSchema extends RouteSchema, TRes = unknown> = {
  operationId: string;
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  route: string;
  schema: TSchema;
  successStatus: SuccessStatus;
  authorizer: Authorizer;
  handler: RouteHandler<
    {
      body: z.infer<TSchema["body"]>;
      query: z.infer<TSchema["query"]>;
      path: z.infer<TSchema["path"]>;
      authnClaims?: Record<string, any>;
    },
    TRes
  >;
};

function defineRoute<TSchema extends RouteSchema, TRes = unknown>(config: {
  operationId: string;
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  route: string;
  schema: TSchema;
  successStatus: SuccessStatus;
  authorizer: Authorizer;
  handler: RouteHandler<
    {
      body: z.infer<TSchema["body"]>;
      query: z.infer<TSchema["query"]>;
      path: z.infer<TSchema["path"]>;
      authnClaims?: Record<string, any>;
    },
    TRes
  >;
}): Route<TSchema, TRes> {
  return {
    ...config,
  };
}

type AnyRoute = Route<RouteSchema<any, any, any>, any>;

export {
  type Route,
  type RouteSchema,
  type RouteHandler,
  type AnyRoute,
  defineRoute,
};
