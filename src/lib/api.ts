import type { Authenticator, TokenExtractor } from "./auth/authn.js";
import type { Authorizer } from "./auth/authz.js";
import type { AnyRoute } from "./route.js";
import { RequestPartSchema } from "./utils/schemas.js";

type HostOptions =
  | {
      restrictHosts: true;
      allowedHosts: string[];
    }
  | {
      restrictHosts: false;
      allowedHosts?: undefined;
    };

type AuthzOptions = {
  authorizer?: Authorizer;
};

type AuthnOptions = {
  allowUnauthenticated?: boolean; // Default is false. Whether or not to allow unauthenticated requests. Does not impact proxy authn. Does not bypass authorizer - however it allows passing of authentication decisions with authenticated: false to authorizer
  tokenExtractor: TokenExtractor;
  authenticator: Authenticator;
};

type RouteOptions = {
  routes: Array<AnyRoute>;
};

type DocsOptions = {
  version: string;
  description: string;
  jsonSchemaParser?: (schema: RequestPartSchema) => Record<string, any>;
};

type ApiOptions = { name: string } & HostOptions &
  AuthzOptions &
  AuthnOptions &
  RouteOptions &
  DocsOptions;

type Api = {
  name: string;
  version: string;
  description: string;
  routes: Array<AnyRoute>;
  tokenExtractor: TokenExtractor;
  allowUnauthenticated: boolean;
  authenticator: Authenticator;
  authorizer: Authorizer;
  restrictHosts: boolean;
  allowedHosts: string[];
  jsonSchemaParser: (schema: RequestPartSchema) => Record<string, any>;
};

function defineApi(options: ApiOptions): Api {
  return {
    name: options.name,
    version: options.version,
    description: options.description,
    routes: options.routes,
    tokenExtractor: options.tokenExtractor,
    allowUnauthenticated: options.allowUnauthenticated ?? false,
    authenticator: options.authenticator,
    authorizer: options.authorizer ?? (async () => ({ authorized: true })),
    restrictHosts: options.restrictHosts,
    allowedHosts: options.restrictHosts ? options.allowedHosts : [],
    jsonSchemaParser:
      options.jsonSchemaParser ??
      ((schema) => {
        return {};
      }),
  };
}

export { type Api, defineApi };
