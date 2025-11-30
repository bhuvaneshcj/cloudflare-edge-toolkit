import type { Handler } from "../router/types.js";
import { BadRequestError, ValidationError } from "../utils/errors.js";
import { parseBody } from "../utils/request.js";

/**
 * Validation schema types
 */
export type ValidationSchema = {
    [key: string]: ValidationRule;
};

export type ValidationRule =
    | string // Type: "string", "number", "boolean", "email", "url"
    | {
          type: string;
          required?: boolean;
          min?: number;
          max?: number;
          pattern?: RegExp | string;
          custom?: (value: unknown) => boolean | string;
      };

/**
 * Validation middleware options
 */
export interface ValidationOptions {
    body?: ValidationSchema;
    query?: ValidationSchema;
    params?: ValidationSchema;
    onError?: (errors: Record<string, string[]>) => Response;
}

/**
 * Create request validation middleware
 */
export function validate(options: ValidationOptions = {}): Handler {
    const { body, query, params, onError } = options;

    return async (request) => {
        const errors: Record<string, string[]> = {};

        // Validate body
        if (body) {
            try {
                const bodyData = await parseBody(request);
                const bodyErrors = validateObject(bodyData, body, "body");
                if (Object.keys(bodyErrors).length > 0) {
                    Object.assign(errors, bodyErrors);
                }
            } catch (error) {
                errors.body = [
                    error instanceof Error
                        ? error.message
                        : "Invalid request body",
                ];
            }
        }

        // Validate query parameters
        if (query) {
            const url = new URL(request.url);
            const queryData: Record<string, string> = {};
            url.searchParams.forEach((value, key) => {
                queryData[key] = value;
            });
            const queryErrors = validateObject(queryData, query, "query");
            if (Object.keys(queryErrors).length > 0) {
                Object.assign(errors, queryErrors);
            }
        }

        // Validate path parameters
        if (params) {
            const req = request as { params?: Record<string, string> };
            const paramsData = req.params || {};
            const paramsErrors = validateObject(paramsData, params, "params");
            if (Object.keys(paramsErrors).length > 0) {
                Object.assign(errors, paramsErrors);
            }
        }

        // If there are errors, return error response
        if (Object.keys(errors).length > 0) {
            if (onError) {
                return onError(errors);
            }
            throw new ValidationError("Validation failed", errors);
        }

        return;
    };
}

/**
 * Validate an object against a schema
 */
function validateObject(
    data: unknown,
    schema: ValidationSchema,
    prefix: string,
): Record<string, string[]> {
    const errors: Record<string, string[]> = {};

    if (typeof data !== "object" || data === null) {
        return { [prefix]: ["Expected an object"] };
    }

    const obj = data as Record<string, unknown>;

    for (const [key, rule] of Object.entries(schema)) {
        const value = obj[key];
        const fieldErrors: string[] = [];
        const fieldKey = `${prefix}.${key}`;

        // Parse rule
        const ruleObj =
            typeof rule === "string"
                ? { type: rule }
                : { ...rule, type: rule.type };

        // Check required
        if (ruleObj.required && (value === undefined || value === null)) {
            fieldErrors.push(`${key} is required`);
            errors[fieldKey] = fieldErrors;
            continue;
        }

        // Skip validation if not required and value is missing
        if (!ruleObj.required && (value === undefined || value === null)) {
            continue;
        }

        // Type validation
        const typeError = validateType(value, ruleObj.type);
        if (typeError) {
            fieldErrors.push(typeError);
        }

        // String-specific validations
        if (typeof value === "string") {
            if (ruleObj.min !== undefined && value.length < ruleObj.min) {
                fieldErrors.push(
                    `${key} must be at least ${ruleObj.min} characters`,
                );
            }
            if (ruleObj.max !== undefined && value.length > ruleObj.max) {
                fieldErrors.push(
                    `${key} must be at most ${ruleObj.max} characters`,
                );
            }
            if (ruleObj.pattern) {
                const pattern =
                    typeof ruleObj.pattern === "string"
                        ? new RegExp(ruleObj.pattern)
                        : ruleObj.pattern;
                if (!pattern.test(value)) {
                    fieldErrors.push(`${key} format is invalid`);
                }
            }
        }

        // Number-specific validations
        if (typeof value === "number") {
            if (ruleObj.min !== undefined && value < ruleObj.min) {
                fieldErrors.push(`${key} must be at least ${ruleObj.min}`);
            }
            if (ruleObj.max !== undefined && value > ruleObj.max) {
                fieldErrors.push(`${key} must be at most ${ruleObj.max}`);
            }
        }

        // Custom validation
        if (ruleObj.custom && typeof value !== "undefined") {
            const customResult = ruleObj.custom(value);
            if (customResult !== true) {
                fieldErrors.push(
                    typeof customResult === "string"
                        ? customResult
                        : `${key} validation failed`,
                );
            }
        }

        if (fieldErrors.length > 0) {
            errors[fieldKey] = fieldErrors;
        }
    }

    return errors;
}

/**
 * Validate value type
 */
function validateType(value: unknown, type: string): string | null {
    switch (type) {
        case "string":
            return typeof value === "string" ? null : "Must be a string";
        case "number":
            return typeof value === "number" ? null : "Must be a number";
        case "boolean":
            return typeof value === "boolean" ? null : "Must be a boolean";
        case "email": {
            if (typeof value !== "string") return "Must be a string";
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return emailRegex.test(value) ? null : "Must be a valid email";
        }
        case "url": {
            if (typeof value !== "string") return "Must be a string";
            try {
                new URL(value);
                return null;
            } catch {
                return "Must be a valid URL";
            }
        }
        default:
            return null;
    }
}
