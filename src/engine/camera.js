import { mat4, vec3 } from 'gl-matrix'

export const CameraMode = {
  ANGLED_TOP_DOWN: 'angled-top-down',
  CHASE: 'chase',
}

function degreesToRadians(degrees) {
  return (degrees * Math.PI) / 180
}

const BASE_PRESETS = {
  [CameraMode.ANGLED_TOP_DOWN]: {
    pitch: degreesToRadians(60),
    distance: 9,
    up: [0, 1, 0],
  },
  [CameraMode.CHASE]: {
    pitch: degreesToRadians(20),
    distance: 5,
    up: [0, 1, 0],
  },
}

export const MIN_PITCH = degreesToRadians(5)
export const MAX_PITCH = degreesToRadians(85)
export const MIN_DISTANCE = 2
export const MAX_DISTANCE = 20

export const cameraState = {
  yaw: 0,
  pitch: BASE_PRESETS[CameraMode.ANGLED_TOP_DOWN].pitch,
  distance: BASE_PRESETS[CameraMode.ANGLED_TOP_DOWN].distance,
}

export function resetCameraTilt(mode) {
  cameraState.pitch = BASE_PRESETS[mode].pitch
}

// Converts yaw/pitch/distance into an xyz offset from the target
function sphericalToOffset(yaw, pitch, distance) {
  const x = distance * Math.cos(pitch) * Math.sin(yaw)
  const y = distance * Math.sin(pitch)
  const z = distance * Math.cos(pitch) * Math.cos(yaw)
  return [x, y, z]
}

export function computeCameraPosition(targetPosition) {
  const eyeOffset = sphericalToOffset(cameraState.yaw, cameraState.pitch, cameraState.distance)

  const eyePosition = vec3.create()
  vec3.add(eyePosition, targetPosition, eyeOffset)

  return eyePosition
}

export function computeViewMatrix(mode, targetPosition) {
  const base = BASE_PRESETS[mode]
  const eyePosition = computeCameraPosition(targetPosition)

  const viewMatrix = mat4.create()
  mat4.lookAt(viewMatrix, eyePosition, targetPosition, base.up)

  return viewMatrix
}
