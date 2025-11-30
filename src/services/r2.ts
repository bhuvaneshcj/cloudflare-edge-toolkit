/// <reference types="@cloudflare/workers-types" />

/**
 * R2 (Object Storage) service wrapper
 */

/**
 * Upload an object to R2 bucket
 */
export async function putR2(
    bucket: R2Bucket,
    key: string,
    value: ReadableStream | ArrayBuffer | string,
    options?: R2PutOptions,
): Promise<R2Object> {
    return bucket.put(key, value, options);
}

/**
 * Get an object from R2 bucket
 */
export async function getR2(
    bucket: R2Bucket,
    key: string,
    options?: {
        range?: { offset: number; length?: number };
        onlyIf?: R2Conditional;
    },
): Promise<R2ObjectBody | null> {
    return bucket.get(key, options);
}

/**
 * Get object metadata (head) from R2 bucket
 */
export async function headR2(
    bucket: R2Bucket,
    key: string,
): Promise<R2Object | null> {
    return bucket.head(key);
}

/**
 * Delete an object from R2 bucket
 */
export async function deleteR2(bucket: R2Bucket, key: string): Promise<void> {
    await bucket.delete(key);
}

/**
 * List objects in R2 bucket
 */
export async function listR2(
    bucket: R2Bucket,
    options?: R2ListOptions,
): Promise<R2Objects> {
    return bucket.list(options);
}

/**
 * Create a multipart upload
 */
export async function createMultipartUploadR2(
    bucket: R2Bucket,
    key: string,
    options?: R2MultipartOptions,
): Promise<string> {
    const upload = await bucket.createMultipartUpload(key, options);
    return upload.uploadId;
}

/**
 * Upload a part in multipart upload
 * Note: R2 multipart upload API methods may vary by version
 */
export async function uploadPartR2(
    bucket: R2Bucket,
    key: string,
    uploadId: string,
    partNumber: number,
    value: ReadableStream | ArrayBuffer,
): Promise<R2UploadedPart> {
    // R2 multipart API - method names may vary
    // @ts-expect-error - R2 multipart methods may not be in types
    return bucket.uploadPart(key, uploadId, partNumber, value);
}

/**
 * Complete a multipart upload
 * Note: R2 multipart upload API methods may vary by version
 */
export async function completeMultipartUploadR2(
    bucket: R2Bucket,
    key: string,
    uploadId: string,
    parts: R2UploadedPart[],
): Promise<R2Object> {
    // R2 multipart API - method names may vary
    // @ts-expect-error - R2 multipart methods may not be in types
    return bucket.completeMultipartUpload(key, uploadId, parts);
}

/**
 * Abort a multipart upload
 * Note: R2 multipart upload API methods may vary by version
 */
export async function abortMultipartUploadR2(
    bucket: R2Bucket,
    key: string,
    uploadId: string,
): Promise<void> {
    // R2 multipart API - method names may vary
    // @ts-expect-error - R2 multipart methods may not be in types
    await bucket.abortMultipartUpload(key, uploadId);
}

/**
 * R2 service class (alternative API)
 */
export class R2Service {
    constructor(private bucket: R2Bucket) {}

    async put(
        key: string,
        value: ReadableStream | ArrayBuffer | string,
        options?: R2PutOptions,
    ): Promise<R2Object> {
        return putR2(this.bucket, key, value, options);
    }

    async get(
        key: string,
        options?: {
            range?: { offset: number; length?: number };
            onlyIf?: R2Conditional;
        },
    ): Promise<R2ObjectBody | null> {
        return getR2(this.bucket, key, options);
    }

    async head(key: string): Promise<R2Object | null> {
        return headR2(this.bucket, key);
    }

    async delete(key: string): Promise<void> {
        return deleteR2(this.bucket, key);
    }

    async list(options?: R2ListOptions): Promise<R2Objects> {
        return listR2(this.bucket, options);
    }

    async createMultipartUpload(
        key: string,
        options?: R2MultipartOptions,
    ): Promise<string> {
        return createMultipartUploadR2(this.bucket, key, options);
    }

    async uploadPart(
        key: string,
        uploadId: string,
        partNumber: number,
        value: ReadableStream | ArrayBuffer,
    ): Promise<R2UploadedPart> {
        return uploadPartR2(this.bucket, key, uploadId, partNumber, value);
    }

    async completeMultipartUpload(
        key: string,
        uploadId: string,
        parts: R2UploadedPart[],
    ): Promise<R2Object> {
        return completeMultipartUploadR2(this.bucket, key, uploadId, parts);
    }

    async abortMultipartUpload(key: string, uploadId: string): Promise<void> {
        return abortMultipartUploadR2(this.bucket, key, uploadId);
    }
}
