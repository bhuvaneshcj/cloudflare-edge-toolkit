/**
 * Environment type definitions for Cloudflare Workers
 */
export type Env = Record<string, unknown>;

export interface WorkerEnv extends Env {
    [key: string]: unknown;
}
