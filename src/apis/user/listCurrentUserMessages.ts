import z from "zod";
import { type AnyRoute, defineRoute } from "../../lib/route.js";
import { allAuthenticatedAuthorizer } from "../../utils/authorizers.js";
import { zodStringInt } from "../../utils/zodStringNumber.js";
import type {
  ListMessagesFilter,
  MessageRepo,
} from "../../infra/messageRepo.js";

const useListCurrentUserMessages = (
  serviceId: string,
  deps: { messageRepo: MessageRepo }
): AnyRoute | null => {
  if (serviceId !== "message-service") {
    return null;
  }

  return defineRoute({
    serviceId: "message-service",
    operationId: "ListCurrentUserMessages",
    method: "GET",
    route: "/users/current/messages",
    successStatus: 200,
    schema: {
      body: z.object({}),
      query: z.object({
        createdRangeStart: z.iso.datetime().optional(),
        createdRangeEnd: z.iso.datetime().optional(),
        search: z.string().optional(),
        from: z.uuid().optional(),
        to: z.uuid().optional(),
        limit: zodStringInt(z.int().min(1).max(100), 10),
        offset: zodStringInt(z.int().min(0), 0),
      }),
      path: z.object({}),
    },
    authorizer: allAuthenticatedAuthorizer,
    handler: async (req) => {
      if (!req.authnClaims || !req.authnClaims.sub) {
        throw new Error("No userId in authn claims");
      }

      const filter: ListMessagesFilter = {
        createdRangeStart: req.query.createdRangeStart
          ? new Date(req.query.createdRangeStart)
          : undefined,
        createdRangeEnd: req.query.createdRangeEnd
          ? new Date(req.query.createdRangeEnd)
          : undefined,
        search: req.query.search,
        from: req.query.from,
        to: req.query.to,
        limit: req.query.limit,
        offset: req.query.offset,
        userContextFilter: req.authnClaims.sub,
      };

      return deps.messageRepo.listMessages(filter);
    },
  });
};

export { useListCurrentUserMessages };
