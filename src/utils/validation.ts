import { BadRequestError, ValidationError } from "./errors.js";

/**
 * Validation utilities
 */

/**
 * Validate request body against schema
 */
export function validateBody<T>(
    body: unknown,
    validator: (data: unknown) => data is T,
): T {
    if (!validator(body)) {
        throw new BadRequestError("Invalid request body");
    }
    return body;
}

/**
 * Validate query parameter exists
 */
export function validateQueryParam(
    params: URLSearchParams,
    name: string,
    required: boolean = true,
): string | null {
    const value = params.get(name);
    if (required && !value) {
        throw new ValidationError(`Missing required query parameter: ${name}`);
    }
    return value;
}

/**
 * Validate path parameter exists
 */
export function validatePathParam(
    params: Record<string, string>,
    name: string,
): string {
    const value = params[name];
    if (!value) {
        throw new ValidationError(`Missing required path parameter: ${name}`);
    }
    return value;
}

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Validate URL format
 */
export function validateURL(url: string): boolean {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
}

/**
 * Validate string length
 */
export function validateLength(
    value: string,
    min?: number,
    max?: number,
): boolean {
    const length = value.length;
    if (min !== undefined && length < min) {
        return false;
    }
    if (max !== undefined && length > max) {
        return false;
    }
    return true;
}

/**
 * Validate number range
 */
export function validateRange(
    value: number,
    min?: number,
    max?: number,
): boolean {
    if (min !== undefined && value < min) {
        return false;
    }
    if (max !== undefined && value > max) {
        return false;
    }
    return true;
}
