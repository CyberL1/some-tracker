# Bitphase

A modern web-based chiptune tracker designed for creating music on retro sound chips. Currently supports the AY-3-8910 / YM2149F chip (used in ZX Spectrum and other 8-bit computers), with plans to support additional chips in the future.

## Prerequisites

- **Node.js** (v18 or higher)
- **pnpm** (v10.11.0 or higher) - Package manager
- **Emscripten SDK** - Required for building WebAssembly modules

### Installing Emscripten

1. Download and install Emscripten from [emscripten.org](https://emscripten.org/docs/getting_started/downloads.html)
2. Set the `EMSDK` environment variable to point to your Emscripten installation
3. Ensure `emcc` is available in your PATH

## Getting Started

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd bitphase
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Build WebAssembly modules**
   ```bash
   pnpm build:wasm
   ```
   This compiles the Ayumi chip emulator to WebAssembly. You only need to run this once, or when the WASM code changes.

4. **Start the development server**
   ```bash
   pnpm dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:5173` (or the port shown in the terminal)

## Available Scripts

- `pnpm dev` - Build WASM and start development server with hot module replacement
- `pnpm build` - Build WASM and create production build
- `pnpm build:wasm` - Build only the WebAssembly modules
- `pnpm preview` - Preview the production build locally
- `pnpm check` - Run TypeScript and Svelte type checking

## Project Structure

```
src/
├── lib/
│   ├── chips/           # Chip implementations (AY, future chips)
│   │   ├── ay/          # AY-3-8910 implementation
│   │   └── base/        # Base interfaces and utilities
│   ├── components/      # Svelte UI components
│   │   ├── Menu/        # Menu bar and navigation
│   │   ├── Song/        # Pattern editor and song view
│   │   ├── Instruments/ # Instrument editor
│   │   └── ...
│   ├── models/          # Domain models (Project, Song, Pattern, etc.)
│   ├── services/        # Business logic services
│   │   ├── audio/       # Audio service and chip processors
│   │   ├── file/        # Import/export functionality
│   │   └── pattern/     # Pattern editing logic
│   ├── stores/          # Reactive state management (Svelte 5 runes)
│   ├── ui-rendering/    # Canvas-based rendering
│   └── utils/           # Utility functions
├── public/              # Static assets and compiled WASM
└── App.svelte           # Root component
```
