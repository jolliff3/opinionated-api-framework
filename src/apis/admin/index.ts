import { defineApi, type Api } from "../../lib/api.js";
import type { AnyRoute } from "../../lib/route.js";
import { bearerJwtAuthenticator } from "../../utils/bearerJwtAuthenticator.js";
import { headerTokenExtractor } from "../../utils/headerTokenExtractor.js";
import { useCreateUserRoute } from "./createUser.js";
import { useGetUserRoute } from "./getUser.js";
import { useListUsersRoute } from "./listUsers.js";

const useAdminApi = (serviceId: string, deps: any): Api => {
  const adminRoutes: Array<AnyRoute | null> = [
    useGetUserRoute(serviceId, deps),
    useListUsersRoute(serviceId, deps),
    useCreateUserRoute(serviceId, deps),
  ];

  const adminApi = defineApi({
    version: "1.0.0",
    description: "Admin API for managing users",
    name: "admin.localhost",
    restrictHosts: true,
    allowedHosts: ["admin.localhost"],
    tokenExtractor: headerTokenExtractor,
    authenticator: bearerJwtAuthenticator,
    allowUnauthenticated: false,
    routes: adminRoutes.filter((r): r is AnyRoute => r !== null),
  });

  return adminApi;
};

export { useAdminApi };
