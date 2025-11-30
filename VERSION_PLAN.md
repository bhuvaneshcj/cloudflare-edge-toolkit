# Version Planning - Cloudflare Edge Toolkit

## Quick Reference

| Version | Focus | Target Date | Status |
|---------|-------|-------------|--------|
| v1.0.0 | Core features | ✅ Nov 2024 | **Released** |
| v1.1.0 | Enhanced Router & Middleware | Q1 2025 | Planned |
| v1.2.0 | D1 ORM | Q1 2025 | Planned |
| v1.3.0 | Session Management | Q2 2025 | Planned |
| v1.4.0 | WebSocket Support | Q2 2025 | Planned |
| v1.5.0 | Testing Utilities | Q2 2025 | Planned |
| v2.0.0 | CLI & Plugin System | Q3 2025 | Planned |

---

## v1.1.0 - Enhanced Router & Middleware

### Must Have
- [ ] Route groups/namespaces
- [ ] Sub-routers
- [ ] Security headers middleware
- [ ] Request validation middleware

### Should Have
- [ ] Compression middleware
- [ ] Route constraints (regex)
- [ ] Response transformation middleware

### Nice to Have
- [ ] Route caching
- [ ] Route priorities

### Estimated Effort: 2-3 weeks

---

## v1.2.0 - D1 ORM

### Must Have
- [ ] Query builder (basic)
- [ ] Model definitions
- [ ] Type-safe queries

### Should Have
- [ ] Relationships (basic)
- [ ] Migrations support

### Nice to Have
- [ ] Advanced relationships
- [ ] Query result caching

### Estimated Effort: 3-4 weeks

---

## v1.3.0 - Session Management

### Must Have
- [ ] KV-backed sessions
- [ ] Session middleware
- [ ] Cookie-based sessions

### Should Have
- [ ] Token-based sessions
- [ ] Flash messages

### Estimated Effort: 1-2 weeks

---

## v1.4.0 - WebSocket Support

### Must Have
- [ ] WebSocket upgrade handling
- [ ] Message broadcasting
- [ ] Connection management

### Should Have
- [ ] Room management
- [ ] WebSocket middleware

### Estimated Effort: 2-3 weeks

---

## v1.5.0 - Testing Utilities

### Must Have
- [ ] Test helpers
- [ ] Mock KV/R2/D1
- [ ] Request builders

### Should Have
- [ ] Response assertions
- [ ] Integration test utilities

### Estimated Effort: 2 weeks

---

## Release Strategy

### Release Cycle
- **Monthly minor releases** (v1.1.0, v1.2.0, etc.)
- **Patch releases** as needed (bug fixes)
- **Major releases** when breaking changes are needed

### Version Bumping
```bash
# Patch (bug fix)
npm version patch  # 1.0.0 -> 1.0.1

# Minor (new features)
npm version minor  # 1.0.0 -> 1.1.0

# Major (breaking changes)
npm version major  # 1.0.0 -> 2.0.0
```

### Release Process
1. Complete features for version
2. Update CHANGELOG.md
3. Update version in package.json
4. Run tests
5. Build package
6. Publish to npm
7. Create GitHub release
8. Announce release

---

## Feature Requests & Feedback

Track feature requests and user feedback to prioritize future versions.

### Top Requested Features (from community)
1. Route groups
2. D1 ORM
3. Better TypeScript types
4. More examples
5. Performance improvements

---

**Current Focus**: v1.1.0 - Enhanced Router & Middleware

