import z from "zod";
import { type UserRepo } from "../infra/userRepo.js";
import { defineRoute } from "../lib/route.js";
import { adminAuthorizer } from "../utils/authorizers.js";

export const useCreateUserRoute = (userRepo: UserRepo) =>
  defineRoute({
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
      return userRepo.createUser({
        name: req.body.name,
      });
    },
  });
