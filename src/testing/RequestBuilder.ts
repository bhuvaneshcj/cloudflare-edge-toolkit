/**
 * Request builder for testing
 */
export class RequestBuilder {
    private httpMethod: string = "GET";
    private requestUrl: string = "http://localhost/";
    private requestHeaders: Headers = new Headers();
    private body: BodyInit | null = null;

    /**
     * Set HTTP method
     */
    method(method: string): this {
        this.httpMethod = method;
        return this;
    }

    /**
     * Set URL
     */
    url(url: string): this {
        this.requestUrl = url;
        return this;
    }

    /**
     * Set header
     */
    header(name: string, value: string): this {
        this.requestHeaders.set(name, value);
        return this;
    }

    /**
     * Set multiple headers
     */
    headers(headers: Record<string, string>): this {
        for (const [name, value] of Object.entries(headers)) {
            this.requestHeaders.set(name, value);
        }
        return this;
    }

    /**
     * Set JSON body
     */
    json(data: unknown): this {
        this.body = JSON.stringify(data);
        this.requestHeaders.set("Content-Type", "application/json");
        return this;
    }

    /**
     * Set text body
     */
    text(data: string): this {
        this.body = data;
        this.requestHeaders.set("Content-Type", "text/plain");
        return this;
    }

    /**
     * Set form data body
     */
    form(data: Record<string, string>): this {
        const formData = new URLSearchParams();
        for (const [key, value] of Object.entries(data)) {
            formData.append(key, value);
        }
        this.body = formData.toString();
        this.requestHeaders.set(
            "Content-Type",
            "application/x-www-form-urlencoded",
        );
        return this;
    }

    /**
     * Set cookie
     */
    cookie(name: string, value: string): this {
        const existing = this.requestHeaders.get("Cookie") || "";
        this.requestHeaders.set(
            "Cookie",
            existing ? `${existing}; ${name}=${value}` : `${name}=${value}`,
        );
        return this;
    }

    /**
     * Build Request
     */
    build(): Request {
        return new Request(this.requestUrl, {
            method: this.httpMethod,
            headers: this.requestHeaders,
            body: this.body,
        });
    }
}

/**
 * Create a request builder
 */
export function createRequest(): RequestBuilder {
    return new RequestBuilder();
}

/**
 * Helper to create GET request
 */
export function get(url: string): Request {
    return createRequest().method("GET").url(url).build();
}

/**
 * Helper to create POST request
 */
export function post(url: string, body?: unknown): Request {
    const builder = createRequest().method("POST").url(url);
    if (body) {
        builder.json(body);
    }
    return builder.build();
}

/**
 * Helper to create PUT request
 */
export function put(url: string, body?: unknown): Request {
    const builder = createRequest().method("PUT").url(url);
    if (body) {
        builder.json(body);
    }
    return builder.build();
}

/**
 * Helper to create DELETE request
 */
export function del(url: string): Request {
    return createRequest().method("DELETE").url(url).build();
}
