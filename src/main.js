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
  resetCameraToPreset,
  computeViewMatrix,
  computeCameraPosition,
} from './engine/camera.js'
import { initMouseCameraControls } from './engine/mouse-camera-controls.js'
import { lightState, computeLightColor } from './engine/light.js'
import { initLightControls } from './engine/light-controls.js'
import { buildScene } from './game/scene.js'
import {
  createPlayerState,
  updatePlayer,
  resetPlayer,
  fireQueuedHop,
  startDeath,
  isDeathFinished,
  getDeathTransform,
  DeathType,
} from './game/player.js'
import { initPlayerControls } from './game/player-controls.js'
import { createTrafficState, updateTraffic } from './game/traffic.js'
import {
  createFloatState,
  updateFloats,
  buildFloatGeometry,
  getFloatSurfaceY,
} from './game/floats.js'
import { checkCarCollision, checkWaterHazard, getFloatUnderPlayer } from './game/collision.js'

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

const model = await loadModel('./models/frog.glb', { materialGamma: 1.6, targetSize: 1.3 })

const carModel = await loadModel('./models/car.glb', {
  materialGamma: 1.6,
  targetSize: 2.4,
  fallbackColor: [0.75, 0.15, 0.12],
})

// Static level geometry (lanes, props, markings)
const scene = buildScene()

// One fixed direction/speed per road lane, plus a row of cars in each
const trafficState = createTrafficState(scene.roadLanes, scene.bounds)

// Same idea for water lanes, but with logs/lily pads instead of cars
const floatState = createFloatState(scene.waterLanes, scene.bounds)
const floatGeometryByType = buildFloatGeometry()

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
const sceneRenderableParts = createRenderableParts(gl, scene.parts, attribLocations)
const carRenderableParts = createRenderableParts(gl, carModel.parts, attribLocations)

// One renderable per float type (log, lily pad); each water lane picks
// the right one by its `type` when drawing
const floatRenderablePartsByType = Object.fromEntries(
  Object.entries(floatGeometryByType).map(([type, parts]) => [
    type,
    createRenderableParts(gl, parts, attribLocations),
  ])
)

gl.clearColor(0.1, 0.1, 0.1, 1.0)

// Without depth testing, triangles draw in submission order instead of
// nearest-to-camera order, so back faces would bleed through front faces
gl.enable(gl.DEPTH_TEST)

// Recomputed every frame to track player movement
const modelMatrix = mat4.create()
const normalMatrix = mat3.create()

// The scene is static and already baked into world space, so it's
// always drawn with these identities
const sceneModelMatrix = mat4.create()
const sceneNormalMatrix = mat3.create()

// Current camera mode, switchable with the "C" key
let currentCameraMode = CameraMode.THIRD_PERSON

let isPaused = false
let animationTimeMs = 0
let lastFrameTimeMs = null

// Height of whatever the frog is currently standing on, relative to ground level
let currentFloatSurfaceY = 0

const playerState = createPlayerState(scene.playerStart, scene.bounds)
const fieldOfViewDegrees = 60

initMouseCameraControls(canvas, cameraState)
initLightControls(lightState)
initPlayerControls(playerState, () => animationTimeMs)

