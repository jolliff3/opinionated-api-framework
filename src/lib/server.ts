import Koa = require("koa");
import Router = require("@koa/router");
import { Server } from "http";
import { Api } from "./api.js";
import { AnyRoute } from "./route.js";
import { defaultErrorHandler } from "./middleware/errorHandler.js";
import { defaultBodyParser } from "./middleware/bodyParser.js";
import { defaultValidationFailureHandler } from "./middleware/validationFailureHandler.js";
import { defaultUndefinedRouteHandler } from "./middleware/undefinedRouteHandler.js";
class ApiServer {
  private app: Koa;
  private router: Router;
  private apis: Api[] = [];
  private server?: Server;

  constructor() {
    this.app = new Koa();
    this.router = new Router();
    this.setupMiddleware();
  }

  private setupMiddleware(): void {
    this.app.use(defaultErrorHandler);
    this.app.use(defaultBodyParser);
  }

  registerApi(api: Api): this {
    this.apis.push(api);
    this.registerApiRoutes(api);
    return this;
  }

  private registerApiRoutes(api: Api): void {
    api.routes.forEach((route) => {
      this.registerKoaRoute(api, route);
    });
  }

  private extractToken(
    ctx: Koa.Context,
    tokenLocation: string,
    tokenKey: string
  ): string | null {
    if (tokenLocation === "HEADER") {
      const token = ctx.headers[tokenKey.toLowerCase()];
      if (token && typeof token === "string") {
        return token;
      }
    }

    return null;
  }

  private registerKoaRoute(api: Api, route: AnyRoute): void {
    const koaHandler: Router.Middleware = async (ctx) => {
      if (api.restrictHosts && !api.allowedHosts.includes(ctx.host)) {
        ctx.status = 404;
        ctx.body = { error: "Not Found" };
        return;
      }

      const token = this.extractToken(ctx, api.tokenLocation, api.tokenKey);
      const authn = await api.authenticator(token); // authn happens at the API level
      if (!authn.authenticated && !api.allowUnauthenticated) {
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
        ctx.status = 403;
        ctx.body = { error: "Unauthorized" };
        return;
      }

      const requestData = await this.extractRequestData(ctx, route);
      const validatedData = this.validateRequestData(requestData, route);

      if (!validatedData.success) {
        return defaultValidationFailureHandler(validatedData, ctx);
      }
      const result = await route.handler({
        ...validatedData.data,
        authnClaims: authn.authenticated ? authn.claims : undefined,
      });

      ctx.status = route.successStatus;
      ctx.body = result;
    };

    // Register with Koa router based on HTTP method
    switch (route.method) {
      case "GET":
        this.router.get(route.operationId, route.route, koaHandler);
        break;
      case "POST":
        this.router.post(route.operationId, route.route, koaHandler);
        break;
      case "PUT":
        this.router.put(route.operationId, route.route, koaHandler);
        break;
      case "PATCH":
        this.router.patch(route.operationId, route.route, koaHandler);
        break;
      case "DELETE":
        this.router.delete(route.operationId, route.route, koaHandler);
        break;
      default:
        throw new Error(`Unsupported HTTP method: ${route.method}`);
    }

    console.log(
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

  private validateRequestData(
    data: any,
    route: AnyRoute
  ):
    | { success: true; data: { body: any; query: any; path: any } }
    | { success: false; errors: Map<"body" | "query" | "path", any> } {
    const errors = new Map<"body" | "query" | "path", any>();

    const vBody = route.schema.body.safeParse(data.body);
    if (!vBody.success) {
      errors.set("body", vBody.error);
    }

    const vQuery = route.schema.query.safeParse(data.query);
    if (!vQuery.success) {
      errors.set("query", vQuery.error);
    }

    const vPath = route.schema.path.safeParse(data.path);
    if (!vPath.success) {
      errors.set("path", vPath.error);
    }

    if (errors.size > 0) {
      return { success: false, errors };
    }

    return {
      success: true,
      data: {
        body: vBody.data,
        query: vQuery.data,
        path: vPath.data,
      },
    };
  }

  listen(port: number, callback?: () => void): Server {
    this.app.use(this.router.routes());
    this.app.use(this.router.allowedMethods());
    this.app.use(defaultUndefinedRouteHandler); // custom 404 handler

    // Start server
    this.server = this.app.listen(port, callback);
    return this.server;
  }

  close(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.server) {
        this.server.close((err) => {
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
