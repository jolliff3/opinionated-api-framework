import z from "zod";
import { type UserRepo } from "../../infra/userRepo.js";
import { type AnyRoute, defineRoute } from "../../lib/route.js";
import { HandlerError } from "../../lib/middleware/errorHandler.js";
import { TokenRepo } from "../../infra/tokenRepo.js";

const useSignInRoute = (
  serviceId: string,
  deps: { userRepo: UserRepo; tokenRepo: TokenRepo }
): AnyRoute | null => {
  if (serviceId !== "auth-service") {
    return null;
  }

  return defineRoute({
    serviceId: "auth-service",
    operationId: "SignInUser",
    method: "POST",
    route: "/users\\:signIn",
    successStatus: 200,
    schema: {
      body: z.object({
        email: z.email(),
        password: z.string().min(8).max(100),
      }),
      query: z.object({}),
      path: z.object({}),
    },
    authorizer: async (authn) => {
      if (authn.authenticated) {
        return { authorized: false }; // Already signed in
      }

      return { authorized: true };
    },
    handler: async (req) => {
      const user = await deps.userRepo.signInUser(
        req.body.email,
        req.body.password
      );

      if (!user) {
        throw new HandlerError(
          "Invalid email or password",
          401,
          "Invalid email or password"
        );
      }

      const token = await deps.tokenRepo.generateUserIdToken(user);

      return { token };
    },
  });
};

export { useSignInRoute };
