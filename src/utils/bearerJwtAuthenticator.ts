import type { Authenticator, AuthnDecision } from "../lib/auth/authn.js";

const bearerJwtAuthenticator: Authenticator = async (
  token: string | null
): Promise<AuthnDecision> => {
  if (!token) {
    return { authenticated: false };
  }

  if (!token.startsWith("Bearer ")) {
    return { authenticated: false };
  }

  const tokenVal = token.slice(7).trim();

  // Dummy implementation for illustration; replace with real JWT verification
  if (tokenVal === "admin") {
    return {
      authenticated: true,
      claims: {
        jti: "unique-token-id",
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
        sub: "user-id",
        aud: "your-audience",
        iss: "your-issuer",
        role: "admin",
      },
    };
  }

  if (tokenVal === "user") {
    return {
      authenticated: true,
      claims: {
        jti: "unique-token-id",
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
        sub: "4ab28100-f56d-450d-92be-5f9fec656ccd", // John Doe's user ID
        aud: "your-audience",
        iss: "your-issuer",
        role: "user",
      },
    };
  }

  return { authenticated: false };
};

export { bearerJwtAuthenticator };
