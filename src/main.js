import './style.css'
import { mat4, mat3 } from 'gl-matrix'
import { createProgram, getAttribLocation, getUniformLocation } from './engine/gl-utils.js'
import { loadModel } from './engine/model-loader.js'
import {
  CameraMode,
  cameraState,
  resetCameraTilt,
  computeViewMatrix,
  computeCameraPosition,
} from './engine/camera.js'
import { initMouseCameraControls } from './engine/mouse-camera-controls.js'
import { lightState, computeLightColor } from './engine/light.js'
import { initLightControls } from './engine/light-controls.js'

// Vite's `?raw` suffix imports the file as a plain string
import vertexShaderSourceCode from './shaders/model.vert.glsl?raw'
import fragmentShaderSourceCode from './shaders/model.frag.glsl?raw'

/** @type {HTMLCanvasElement} */
const canvas = document.getElementById('canvas')

/** @type {WebGL2RenderingContext} */
const gl = canvas.getContext('webgl2')

if (!gl) {
  throw new Error('WebGL2 is not supported.')
}

// Pauses this module until the model is loaded
const model = await loadModel('/models/frog.glb')

const modelShaderProgram = createProgram(gl, vertexShaderSourceCode, fragmentShaderSourceCode)

const vertexPositionAttribLocation = getAttribLocation(gl, modelShaderProgram, 'vertexPosition')
const vertexNormalAttribLocation = getAttribLocation(gl, modelShaderProgram, 'vertexNormal')

const uModelLocation = getUniformLocation(gl, modelShaderProgram, 'uModel')
const uViewLocation = getUniformLocation(gl, modelShaderProgram, 'uView')
const uProjectionLocation = getUniformLocation(gl, modelShaderProgram, 'uProjection')
const uColorLocation = getUniformLocation(gl, modelShaderProgram, 'uColor')
const uNormalMatrixLocation = getUniformLocation(gl, modelShaderProgram, 'uNormalMatrix')
const uLightPositionLocation = getUniformLocation(gl, modelShaderProgram, 'uLightPosition')
const uLightColorLocation = getUniformLocation(gl, modelShaderProgram, 'uLightColor')
const uViewPositionLocation = getUniformLocation(gl, modelShaderProgram, 'uViewPosition')

// One VAO per mesh part, each with its own color, sharing one shader program
const renderableParts = model.parts.map((part) => {
  const vao = gl.createVertexArray()
  gl.bindVertexArray(vao)

  const positionBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
  gl.bufferData(gl.ARRAY_BUFFER, part.positions, gl.STATIC_DRAW)
  gl.enableVertexAttribArray(vertexPositionAttribLocation)
  gl.vertexAttribPointer(vertexPositionAttribLocation, 3, gl.FLOAT, false, 0, 0)

  const normalBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer)
  gl.bufferData(gl.ARRAY_BUFFER, part.normals, gl.STATIC_DRAW)
  gl.enableVertexAttribArray(vertexNormalAttribLocation)
  gl.vertexAttribPointer(vertexNormalAttribLocation, 3, gl.FLOAT, false, 0, 0)

  // Indexed drawing: shared vertices are referenced instead of duplicated
  const indexBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer)
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, part.indices, gl.STATIC_DRAW)

  gl.bindVertexArray(null)

  // glTF picks the smallest index type that fits, so we read it off the array
  const indexType = part.indices instanceof Uint32Array ? gl.UNSIGNED_INT : gl.UNSIGNED_SHORT

  return {
    vao,
    indexType,
    indexCount: part.indices.length,
    color: part.color,
  }
})

gl.clearColor(0.1, 0.1, 0.1, 1.0)

// Without depth testing, triangles draw in submission order instead of
// nearest distance to camera order, so back faces would bleed through front faces
gl.enable(gl.DEPTH_TEST)

// Placed/rotated in world space, recomputed every frame since the model spins
const modelMatrix = mat4.create()

// Current camera mode, switchable with the "C" key
let currentCameraMode = CameraMode.ANGLED_TOP_DOWN

let isPaused = false
let animationTimeMs = 0
let lastFrameTimeMs = null

const cameraTarget = [0, 0, 0]
const fieldOfViewDegrees = 60

initMouseCameraControls(canvas, cameraState)
initLightControls(lightState)

window.addEventListener('keydown', (event) => {
  const key = event.key.toLocaleLowerCase()

  switch (key) {
    case 'c':
      currentCameraMode =
        currentCameraMode === CameraMode.ANGLED_TOP_DOWN
          ? CameraMode.CHASE
          : CameraMode.ANGLED_TOP_DOWN

      resetCameraTilt(currentCameraMode)
      break

    case 'p':
      isPaused = !isPaused
      break
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
  // First frame has no previous timestamp to diff against
  const deltaMs = lastFrameTimeMs === null ? 0 : timeMs - lastFrameTimeMs
  lastFrameTimeMs = timeMs

  if (!isPaused) {
    animationTimeMs += deltaMs
  }

  const timeSeconds = animationTimeMs * 0.001

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

  // Scale first so we rotate around the (already normalized) object center
  mat4.identity(modelMatrix)
  mat4.scale(modelMatrix, modelMatrix, [model.scale, model.scale, model.scale])
  mat4.rotateY(modelMatrix, modelMatrix, timeSeconds)
  mat4.rotateX(modelMatrix, modelMatrix, timeSeconds * 0.6)

  // Recomputed every frame since the mode can change via keypress
  const viewMatrix = computeViewMatrix(currentCameraMode, cameraTarget)

  // Inverse transpose of modelMatrix's upper 3x3, so normals transform
  // correctly even if the model is ever scaled non uniformly
  const normalMatrix = mat3.create()
  mat3.normalFromMat4(normalMatrix, modelMatrix)

  const cameraPosition = computeCameraPosition(cameraTarget)

  gl.useProgram(modelShaderProgram)
  gl.uniformMatrix4fv(uModelLocation, false, modelMatrix)
  gl.uniformMatrix4fv(uViewLocation, false, viewMatrix)
  gl.uniformMatrix4fv(uProjectionLocation, false, projectionMatrix)
  gl.uniformMatrix3fv(uNormalMatrixLocation, false, normalMatrix)
  gl.uniform3fv(uLightPositionLocation, lightState.position)
  gl.uniform3fv(uLightColorLocation, computeLightColor())
  gl.uniform3fv(uViewPositionLocation, cameraPosition)

  // Same model/view/projection for every part so they move as one object,
  // but each part sets its own color before drawing
  for (const part of renderableParts) {
    gl.uniform3fv(uColorLocation, part.color)
    gl.bindVertexArray(part.vao)
    gl.drawElements(gl.TRIANGLES, part.indexCount, part.indexType, 0)
  }
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
