# v1.1.0 Features Example

This example demonstrates all the new features in v1.1.0:

## Features Demonstrated

1. **Route Groups** - Organize routes with common prefixes
2. **Sub-routers** - Mount separate routers
3. **Route Constraints** - Regex-based path parameter validation
4. **Security Headers** - Add security headers to responses
5. **Request Validation** - Validate request body, query, and params
6. **Combined Features** - Using multiple features together

## Setup

```bash
npm install
npx wrangler dev
```

## API Endpoints

### Route Groups

- `GET /api/status` - API status
- `GET /api/version` - API version
- `GET /api/v1/users` - List users (nested group)
- `GET /api/v1/users/:id` - Get user by ID

### Sub-routers

- `GET /users` - List users (from sub-router)
- `GET /users/:id` - Get user by ID (from sub-router)
- `POST /users` - Create user (from sub-router)

### Route Constraints

- `GET /posts/:id` - Only matches numeric IDs (e.g., `/posts/123`)

### Security Headers

- `GET /secure` - Endpoint with security headers

### Validation

- `POST /register` - Register with validation
    ```json
    {
        "name": "John Doe",
        "email": "john@example.com",
        "age": 25
    }
    ```

### Admin Group

- `GET /admin/dashboard` - Admin dashboard
- `GET /admin/settings` - Admin settings
