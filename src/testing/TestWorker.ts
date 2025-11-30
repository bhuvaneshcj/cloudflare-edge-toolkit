import type { Router } from "../router/Router.js";
import type { Env } from "../types/env.js";
import { createMockKV, createMockR2, createMockD1 } from "./Mocks.js";
import type { MockKVNamespace, MockR2Bucket, MockD1Database } from "./Mocks.js";

/**
 * Test worker environment
 */
export interface TestEnv extends Env {
    [key: string]: unknown;
}

/**
 * Test worker for running router in tests
 */
export class TestWorker {
    private testEnv: TestEnv = {};
    private ctx: ExecutionContext = {
        waitUntil: () => {},
        passThroughOnException: () => {},
        props: {},
    } as ExecutionContext;

    constructor(private router: Router) {}

    /**
     * Set environment variable
     */
    env(key: string, value: unknown): this {
        this.testEnv[key] = value;
        return this;
    }

    /**
     * Set mock KV namespace
     */
    kv(binding: string): MockKVNamespace {
        const kv = createMockKV();
        this.testEnv[binding] = kv;
        return kv;
    }

    /**
     * Set mock R2 bucket
     */
    r2(binding: string): MockR2Bucket {
        const bucket = createMockR2();
        this.testEnv[binding] = bucket;
        return bucket;
    }

    /**
     * Set mock D1 database
     */
    d1(binding: string): MockD1Database {
        const db = createMockD1();
        this.testEnv[binding] = db;
        return db;
    }

    /**
     * Fetch (handle request)
     */
    async fetch(request: Request): Promise<Response> {
        return this.router.handle(request, this.testEnv, this.ctx);
    }

    /**
     * Get environment
     */
    getEnv(): TestEnv {
        return this.testEnv;
    }
}

/**
 * Create a test worker
 */
export function createTestWorker(router: Router): TestWorker {
    return new TestWorker(router);
}
