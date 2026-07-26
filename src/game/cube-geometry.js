// Unit cube (1x1x1, centered at origin)
// 36 vertices = 6 faces * 2 triangles * 3 vertices

// prettier-ignore
const positions = [
  // Front face (+Z)
  -0.5, -0.5,  0.5,   0.5, -0.5,  0.5,   0.5,  0.5,  0.5,
  -0.5, -0.5,  0.5,   0.5,  0.5,  0.5,  -0.5,  0.5,  0.5,
  // Back face (-Z)
   0.5, -0.5, -0.5,  -0.5, -0.5, -0.5,  -0.5,  0.5, -0.5,
   0.5, -0.5, -0.5,  -0.5,  0.5, -0.5,   0.5,  0.5, -0.5,
  // Left face (-X)
  -0.5, -0.5, -0.5,  -0.5, -0.5,  0.5,  -0.5,  0.5,  0.5,
  -0.5, -0.5, -0.5,  -0.5,  0.5,  0.5,  -0.5,  0.5, -0.5,
  // Right face (+X)
   0.5, -0.5,  0.5,   0.5, -0.5, -0.5,   0.5,  0.5, -0.5,
   0.5, -0.5,  0.5,   0.5,  0.5, -0.5,   0.5,  0.5,  0.5,
  // Top face (+Y)
  -0.5,  0.5,  0.5,   0.5,  0.5,  0.5,   0.5,  0.5, -0.5,
  -0.5,  0.5,  0.5,   0.5,  0.5, -0.5,  -0.5,  0.5, -0.5,
  // Bottom face (-Y)
  -0.5, -0.5, -0.5,   0.5, -0.5, -0.5,   0.5, -0.5,  0.5,
  -0.5, -0.5, -0.5,   0.5, -0.5,  0.5,  -0.5, -0.5,  0.5,
]

// One flat color per face, same order as the faces above
const faceColors = [
  [1.0, 0.3, 0.3], // front  - red
  [0.3, 1.0, 0.3], // back   - green
  [0.3, 0.3, 1.0], // left   - blue
  [1.0, 1.0, 0.3], // right  - yellow
  [1.0, 0.3, 1.0], // top    - magenta
  [0.3, 1.0, 1.0], // bottom - cyan
]

// Interleave position and color into one Float32Array
export function createCubeVertexData() {
  const vertexData = []

  for (let face = 0; face < 6; face++) {
    const color = faceColors[face]
    for (let vertexInFace = 0; vertexInFace < 6; vertexInFace++) {
      const i = (face * 6 + vertexInFace) * 3
      vertexData.push(
        positions[i],
        positions[i + 1],
        positions[i + 2],
        color[0],
        color[1],
        color[2]
      )
    }
  }

  return new Float32Array(vertexData)
}

export const CUBE_VERTEX_COUNT = 36
