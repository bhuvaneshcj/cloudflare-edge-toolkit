/// <reference types="@cloudflare/workers-types" />

/**
 * KV (Key-Value) service wrapper
 */

/**
 * Get a value from KV namespace
 */
export async function getKV<T = string>(
    namespace: KVNamespace,
    key: string,
): Promise<T | null> {
    const value = await namespace.get(key);
    if (value === null) {
        return null;
    }
    // Try to parse as JSON, fallback to string
    try {
        return JSON.parse(value) as T;
    } catch {
        return value as T;
    }
}

/**
 * Get a value with metadata from KV namespace
 */
export async function getKVWithMetadata<T = string, M = unknown>(
    namespace: KVNamespace,
    key: string,
): Promise<{ value: T | null; metadata: M | null }> {
    const result = await namespace.getWithMetadata(key);
    if (result.value === null) {
        return { value: null, metadata: null };
    }

    let parsedValue: T;
    try {
        parsedValue = JSON.parse(result.value) as T;
    } catch {
        parsedValue = result.value as T;
    }

    return {
        value: parsedValue,
        metadata: (result.metadata as M) || null,
    };
}

/**
 * Set a value in KV namespace
 */
export async function setKV(
    namespace: KVNamespace,
    key: string,
    value: string | ArrayBuffer | ReadableStream | object,
    options?: {
        expirationTtl?: number;
        expiration?: number;
        metadata?: unknown;
    },
): Promise<void> {
    let stringValue: string;
    if (typeof value === "string") {
        stringValue = value;
    } else if (
        value instanceof ArrayBuffer ||
        value instanceof ReadableStream
    ) {
        throw new Error(
            "ArrayBuffer and ReadableStream not supported in setKV. Use namespace.put() directly.",
        );
    } else {
        stringValue = JSON.stringify(value);
    }

    await namespace.put(key, stringValue, {
        expirationTtl: options?.expirationTtl,
        expiration: options?.expiration,
        metadata: options?.metadata,
    });
}

/**
 * Delete a value from KV namespace
 */
export async function deleteKV(
    namespace: KVNamespace,
    key: string,
): Promise<void> {
    await namespace.delete(key);
}

/**
 * Check if a key exists in KV namespace
 */
export async function hasKV(
    namespace: KVNamespace,
    key: string,
): Promise<boolean> {
    const value = await namespace.get(key);
    return value !== null;
}

/**
 * List keys in KV namespace
 */
export async function listKV(
    namespace: KVNamespace,
    options?: {
        prefix?: string;
        limit?: number;
        cursor?: string;
    },
): Promise<{
    keys: Array<{ name: string; expiration?: number; metadata?: unknown }>;
    listComplete: boolean;
    cursor?: string;
}> {
    const result = await namespace.list(options);
    return {
        keys: result.keys,
        listComplete: result.list_complete,
        cursor: result.list_complete
            ? undefined
            : (result as { cursor?: string }).cursor,
    };
}

/**
 * KV service class (alternative API)
 */
export class KVService {
    constructor(private namespace: KVNamespace) {}

    async get<T = string>(key: string): Promise<T | null> {
        return getKV<T>(this.namespace, key);
    }

    async getWithMetadata<T = string, M = unknown>(
        key: string,
    ): Promise<{ value: T | null; metadata: M | null }> {
        return getKVWithMetadata<T, M>(this.namespace, key);
    }

    async set(
        key: string,
        value: string | object,
        options?: {
            expirationTtl?: number;
            expiration?: number;
            metadata?: unknown;
        },
    ): Promise<void> {
        return setKV(this.namespace, key, value, options);
    }

    async delete(key: string): Promise<void> {
        return deleteKV(this.namespace, key);
    }

    async has(key: string): Promise<boolean> {
        return hasKV(this.namespace, key);
    }

    async list(options?: {
        prefix?: string;
        limit?: number;
        cursor?: string;
    }): Promise<{
        keys: Array<{ name: string; expiration?: number; metadata?: unknown }>;
        listComplete: boolean;
        cursor?: string;
    }> {
        return listKV(this.namespace, options);
    }
}
