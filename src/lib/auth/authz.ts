import { type AuthnDecision } from "./authn.js";

type AuthzDecision =
  | {
      authorized: true;
    }
  | {
      authorized: false;
    };

type Authorizer<T = Record<string, any>> = (
  authn: AuthnDecision<T>
) => Promise<AuthzDecision>;

export { type Authorizer, type AuthzDecision };
