import { type JwtPayload } from "./tokenRepo.js";
import crypto from "crypto";

type JwtHeader = {
  alg: string;
  typ: string;
  kid: string;
};

type Jwk = {
  kty: string;
  use: string;
  alg: string;
  kid: string;
  n: string;
  e: string;
};

type Jwks = {
  keys: Jwk[];
};

class TokenVerifier {
  private readonly _jwksUrl: string;
  private readonly _audience: string;
  private readonly _issuer: string;
  private readonly _keyCache: Map<string, crypto.KeyObject> = new Map();
  private _jwksCache: Jwks | null = null;
  private _jwksCacheExpiry: number = 0;
  private readonly _jwksCacheTtl: number = 3600000; // 1 hour in milliseconds

  constructor(jwksUrl: string, audience: string, issuer: string) {
    this._jwksUrl = jwksUrl;
    this._audience = audience;
    this._issuer = issuer;
  }

  private async fetchJwks(): Promise<Jwks> {
    const now = Date.now();

    // Return cached JWKS if still valid
    if (this._jwksCache && now < this._jwksCacheExpiry) {
      return this._jwksCache;
    }

    try {
      const response = await fetch(this._jwksUrl);
      if (!response.ok) {
        throw new Error(
          `Failed to fetch JWKS: ${response.status} ${response.statusText}`
        );
      }

      const jwks: Jwks = (await response.json()) as Jwks;

      // Cache the JWKS
      this._jwksCache = jwks;
      this._jwksCacheExpiry = now + this._jwksCacheTtl;

      return jwks;
    } catch (error) {
      throw new Error(`Failed to fetch JWKS from ${this._jwksUrl}: ${error}`);
    }
  }

  private jwkToPublicKey(jwk: Jwk): crypto.KeyObject {
    // Check if we have this key cached
    if (this._keyCache.has(jwk.kid)) {
      return this._keyCache.get(jwk.kid)!;
    }

    if (jwk.kty !== "RSA") {
      throw new Error(`Unsupported key type: ${jwk.kty}`);
    }

    // Convert JWK to PEM format
    const keyObject = crypto.createPublicKey({
      key: {
        kty: jwk.kty,
        n: jwk.n,
        e: jwk.e,
      },
      format: "jwk",
    });

    // Cache the key
    this._keyCache.set(jwk.kid, keyObject);

    return keyObject;
  }

  private base64UrlDecode(str: string): Buffer {
    // Add padding if needed
    const padded = str + "=".repeat((4 - (str.length % 4)) % 4);
    // Convert base64url to base64
    const base64 = padded.replace(/-/g, "+").replace(/_/g, "/");
    return Buffer.from(base64, "base64");
  }

  private parseToken(token: string): {
    header: JwtHeader;
    payload: JwtPayload;
    signature: Buffer;
    signingInput: string;
  } | null {
    const parts = token.split(".");
    if (parts.length !== 3) {
      return null;
    }

    try {
      const [headerB64, payloadB64, signatureB64] = parts;

      const headerJson = this.base64UrlDecode(headerB64).toString("utf8");
      const header: JwtHeader = JSON.parse(headerJson);

      const payloadJson = this.base64UrlDecode(payloadB64).toString("utf8");
      const payload: JwtPayload = JSON.parse(payloadJson);

      const signature = this.base64UrlDecode(signatureB64);
      const signingInput = `${headerB64}.${payloadB64}`;

      return { header, payload, signature, signingInput };
    } catch (error) {
      return null;
    }
  }

  private validateClaims(payload: JwtPayload): boolean {
    const now = Math.floor(Date.now() / 1000);

    // Check expiration
    if (payload.exp <= now) {
      return false;
    }

    // Check issued at time (should not be in the future)
    if (payload.iat > now + 60) {
      // Allow 60 seconds clock skew
      return false;
    }

    // Check issuer
    if (payload.iss !== this._issuer) {
      return false;
    }

    // Check audience
    if (payload.aud !== this._audience) {
      return false;
    }

    return true;
  }

  async verifyToken(token: string): Promise<JwtPayload | null> {
    try {
      // Parse the token
      const parsed = this.parseToken(token);
      if (!parsed) {
        return null;
      }

      const { header, payload, signature, signingInput } = parsed;

      // Validate algorithm
      if (header.alg !== "RS256") {
        return null;
      }

      // Validate token type
      if (header.typ !== "JWT") {
        return null;
      }

      // Validate claims first (before expensive crypto operations)
      if (!this.validateClaims(payload)) {
        return null;
      }

      // Fetch JWKS and find the key
      const jwks = await this.fetchJwks();
      const jwk = jwks.keys.find((key) => key.kid === header.kid);

      if (!jwk) {
        return null;
      }

      // Convert JWK to public key
      const publicKey = this.jwkToPublicKey(jwk);

      // Verify signature
      const isValid = crypto.verify(
        "sha256",
        Buffer.from(signingInput),
        publicKey,
        signature
      );

      if (!isValid) {
        return null;
      }

      return payload;
    } catch (error) {
      return null;
    }
  }

  // Method to clear caches (useful for testing or manual cache invalidation)
  clearCaches(): void {
    this._keyCache.clear();
    this._jwksCache = null;
    this._jwksCacheExpiry = 0;
  }

  // Method to get current cache status (useful for monitoring)
  getCacheStatus(): {
    keyCacheSize: number;
    jwksCached: boolean;
    jwksCacheExpiry: Date | null;
  } {
    return {
      keyCacheSize: this._keyCache.size,
      jwksCached: this._jwksCache !== null,
      jwksCacheExpiry:
        this._jwksCacheExpiry > 0 ? new Date(this._jwksCacheExpiry) : null,
    };
  }
}

export { TokenVerifier };