window.addEventListener('keydown', (event) => {
  const key = event.key.toLocaleLowerCase()

  switch (key) {
    case 'c':
      currentCameraMode =
        currentCameraMode === CameraMode.THIRD_PERSON
          ? CameraMode.TOP_DOWN
          : CameraMode.THIRD_PERSON

      resetCameraToPreset(currentCameraMode)
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

// Reused every frame instead of allocated per-car
const carModelMatrix = mat4.create()
const carNormalMatrix = mat3.create()

// Cars are the one car model, translated along their lane's z and along
// x by however far updateTraffic has moved them, then rotated to face
// the lane's direction of travel
function drawTraffic(trafficState) {
  for (const lane of trafficState) {
    // Assumes the car model's default forward is +Z
    const rotationY = lane.direction > 0 ? -Math.PI / 2 : Math.PI / 2

    for (const car of lane.cars) {
      mat4.identity(carModelMatrix)
      mat4.translate(carModelMatrix, carModelMatrix, [car.x, 0, lane.centerZ])
      mat4.rotateY(carModelMatrix, carModelMatrix, rotationY)
      mat4.scale(carModelMatrix, carModelMatrix, [carModel.scale, carModel.scale, carModel.scale])

      mat3.normalFromMat4(carNormalMatrix, carModelMatrix)

      drawParts(carRenderableParts, carModelMatrix, carNormalMatrix)
    }
  }
}

// Reused every frame instead of allocated per-float
const floatModelMatrix = mat4.create()
const floatNormalMatrix = mat3.create()

// Floats reuse one geometry per type (baked at the water's surface
// height already), translated along their lane's z and along x by
// however far updateFloats has moved them
function drawFloats(floatState) {
  for (const lane of floatState) {
    const parts = floatRenderablePartsByType[lane.type]

    for (const float of lane.floats) {
      mat4.identity(floatModelMatrix)
      mat4.translate(floatModelMatrix, floatModelMatrix, [float.x, 0, lane.centerZ])
      mat4.scale(floatModelMatrix, floatModelMatrix, [float.scaleX, 1, float.scaleZ])

      mat3.normalFromMat4(floatNormalMatrix, floatModelMatrix)

      drawParts(parts, floatModelMatrix, floatNormalMatrix)
    }
  }
}

function render(timeMs) {
  // First frame has no previous timestamp to diff against
  const deltaMs = lastFrameTimeMs === null ? 0 : timeMs - lastFrameTimeMs
  lastFrameTimeMs = timeMs

  if (!isPaused) {
    animationTimeMs += deltaMs
    updatePlayer(playerState, animationTimeMs)
    updateTraffic(trafficState, deltaMs)
    updateFloats(floatState, deltaMs)

    currentFloatSurfaceY = 0

    if (!playerState.death) {
      if (checkCarCollision(playerState, trafficState, scene)) {
        const type = playerState.hop ? DeathType.SQUASHED_AIR : DeathType.SQUASHED_GROUND
        startDeath(playerState, type, animationTimeMs)
      } else if (!playerState.hop) {
        const ride = getFloatUnderPlayer(playerState, floatState, scene)

        if (ride) {
          playerState.x += ride.speed * (deltaMs / 1000)
          currentFloatSurfaceY = getFloatSurfaceY(ride.type)

          const halfWidth = scene.bounds.width / 2
          if (playerState.x < -halfWidth || playerState.x > halfWidth) {
            startDeath(playerState, DeathType.DROWNED, animationTimeMs)
          }
        } else if (checkWaterHazard(playerState, floatState, scene)) {
          startDeath(playerState, DeathType.DROWNED, animationTimeMs)
        }
      }
    }

    if (isDeathFinished(playerState, animationTimeMs)) {
      resetPlayer(playerState, scene.playerStart)
    }

    if (!playerState.death) {
      fireQueuedHop(playerState, animationTimeMs)
    }
  }

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

  const deathTransform = getDeathTransform(playerState, animationTimeMs)

  mat4.identity(modelMatrix)
  mat4.translate(modelMatrix, modelMatrix, [
    playerState.x,
    playerState.hopHeight + currentFloatSurfaceY + (deathTransform ? deathTransform.offsetY : 0),
    playerState.z,
  ])
  mat4.rotateY(modelMatrix, modelMatrix, playerState.facing)
  if (deathTransform && deathTransform.rotationX) {
    mat4.rotateX(modelMatrix, modelMatrix, deathTransform.rotationX)
  }
  if (deathTransform && deathTransform.rotationZ) {
    mat4.rotateZ(modelMatrix, modelMatrix, deathTransform.rotationZ)
  }
  mat4.scale(modelMatrix, modelMatrix, [
    model.scale * (deathTransform ? deathTransform.scaleX : 1),
    model.scale * (deathTransform ? deathTransform.scaleY : 1),
    model.scale * (deathTransform ? deathTransform.scaleZ : 1),
  ])

  // Follows the player, so it's recomputed every frame
  const cameraTarget = [playerState.x, 0, playerState.z]
  const viewMatrix = computeViewMatrix(currentCameraMode, cameraTarget)

  mat3.normalFromMat4(normalMatrix, modelMatrix)

  const cameraPosition = computeCameraPosition(cameraTarget)

  gl.useProgram(modelShaderProgram)
  gl.uniformMatrix4fv(uViewLocation, false, viewMatrix)
  gl.uniformMatrix4fv(uProjectionLocation, false, projectionMatrix)
  gl.uniform3fv(uLightPositionLocation, lightState.position)
  gl.uniform3fv(uLightColorLocation, computeLightColor())
  gl.uniform3fv(uViewPositionLocation, cameraPosition)

  drawParts(sceneRenderableParts, sceneModelMatrix, sceneNormalMatrix)
  drawFloats(floatState)
  drawTraffic(trafficState)
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
