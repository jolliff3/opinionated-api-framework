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

type ApiOptions = HostOptions & AuthzOptions & AuthnOptions;

class Api {
  private _routes: Map<string, AnyRoute> = new Map();
  private _allowedHosts: string[] | null = null;
  private _authenticator: Authenticator;
  private _authorizer: Authorizer = async () => {
    return { authorized: true };
  };
  private _tokenLocation: "HEADER";
  private _tokenKey: string;
  private _allowUnauthenticated: boolean;

  get authorizer(): Authorizer {
    return this._authorizer;
  }

  get authenticator(): Authenticator {
    return this._authenticator;
  }

  get tokenLocation(): "HEADER" {
    return this._tokenLocation;
  }

  get tokenKey(): string {
    return this._tokenKey;
  }

  get allowUnauthenticated(): boolean {
    return this._allowUnauthenticated;
  }

  constructor(options: ApiOptions) {
    this._authenticator = options.authenticator;

    if (options.restrictHosts) {
      this._allowedHosts = options.hosts;
    }

    if (options.authorizer) {
      this._authorizer = options.authorizer;
    }

    this._tokenLocation = options.tokenLocation;
    this._tokenKey = options.tokenKey;
    this._allowUnauthenticated = options.allowUnauthenticated;
  }

  registerRoute<TSchema extends RouteSchema, TRes>(
    route: Route<TSchema, TRes>
  ): this {
    const routeKey = route.operationId;
    if (this._routes.has(routeKey)) {
      throw new Error(
        `Route with operationId ${routeKey} is already registered`
      );
    }

    this._routes.set(routeKey, route);
    return this;
  }

  getRoute(operationId: string): AnyRoute | undefined {
    return this._routes.get(operationId);
  }

  getAllRoutes(): AnyRoute[] {
    return Array.from(this._routes.values());
  }

  clear(): this {
    this._routes.clear();
    return this;
  }

  getAllowedHosts(): string[] | null {
    return this._allowedHosts;
  }
}

export { Api, type ApiOptions };
