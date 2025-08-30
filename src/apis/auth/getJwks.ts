import z from "zod";
import { type AnyRoute, defineRoute } from "../../lib/route.js";
import { HandlerError } from "../../lib/middleware/errorHandler.js";
import { TokenRepo } from "../../infra/tokenRepo.js";

const useGetJwksRoute = (
  serviceId: string,
  deps: { tokenRepo: TokenRepo }
): AnyRoute | null => {
  if (serviceId !== "auth-service") {
    return null;
  }

  return defineRoute({
    serviceId: "auth-service",
    operationId: "GetJwks",
    method: "GET",
    route: "/.well-known/jwks.json",
    successStatus: 200,
    bypassProxyAuth: true, // This is set to true to allow s2s comms
    schema: {
      body: z.object({}),
      query: z.object({}),
      path: z.object({}),
    },
    authorizer: async (_) => {
      return { authorized: true };
    },
    handler: async (req) => {
      const jwks = await deps.tokenRepo.getJwks();
      if (!jwks) {
        throw new HandlerError("Failed to get JWKS", 500, "Failed to get JWKS");
      }

      return jwks;
    },
  });
};

export { useGetJwksRoute };
