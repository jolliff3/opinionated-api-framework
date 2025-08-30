import z from "zod";
import { type UserRepo } from "../../infra/userRepo.js";
import { type AnyRoute, defineRoute } from "../../lib/route.js";
import { HandlerError } from "../../lib/middleware/errorHandler.js";
import { TokenRepo } from "../../infra/tokenRepo.js";

const useSignUpRoute = (
  serviceId: string,
  deps: { userRepo: UserRepo; tokenRepo: TokenRepo }
): AnyRoute | null => {
  if (serviceId !== "auth-service") {
    return null;
  }

  return defineRoute({
    serviceId: "auth-service",
    operationId: "SignUpUser",
    method: "POST",
    route: "/users\\:signUp",
    successStatus: 200,
    schema: {
      body: z.object({
        email: z.email(),
        password: z.string().min(8).max(100),
        name: z.string().min(1).max(100),
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
      const res = await deps.userRepo.createUser({
        email: req.body.email,
        password: req.body.password,
        name: req.body.name,
      });

      if (!res.success) {
        switch (res.error) {
          case "EMAIL_ALREADY_EXISTS":
            throw new HandlerError(
              "Email already exists",
              500,
              "Failed to create user" // Don't reveal that the email exists
            );
          default:
            throw new HandlerError(
              "Failed to create user",
              500,
              "Failed to create user"
            );
        }
      }

      const token = await deps.tokenRepo.generateUserIdToken(res.user);

      return { token };
    },
  });
};

export { useSignUpRoute };
