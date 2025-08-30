import { type AuthnDecision } from "./authn.js";

type AuthzDecision =
  | {
      authorized: true;
    }
  | {
      authorized: false;
    };

type Authorizer = (authn: AuthnDecision) => Promise<AuthzDecision>;

export { type Authorizer, type AuthzDecision };
