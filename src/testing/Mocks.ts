/**
 * Mock KV namespace for testing
 */
export class MockKVNamespace {
    private store: Map<
        string,
        { value: string; expiration?: number; metadata?: unknown }
    > = new Map();

    async get(key: string, type?: "text"): Promise<string | null>;
    async get(key: string, type: "json"): Promise<unknown>;
    async get(key: string, type: "arrayBuffer"): Promise<ArrayBuffer | null>;
    async get(key: string, type: "stream"): Promise<ReadableStream | null>;
    async get(
        key: string,
        type?: string,
    ): Promise<string | unknown | ArrayBuffer | ReadableStream | null> {
        const entry = this.store.get(key);
        if (!entry) {
            return null;
        }

        // Check expiration
        if (entry.expiration && entry.expiration < Date.now() / 1000) {
            this.store.delete(key);
            return null;
        }

        if (type === "json") {
            return JSON.parse(entry.value);
        }
        if (type === "arrayBuffer") {
            return new TextEncoder().encode(entry.value).buffer;
        }
        if (type === "stream") {
            return new ReadableStream({
                start(controller) {
                    controller.enqueue(new TextEncoder().encode(entry.value));
                    controller.close();
                },
            });
        }
        return entry.value;
    }

    async getWithMetadata<T = unknown>(
        key: string,
    ): Promise<{ value: string | null; metadata: T | null }> {
        const entry = this.store.get(key);
        if (!entry) {
            return { value: null, metadata: null };
        }
        return {
            value: entry.value,
            metadata: (entry.metadata as T) || null,
        };
    }

    async put(
        key: string,
        value: string | ArrayBuffer | ArrayBufferView | ReadableStream,
        options?: {
            expirationTtl?: number;
            expiration?: number;
            metadata?: unknown;
        },
    ): Promise<void> {
        let stringValue: string;
        if (typeof value === "string") {
            stringValue = value;
        } else if (value instanceof ArrayBuffer) {
            stringValue = new TextDecoder().decode(value);
        } else if (value instanceof ReadableStream) {
            const reader = value.getReader();
            const chunks: Uint8Array[] = [];
            let done = false;
            while (!done) {
                const result = await reader.read();
                done = result.done;
                if (result.value) {
                    chunks.push(result.value);
                }
            }
            const combined = new Uint8Array(
                chunks.reduce((acc, chunk) => acc + chunk.length, 0),
            );
            let offset = 0;
            for (const chunk of chunks) {
                combined.set(chunk, offset);
                offset += chunk.length;
            }
            stringValue = new TextDecoder().decode(combined);
        } else {
            stringValue = new TextDecoder().decode(value);
        }

        const expiration = options?.expiration
            ? options.expiration
            : options?.expirationTtl
              ? Math.floor(Date.now() / 1000) + options.expirationTtl
              : undefined;

        this.store.set(key, {
            value: stringValue,
            expiration,
            metadata: options?.metadata,
        });
    }

    async delete(key: string): Promise<void> {
        this.store.delete(key);
    }

    async list(options?: {
        prefix?: string;
        limit?: number;
        cursor?: string;
    }): Promise<KVNamespaceListResult<unknown, string>> {
        const keys: KVNamespaceListKey<unknown, string>[] = [];
        const prefix = options?.prefix || "";
        const limit = options?.limit || 1000;

        for (const [key, entry] of this.store.entries()) {
            if (key.startsWith(prefix)) {
                keys.push({
                    name: key,
                    expiration: entry.expiration,
                    metadata: entry.metadata,
                });
                if (keys.length >= limit) {
                    break;
                }
            }
        }

        return {
            keys,
            list_complete: true,
            cacheStatus: null,
        };
    }

    /**
     * Clear all data (for testing)
     */
    clear(): void {
        this.store.clear();
    }

    /**
     * Get all keys (for testing)
     */
    keys(): string[] {
        return Array.from(this.store.keys());
    }
}

/**
 * Mock R2 bucket for testing
 */
export class MockR2Bucket {
    private objects: Map<
        string,
        {
            data: ArrayBuffer;
            metadata?: R2HTTPMetadata;
            customMetadata?: Record<string, string>;
        }
    > = new Map();

    async head(key: string): Promise<R2Object | null> {
        const obj = this.objects.get(key);
        if (!obj) {
            return null;
        }
        // @ts-expect-error - Mock implementation doesn't need all R2Object properties
        return {
            key,
            size: obj.data.byteLength,
            etag: `"${key}"`,
            uploaded: new Date(),
            httpMetadata: obj.metadata,
            customMetadata: obj.customMetadata,
            checksums: {
                toJSON: () => ({}),
            },
        };
    }

    async get(
        key: string,
        options?: R2GetOptions,
    ): Promise<R2ObjectBody | null> {
        const obj = this.objects.get(key);
        if (!obj) {
            return null;
        }
        // @ts-expect-error - Mock implementation doesn't need all R2ObjectBody properties
        return {
            key,
            size: obj.data.byteLength,
            etag: `"${key}"`,
            uploaded: new Date(),
            httpMetadata: obj.metadata,
            customMetadata: obj.customMetadata,
            checksums: {
                toJSON: () => ({}),
            },
            body: new ReadableStream({
                start(controller) {
                    controller.enqueue(obj.data);
                    controller.close();
                },
            }),
            bodyUsed: false,
            arrayBuffer: async () => obj.data,
            text: async () => new TextDecoder().decode(obj.data),
            json: async () => JSON.parse(new TextDecoder().decode(obj.data)),
            blob: async () => new Blob([obj.data]),
        };
    }

