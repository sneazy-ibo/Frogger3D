import { createRandom } from '../engine/random.js'
import { createBoxGeometry, transformGeometry, mergeGeometries } from '../engine/geometry.js'

export const FloatType = {
  LOG: 'log',
  LILY: 'lily',
}

const LOG_GAP_MIN = 1.2
const LOG_GAP_MAX = 3.2

const LILY_GAP_MIN = 4
const LILY_GAP_MAX = 7

const BASE_SPEED = 1.4
const SPEED_VARIATION_PER_LANE = 1.0

const WRAP_MARGIN = 3

// Unit geometry size; instances are scaled independently
const LOG_UNIT_HALF_WIDTH = 1
const LILY_UNIT_HALF_WIDTH = 1

const LOG_SCALE_MIN = 0.8
const LOG_SCALE_MAX = 2.0

const LILY_SCALE_MIN = 0.45
const LILY_SCALE_MAX = 0.85

const LOG_HEIGHT = 0.35
const LILY_HEIGHT = 0.08
const LOG_RING_HALF_THICKNESS = 0.12

// Matches the recessed water surface height
const WATER_SURFACE_Y = -0.08

const LOG_COLOR = [0.38, 0.24, 0.13]
const LOG_RING_COLOR = [0.46, 0.3, 0.17]
const LILY_COLOR = [0.2, 0.5, 0.22]
const LILY_CENTER_COLOR = [0.15, 0.4, 0.19]

export function createFloatState(waterLanes, bounds, seed = 11) {
  const random = createRandom(seed)
  const halfWidth = bounds.width / 2

  return waterLanes.map((lane, laneIndex) => {
    // Alternate lane directions like traffic.
    const direction = laneIndex % 2 === 0 ? -1 : 1
    const speed = (BASE_SPEED + random() * SPEED_VARIATION_PER_LANE) * direction

    const type = laneIndex % 2 === 0 ? FloatType.LOG : FloatType.LILY

    const floats = []
    let edge = -halfWidth - WRAP_MARGIN - random() * 8

    while (edge < halfWidth + WRAP_MARGIN) {
      const scale =
        type === FloatType.LOG
          ? LOG_SCALE_MIN + random() * (LOG_SCALE_MAX - LOG_SCALE_MIN)
          : LILY_SCALE_MIN + random() * (LILY_SCALE_MAX - LILY_SCALE_MIN)

      const floatHalfWidth =
        (type === FloatType.LOG ? LOG_UNIT_HALF_WIDTH : LILY_UNIT_HALF_WIDTH) * scale

      const x = edge + floatHalfWidth

      floats.push({
        x,
        halfWidth: floatHalfWidth,
        scaleX: scale,
        scaleZ: type === FloatType.LOG ? 1 : scale,
      })

      const gapMin = type === FloatType.LILY ? LILY_GAP_MIN : LOG_GAP_MIN
      const gapMax = type === FloatType.LILY ? LILY_GAP_MAX : LOG_GAP_MAX
      const extraGap = random() < 0.25 ? random() * 5 : 0

      edge = x + floatHalfWidth + gapMin + random() * (gapMax - gapMin) + extraGap
    }

    return {
      centerZ: lane.centerZ,
      direction,
      speed,
      halfWidth,
      type,
      floats,
    }
  })
}

export function updateFloats(floatState, deltaMs) {
  const deltaSeconds = deltaMs / 1000

  for (const lane of floatState) {
    const wrapSpan = (lane.halfWidth + WRAP_MARGIN) * 2

    for (const float of lane.floats) {
      float.x += lane.speed * deltaSeconds

      if (float.x > lane.halfWidth + WRAP_MARGIN) float.x -= wrapSpan
      if (float.x < -lane.halfWidth - WRAP_MARGIN) float.x += wrapSpan
    }
  }
}

export function getFloatSurfaceY(type) {
  return type === FloatType.LOG ? WATER_SURFACE_Y + LOG_HEIGHT : WATER_SURFACE_Y + LILY_HEIGHT
}

export function buildFloatGeometry() {
  const logBody = transformGeometry(createBoxGeometry(LOG_UNIT_HALF_WIDTH * 2, LOG_HEIGHT, 1.0), {
    position: [0, WATER_SURFACE_Y + LOG_HEIGHT / 2, 0],
  })

  const ringGeometry = createBoxGeometry(LOG_RING_HALF_THICKNESS * 2, LOG_HEIGHT + 0.02, 1.02)

  const logRingLeft = transformGeometry(ringGeometry, {
    position: [-LOG_UNIT_HALF_WIDTH + LOG_RING_HALF_THICKNESS, WATER_SURFACE_Y + LOG_HEIGHT / 2, 0],
  })

  const logRingRight = transformGeometry(ringGeometry, {
    position: [LOG_UNIT_HALF_WIDTH - LOG_RING_HALF_THICKNESS, WATER_SURFACE_Y + LOG_HEIGHT / 2, 0],
  })

  // Layered boxes approximate a round lily pad.
  const lilyPadA = transformGeometry(
    createBoxGeometry(LILY_UNIT_HALF_WIDTH * 2, LILY_HEIGHT, LILY_UNIT_HALF_WIDTH * 1.7),
    { position: [0, WATER_SURFACE_Y + LILY_HEIGHT / 2, 0] }
  )

  const lilyPadB = transformGeometry(
    createBoxGeometry(LILY_UNIT_HALF_WIDTH * 1.7, LILY_HEIGHT, LILY_UNIT_HALF_WIDTH * 2),
    {
      position: [0, WATER_SURFACE_Y + LILY_HEIGHT / 2, 0],
      rotationY: Math.PI / 4,
    }
  )

  const lilyCenter = transformGeometry(createBoxGeometry(0.22, LILY_HEIGHT + 0.03, 0.22), {
    position: [0, WATER_SURFACE_Y + LILY_HEIGHT + 0.005, 0],
    rotationY: Math.PI / 4,
  })

  return {
    [FloatType.LOG]: [
      mergeGeometries([logBody], LOG_COLOR),
      mergeGeometries([logRingLeft, logRingRight], LOG_RING_COLOR),
    ],
    [FloatType.LILY]: [
      mergeGeometries([lilyPadA, lilyPadB], LILY_COLOR),
      mergeGeometries([lilyCenter], LILY_CENTER_COLOR),
    ],
  }
}
