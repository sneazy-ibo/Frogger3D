# Frogger3D

A 3D remake of the classic Frogger game, built with WebGL2 and [Vite](https://vitejs.dev/).

Guide your frog across a busy road and a river full of logs and lily pads without getting run over or drowning.

**Live demo:** https://sneazy-ibo.github.io/Frogger3D/

## Controls

| Action             | Key / Input       |
| ------------------ | ----------------- |
| Move frog          | Arrow keys / WASD |
| Rotate camera      | Click + drag      |
| Zoom camera        | Scroll            |
| Switch camera view | `C`               |
| Pause              | `P`               |

There's also a light panel in the corner to play with the position, intensity and color of the scene's light.

## Getting Started

This project uses [pnpm](https://pnpm.io/) as its package manager and [Vite](https://vitejs.dev/) as its dev server / bundler. You don't need to install Vite globally, it's a project dependency and gets installed automatically in the next step.

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or newer recommended)
- [pnpm](https://pnpm.io/installation) (v10 or newer recommended )

### Install dependencies

```bash
pnpm install
```

### Run the dev server

```bash
pnpm dev
```

This starts Vite's local dev server (usually at `http://localhost:5173`) and prints the URL in the terminal. Open it in a browser that supports WebGL2.


## Deployment

The `.github/workflows/deploy.yml` workflow builds the project and deploys it to GitHub Pages automatically. This is done in order to support previews of branches.

## Project Structure

```
src/
├── engine/     # Reusable rendering/camera/lighting/math utilities (not game-specific)
├── game/       # Frogger-specific logic: player, traffic, floats, collisions, scene
├── shaders/    # GLSL vertex/fragment shaders
└── main.js     # Entry point: wires everything together and runs the render loop
```

## Tech Stack

- WebGL2
- [gl-matrix](https://glmatrix.net/) for vector/matrix math
- [loaders.gl](https://loaders.gl/) (`@loaders.gl/core` + `@loaders.gl/gltf`) for loading the `.glb` models
- Vite for bundling and the dev server
- Husky + lint-staged + Prettier for formatting on commit
