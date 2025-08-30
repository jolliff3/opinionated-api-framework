import { bodyParser } from "@koa/bodyparser";
import Koa = require("koa");

export const defaultBodyParser: Koa.Middleware = bodyParser({
  enableTypes: ["json"],
  parsedMethods: ["POST", "PUT", "PATCH"],
});
