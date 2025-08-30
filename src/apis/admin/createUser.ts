import z from "zod";
import { type UserRepo } from "../../infra/userRepo.js";
import { AnyRoute, defineRoute } from "../../lib/route.js";
import { adminAuthorizer } from "../../utils/authorizers.js";

export const useCreateUserRoute = (
  serviceId: string,
  deps: { userRepo: UserRepo }
): AnyRoute | null => {
  if (serviceId !== "user-service") {
    return null;
  }

  return defineRoute({
    serviceId,
    operationId: "CreateUser",
    method: "POST",
    route: "/users",
    successStatus: 201,
    schema: {
      body: z.object({
        name: z.string().min(1).max(100),
      }),
      query: z.object({}),
      path: z.object({}),
    },
    authorizer: adminAuthorizer,
    handler: async (req, _) => {
      return deps.userRepo.createUser({
        name: req.body.name,
      });
    },
  });
};
