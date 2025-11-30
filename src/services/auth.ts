/**
 * Authentication service with JWT support
 */

/**
 * Sign a JWT token
 * Note: Requires 'jose' package to be installed
 */
export async function signJWT(
    payload: Record<string, unknown>,
    secret: string,
    options?: {
        expiresIn?: string;
        algorithm?: string;
    },
): Promise<string> {
    try {
        // Dynamic import to make jose optional
        const { SignJWT } = await import("jose");
        const algorithm = options?.algorithm || "HS256";
        const secretKey = new TextEncoder().encode(secret);

        let jwt = new SignJWT(
            payload as Record<string, unknown>,
        ).setProtectedHeader({ alg: algorithm });

        if (options?.expiresIn) {
            jwt = jwt.setExpirationTime(options.expiresIn);
        }

        return await jwt.sign(secretKey);
    } catch (error) {
        if (
            error instanceof Error &&
            error.message.includes("Cannot find module")
        ) {
            throw new Error(
                "JWT signing requires 'jose' package. Install it with: npm install jose",
            );
        }
        throw error;
    }
}

/**
 * Verify a JWT token
 * Note: Requires 'jose' package to be installed
 */
export async function verifyJWT(
    token: string,
    secret: string,
    options?: {
        algorithms?: string[];
    },
): Promise<{ payload: unknown; protectedHeader: unknown }> {
    try {
        // Dynamic import to make jose optional
        const { jwtVerify } = await import("jose");
        const secretKey = new TextEncoder().encode(secret);
        const algorithms = options?.algorithms || ["HS256"];

        const { payload, protectedHeader } = await jwtVerify(token, secretKey, {
            algorithms,
        });

        return { payload, protectedHeader };
    } catch (error) {
        if (
            error instanceof Error &&
            error.message.includes("Cannot find module")
        ) {
            throw new Error(
                "JWT verification requires 'jose' package. Install it with: npm install jose",
            );
        }
        throw error;
    }
}

/**
 * Decode a JWT token without verification
 * Note: Requires 'jose' package to be installed
 */
export async function decodeJWT(token: string): Promise<{
    payload: unknown;
    protectedHeader: unknown;
}> {
    try {
        // Dynamic import to make jose optional
        const { decodeJwt } = await import("jose");
        return decodeJwt(token);
    } catch (error) {
        if (
            error instanceof Error &&
            error.message.includes("Cannot find module")
        ) {
            throw new Error(
                "JWT decoding requires 'jose' package. Install it with: npm install jose",
            );
        }
        throw error;
    }
}

/**
 * Auth service class (alternative API)
 */
export class AuthService {
    async signJWT(
        payload: Record<string, unknown>,
        secret: string,
        options?: {
            expiresIn?: string;
            algorithm?: string;
        },
    ): Promise<string> {
        return signJWT(payload, secret, options);
    }

    async verifyJWT(
        token: string,
        secret: string,
        options?: {
            algorithms?: string[];
        },
    ): Promise<{ payload: unknown; protectedHeader: unknown }> {
        return verifyJWT(token, secret, options);
    }

    async decodeJWT(token: string): Promise<{
        payload: unknown;
        protectedHeader: unknown;
    }> {
        return decodeJWT(token);
    }
}
