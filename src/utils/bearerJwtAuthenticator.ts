import type { TokenVerifier } from "../infra/tokenVerifier.js";
import type { Authenticator } from "../lib/auth/authn.js";

const useBearerJwtAuthenticator = (
  tokenVerifier: TokenVerifier
): Authenticator => {
  const authenticator: Authenticator = async (token) => {
    if (!token) {
      return { authenticated: false };
    }

    if (!token.startsWith("Bearer ")) {
      return { authenticated: false };
    }

    const tokenVal = token.slice(7).trim();

    try {
      const claims = await tokenVerifier.verifyToken(tokenVal);
      if (claims) {
        return { authenticated: true, claims };
      }
    } catch (error) {
      return { authenticated: false };
    }

    return { authenticated: false };
  };

  return authenticator;
};

export { useBearerJwtAuthenticator };
