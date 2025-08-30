import { type TokenExtractor } from "../lib/auth/authn.js";

const headerTokenExtractor: TokenExtractor = (headers, _) => {
  const authHeader = headers["authorization"];
  if (!authHeader) {
    return null;
  }

  if (typeof authHeader !== "string") {
    return null;
  }

  return authHeader;
};

export { headerTokenExtractor };
