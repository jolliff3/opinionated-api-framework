import z from "zod";
import { defineRoute, type AnyRoute } from "../../lib/route.js";
import { adminAuthorizer } from "../../utils/authorizers.js";
import { type UserRepo } from "../../infra/userRepo.js";

const useGetUserRoute = (
  serviceId: string,
  deps: { userRepo: UserRepo }
): AnyRoute | null => {
  if (serviceId !== "user-service") {
    return null;
  }

  return defineRoute({
    serviceId: "user-service",
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
    authorizer: adminAuthorizer,
    handler: async (req) => {
      return deps.userRepo.getUser(req.path.userId);
    },
    notFoundValues: [null, undefined],
  });
};
export { useGetUserRoute };
