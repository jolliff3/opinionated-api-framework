type AuthnDecision<T = Record<string, any>> =
  | {
      authenticated: true;
      claims: T;
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
