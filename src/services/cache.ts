/// <reference types="@cloudflare/workers-types" />

/**
 * Cache API service wrapper
 */

/**
 * Match a request in cache
 */
export async function matchCache(
    cache: Cache,
    request: Request | string,
): Promise<Response | undefined> {
    return cache.match(request);
}

/**
 * Put a response in cache
 */
export async function putCache(
    cache: Cache,
    request: Request | string,
    response: Response,
): Promise<void> {
    await cache.put(request, response);
}

/**
 * Delete a request from cache
 */
export async function deleteCache(
    cache: Cache,
    request: Request | string,
): Promise<boolean> {
    return cache.delete(request);
}

/**
 * Cache service class (alternative API)
 */
export class CacheService {
    constructor(private cache: Cache) {}

    async match(request: Request | string): Promise<Response | undefined> {
        return matchCache(this.cache, request);
    }

    async put(request: Request | string, response: Response): Promise<void> {
        return putCache(this.cache, request, response);
    }

    async delete(request: Request | string): Promise<boolean> {
        return deleteCache(this.cache, request);
    }
}
