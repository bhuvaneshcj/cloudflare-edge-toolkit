# Publishing Guide

## Pre-Publish Checklist

- [x] All code is implemented
- [x] TypeScript compilation works
- [x] All examples are included
- [x] README is comprehensive
- [x] LICENSE is included (MIT)
- [x] CHANGELOG is up to date
- [x] package.json is configured correctly
- [x] .npmignore is set up
- [x] Node.js 24 requirement is specified

## Build the Package

```bash
# Install dependencies (if not already done)
npm install

# Build the package
npm run build

# Verify the dist folder was created
ls -la dist/
```

## Test Locally

Before publishing, test the package locally:

```bash
# In the package directory
npm pack

# This creates a .tgz file
# In a test project, install it:
npm install /path/to/cloudflare-edge-toolkit-1.0.0.tgz
```

## Publish to npm

### First Time Publishing

1. Create an npm account if you don't have one: https://www.npmjs.com/signup
2. Login to npm:
   ```bash
   npm login
   ```
3. Verify you're logged in:
   ```bash
   npm whoami
   ```

### Publishing

```bash
# Dry run (see what would be published)
npm publish --dry-run

# Publish to npm
npm publish

# For scoped packages or first publish, use:
npm publish --access public
```

## Version Management

After publishing, update version for next release:

```bash
# Patch version (1.0.0 -> 1.0.1)
npm version patch

# Minor version (1.0.0 -> 1.1.0)
npm version minor

# Major version (1.0.0 -> 2.0.0)
npm version major
```

## Post-Publish

1. Create a git tag:
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```

2. Update CHANGELOG.md with the published version

3. Create a GitHub release

## Troubleshooting

- **Error: You must verify your email**: Verify your email on npmjs.com
- **Error: Package name already exists**: Choose a different package name or use a scoped package (@yourname/cloudflare-edge-toolkit)
- **Error: Invalid package.json**: Check that all required fields are present

