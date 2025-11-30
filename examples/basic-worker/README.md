# Basic Worker Example

This is a simple example demonstrating basic usage of the Cloudflare Edge Toolkit.

## Features Demonstrated

- Basic router setup
- GET and POST routes
- Path parameters (`/users/:id`)
- KV storage operations
- Custom 404 and error handlers

## Setup

1. Install dependencies:

```bash
npm install
```

2. Configure your `wrangler.toml` with your KV namespace IDs

3. Run locally:

```bash
npx wrangler dev
```

4. Deploy:

```bash
npx wrangler deploy
```

## Usage

- `GET /hello` - Simple JSON response
- `GET /users/:id` - Route with path parameter
- `GET /kv` - KV storage operations
- `POST /data` - POST request with body
