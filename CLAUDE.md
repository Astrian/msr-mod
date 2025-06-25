# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MSR Mod is a browser extension that provides an alternate frontend for Monster Siren Records (monster-siren.hypergryph.com). It's built with Vue 3, TypeScript, and Tailwind CSS, designed to work as both Chrome and Firefox extensions.

## Common Commands

### Development
```bash
npm run dev                 # Start development server with Vite
npm run dev:refresh         # Build and refresh dist folder for extension development
npm i                       # Install dependencies
```

### Building
```bash
npm run build:chrome        # Build for Chrome/Chromium browsers
npm run build:firefox       # Build for Firefox
npm run build:safari        # Build for Safari (uses background.html)
npm run build              # Default build (Chrome)
```

### Code Quality
```bash
npm run lint               # Format code with Biome
npm run quality-check      # Run Biome CI checks
npm run qc                 # Alias for quality-check
```

### Extension Development Workflow
1. Run `npm run dev:refresh` to build initial dist folder
2. Load the `dist` folder as an unpacked extension in browser
3. Use `npm run dev` for hot-reload development
4. Use `npm run build:watch` for continuous builds

## Architecture

### Core Technologies
- **Vue 3** with Composition API and `<script setup>` syntax
- **TypeScript** for type safety
- **Pinia** for state management
- **Vue Router** with hash history for extension compatibility
- **Tailwind CSS v4** for styling
- **GSAP** for animations
- **Axios** for API communication

### Browser Extension Structure
- **Manifest V3** with platform-specific builds
- **Content Scripts** inject the frontend on monster-siren.hypergryph.com
- **Background Service Worker** handles extension lifecycle
- **Cross-platform compatibility** via prebuild scripts

### State Management (Pinia Stores)
- **usePlayQueueStore**: Music playback queue, shuffle/repeat modes, audio preloading
- **useFavourites**: User favorites with cross-platform storage (Chrome storage API/localStorage)
- **usePreferences**: User settings and preferences

### Key Components
- **Player**: Main audio player with preloading and resource validation
- **Playroom**: Full-screen player interface with lyrics and visualizations
- **ScrollingLyrics**: Animated lyrics display with auto-scroll and user interaction
- **PlayListItem/TrackItem**: Reusable music track components

### API Integration
- **Monster Siren API**: Fetches songs, albums, and metadata via `src/apis/index.ts`
- **Resource URL Validation**: Automatic refresh of cached URLs when servers rotate resources
- **Preloading System**: Smart audio preloading with cache management

### Browser Compatibility
- **Chrome**: Uses service worker, full CSP support
- **Firefox**: Uses background scripts, modified CSP, specific gecko settings
- **Safari**: Uses background page (background.html) instead of service worker
- **Prebuild Scripts**: Automatically modify manifest.json and HTML for each platform

### Storage Strategy
- **Favorites**: Stored in Chrome storage API (fallback to localStorage)
- **Preferences**: Browser-specific storage with graceful degradation
- **Audio Cache**: In-memory preloading with size limits

### Resource Management
- **Audio Preloading**: Validates and preloads next track during playback
- **URL Refresh Logic**: Checks resource availability before playback/preload
- **Cache Invalidation**: Automatic cleanup when resource URLs change

### Shuffle/Random Play Logic
- **shuffleList**: Array storing the shuffled order of original list indices
- **currentIndex**: In shuffle mode, this is the index within shuffleList
- **Accessing current song**: `list[shuffleList[currentIndex]]` in shuffle mode
- **getNextIndex**: Returns the actual list index of the next song to play

## File Structure Notes

### `/src/utils/`
- **songResourceChecker.ts**: Centralized resource validation and refresh logic
- **audioVisualizer.ts**: Real-time audio analysis for visual effects
- **artistsOrganize.ts**: Helper for formatting artist names

### `/scripts/`
- **prebuild-chrome.js**: Removes localhost dev configs for production
- **prebuild-firefox.js**: Adapts manifest for Firefox compatibility
- **prebuild-safari.js**: Creates background.html and adapts manifest for Safari

### `/public/`
- **manifest.json**: Extension manifest (modified by prebuild scripts)
- **content.js**: Injects the Vue app into target websites
- **background.js**: Extension background script

## Code Style and Formatting

### Indentation
- **This project uses Tab indentation (not spaces)**
- Ensure all code edits maintain consistent Tab indentation
- When editing files, preserve the existing Tab character formatting

## Development Considerations

### Extension Context
- Uses hash routing for browser extension compatibility
- CSP restrictions require specific script and style handling
- Cross-origin requests limited to declared host permissions

### Performance
- Audio preloading system prevents playback interruptions
- Resource validation happens only when needed (playback/preload)
- GSAP animations with proper cleanup to prevent memory leaks

### Error Handling
- Graceful fallbacks for storage API unavailability
- Resource URL rotation handling with automatic refresh
- Cross-browser compatibility with feature detection

## Safari Extension Considerations

### Background Script Handling
Safari Web Extensions have different requirements for background scripts:

1. **Background Page vs Service Worker**: Safari uses `background.page` instead of `service_worker`
2. **Background HTML**: The prebuild script creates `background.html` that loads `background.js`
3. **Manifest Configuration**: Uses `"background": { "page": "background.html", "persistent": false }`

### Auto-redirect Functionality
The auto-redirect feature in Safari may require special handling due to:
- Different WebKit extension APIs
- Safari's stricter security policies
- Tab management differences from Chromium

### Building for Safari
```bash
npm run build:safari    # Creates background.html and Safari-specific manifest
```

The Safari build process:
1. Removes localhost development configurations
2. Converts `service_worker` to `background.page`
3. Creates `background.html` wrapper for `background.js`
4. Adds Safari-specific browser settings