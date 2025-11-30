# WebSocket Chat Example

This example demonstrates WebSocket support from v1.4.0:

## Features Demonstrated

1. **WebSocket Upgrade** - Upgrade HTTP requests to WebSocket
2. **Message Broadcasting** - Send messages to all connected clients
3. **Room Management** - Organize connections into rooms
4. **Connection Management** - Handle open, close, error events

## Setup

```bash
npm install
npx wrangler dev
```

## Usage

### Connect via WebSocket

```javascript
const ws = new WebSocket("ws://localhost:8787/ws");

ws.onopen = () => {
    console.log("Connected");
    // Send a message
    ws.send(
        JSON.stringify({
            type: "message",
            user: "John",
            message: "Hello, world!",
        }),
    );
};

ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    console.log("Received:", data);
};

ws.onclose = () => {
    console.log("Disconnected");
};
```

## API Endpoints

- `GET /ws` - WebSocket endpoint
- `GET /rooms` - Get list of rooms and connection counts
- `GET /` - Health check

## WebSocket Message Format

```json
{
    "type": "message",
    "user": "John",
    "message": "Hello!"
}
```