    async put(
        key: string,
        value:
            | ReadableStream
            | ArrayBuffer
            | ArrayBufferView
            | string
            | null
            | Blob,
        options?: R2PutOptions,
    ): Promise<R2Object> {
        let data: ArrayBuffer;
        if (value instanceof ArrayBuffer) {
            data = value;
        } else if (value instanceof ReadableStream) {
            const reader = value.getReader();
            const chunks: Uint8Array[] = [];
            let done = false;
            while (!done) {
                const result = await reader.read();
                done = result.done;
                if (result.value) {
                    chunks.push(result.value);
                }
            }
            const combined = new Uint8Array(
                chunks.reduce((acc, chunk) => acc + chunk.length, 0),
            );
            let offset = 0;
            for (const chunk of chunks) {
                combined.set(chunk, offset);
                offset += chunk.length;
            }
            data = combined.buffer as ArrayBuffer;
        } else if (typeof value === "string") {
            data = new TextEncoder().encode(value).buffer as ArrayBuffer;
        } else if (value instanceof Blob) {
            data = await value.arrayBuffer();
        } else if (value === null) {
            data = new ArrayBuffer(0);
        } else {
            // @ts-expect-error - ArrayBufferView can be converted
            data = new Uint8Array(value as ArrayLike<number>)
                .buffer as ArrayBuffer;
        }

        const httpMetadata =
            options?.httpMetadata &&
            typeof options.httpMetadata === "object" &&
            !(options.httpMetadata instanceof Headers)
                ? options.httpMetadata
                : undefined;

        this.objects.set(key, {
            data,
            metadata: httpMetadata,
            customMetadata: options?.customMetadata,
        });

        // @ts-expect-error - Mock implementation doesn't need all R2Object properties
        return {
            key,
            size: data.byteLength,
            etag: `"${key}"`,
            uploaded: new Date(),
            httpMetadata: httpMetadata,
            customMetadata: options?.customMetadata,
            checksums: {
                toJSON: () => ({}),
            },
        };
    }

    async delete(key: string): Promise<void> {
        this.objects.delete(key);
    }

    async list(options?: R2ListOptions): Promise<R2Objects> {
        const objects: R2Object[] = [];
        const prefix = options?.prefix || "";
        const limit = options?.limit || 1000;

        for (const [key, obj] of this.objects.entries()) {
            if (key.startsWith(prefix)) {
                // @ts-expect-error - Mock implementation doesn't need all R2Object properties
                objects.push({
                    key,
                    size: obj.data.byteLength,
                    etag: `"${key}"`,
                    uploaded: new Date(),
                    httpMetadata: obj.metadata,
                    customMetadata: obj.customMetadata,
                    checksums: {
                        toJSON: () => ({}),
                    },
                });
                if (objects.length >= limit) {
                    break;
                }
            }
        }

        return {
            objects,
            truncated: false,
            delimitedPrefixes: [],
        };
    }

    /**
     * Clear all objects (for testing)
     */
    clear(): void {
        this.objects.clear();
    }
}

/**
 * Mock D1 database for testing
 */
export class MockD1Database {
    private tables: Map<string, Array<Record<string, unknown>>> = new Map();
    private lastInsertId: number = 0;

    prepare(query: string): D1PreparedStatement {
        // Simple mock - in real implementation, would parse SQL
        const self = this;
        return {
            bind: (...values: unknown[]) => {
                return self.prepare(query);
            },
            first: async <T = unknown>(): Promise<T | null> => {
                // Mock implementation
                return null;
            },
            run: async (): Promise<D1Result<unknown>> => {
                // Mock implementation
                return {
                    results: [],
                    success: true,
                    meta: {
                        changes: 0,
                        last_row_id: 0,
                        duration: 0,
                        rows_read: 0,
                        rows_written: 0,
                        size_after: 0,
                        changed_db: false,
                    },
                };
            },
            all: async <T = unknown>(): Promise<D1Result<T>> => {
                return {
                    results: [],
                    success: true,
                    meta: {
                        changes: 0,
                        last_row_id: 0,
                        duration: 0,
                        rows_read: 0,
                        rows_written: 0,
                        size_after: 0,
                        changed_db: false,
                    },
                };
            },
            raw: async <T = unknown[]>(): Promise<T> => {
                return [] as T;
            },
        } as D1PreparedStatement;
    }

    async exec(query: string): Promise<D1ExecResult> {
        // Simple mock - would parse and execute SQL in real implementation
        return {
            count: 0,
            duration: 0,
        };
    }

    async batch(statements: D1PreparedStatement[]): Promise<D1Result[]> {
        const results: D1Result[] = [];
        for (const stmt of statements) {
            const result = await stmt.all();
            results.push(result);
        }
        return results;
    }

    /**
     * Clear all data (for testing)
     */
    clear(): void {
        this.tables.clear();
        this.lastInsertId = 0;
    }
}

/**
 * Create mock KV namespace
 */
export function createMockKV(): MockKVNamespace {
    return new MockKVNamespace();
}

/**
 * Create mock R2 bucket
 */
export function createMockR2(): MockR2Bucket {
    return new MockR2Bucket();
}

/**
 * Create mock D1 database
 */
export function createMockD1(): MockD1Database {
    return new MockD1Database();
}
