import { AuthnDecision } from "../../lib/auth/authn.js";
import { ProxyOptions } from "../../lib/server.js";

const devProxyOpts: ProxyOptions = {
  trustProxy: true,
  proxyIpHeader: "X-Forwarded-For",
  authenticatedProxy: true,
  tokenExtractor: (headers, _) => {
    const proxyToken = headers["x-proxy-auth"] ?? headers["X-Proxy-Auth"];
    if (typeof proxyToken === "string") {
      return proxyToken;
    }

    return null;
  },
  authenticator: async (token): Promise<AuthnDecision<{ proxy: true }>> => {
    if (token === "secure-proxy-token") {
      return { authenticated: true, claims: { proxy: true } };
    }

    return { authenticated: false };
  },
  authorizer: async (authn) => {
    if (authn.authenticated) {
      return { authorized: true };
    }

    return { authorized: false };
  },
};

export { devProxyOpts };
