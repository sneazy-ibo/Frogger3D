import { load } from '@loaders.gl/core'
import { GLTFLoader, postProcessGLTF } from '@loaders.gl/gltf'
import { mat4 } from 'gl-matrix'
import { applyMatrixToGeometry } from './geometry.js'

// Used when a part has no material assigned
const DEFAULT_COLOR = [0.8, 0.8, 0.8]

// Target size (world units) the model's longest dimension is scaled to fit
const TARGET_SIZE = 2

// glTF's baseColorFactor is linear; scene.js's flat colors aren't.
// How much to correct for that is scene-specific, so it's a parameter
// (see the loadModel call in main.js) rather than hardcoded here.
function linearToDisplayColor([r, g, b], gamma) {
  const exponent = 1 / gamma
  return [r ** exponent, g ** exponent, b ** exponent]
}

function averageTextureColor(image, uvs, fallbackColor) {
  const canvas = document.createElement('canvas')
  canvas.width = image.width
  canvas.height = image.height
  const ctx = canvas.getContext('2d')
  ctx.drawImage(image, 0, 0)
  const { data } = ctx.getImageData(0, 0, image.width, image.height)

  let r = 0
  let g = 0
  let b = 0
  let count = 0
  for (let i = 0; i < uvs.length; i += 2) {
    const x = Math.max(0, Math.min(image.width - 1, Math.floor(uvs[i] * image.width)))
    // glTF's v axis is flipped relative to canvas y
    const y = Math.max(0, Math.min(image.height - 1, Math.floor((1 - uvs[i + 1]) * image.height)))
    const pixel = (y * image.width + x) * 4

    if (data[pixel + 3] === 0) continue // fully transparent texel, not real color
    r += data[pixel]
    g += data[pixel + 1]
    b += data[pixel + 2]
    count++
  }

  if (count === 0) return fallbackColor
  return [r / count / 255, g / count / 255, b / count / 255]
}

function expandBounds(min, max, positions) {
  for (let i = 0; i < positions.length; i += 3) {
    for (let axis = 0; axis < 3; axis++) {
      const value = positions[i + axis]
      min[axis] = Math.min(min[axis], value)
      max[axis] = Math.max(max[axis], value)
    }
  }
}

// A glTF node's local transform is either a full matrix or a separate
// translation/rotation/scale but never both.
function nodeLocalMatrix(node) {
  if (node.matrix) return mat4.clone(node.matrix)
  return mat4.fromRotationTranslationScale(
    mat4.create(),
    node.rotation ?? [0, 0, 0, 1],
    node.translation ?? [0, 0, 0],
    node.scale ?? [1, 1, 1]
  )
}

// Walks the glTF scene graph accumulating each node's world transform,
// yielding one {mesh, worldMatrix} per node that references a mesh.
// Sketchfab/Blender exports often bake a Z-up -> Y-up conversion into
// these node matrices rather than into the mesh data itself, so skipping
// them (as this loader used to) leaves the mesh in the wrong orientation.
function collectMeshInstances(node, parentWorldMatrix, instances) {
  const worldMatrix = mat4.multiply(mat4.create(), parentWorldMatrix, nodeLocalMatrix(node))

  if (node.mesh) instances.push({ mesh: node.mesh, worldMatrix })
  for (const child of node.children ?? []) {
    collectMeshInstances(child, worldMatrix, instances)
  }
}

// Loads a .glb and pulls out every mesh as a separate part, baking in
// each mesh's accumulated node transform so the geometry ends up in one
// consistent space before it's scaled/placed in main.js.
export async function loadModel(
  url,
  { materialGamma = 1, targetSize = DEFAULT_TARGET_SIZE, fallbackColor = DEFAULT_COLOR } = {}
) {
  const gltf = await load(url, GLTFLoader)
  const processed = postProcessGLTF(gltf)

  const instances = []
  const scene = processed.scene ?? processed.scenes[0]
  for (const rootNode of scene.nodes) {
    collectMeshInstances(rootNode, mat4.create(), instances)
  }

  const parts = instances.map(({ mesh, worldMatrix }) => {
    const primitive = mesh.primitives[0]
    const { positions, normals } = applyMatrixToGeometry(
      {
        positions: primitive.attributes.POSITION.value,
        normals: primitive.attributes.NORMAL.value,
      },
      worldMatrix
    )

    const texture = primitive.material?.pbrMetallicRoughness?.baseColorTexture?.texture
    const image = texture?.source?.image
    const uvs = primitive.attributes.TEXCOORD_0?.value

    const baseColorFactor = primitive.material?.pbrMetallicRoughness?.baseColorFactor
    const color =
      image && uvs
        ? averageTextureColor(image, uvs, fallbackColor)
        : baseColorFactor
          ? linearToDisplayColor(baseColorFactor, materialGamma)
          : fallbackColor

    return { positions, normals, indices: primitive.indices.value, color }
  })

  // Bounding box spans all parts together, so they stay sized/positioned
  // correctly relative to each other after scaling
  const min = [Infinity, Infinity, Infinity]
  const max = [-Infinity, -Infinity, -Infinity]
  for (const part of parts) expandBounds(min, max, part.positions)

  // The model's local origin isn't at the bottom of its feet, so without
  // this the frog sits with its feet partway through the ground. Shift
  // everything up so the lowest point sits at y = 0.
  const groundOffset = -min[1]
  for (const part of parts) {
    for (let i = 1; i < part.positions.length; i += 3) {
      part.positions[i] += groundOffset
    }
  }

  const largestDimension = Math.max(max[0] - min[0], max[1] - min[1], max[2] - min[2])
  const scale = targetSize / largestDimension

  return { parts, scale }
}
