import Koa = require("koa");
import Router = require("@koa/router");
import { Server } from "http";
import type { Api } from "./api.js";
import type { AnyRoute } from "./route.js";
import { defaultErrorHandler } from "./middleware/errorHandler.js";
import { defaultValidationFailureHandler } from "./middleware/validationFailureHandler.js";
import { defaultUndefinedRouteHandler } from "./middleware/undefinedRouteHandler.js";
import { emptyLogger, Logger } from "./utils/logger.js";
import { loggerInjector } from "./middleware/loggerInjector.js";
import bodyParser from "@koa/bodyparser";
import { Authenticator, TokenExtractor } from "./auth/authn.js";
import { Authorizer } from "./auth/authz.js";
import { validateRequestData } from "./utils/schemas.js";

type ProxyAuthOptions =
  | {
      authenticatedProxy?: false;
    }
  | {
      authenticatedProxy: true; // The server is behind an authenticated proxy
      tokenExtractor: TokenExtractor; // Method to extract proxy auth token from request
      authenticator: Authenticator; // Authenticator for proxy token
      authorizer: Authorizer; // Authorizer for proxy authn result
    };

type ProxyOptions = {
  trustProxy?: boolean; // Default is false
  proxyIpHeader?: string; // if trustProxy is true, default is "X-Forwarded-For" to get client IP from this header
} & ProxyAuthOptions;

type LoggerOptions = {
  logger?: Logger; // Logger for request context
  internalLogger?: Logger; // Logger used within server outside of request context
};

type ServerOptions = {
  proxy?: ProxyOptions;
  logging?: LoggerOptions; // Logger for request context
};

class ApiServer {
  private _app: Koa;
  private _router: Router;
  private _apis: Api[] = [];
  private _server?: Server;
  private _internalLogger: Logger; // Logger used within server outside of request context
  private _undefinedRouteHandler = defaultUndefinedRouteHandler;

  get apis(): Api[] {
    return this._apis;
  }

  constructor(opts: ServerOptions) {
    this._internalLogger = opts.logging?.internalLogger ?? emptyLogger;
    this._app = new Koa({
      proxy: opts.proxy?.trustProxy ?? false,
      proxyIpHeader:
        opts?.proxy?.trustProxy && opts?.proxy?.proxyIpHeader
          ? "X-Forwarded-For"
          : undefined,
    });
    this._router = new Router();

    const proxyAuthConfig = opts?.proxy?.authenticatedProxy
      ? {
          tokenExtractor: opts.proxy.tokenExtractor,
          authenticator: opts.proxy.authenticator,
          authorizer: opts.proxy.authorizer,
        }
      : undefined;

    this.setupMiddleware(opts.logging?.logger ?? emptyLogger, proxyAuthConfig);
  }

  private setupMiddleware(
    logger: Logger,
    proxyAuthConfig?: {
      tokenExtractor: TokenExtractor;
      authenticator: Authenticator;
      authorizer: Authorizer;
    }
  ): void {
    this._app.use(loggerInjector(logger));
    this._app.use(defaultErrorHandler);

    // proxy authn happens before parsing, if configured
    if (proxyAuthConfig) {
      this._app.use(async (ctx, next) => {
        const token = proxyAuthConfig.tokenExtractor(ctx.headers, ctx.query);
        const authn = await proxyAuthConfig.authenticator(token);

        if (!authn.authenticated) {
          ctx.state.logger.warn("Unauthenticated access attempt to proxy");
          ctx.status = 401;
          ctx.body = { error: "Unauthenticated" };
          return;
        }

        const authzDec = await proxyAuthConfig.authorizer(authn);
        if (!authzDec.authorized) {
          ctx.state.logger.warn("Unauthorized access attempt to proxy", {
            authn,
          });
          ctx.status = 403;
          ctx.body = { error: "Unauthorized" };
          return;
        }

        await next();
      });
    }
    this._app.use(
      bodyParser({
        enableTypes: ["json"],
        parsedMethods: ["POST", "PUT", "PATCH"],
        jsonLimit: "1mb",
      })
    );
  }

