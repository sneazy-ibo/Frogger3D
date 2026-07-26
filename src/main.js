import './style.css'
import { mat4 } from 'gl-matrix'
import { createProgram, getAttribLocation, getUniformLocation } from './engine/gl-utils.js'
import { createCubeVertexData, CUBE_VERTEX_COUNT } from './game/cube-geometry.js'
import { CameraMode, cameraState, resetCameraTilt, computeViewMatrix } from './engine/camera.js'
import { initMouseCameraControls } from './engine/mouse-camera-controls.js'

// Vite's `?raw` suffix imports the file as a plain string
import vertexShaderSourceCode from './shaders/cube.vert.glsl?raw'
import fragmentShaderSourceCode from './shaders/cube.frag.glsl?raw'

/** @type {HTMLCanvasElement} */
const canvas = document.getElementById('canvas')

/** @type {WebGL2RenderingContext} */
const gl = canvas.getContext('webgl2')

if (!gl) {
  throw new Error('WebGL2 is not supported.')
}

const cubeVertexData = createCubeVertexData()

const cubeGeoBuffer = gl.createBuffer()
gl.bindBuffer(gl.ARRAY_BUFFER, cubeGeoBuffer)
gl.bufferData(gl.ARRAY_BUFFER, cubeVertexData, gl.STATIC_DRAW)

const cubeShaderProgram = createProgram(gl, vertexShaderSourceCode, fragmentShaderSourceCode)

const vertexPositionAttribLocation = getAttribLocation(gl, cubeShaderProgram, 'vertexPosition')
const vertexColorAttribLocation = getAttribLocation(gl, cubeShaderProgram, 'vertexColor')

const uModelLocation = getUniformLocation(gl, cubeShaderProgram, 'uModel')
const uViewLocation = getUniformLocation(gl, cubeShaderProgram, 'uView')
const uProjectionLocation = getUniformLocation(gl, cubeShaderProgram, 'uProjection')

// Vertex Array Object stores the vertex buffer layout so we only bind it when drawing
const vao = gl.createVertexArray()
gl.bindVertexArray(vao)
gl.bindBuffer(gl.ARRAY_BUFFER, cubeGeoBuffer)

// Total byte size of one vertex
const stride = 6 * Float32Array.BYTES_PER_ELEMENT

gl.enableVertexAttribArray(vertexPositionAttribLocation)
gl.vertexAttribPointer(
  vertexPositionAttribLocation,
  3, // 3 components: x, y, z
  gl.FLOAT,
  false,
  stride,
  0 // position starts at byte offset 0
)

gl.enableVertexAttribArray(vertexColorAttribLocation)
gl.vertexAttribPointer(
  vertexColorAttribLocation,
  3, // 3 components: r, g, b
  gl.FLOAT,
  false,
  stride,
  3 * Float32Array.BYTES_PER_ELEMENT // color starts after the 3 position floats
)

gl.bindVertexArray(null)
gl.clearColor(0.1, 0.1, 0.1, 1.0)

// Without depth testing, triangles draw in submission order instead of
// nearest distance to camera order, so back faces would bleed through front faces
gl.enable(gl.DEPTH_TEST)

// Placed/rotated in world space, recomputed every frame since the cube spins
const modelMatrix = mat4.create()

// Current camera mode, switchable with the "C" key
let currentCameraMode = CameraMode.ANGLED_TOP_DOWN

const cameraTarget = [0, 0, 0]
const fieldOfViewDegrees = 60

initMouseCameraControls(canvas, cameraState)

window.addEventListener('keydown', (event) => {
  const key = event.key.toLocaleLowerCase()

  if (key === 'c') {
    currentCameraMode =
      currentCameraMode === CameraMode.ANGLED_TOP_DOWN
        ? CameraMode.CHASE
        : CameraMode.ANGLED_TOP_DOWN

    resetCameraTilt(currentCameraMode)
  }
})

// Depends on canvas aspect ratio, so recomputed on resize
const projectionMatrix = mat4.create()

function updateProjectionMatrix() {
  const fieldOfViewRadians = (fieldOfViewDegrees * Math.PI) / 180
  const aspect = canvas.width / canvas.height
  const near = 0.1
  const far = 100
  mat4.perspective(projectionMatrix, fieldOfViewRadians, aspect, near, far)
}

function render(timeMs) {
  const timeSeconds = timeMs * 0.001

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

  // Spin the cube so that we can confirm the pipeline and depth test work
  mat4.identity(modelMatrix)
  mat4.rotateY(modelMatrix, modelMatrix, timeSeconds)
  mat4.rotateX(modelMatrix, modelMatrix, timeSeconds * 0.6)

  // Recomputed every frame since the mode can change via keypress
  const viewMatrix = computeViewMatrix(currentCameraMode, cameraTarget)

  gl.useProgram(cubeShaderProgram)
  gl.uniformMatrix4fv(uModelLocation, false, modelMatrix)
  gl.uniformMatrix4fv(uViewLocation, false, viewMatrix)
  gl.uniformMatrix4fv(uProjectionLocation, false, projectionMatrix)

  gl.bindVertexArray(vao)
  gl.drawArrays(gl.TRIANGLES, 0, CUBE_VERTEX_COUNT)
  gl.bindVertexArray(null)

  requestAnimationFrame(render)
}

requestAnimationFrame(render)

function resize() {
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight

  gl.viewport(0, 0, canvas.width, canvas.height)
  updateProjectionMatrix()
}

window.addEventListener('resize', resize)
resize()
