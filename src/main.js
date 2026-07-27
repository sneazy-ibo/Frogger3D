import './style.css'
import { mat4, mat3 } from 'gl-matrix'
import {
  createProgram,
  getAttribLocation,
  getUniformLocation,
  createRenderableParts,
} from './engine/gl-utils.js'
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
import { buildScene } from './game/scene.js'

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
const model = await loadModel('/models/frog.glb', { materialGamma: 1.6 })

// Static level geometry (lanes, props, markings)
const scene = buildScene()

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

const attribLocations = {
  positionLocation: vertexPositionAttribLocation,
  normalLocation: vertexNormalAttribLocation,
}

// One VAO per mesh part, each with its own color, sharing one shader program
const frogRenderableParts = createRenderableParts(gl, model.parts, attribLocations)

// Same idea, but for the static ground/props built in game/scene.js
const sceneRenderableParts = createRenderableParts(gl, scene.parts, attribLocations)

gl.clearColor(0.1, 0.1, 0.1, 1.0)

// Without depth testing, triangles draw in submission order instead of
// nearest distance to camera order, so back faces would bleed through front faces
gl.enable(gl.DEPTH_TEST)

// Placed at the scene's start position; recomputed every frame since this
// will need to track player movement once the frog becomes controllable
const modelMatrix = mat4.create()

// The scene is static and its vertex data already lives in world space
// (baked in by game/scene.js), so it's always drawn with these identities
const sceneModelMatrix = mat4.create()
const sceneNormalMatrix = mat3.create()

// Current camera mode, switchable with the "C" key
let currentCameraMode = CameraMode.ANGLED_TOP_DOWN

let isPaused = false
let animationTimeMs = 0
let lastFrameTimeMs = null

const cameraTarget = [scene.playerStart.x, 0, scene.playerStart.z]
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

function drawParts(parts, modelMatrixUniform, normalMatrixUniform) {
  gl.uniformMatrix4fv(uModelLocation, false, modelMatrixUniform)
  gl.uniformMatrix3fv(uNormalMatrixLocation, false, normalMatrixUniform)

  for (const part of parts) {
    gl.uniform3fv(uColorLocation, part.color)
    gl.bindVertexArray(part.vao)
    gl.drawElements(gl.TRIANGLES, part.indexCount, part.indexType, 0)
  }
}

function render(timeMs) {
  // First frame has no previous timestamp to diff against
  const deltaMs = lastFrameTimeMs === null ? 0 : timeMs - lastFrameTimeMs
  lastFrameTimeMs = timeMs

  if (!isPaused) {
    animationTimeMs += deltaMs
  }

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

  // Scale to the model's normalized size, then move it to its spot in the
  // scene (currently fixed; will track player input later)
  mat4.identity(modelMatrix)
  mat4.translate(modelMatrix, modelMatrix, [scene.playerStart.x, 0, scene.playerStart.z])
  mat4.scale(modelMatrix, modelMatrix, [model.scale, model.scale, model.scale])

  // Recomputed every frame since the mode can change via keypress
  const viewMatrix = computeViewMatrix(currentCameraMode, cameraTarget)

  // Inverse transpose of modelMatrix's upper 3x3, so normals transform
  // correctly even if the model is ever scaled non uniformly
  const normalMatrix = mat3.create()
  mat3.normalFromMat4(normalMatrix, modelMatrix)

  const cameraPosition = computeCameraPosition(cameraTarget)

  gl.useProgram(modelShaderProgram)
  gl.uniformMatrix4fv(uViewLocation, false, viewMatrix)
  gl.uniformMatrix4fv(uProjectionLocation, false, projectionMatrix)
  gl.uniform3fv(uLightPositionLocation, lightState.position)
  gl.uniform3fv(uLightColorLocation, computeLightColor())
  gl.uniform3fv(uViewPositionLocation, cameraPosition)

  // Ground/props first, then the frog on top of it
  drawParts(sceneRenderableParts, sceneModelMatrix, sceneNormalMatrix)
  drawParts(frogRenderableParts, modelMatrix, normalMatrix)

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
