import { mat4, vec3 } from 'gl-matrix'

export const CameraMode = {
  THIRD_PERSON: 'third-person',
  TOP_DOWN: 'top-down',
}

function degreesToRadians(degrees) {
  return (degrees * Math.PI) / 180
}

const BASE_PRESETS = {
  [CameraMode.THIRD_PERSON]: {
    yaw: Math.PI,
    pitch: degreesToRadians(30),
    distance: 8,
    up: [0, 1, 0],
  },
  [CameraMode.TOP_DOWN]: {
    yaw: Math.PI,
    pitch: degreesToRadians(89),
    distance: 12,
    up: [0, 1, 0],
  },
}

export const MIN_PITCH = degreesToRadians(5)
export const MAX_PITCH = degreesToRadians(89)
export const MIN_DISTANCE = 2
export const MAX_DISTANCE = 20

export const cameraState = {
  yaw: BASE_PRESETS[CameraMode.THIRD_PERSON].yaw,
  pitch: BASE_PRESETS[CameraMode.THIRD_PERSON].pitch,
  distance: BASE_PRESETS[CameraMode.THIRD_PERSON].distance,
}

// Restores yaw/pitch/distance to the mode's preset
export function resetCameraToPreset(mode) {
  cameraState.yaw = BASE_PRESETS[mode].yaw
  cameraState.pitch = BASE_PRESETS[mode].pitch
  cameraState.distance = BASE_PRESETS[mode].distance
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
