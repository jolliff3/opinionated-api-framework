import z from "zod";
import { type UserRepo } from "../infra/userRepo.js";
import { defineRoute } from "../lib/route.js";
import { allAuthenticatedAuthorizer } from "../utils/authorizers.js";

const useGetCurrentUserRoute = (userRepo: UserRepo) =>
  defineRoute({
    operationId: "GetCurrentUser",
    method: "GET",
    route: "/users/current",
    successStatus: 200,
    schema: {
      body: z.object({}),
      query: z.object({}),
      path: z.object({}),
    },
    authorizer: allAuthenticatedAuthorizer,
    handler: async (req) => {
      if (!req.authnClaims || !req.authnClaims.sub) {
        throw new Error("No userId in authn claims");
      }

      return userRepo.getUser(req.authnClaims.sub);
    },
  });

export { useGetCurrentUserRoute };
