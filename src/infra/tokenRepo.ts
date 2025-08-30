import { User } from "./userRepo.js";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import { Logger } from "../lib/utils/logger.js";

type SigningConfig = {
  issuer: string;
  audience: string;
  tokenExpirySeconds: number;
};

type JwtHeader = {
  alg: string;
  typ: string;
  kid: string;
};

type JwtPayload = {
  iss: string;
  aud: string;
  sub: string;
  iat: number;
  exp: number;
  email?: string;
  name?: string;
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

class TokenRepo {
  private readonly _keyDir: string;
  private readonly _signingConfig: SigningConfig;
  private readonly _currentKeyId: string = "default-key-2024";

  private readonly _publicKeyCache: Map<string, crypto.KeyObject> = new Map();
  private readonly _privateKeyCache: Map<string, crypto.KeyObject> = new Map();
  private readonly logger: Logger;

  constructor(keyDir: string, signingConfig: SigningConfig, logger: Logger) {
    this._keyDir = keyDir;
    this._signingConfig = signingConfig;
    this.logger = logger;
  }

  private async generateKeyPair(): Promise<void> {
    this.logger.info("Generating new RSA key pair for token signing");
    const { publicKey, privateKey } = crypto.generateKeyPairSync("rsa", {
      modulusLength: 2048,
      publicKeyEncoding: {
        type: "spki",
        format: "pem",
      },
      privateKeyEncoding: {
        type: "pkcs8",
        format: "pem",
      },
    });

    // Ensure key directory exists
    await fs.mkdir(this._keyDir, { recursive: true });

    // Save keys to files
    const publicKeyPath = path.join(this._keyDir, `${this._currentKeyId}.pub`);
    const privateKeyPath = path.join(this._keyDir, `${this._currentKeyId}.key`);

    await fs.writeFile(publicKeyPath, publicKey);
    await fs.writeFile(privateKeyPath, privateKey);

    // Cache the key objects
    const publicKeyObj = crypto.createPublicKey(publicKey);
    const privateKeyObj = crypto.createPrivateKey(privateKey);

    this._publicKeyCache.set(this._currentKeyId, publicKeyObj);
    this._privateKeyCache.set(this._currentKeyId, privateKeyObj);
  }

  private async loadKey(
    keyId: string,
    isPrivate: boolean
  ): Promise<crypto.KeyObject | null> {
    this.logger.debug("Loading key", { keyId, isPrivate });
    const cache = isPrivate ? this._privateKeyCache : this._publicKeyCache;

    if (cache.has(keyId)) {
      return cache.get(keyId)!;
    }

    const keyExtension = isPrivate ? ".key" : ".pub";
    const keyPath = path.join(this._keyDir, `${keyId}${keyExtension}`);

    try {
      const keyData = await fs.readFile(keyPath, "utf8");
      const keyObj = isPrivate
        ? crypto.createPrivateKey(keyData)
        : crypto.createPublicKey(keyData);

      cache.set(keyId, keyObj);
      return keyObj;
    } catch (error) {
      this.logger.error("Failed to load key from file", { keyPath, error });
      return null;
    }
  }

  private async ensureKeyExists(): Promise<void> {
    const privateKey = await this.loadKey(this._currentKeyId, true);
    if (!privateKey) {
      await this.generateKeyPair();
    }
  }

  private base64UrlEncode(buffer: Buffer): string {
    return buffer
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=/g, "");
  }

  private createJWTPayload(user: User): JwtPayload {
    const now = Math.floor(Date.now() / 1000);

    return {
      iss: this._signingConfig.issuer,
      aud: this._signingConfig.audience,
      sub: user.id.toString(),
      iat: now,
      exp: now + this._signingConfig.tokenExpirySeconds,
      email: user.email,
      name: user.name,
    };
  }

  async generateUserIdToken(user: User): Promise<string> {
    await this.ensureKeyExists();

    const privateKey = await this.loadKey(this._currentKeyId, true);
    if (!privateKey) {
      throw new Error("Failed to load private key for token signing");
    }

    // Create JWT header
    const header: JwtHeader = {
      alg: "RS256",
      typ: "JWT",
      kid: this._currentKeyId,
    };

    // Create JWT payload
    const payload = this.createJWTPayload(user);

    // Encode header and payload
    const encodedHeader = this.base64UrlEncode(
      Buffer.from(JSON.stringify(header))
    );
    const encodedPayload = this.base64UrlEncode(
      Buffer.from(JSON.stringify(payload))
    );

    // Create signature
    const signingInput = `${encodedHeader}.${encodedPayload}`;
    const signature = crypto.sign(
      "sha256",
      Buffer.from(signingInput),
      privateKey
    );
    const encodedSignature = this.base64UrlEncode(signature);

    // Return complete JWT
    return `${signingInput}.${encodedSignature}`;
  }

  async getJwks(): Promise<Jwks> {
    await this.ensureKeyExists();

    const publicKey = await this.loadKey(this._currentKeyId, false);
    if (!publicKey) {
      throw new Error("Failed to load public key for JWKS");
    }

    // Parse the DER to extract n and e values for JWK
    // This is a simplified approach - in production, you might want to use a library
    const publicKeyPem = publicKey.export({
      type: "spki",
      format: "pem",
    }) as string;
    const publicKeyObj = crypto.createPublicKey(publicKeyPem);

    // Get the key in JWK format components
    const keyExport = publicKeyObj.export({ format: "jwk" }) as any;

    const jwk: Jwk = {
      kty: "RSA",
      use: "sig",
      alg: "RS256",
      kid: this._currentKeyId,
      n: keyExport.n,
      e: keyExport.e,
    };

    return {
      keys: [jwk],
    };
  }

  // Utility method to verify a token (useful for testing)
  async verifyToken(token: string): Promise<JwtPayload | null> {
    try {
      const [headerB64, payloadB64, signatureB64] = token.split(".");

      if (!headerB64 || !payloadB64 || !signatureB64) {
        return null;
      }

      // Decode header to get key ID
      const headerJson = Buffer.from(headerB64, "base64").toString();
      const header: JwtHeader = JSON.parse(headerJson);

      // Load public key
      const publicKey = await this.loadKey(header.kid, false);
      if (!publicKey) {
        return null;
      }

      // Verify signature
      const signingInput = `${headerB64}.${payloadB64}`;
      const signature = Buffer.from(
        signatureB64.replace(/-/g, "+").replace(/_/g, "/"),
        "base64"
      );

      const isValid = crypto.verify(
        "sha256",
        Buffer.from(signingInput),
        publicKey,
        signature
      );
      if (!isValid) {
        return null;
      }

      // Decode and validate payload
      const payloadJson = Buffer.from(payloadB64, "base64").toString();
      const payload: JwtPayload = JSON.parse(payloadJson);

      // Check expiration
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp < now) {
        return null;
      }

      return payload;
    } catch (error) {
      return null;
    }
  }
}

export { TokenRepo, type SigningConfig, type JwtPayload, type Jwks };
