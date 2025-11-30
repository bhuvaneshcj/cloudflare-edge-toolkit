# API with Storage Example

An example demonstrating RESTful API patterns with storage backends.

## Features Demonstrated

- RESTful API design
- File upload to R2
- Data storage in KV
- Response caching
- Rate limiting
- CORS configuration
- List operations

## Setup

1. Install dependencies:

```bash
npm install
```

2. Configure your `wrangler.toml`:
    - Set KV namespace IDs
    - Set R2 bucket names

3. Run locally:

```bash
npx wrangler dev
```

4. Deploy:

```bash
npx wrangler deploy
```

## API Endpoints

- `GET /api/data/:key` - Get stored data
- `POST /api/data/:key` - Store data
- `POST /api/files` - Upload file
- `GET /api/files` - List files
- `GET /api/files/:key` - Download file
- `GET /health` - Health check

## Usage Examples

### Store data

```bash
curl -X POST http://localhost:8787/api/data/mykey \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello World"}'
```

### Get data

```bash
curl http://localhost:8787/api/data/mykey
```

### Upload file

```bash
curl -X POST http://localhost:8787/api/files \
  -F "file=@example.txt"
```

### List files

```bash
curl http://localhost:8787/api/files
```