  registerApi(api: Api): this {
    this._apis.push(api);
    this.registerApiRoutes(api);
    return this;
  }

  private registerApiRoutes(api: Api): void {
    api.routes.forEach((route) => {
      this.registerKoaRoute(api, route);
    });
  }

  private registerKoaRoute(api: Api, route: AnyRoute): void {
    const koaHandler: Router.Middleware = async (ctx, next) => {
      if (api.restrictHosts && !api.allowedHosts.includes(ctx.host)) {
        ctx.state.logger.warn(`Host not allowed: ${ctx.host}`);
        ctx.status = 404;
        return next(); // Go to 404 handler
      }

      const token = api.tokenExtractor(ctx.headers, ctx.query);
      const authn = await api.authenticator(token); // authn happens at the API level
      if (!authn.authenticated && !api.allowUnauthenticated) {
        ctx.state.logger.warn("Unauthenticated access attempt");
        ctx.status = 401;
        ctx.body = { error: "Unauthenticated" };
        return;
      }
      const authorizers = [api.authorizer, route.authorizer]; // authz is required at the route level, but can also be set at the API level

      const isAuthorized = await authorizers.reduce(
        async (prev, authorizer) => {
          const prevRes = await prev;
          const authzDec = authorizer
            ? await authorizer(authn)
            : { authorized: true }; // A route may not have an authorizer
          return prevRes && authzDec.authorized;
        },
        Promise.resolve(true)
      );

      if (!isAuthorized) {
        ctx.state.logger.warn("Unauthorized access attempt", { authn });
        ctx.status = 403;
        ctx.body = { error: "Unauthorized" };
        return;
      }

      const requestData = await this.extractRequestData(ctx, route);
      const validatedData = validateRequestData(route.schema, requestData);
      if (!validatedData.success) {
        return defaultValidationFailureHandler(validatedData, ctx);
      }

      const result = await route.handler(
        {
          ...validatedData.data,
          authnClaims: authn.authenticated ? authn.claims : undefined,
        },
        ctx.state.logger
      );

      if (route.notFoundValues.includes(result)) {
        ctx.state.logger.info("Resource not found", { result });
        ctx.status = 404;
        ctx.body = { error: "Not Found" };
        return;
      }

      ctx.status = route.successStatus;
      ctx.body = result;
    };

    // Register with Koa router based on HTTP method
    switch (route.method) {
      case "GET":
        this._router.get(route.operationId, route.route, koaHandler);
        break;
      case "POST":
        this._router.post(route.operationId, route.route, koaHandler);
        break;
      case "PUT":
        this._router.put(route.operationId, route.route, koaHandler);
        break;
      case "PATCH":
        this._router.patch(route.operationId, route.route, koaHandler);
        break;
      case "DELETE":
        this._router.delete(route.operationId, route.route, koaHandler);
        break;
      default:
        throw new Error(`Unsupported HTTP method: ${route.method}`);
    }

    this._internalLogger.info(
      `Registered Koa route: ${route.method} ${route.route} (${route.operationId})`
    );
  }

  private async extractRequestData(ctx: Koa.Context, route: AnyRoute) {
    return {
      body: ctx.request.body || {},
      query: ctx.query || {},
      path: ctx.params || {},
    };
  }

  listen(port: number, callback?: () => void): Server {
    this._app.use(this._router.routes());
    this._app.use(this._router.allowedMethods());
    this._app.use(this._undefinedRouteHandler); // custom 404 handler

    // Start server
    this._server = this._app.listen(port, callback);
    return this._server;
  }

  close(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this._server) {
        this._server.close((err) => {
          if (err) reject(err);
          else resolve();
        });
      } else {
        resolve();
      }
    });
  }
}

export { ApiServer };
