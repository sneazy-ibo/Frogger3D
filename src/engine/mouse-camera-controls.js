import { MIN_PITCH, MAX_PITCH, MIN_DISTANCE, MAX_DISTANCE } from './camera.js'

const ROTATE_SPEED = 0.005
const ZOOM_SPEED = 0.01

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

export function initMouseCameraControls(canvas, cameraState) {
  let isDragging = false
  let lastPointerX = 0
  let lastPointerY = 0

  canvas.addEventListener('pointerdown', (event) => {
    isDragging = true
    lastPointerX = event.clientX
    lastPointerY = event.clientY
  })

  // Listening on window instead of canvas so dragging still works
  // if the pointer moves outside the canvas mid drag
  window.addEventListener('pointerup', () => {
    isDragging = false
  })

  window.addEventListener('pointermove', (event) => {
    if (!isDragging) return

    const deltaX = event.clientX - lastPointerX
    const deltaY = event.clientY - lastPointerY
    lastPointerX = event.clientX
    lastPointerY = event.clientY

    cameraState.yaw -= deltaX * ROTATE_SPEED
    cameraState.pitch = clamp(cameraState.pitch + deltaY * ROTATE_SPEED, MIN_PITCH, MAX_PITCH)
  })

  canvas.addEventListener(
    'wheel',
    (event) => {
      // Prevent the page itself from scrolling while zooming the camera
      event.preventDefault()
      cameraState.distance = clamp(
        cameraState.distance + event.deltaY * ZOOM_SPEED,
        MIN_DISTANCE,
        MAX_DISTANCE
      )
    },
    { passive: false }
  )
}
