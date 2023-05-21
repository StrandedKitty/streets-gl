![cityscape banner](https://user-images.githubusercontent.com/48140945/235281559-9a78fdbb-7b22-4c2d-8d74-dddaf5eaece6.png)

<div align="center">
    <h1>Streets GL</h1>
    <!--<a href="https://trello.com/b/WJ1D07lT"><img src="https://img.shields.io/static/v1?label=&message=Trello%20board&logo=trello&logoColor=ffffff&color=0052CC" alt="Trello board" /></a>-->
    <a href="https://discord.gg/bewggJ3eMC"><img src="https://img.shields.io/discord/1098082266451820544.svg?label=&logo=discord&logoColor=ffffff&color=6A7EC2" alt="Discord" /></a>
    <img src="https://img.shields.io/github/commit-activity/m/strandedkitty/streets-gl?color=d77bdb" alt="GitHub commit activity">
    <img src="https://img.shields.io/github/license/strandedkitty/streets-gl?color=3975cf" alt="License" />
</div>
<br>

**Streets GL** is a real-time 3D map renderer built for visualizing [OpenStreetMap](https://www.openstreetmap.org/) data with a heavy focus on eye-candy features.

The whole project is written in Typescript. For rendering it uses a custom low-level library that wraps WebGL2 API, and for managing the rendering pipeline it uses a simple render graph (or frame graph) implementation. Geometry generation is done on the fly; supported map features include but are not limited to complex building shapes (according to the de-facto standard [Simple 3D Buildings](https://wiki.openstreetmap.org/wiki/Simple_3D_Buildings) schema), roads and paths, trees, etc.

The goals of this project include providing a way to explore the feature-rich OSM database in 3D, promoting open data, and offering a way for the mapping community to easily validate the map by visual means.

> **Warning**: This project is still in early development, expect bugs and missing features.

<div align="center">
<b><a href="https://streets.gl/">Visit streets.gl</a></b>
</div>

## ⭐ Features

- Support for the most common OpenStreetMap features
- Configurable time of day
- Global map search powered by Nominatim
- Real-time air traffic
- Terrain with LODs
- Deferred shading with PBR
- Rich postprocessing: TAA, SSAO, depth of field, screen-space reflections, bloom
- Realistic atmosphere and aerial perspective rendering

## 🖼️ Screenshots

<img src="https://user-images.githubusercontent.com/48140945/235284116-a1730bb2-5467-486f-9aca-e7953963fe94.png" width="30%"></img> <img src="https://user-images.githubusercontent.com/48140945/235284103-0f714011-643d-4d73-a4fd-6d6881acd00b.png" width="30%"></img> <img src="https://user-images.githubusercontent.com/48140945/235284113-48afe76d-1ac9-4f00-b5cc-b4fb64587125.png" width="30%"></img> <img src="https://user-images.githubusercontent.com/48140945/235284096-b22d31cf-47c5-4237-9637-fc3de3628778.png" width="30%"></img> <img src="https://user-images.githubusercontent.com/48140945/235284120-3065b7fd-7706-4c4a-83af-a4cdb1ed7f56.png" width="30%"></img> <img src="https://user-images.githubusercontent.com/48140945/235284106-b9c0b90f-002b-47ac-a7f0-e1bd3056e2b6.png" width="30%"></img> <img src="https://user-images.githubusercontent.com/48140945/235664789-a7c19ec2-1dc3-4c03-ba4a-ee18c1cfac0d.png" width="30%"></img> <img src="https://user-images.githubusercontent.com/48140945/235664814-d2be2ac0-bfa3-4407-a3d0-bd67f10e3fd9.png" width="30%"></img> <img src="https://user-images.githubusercontent.com/48140945/235664795-219e41c8-b03f-4f4b-9972-6ce476b71e06.png" width="30%"></img>

## 💻 Minimum requirements

To run this application, you need a machine that supports WebGL2. It's recommended to use an up-to-date version of Google Chrome. Additionally, for a smooth experience, you will likely need a modern discrete GPU.

## 🗂️ Data sources

Currently, Streets GL uses three sources of data to render the map:

- Public Overpass API instances to query small portions of the OpenStreetMap database (specific endpoints can be configured in the settings).
- Terrain 3D tileset by Esri to visualize terrain elevation.
- Mapbox API vector tiles to access pre-sliced polygons for big features that can't be reliably queried using Overpass API (such as water bodies).

Some small areas of the map are occasionally fetched and cached by the server for a faster and more reliable access. These areas include several major well-mapped cities (NYC, Berlin, Paris, etc). This feature can be turned off in the settings in case you want to see the most recent OSM data directly from Overpass API instances.

Read more about issues regarding the data on [this wikipage](https://github.com/StrandedKitty/streets-gl/wiki/Data-sources).

## 📦 Modules

This repository includes several separable modules without any external dependencies that can be used in other projects with minimal modifications.

- [renderer](src/lib/renderer) — a simple WebGL2 renderer built from scratch (WebGPU support is also planned but hasn't been implemented yet).
- [render-graph](src/lib/render-graph) — a minimal render graph (a.k.a. frame graph) implementation for easier rendering pipeline management. It automatically reorders render passes each frame, taking into account their dependencies, and culls out render passes that don't contribute to the final image. It also does basic memory management for framebuffers.
- [math](src/lib/math) — math utilities.
- [core](src/lib/core) — includes scene graph and some basic classes that describe a 3D scene. Depends on `math`.
- [bmfont](src/lib/bmfont) — a bitmap text geometry generator optimized for large bitmaps and real-time use.

## 💡 Contributing

Please report any bugs you find by opening a new issue (but first make sure it hasn't been reported yet). Suggestions and pull requests are also welcome.

If you want to make a significant change, please open an issue first to discuss it.

More information about contributing can be found in [CONTRIBUTING.md](CONTRIBUTING.md).

### Development

1. Clone this repository
2. Install dependencies with `npm i`
3. Run `npm run dev` to start a local development server
