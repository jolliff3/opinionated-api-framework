import { defineApi, type Api } from "../../lib/api.js";
import { type AnyRoute } from "../../lib/route.js";
import { useGetPublicUserCountRoute } from "./getPublicUserCount.js";

const usePublicApi = (serviceId: string, deps: any): Api => {
  const publicRoutes: Array<AnyRoute | null> = [
    useGetPublicUserCountRoute(serviceId, deps),
  ];

  const publicApi = defineApi({
    version: "1.0.0",
    description: "Public API for accessing public information",
    name: "public.localhost",
    restrictHosts: true,
    allowedHosts: ["public.localhost"],
    tokenExtractor: (_, __) => null,
    authenticator: async () => ({ authenticated: false, authnClaims: null }),
    allowUnauthenticated: true,
    routes: publicRoutes.filter((r): r is AnyRoute => r !== null),
  });

  return publicApi;
};

export { usePublicApi };
