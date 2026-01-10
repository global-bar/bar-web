# Global Bar - Web Client

A cyberpunk-themed, pixel-art virtual bar where users can move around and chat in real-time.

## Features

- Real-time multiplayer with WebSocket
- Pixel-art Canvas rendering
- Smooth movement interpolation
- Chat with speech bubbles
- Cyberpunk/neon aesthetic

## Tech Stack

- Vite + React + TypeScript
- TailwindCSS
- Zustand (state management)
- Canvas 2D (rendering)

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Environment Variables

Create a `.env` file:

```bash
VITE_WS_BASE_URL=ws://localhost:8080
VITE_DEFAULT_ROOM_ID=main-bar
```

## Usage

1. Open http://localhost:5173
2. Enter your nickname and room ID
3. Use **WASD** or **Arrow keys** to move
4. Press **Enter** to open chat and send messages

## Project Structure

```
src/
├── ws/           # WebSocket client and protocol types
├── game/         # Game engine, world state, input, rendering
├── store/        # Zustand state management
├── ui/           # React UI components
└── styles/       # CSS styles
```

## Protocol

This client implements the `global-bar-ws-protocol-minimal-v1` protocol for communication with the Go WebSocket server.
