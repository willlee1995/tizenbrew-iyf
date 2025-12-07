# IYF TV Mod

A TizenBrew module for enhancing the iyf.tv experience on Tizen (Samsung) TVs.

## Features

- **Ad Blocking**: Removes advertisements from the website
- **TV Remote Controls**: Optimized controls for TV remote navigation
  - Play/Pause: Media Play/Pause button or OK button
  - Rewind: Left Arrow or Media Rewind button (10 seconds)
  - Fast Forward: Right Arrow or Media Fast Forward button (10 seconds)
  - Volume Up/Down: Up/Down Arrow keys
  - Stop: Media Stop button or Red button
- **On-Screen Controls**: Visual overlay showing available controls
- **UI Enhancements**: Customizable interface improvements
- **Playback Speed Control**: Adjust video playback speed
- **Fullscreen Controls**: Better controls for fullscreen viewing

## Installation

1. Install [TizenBrew](https://github.com/reisxd/TizenBrew) on your Tizen TV
2. Add this module to TizenBrew's module manager
3. Navigate to https://www.iyf.tv/ and enjoy the enhanced experience

## Development

### Building

```bash
npm install
npm run build
```

This will build both the mods (userScript.js) and service files.

### Structure

- `mods/` - Main modification scripts that are injected into the website
- `service/` - Optional Node.js service file
- `dist/` - Built output files

## Configuration

The module stores configuration in localStorage with the key `iyf-tv-configuration`. You can modify settings programmatically or through the module's UI.

## TV Remote Controls

When a video is playing, you can use the following controls:

- **Play/Pause**: Press the Media Play/Pause button (or OK/Enter button)
- **Rewind**: Press Left Arrow or Media Rewind button (rewinds 10 seconds)
- **Fast Forward**: Press Right Arrow or Media Fast Forward button (forwards 10 seconds)
- **Volume Up**: Press Up Arrow
- **Volume Down**: Press Down Arrow
- **Stop**: Press Media Stop button or Red button

The controls automatically appear on-screen when you interact with the video, and disappear after 3 seconds of inactivity.

## License

GPL-3.0-only

