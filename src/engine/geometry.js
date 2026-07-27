import { mat4, mat3, vec3 } from 'gl-matrix'

// Procedural primitive generators: axis-aligned box and flat plane, both
// built in local space and then baked into world space via
// transformGeometry(). Baking transforms in means many instances (tiles,
// trees, lane markings, ...) can be merged into one buffer and drawn with
// a single, static (identity) model matrix, same as everything else the
// renderer already draws.

// Box centered on the origin, spanning [-size/2, size/2] on every axis.
// Each face gets its own 4 vertices so normals stay flat across edges
// (no smoothing), which fits a low-poly/stylized look.
export function createBoxGeometry(width, height, depth) {
  const x = width / 2
  const y = height / 2
  const z = depth / 2

  // prettier-ignore
  const positions = new Float32Array([
    // +X face
    x, -y, -z,   x, -y, z,   x, y, z,   x, y, -z,
    // -X face
    -x, -y, z,   -x, -y, -z,   -x, y, -z,   -x, y, z,
    // +Y face
    -x, y, -z,   x, y, -z,   x, y, z,   -x, y, z,
    // -Y face
    -x, -y, z,   x, -y, z,   x, -y, -z,   -x, -y, -z,
    // +Z face
    -x, -y, z,   x, -y, z,   x, y, z,   -x, y, z,
    // -Z face
    x, -y, -z,   -x, -y, -z,   -x, y, -z,   x, y, -z,
  ])

  // prettier-ignore
  const normals = new Float32Array([
    1, 0, 0,   1, 0, 0,   1, 0, 0,   1, 0, 0,
    -1, 0, 0,   -1, 0, 0,   -1, 0, 0,   -1, 0, 0,
    0, 1, 0,   0, 1, 0,   0, 1, 0,   0, 1, 0,
    0, -1, 0,   0, -1, 0,   0, -1, 0,   0, -1, 0,
    0, 0, 1,   0, 0, 1,   0, 0, 1,   0, 0, 1,
    0, 0, -1,   0, 0, -1,   0, 0, -1,   0, 0, -1,
  ])

  // Two triangles per face, 6 faces, following the vertex order above
  const indices = new Uint32Array(
    Array.from({ length: 6 }, (_, face) => {
      const base = face * 4
      return [base, base + 1, base + 2, base, base + 2, base + 3]
    }).flat()
  )

  return { positions, normals, indices }
}

// Flat quad in the XZ plane, facing +Y, spanning [-size/2, size/2] on X/Z.
// Useful for anything that should read as perfectly flat ground.
export function createPlaneGeometry(width, depth) {
  const x = width / 2
  const z = depth / 2

  // prettier-ignore
  const positions = new Float32Array([
    -x, 0, -z,
     x, 0, -z,
     x, 0,  z,
    -x, 0,  z,
  ])

  // prettier-ignore
  const normals = new Float32Array([
    0, 1, 0,
    0, 1, 0,
    0, 1, 0,
    0, 1, 0,
  ])

  const indices = new Uint32Array([0, 1, 2, 0, 2, 3])

  return { positions, normals, indices }
}

// Applies an arbitrary 4x4 matrix to a geometry's positions and normals,
// baking the transform into fresh vertex data. Shared by transformGeometry
// below (which builds the matrix from position/rotationY/scale) and by
// the model loader (which builds it by walking a glTF node hierarchy),
// both just need "take this geometry, apply this matrix" once they have
// the matrix in hand.
export function applyMatrixToGeometry(geometry, matrix) {
  // Non-uniform scale needs the inverse-transpose for correct normals,
  // same reasoning as the per-frame normal matrix in main.js
  const normalMatrix = mat3.create()
  mat3.normalFromMat4(normalMatrix, matrix)

  const positions = new Float32Array(geometry.positions.length)
  const point = vec3.create()
  for (let i = 0; i < geometry.positions.length; i += 3) {
    vec3.set(point, geometry.positions[i], geometry.positions[i + 1], geometry.positions[i + 2])
    vec3.transformMat4(point, point, matrix)
    positions.set(point, i)
  }

  const normals = new Float32Array(geometry.normals.length)
  const normal = vec3.create()
  for (let i = 0; i < geometry.normals.length; i += 3) {
    vec3.set(normal, geometry.normals[i], geometry.normals[i + 1], geometry.normals[i + 2])
    vec3.transformMat3(normal, normal, normalMatrix)
    vec3.normalize(normal, normal)
    normals.set(normal, i)
  }

  return { positions, normals, indices: geometry.indices }
}

// Bakes a translate/rotateY/scale transform into a geometry's own vertex
// data (positions and normals), so the result can be merged with other
// instances and drawn without any further per-instance uniform.
export function transformGeometry(
  geometry,
  { position = [0, 0, 0], rotationY = 0, scale = [1, 1, 1] } = {}
) {
  const matrix = mat4.create()
  mat4.translate(matrix, matrix, position)
  mat4.rotateY(matrix, matrix, rotationY)
  mat4.scale(matrix, matrix, scale)

  return applyMatrixToGeometry(geometry, matrix)
}

// Concatenates already-transformed geometries that share a color into one
// {positions, normals, indices, color} part, the same shape the model
// loader produces, so both can be turned into VAOs the same way.
export function mergeGeometries(geometries, color) {
  let vertexCount = 0
  let indexCount = 0
  for (const geometry of geometries) {
    vertexCount += geometry.positions.length / 3
    indexCount += geometry.indices.length
  }

  const positions = new Float32Array(vertexCount * 3)
  const normals = new Float32Array(vertexCount * 3)
  const indices = new Uint32Array(indexCount)

  let vertexOffset = 0
  let indexOffset = 0
  for (const geometry of geometries) {
    positions.set(geometry.positions, vertexOffset * 3)
    normals.set(geometry.normals, vertexOffset * 3)

    for (let i = 0; i < geometry.indices.length; i++) {
      indices[indexOffset + i] = geometry.indices[i] + vertexOffset
    }

    vertexOffset += geometry.positions.length / 3
    indexOffset += geometry.indices.length
  }

  return { positions, normals, indices, color }
}
