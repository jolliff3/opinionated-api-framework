import z from "zod";
import { type AnyRoute, defineRoute } from "../../lib/route.js";
import { allAuthenticatedAuthorizer } from "../../utils/authorizers.js";
import type { MessageRepo } from "../../infra/messageRepo.js";

const useSendMessageRoute = (
  serviceId: string,
  deps: { messageRepo: MessageRepo }
): AnyRoute | null => {
  if (serviceId !== "message-service") {
    return null;
  }

  return defineRoute({
    serviceId: "message-service",
    operationId: "SendMessage",
    method: "POST",
    route: "/users/current/messages\\:send",
    successStatus: 200,
    schema: {
      body: z.object({
        to: z.uuid(),
        message: z.string().min(1).max(1000),
      }),
      query: z.object({}),
      path: z.object({}),
    },
    authorizer: allAuthenticatedAuthorizer,
    handler: async (req) => {
      if (!req.authnClaims || !req.authnClaims.sub) {
        throw new Error("No userId in authn claims");
      }

      // TODO: Very "to" exists by calling the user service

      return deps.messageRepo.createMessage({
        from: req.authnClaims.sub,
        to: req.body.to,
        message: req.body.message,
      });
    },
  });
};

export { useSendMessageRoute };
