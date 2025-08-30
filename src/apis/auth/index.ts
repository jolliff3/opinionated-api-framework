import { defineApi, type Api } from "../../lib/api.js";
import type { AnyRoute } from "../../lib/route.js";
import { bearerJwtAuthenticator } from "../../utils/bearerJwtAuthenticator.js";
import { headerTokenExtractor } from "../../utils/headerTokenExtractor.js";
import { useSignInRoute } from "./signIn.js";
import { useSignUpRoute } from "./signUp.js";

const useAuthApi = (serviceId: string, deps: any): Api => {
  const authRoutes: Array<AnyRoute | null> = [
    useSignUpRoute(serviceId, deps),
    useSignInRoute(serviceId, deps),
  ];

  const authApi = defineApi({
    version: "1.0.0",
    description: "Auth API for user sign up, login and tokens",
    name: "auth.localhost",
    restrictHosts: true,
    allowedHosts: ["auth.localhost"],
    tokenExtractor: headerTokenExtractor,
    authenticator: bearerJwtAuthenticator, // we still authenticate incase user is already signed in
    allowUnauthenticated: true,
    routes: authRoutes.filter((r): r is AnyRoute => r !== null),
  });

  return authApi;
};

export { useAuthApi };
