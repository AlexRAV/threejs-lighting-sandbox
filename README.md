# Three.js Lighting Sandbox

A sandbox environment for testing and experimenting with Three.js lighting capabilities.

## Overview

This project provides a simple interface for exploring various lighting techniques in Three.js. It allows you to:

- Add different types of lights (ambient, directional, point, spot)
- Configure light positions, colors, and intensities
- Test lighting effects on primitive 3D objects
- Import custom 3D models (GLTF/GLB) for lighting experimentation
- Apply different HDR environment maps for realistic reflections
- Experiment with shadows and lighting combinations

## Features

- Interactive UI for real-time light manipulation
- Visual feedback for light positions and directions
- Configurable primitive objects to test lighting effects
- Custom 3D model import (GLTF/GLB format)
- HDR environment mapping with multiple presets
- Tone mapping and exposure controls
- Position, rotation, and scale controls for all objects
- Material property adjustments (roughness, metalness) for primitives
- Option to save and load lighting configurations

## Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/threejs-sandbox.git

# Navigate to the project directory
cd threejs-sandbox

# Install dependencies
npm install

# Start the development server
npm run dev
```

## Usage

1. Open the application in your browser
2. Use the interface panel to add lights to the scene
3. Adjust light parameters using the controls
4. Select different primitive objects to test lighting effects
5. Upload custom 3D models (GLTF/GLB format) using the Upload Model button
6. Choose different environment maps to test lighting and reflections
7. Adjust tone mapping and exposure settings as needed
8. Position, rotate, and scale objects as needed
9. Experiment with different combinations for desired results

## Supported Model Formats

The application supports 3D models in the following formats:
- GLTF (.gltf)
- GLB (.glb)

For best results, use models that:
- Have proper material definitions
- Are reasonably sized/optimized
- Use standard PBR materials

## Environment Maps

The application includes several HDR environment presets:
- Apartment
- City
- Dawn
- Forest
- Lobby
- Night
- Park
- Studio
- Sunset
- Warehouse

These environments provide realistic lighting and reflections for your materials.

## Technologies

- Three.js - 3D library
- JavaScript/TypeScript
- HTML5/CSS3
- Modern module bundling

## License

MIT 