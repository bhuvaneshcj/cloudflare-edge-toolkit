/**
 * Response assertion utilities
 */
export class ResponseAssertions {
    constructor(private response: Response) {}

    /**
     * Assert status code
     */
    status(expected: number): this {
        if (this.response.status !== expected) {
            throw new Error(
                `Expected status ${expected}, got ${this.response.status}`,
            );
        }
        return this;
    }

    /**
     * Assert header exists
     */
    hasHeader(name: string): this {
        if (!this.response.headers.has(name)) {
            throw new Error(`Expected header ${name} to exist`);
        }
        return this;
    }

    /**
     * Assert header value
     */
    header(name: string, expected: string): this {
        const actual = this.response.headers.get(name);
        if (actual !== expected) {
            throw new Error(
                `Expected header ${name} to be ${expected}, got ${actual}`,
            );
        }
        return this;
    }

    /**
     * Assert JSON body
     */
    async json(expected?: unknown): Promise<this> {
        const actual = await this.response.json();
        if (expected !== undefined) {
            if (JSON.stringify(actual) !== JSON.stringify(expected)) {
                throw new Error(
                    `Expected JSON ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`,
                );
            }
        }
        return this;
    }

    /**
     * Assert text body
     */
    async text(expected?: string): Promise<this> {
        const actual = await this.response.text();
        if (expected !== undefined && actual !== expected) {
            throw new Error(`Expected text ${expected}, got ${actual}`);
        }
        return this;
    }

    /**
     * Assert body contains text
     */
    async contains(text: string): Promise<this> {
        const body = await this.response.text();
        if (!body.includes(text)) {
            throw new Error(`Expected body to contain ${text}`);
        }
        return this;
    }

    /**
     * Assert Content-Type
     */
    contentType(expected: string): this {
        return this.header("Content-Type", expected);
    }

    /**
     * Assert OK status (200-299)
     */
    ok(): this {
        if (this.response.status < 200 || this.response.status >= 300) {
            throw new Error(`Expected OK status, got ${this.response.status}`);
        }
        return this;
    }

    /**
     * Assert redirect
     */
    redirect(expectedUrl?: string, expectedStatus: number = 302): this {
        this.status(expectedStatus);
        if (expectedUrl) {
            const location = this.response.headers.get("Location");
            if (location !== expectedUrl) {
                throw new Error(
                    `Expected redirect to ${expectedUrl}, got ${location}`,
                );
            }
        }
        return this;
    }
}

/**
 * Create response assertions
 */
export function assertResponse(response: Response): ResponseAssertions {
    return new ResponseAssertions(response);
}
