import type { Authenticator, TokenExtractor } from "./auth/authn.js";
import type { Authorizer } from "./auth/authz.js";
import type { AnyRoute } from "./route.js";

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
  allowUnauthenticated?: boolean;
  tokenExtractor: TokenExtractor;
  authenticator: Authenticator;
};

type RouteOptions = {
  routes: Array<AnyRoute>;
};

type ApiOptions = HostOptions & AuthzOptions & AuthnOptions & RouteOptions;

type Api = {
  routes: Array<AnyRoute>;
  tokenExtractor: TokenExtractor;
  allowUnauthenticated: boolean;
  authenticator: Authenticator;
  authorizer: Authorizer;
  restrictHosts: boolean;
  allowedHosts: string[];
};

function defineApi(options: ApiOptions): Api {
  return {
    routes: options.routes,
    tokenExtractor: options.tokenExtractor,
    allowUnauthenticated: options.allowUnauthenticated ?? false,
    authenticator: options.authenticator,
    authorizer: options.authorizer ?? (async () => ({ authorized: true })),
    restrictHosts: options.restrictHosts,
    allowedHosts: options.restrictHosts ? options.allowedHosts : [],
  };
}

export { type Api, defineApi };
