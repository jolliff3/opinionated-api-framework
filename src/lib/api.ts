import { Authenticator } from "./middleware/auth/authn.js";
import { Authorizer } from "./middleware/auth/authz.js";
import { AnyRoute, Route, RouteSchema } from "./route.js";

type HostOptions =
  | {
      restrictHosts: true;
      hosts: string[];
    }
  | {
      restrictHosts: false;
      hosts?: undefined;
    };

type AuthzOptions = {
  authorizer?: Authorizer;
};

type AuthnOptions = {
  authenticator: Authenticator;
  tokenLocation: "HEADER";
  tokenKey: string;
  allowUnauthenticated: boolean;
};

type RouteOptions = {
  routes: Array<AnyRoute>;
};

type ApiOptions = HostOptions & AuthzOptions & AuthnOptions & RouteOptions;

type Api =
  | {
      routes: Array<AnyRoute>;
      authorizer: Authorizer;
      authenticator: Authenticator;
      tokenLocation: "HEADER";
      tokenKey: string;
      allowUnauthenticated: boolean;
    } & (
      | {
          restrictHosts: false;
        }
      | {
          restrictHosts: true;
          allowedHosts: string[];
        }
    );

function defineApi(options: ApiOptions): Api {
  return {
    routes: options.routes,
    authorizer: options.authorizer ?? (async () => ({ authorized: true })),
    authenticator: options.authenticator,
    tokenLocation: options.tokenLocation,
    tokenKey: options.tokenKey,
    allowUnauthenticated: options.allowUnauthenticated,
    restrictHosts: options.restrictHosts,
    ...(options.restrictHosts
      ? { allowedHosts: options.hosts }
      : { allowedHosts: [] }),
  };
}

export { type Api, defineApi };
