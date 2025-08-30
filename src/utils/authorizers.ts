import { type AuthnDecision } from "../lib/auth/authn.js";
import { type Authorizer } from "../lib/auth/authz.js";

const adminAuthorizer: Authorizer = async (authn: AuthnDecision) => {
  if (!authn.authenticated) {
    return { authorized: false };
  }

  const isAdmin = authn.claims.role === "admin";
  return { authorized: isAdmin };
};

const allAuthenticatedAuthorizer: Authorizer = async (authn: AuthnDecision) => {
  return { authorized: authn.authenticated };
};

export { adminAuthorizer, allAuthenticatedAuthorizer };
