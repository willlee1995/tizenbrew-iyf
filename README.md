# IYF TV Mod

A TizenBrew module for enhancing the iyf.tv experience on Tizen (Samsung) TVs.

## Features

- **Ad Blocking**: Removes advertisements from the website
- **Video Controls**: Enhanced keyboard shortcuts for video playback
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

## License

MIT

