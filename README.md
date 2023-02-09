# Streets GL

**Streets GL** is a real-time 3D map renderer built for visualizing OpenStreetMap data with a heavy focus on eye-candy features.

## Features

- Support for the most common OSM features
- Configurable time of day
- Global map search powered by Nominatim
- Real-time air traffic
- Terrain with LODs
- Deferred shading with PBR
- Rich postprocessing: TAA, SSAO, depth of field, screen-space reflections, bloom
- Realistic atmosphere and aerial perspective rendering

## Modules

This repository includes several separable modules without any external dependencies that can be used in other projects with minimal modifications.

`/src/lib/renderer` — a simple WebGL2 renderer built from scratch (WebGPU support is also planned but hasn't been implemented yet).

`/src/lib/render-graph` — a minimal render graph (a.k.a. frame graph) implementation for easier rendering pipeline management. It automatically reorders render passes each frame, taking into account their dependencies, and culls out render passes that don't contribute to the final image. It also does basic memory management for framebuffers.

`/src/lib/math` — math utilities.

`/src/lib/core` — includes scene graph and some basic classes that describe a 3D scene. Depends on `math`.

`/src/lib/bmfont` — a bitmap text geometry generator optimized for large bitmaps and real-time use.