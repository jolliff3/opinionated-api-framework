import { defineApi, type Api } from "../../lib/api.js";
import type { AnyRoute } from "../../lib/route.js";
import { bearerJwtAuthenticator } from "../../utils/bearerJwtAuthenticator.js";
import { headerTokenExtractor } from "../../utils/headerTokenExtractor.js";
import { useGetCurrentUserRoute } from "./getCurrentUser.js";
import { useListCurrentUserMessages } from "./listCurrentUserMessages.js";

const useUserApi = (serviceId: string, deps: any): Api => {
  const userRoutes: Array<AnyRoute | null> = [
    useGetCurrentUserRoute(serviceId, deps),
    useListCurrentUserMessages(serviceId, deps),
  ];

  const userApi = defineApi({
    version: "1.0.0",
    description: "User API for accessing user information",
    name: "user.localhost",
    restrictHosts: true,
    allowedHosts: ["user.localhost"],
    tokenExtractor: headerTokenExtractor,
    authenticator: bearerJwtAuthenticator,
    allowUnauthenticated: false,
    routes: userRoutes.filter((r): r is AnyRoute => r !== null),
  });

  return userApi;
};

export { useUserApi };
