import z from "zod";
import { type UserRepo } from "../infra/userRepo.js";
import { defineRoute } from "../lib/route.js";
import { adminAuthorizer } from "../utils/authorizers.js";

export const useListUsersRoute = (userRepo: UserRepo) =>
  defineRoute({
    operationId: "ListUsers",
    method: "GET",
    route: "/users",
    successStatus: 200,
    schema: {
      body: z.object({}),
      query: z.object({
        createdRangeStart: z.iso.datetime().optional(),
        createdRangeEnd: z.iso.datetime().optional(),
        search: z.string().optional(),
        limit: z
          .string()
          .default("10")
          .transform((val) => parseInt(val, 10)),
        offset: z
          .string()
          .default("0")
          .transform((val) => parseInt(val, 10)),
      }),
      path: z.object({}),
    },
    authorizer: adminAuthorizer,
    handler: async (req) => {
      return userRepo.listUsers({
        createdRangeStart: req.query.createdRangeStart
          ? new Date(req.query.createdRangeStart)
          : undefined,
        createdRangeEnd: req.query.createdRangeEnd
          ? new Date(req.query.createdRangeEnd)
          : undefined,
        search: req.query.search,
        limit: req.query.limit,
        offset: req.query.offset,
      });
    },
  });
