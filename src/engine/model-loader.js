import { load } from '@loaders.gl/core'
import { GLTFLoader, postProcessGLTF } from '@loaders.gl/gltf'

// Used when a part has no material assigned
const DEFAULT_COLOR = [0.8, 0.8, 0.8]

// Target size (world units) the model's longest dimension is scaled to fit
const TARGET_SIZE = 2

// Expands a running [min, max] bounding box (per axis) with a position array
function expandBounds(min, max, positions) {
  for (let i = 0; i < positions.length; i += 3) {
    for (let axis = 0; axis < 3; axis++) {
      const value = positions[i + axis]
      min[axis] = Math.min(min[axis], value)
      max[axis] = Math.max(max[axis], value)
    }
  }
}

// Loads a .glb and pulls out every mesh as a separate part
export async function loadModel(url) {
  const gltf = await load(url, GLTFLoader)
  const { meshes } = postProcessGLTF(gltf)

  const min = [Infinity, Infinity, Infinity]
  const max = [-Infinity, -Infinity, -Infinity]

  const parts = meshes.map((mesh) => {
    const primitive = mesh.primitives[0]
    const positions = primitive.attributes.POSITION.value

    expandBounds(min, max, positions)

    const baseColorFactor = primitive.material?.pbrMetallicRoughness?.baseColorFactor
    const color = baseColorFactor ? baseColorFactor.slice(0, 3) : DEFAULT_COLOR

    return {
      positions,
      normals: primitive.attributes.NORMAL.value,
      indices: primitive.indices.value,
      color,
    }
  })

  // Bounding box spans all parts together, so they stay sized/positioned
  // correctly relative to each other after scaling
  const largestDimension = Math.max(max[0] - min[0], max[1] - min[1], max[2] - min[2])
  const scale = TARGET_SIZE / largestDimension

  return { parts, scale }
}
