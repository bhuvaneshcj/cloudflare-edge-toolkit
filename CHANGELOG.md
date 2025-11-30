# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned for v1.1.0
- Route groups/namespaces
- Sub-routers
- Security headers middleware
- Request validation middleware
- Compression middleware
- Route constraints with regex

## [1.0.0] - 2024-11-30

### Added

- Initial release of Cloudflare Edge Toolkit
- Class-based Router with support for GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD methods
- Path parameter support (`/users/:id`)
- Middleware pipeline system
- Global and route-specific middleware
- Custom 404 and error handlers
- KV service wrapper with get, set, delete, list, and metadata support
- R2 service wrapper with upload, download, delete, list, and multipart upload support
- D1 service wrapper with prepared statements, transactions, and batch operations
- Cache API wrapper
- JWT authentication service (requires optional `jose` package)
- JSON response utilities
- Error classes (HttpError, BadRequestError, UnauthorizedError, ForbiddenError, NotFoundError, ValidationError)
- Request parsing utilities (body, query params, path params, cookies, headers)
- Response utilities (HTML, text, redirect, cookies)
- Environment variable utilities with type safety
- Validation utilities
- CORS middleware
- Logger middleware
- Error handler middleware
- Rate limiting middleware (in-memory and KV-backed)
- Authentication middleware with JWT support
- Role-based access control middleware
- Comprehensive TypeScript type definitions
- Three example projects (basic-worker, full-stack-app, api-with-storage)
- Full documentation and README

### Technical Details

- TypeScript-first with strict mode
- ESM-only modules
- Zero runtime dependencies (except optional `jose` for JWT)
- Edge-optimized code
- Tree-shakeable exports
- Full type safety
