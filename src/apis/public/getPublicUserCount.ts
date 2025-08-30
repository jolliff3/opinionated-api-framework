import z from "zod";
import type { UserRepo } from "../../infra/userRepo.js";
import { defineRoute } from "../../lib/route.js";

const useGetPublicUserCountRoute = (
  serviceId: string,
  deps: {
    userRepo: UserRepo;
  }
) => {
  if (serviceId !== "user-service") {
    return null;
  }

  return defineRoute({
    serviceId: "user-service",
    operationId: "GetPublicUserCount",
    method: "GET",
    route: "/public/users/count",
    successStatus: 200,
    schema: {
      body: z.object({}).strict(),
      query: z.object({}).strict(),
      path: z.object({}).strict(),
    },
    handler: async () => {
      const count = await deps.userRepo.countUsers();
      return { count };
    },
    authorizer: async (_) => {
      return { authorized: true };
    }, // Public route
  });
};

export { useGetPublicUserCountRoute };
