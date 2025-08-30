type AuthenticatedClaims = {
  jti: string;
  iat: number;
  exp: number;
  sub: string;
  aud: string;
  iss: string;
} & Record<string, any>;

type AuthnDecision =
  | {
      authenticated: true;
      claims: AuthenticatedClaims;
    }
  | {
      authenticated: false;
    };

type Authenticator = (token: string | null) => Promise<AuthnDecision>;
type TokenExtractor = (
  headers: Record<string, string | string[] | undefined>,
  query: Record<string, string | string[] | undefined>
) => string | null;

export { type AuthnDecision, type Authenticator, type TokenExtractor };
