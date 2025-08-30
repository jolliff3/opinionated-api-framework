import { bodyParser } from "@koa/bodyparser";
import { type Middleware } from "koa";

const defaultBodyParser: Middleware = bodyParser({
  enableTypes: ["json"],
  parsedMethods: ["POST", "PUT", "PATCH"],
});

export { defaultBodyParser };
