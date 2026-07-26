import './style.css'

/** @type {HTMLCanvasElement} */
const canvas = document.getElementById('canvas')

/** @type {WebGL2RenderingContext} */
const gl = canvas.getContext('webgl2')

if (!gl) {
  throw new Error('WebGL2 is not supported.')
}

const triangleVertices = [
  {
    // Top Middle
    position: [0.0, 0.5],
    color: [1.0, 0.0, 0.0], // red
  },
  {
    // Bottom Left
    position: [-0.5, -0.5],
    color: [0.0, 1.0, 0.0], // green
  },
  {
    // Bottom Right
    position: [0.5, -0.5],
    color: [0.0, 0.0, 1.0], // blue
  },
]

// Flatten into a Float32Array since that's what the GPU expects
const triangleVerticesCpuBuffer = new Float32Array(
  triangleVertices.flatMap((vertex) => [...vertex.position, ...vertex.color])
)

const triangleGeoBuffer = gl.createBuffer()
gl.bindBuffer(gl.ARRAY_BUFFER, triangleGeoBuffer)
gl.bufferData(gl.ARRAY_BUFFER, triangleVerticesCpuBuffer, gl.STATIC_DRAW)

// Runs once per vertex and determines the final screen position of that vertex
const vertexShaderSourceCode = `#version 300 es
precision mediump float;

in vec2 vertexPosition;
in vec3 vertexColor;

// This gets passed forward to the fragment shader
out vec3 color;

// Shared value used to correct aspect ratio
uniform float uAspect;

void main() {
  vec2 pos = vertexPosition;
  pos.x /= uAspect;

  color = vertexColor;

  // Since we are working in 2D z = 0
  // w = 1.0 is standard for orthographic rendering
  gl_Position = vec4(pos, 0.0, 1.0);
}`

// Runs once per pixel covered by the shape and determines that pixel's final color
const fragmentShaderSourceCode = `#version 300 es
precision mediump float;

// Matches the vertex shader's "out vec3 color"
in vec3 color;

// Output a final pixel color (RGBA)
out vec4 outputColor;

void main() {
  outputColor = vec4(color, 1.0);
}`

function compileShader(gl, type, source) {
  const shader = gl.createShader(type)
  gl.shaderSource(shader, source)
  gl.compileShader(shader)

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const info = gl.getShaderInfoLog(shader)
    gl.deleteShader(shader)
    throw new Error(info)
  }

  return shader
}

const vertexShader = compileShader(gl, gl.VERTEX_SHADER, vertexShaderSourceCode)
const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSourceCode)

const triangleShaderProgram = gl.createProgram()
gl.attachShader(triangleShaderProgram, vertexShader)
gl.attachShader(triangleShaderProgram, fragmentShader)
gl.linkProgram(triangleShaderProgram)

if (!gl.getProgramParameter(triangleShaderProgram, gl.LINK_STATUS)) {
  throw new Error(gl.getProgramInfoLog(triangleShaderProgram))
}

// Vertex Array Object stores the vertex buffer layout so we only bind it when drawing
const vao = gl.createVertexArray()
gl.bindVertexArray(vao)

gl.bindBuffer(gl.ARRAY_BUFFER, triangleGeoBuffer)

// Total byte size of one vertex
const stride = 5 * Float32Array.BYTES_PER_ELEMENT

const vertexPositionAttribLocation = gl.getAttribLocation(triangleShaderProgram, 'vertexPosition')
if (vertexPositionAttribLocation < 0) {
  throw new Error('Failed to get attrib location for vertexPosition')
}

gl.enableVertexAttribArray(vertexPositionAttribLocation)
gl.vertexAttribPointer(
  vertexPositionAttribLocation,
  2, // 2 components: x, y
  gl.FLOAT,
  false,
  stride,
  0 // position starts at byte offset 0
)

const vertexColorAttribLocation = gl.getAttribLocation(triangleShaderProgram, 'vertexColor')
if (vertexColorAttribLocation < 0) {
  throw new Error('Failed to get attrib location for vertexColor')
}

gl.enableVertexAttribArray(vertexColorAttribLocation)
gl.vertexAttribPointer(
  vertexColorAttribLocation,
  3, // 3 components: r, g, b
  gl.FLOAT,
  false,
  stride,
  2 * Float32Array.BYTES_PER_ELEMENT // color starts after the 2 position floats
)

gl.bindVertexArray(null)
gl.clearColor(0.1, 0.1, 0.1, 1.0)

const aspectLocation = gl.getUniformLocation(triangleShaderProgram, 'uAspect')

function render() {
  gl.clear(gl.COLOR_BUFFER_BIT)

  gl.useProgram(triangleShaderProgram)
  gl.uniform1f(aspectLocation, canvas.width / canvas.height)

  gl.bindVertexArray(vao)
  gl.drawArrays(gl.TRIANGLES, 0, 3)
  gl.bindVertexArray(null)

  requestAnimationFrame(render)
}

render()

function resize() {
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight

  gl.viewport(0, 0, canvas.width, canvas.height)
}

window.addEventListener('resize', resize)
resize()
