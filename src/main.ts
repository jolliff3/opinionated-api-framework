import z from "zod";
import { AnyRoute, defineRoute, Route } from "./lib/route.js";
import { UserRepo } from "./infra/userRepo.js";
import { Api } from "./lib/api.js";
import { ApiServer } from "./lib/server.js";
import { bearerJwtAuthenticator } from "./lib/middleware/auth/authn.js";

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

const userRepo = new UserRepo();

const getCurrentUserRoute = defineRoute({
  operationId: "GetCurrentUser",
  method: "GET",
  route: "/users/current",
  successStatus: 200,
  schema: {
    body: z.object({}),
    query: z.object({}),
    path: z.object({}),
  },
  authorizer: async (_) => {
    return { authorized: true };
  },
  handler: async (req) => {
    if (!req.authnClaims || !req.authnClaims.sub) {
      throw new Error("No userId in authn claims");
    }

    return userRepo.getUser(req.authnClaims.sub);
  },
});

const getUserRoute = defineRoute({
  operationId: "GetUser",
  method: "GET",
  route: "/users/:userId",
  successStatus: 200,
  schema: {
    body: z.object({}),
    query: z.object({}),
    path: z.object({
      userId: z.uuid(),
    }),
  },
  authorizer: async (authn) => {
    const authorized = authn.authenticated && authn.claims.role === "admin";
    return { authorized };
  },
  handler: async (req) => {
    return userRepo.getUser(req.path.userId);
  },
});

const listUsersRoute = defineRoute({
  operationId: "ListUsers",
  method: "GET",
  route: "/users",
  successStatus: 200,
  schema: {
    body: z.object({}),
    query: z.object({
      createdRangeStart: z.iso.datetime().optional(),
      createdRangeEnd: z.iso.datetime().optional(),
      search: z.string().optional(),
      limit: z
        .string()
        .default("10")
        .transform((val) => parseInt(val, 10)),
      offset: z
        .string()
        .default("0")
        .transform((val) => parseInt(val, 10)),
    }),
    path: z.object({}),
  },
  authorizer: async (authn) => {
    const authorized = authn.authenticated && authn.claims.role === "admin";
    return { authorized };
  },
  handler: async (req) => {
    return userRepo.listUsers({
      createdRangeStart: req.query.createdRangeStart
        ? new Date(req.query.createdRangeStart)
        : undefined,
      createdRangeEnd: req.query.createdRangeEnd
        ? new Date(req.query.createdRangeEnd)
        : undefined,
      search: req.query.search,
      limit: req.query.limit,
      offset: req.query.offset,
    });
  },
});

const createUserRoute = defineRoute({
  operationId: "CreateUser",
  method: "POST",
  route: "/users",
  successStatus: 201,
  schema: {
    body: z.object({
      name: z.string().min(1),
    }),
    query: z.object({}),
    path: z.object({}),
  },
  authorizer: async (authn) => {
    const authorized = authn.authenticated && authn.claims.role === "admin";
    return { authorized };
  },
  handler: async (req) => {
    return userRepo.createUser({
      name: req.body.name,
    });
  },
});

const api = new Api({
  restrictHosts: false,
  tokenLocation: "HEADER",
  tokenKey: "Authorization",
  authenticator: bearerJwtAuthenticator,
  allowUnauthenticated: false,
});

const server = new ApiServer();

const userRoutes: AnyRoute[] = [
  getCurrentUserRoute,
  getUserRoute,
  listUsersRoute,
  createUserRoute,
];

userRoutes.forEach((route) => api.registerRoute(route));

server.registerApi(api).listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
