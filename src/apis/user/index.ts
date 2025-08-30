import { TokenVerifier } from "../../infra/tokenVerifier.js";
import { defineApi, type Api } from "../../lib/api.js";
import type { AnyRoute } from "../../lib/route.js";
import { useBearerJwtAuthenticator } from "../../utils/bearerJwtAuthenticator.js";
import { headerTokenExtractor } from "../../utils/headerTokenExtractor.js";
import { useGetCurrentUserRoute } from "./getCurrentUser.js";
import { useListCurrentUserMessages } from "./listCurrentUserMessages.js";
import { useSendMessageRoute } from "./sendMessage.js";

const useUserApi = (
  serviceId: string,
  deps: { tokenVerifier: TokenVerifier } & any
): Api => {
  const userRoutes: Array<AnyRoute | null> = [
    useGetCurrentUserRoute(serviceId, deps),
    useListCurrentUserMessages(serviceId, deps),
    useSendMessageRoute(serviceId, deps),
  ];

  const userApi = defineApi({
    version: "1.0.0",
    description: "User API for accessing user information",
    name: "user.localhost",
    restrictHosts: true,
    allowedHosts: ["user.localhost"],
    tokenExtractor: headerTokenExtractor,
    authenticator: useBearerJwtAuthenticator(deps.tokenVerifier),
    allowUnauthenticated: false,
    routes: userRoutes.filter((r): r is AnyRoute => r !== null),
  });

  return userApi;
};

export { useUserApi };
