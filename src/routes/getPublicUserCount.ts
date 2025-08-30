import z from "zod";
import type { UserRepo } from "../infra/userRepo.js";
import { defineRoute } from "../lib/route.js";

const useGetPublicUserCountRoute = (userRepo: UserRepo) => {
  return defineRoute({
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
      const count = await userRepo.countUsers();
      return { count };
    },
    authorizer: async (_) => {
      return { authorized: true };
    }, // Public route
  });
};

export { useGetPublicUserCountRoute };
