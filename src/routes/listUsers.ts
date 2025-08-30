import z from "zod";
import { ListUsersFilter, type UserRepo } from "../infra/userRepo.js";
import { defineRoute } from "../lib/route.js";
import { adminAuthorizer } from "../utils/authorizers.js";
import { zodStringInt } from "../utils/zodStringNumber.js";

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
        limit: zodStringInt(z.int().min(1).max(100), 10),
        offset: zodStringInt(z.int().min(0), 0),
      }),
      path: z.object({}),
    },
    authorizer: adminAuthorizer,
    handler: async (req, logger) => {
      const filter: ListUsersFilter = {
        createdRangeStart: req.query.createdRangeStart
          ? new Date(req.query.createdRangeStart)
          : undefined,
        createdRangeEnd: req.query.createdRangeEnd
          ? new Date(req.query.createdRangeEnd)
          : undefined,
        search: req.query.search,
        limit: req.query.limit,
        offset: req.query.offset,
      };

      logger.debug("Listing users with query", { filter });
      return userRepo.listUsers(filter);
    },
  });
