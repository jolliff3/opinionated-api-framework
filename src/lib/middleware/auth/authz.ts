import { Authentication } from "./authn.js";

type AuthzDecision =
  | {
      authorized: true;
    }
  | {
      authorized: false;
    };

type Authorizer = (authn: Authentication) => Promise<AuthzDecision>;

export { type Authorizer };
