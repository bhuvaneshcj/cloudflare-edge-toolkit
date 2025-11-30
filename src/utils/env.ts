import type { Env } from "../types/env.js";

/**
 * Type-safe environment variable access
 */

/**
 * Get environment variable with type casting
 */
export function getEnv<T = string>(env: Env, key: string, defaultValue?: T): T {
    const value = env[key];
    if (value === undefined || value === null) {
        if (defaultValue !== undefined) {
            return defaultValue;
        }
        throw new Error(`Environment variable ${key} is not defined`);
    }
    return value as T;
}

/**
 * Get environment variable as string
 */
export function getEnvString(
    env: Env,
    key: string,
    defaultValue?: string,
): string {
    return getEnv<string>(env, key, defaultValue);
}

/**
 * Get environment variable as number
 */
export function getEnvNumber(
    env: Env,
    key: string,
    defaultValue?: number,
): number {
    const value = getEnv(env, key, defaultValue);
    if (typeof value === "number") {
        return value;
    }
    const parsed = Number(value);
    if (isNaN(parsed)) {
        throw new Error(`Environment variable ${key} is not a valid number`);
    }
    return parsed;
}

/**
 * Get environment variable as boolean
 */
export function getEnvBoolean(
    env: Env,
    key: string,
    defaultValue?: boolean,
): boolean {
    const value = getEnv(env, key, defaultValue);
    if (typeof value === "boolean") {
        return value;
    }
    if (typeof value === "string") {
        return value.toLowerCase() === "true" || value === "1";
    }
    return Boolean(value);
}

/**
 * Validate required environment variables
 */
export function validateEnv(env: Env, requiredKeys: string[]): void {
    const missing: string[] = [];
    for (const key of requiredKeys) {
        if (env[key] === undefined || env[key] === null) {
            missing.push(key);
        }
    }
    if (missing.length > 0) {
        throw new Error(
            `Missing required environment variables: ${missing.join(", ")}`,
        );
    }
}
