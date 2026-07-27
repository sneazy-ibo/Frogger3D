import { LaneType, LANE_DEPTH } from './scene.js'

const CAR_COLLISION_HALF_LENGTH = 1.1
const FROG_COLLISION_RADIUS = 0.35
const COLLISION_DISTANCE = CAR_COLLISION_HALF_LENGTH + FROG_COLLISION_RADIUS

// Every lane has the same depth, so which lane a z falls into is a
// straight division, not a scan over scene.lanes. Clamped since a hop
// can briefly land exactly on bounds.endZ.
export function getLaneAt(scene, z) {
  const index = Math.floor((z - scene.bounds.startZ) / LANE_DEPTH)
  const clampedIndex = Math.max(0, Math.min(scene.lanes.length - 1, index))
  return scene.lanes[clampedIndex]
}

export function checkCarCollision(playerState, trafficState, scene) {
  const lane = getLaneAt(scene, playerState.z)
  if (lane.type !== LaneType.ROAD) return false

  const { cars } = trafficState[lane.roadLaneIndex]
  return cars.some((car) => Math.abs(car.x - playerState.x) < COLLISION_DISTANCE)
}

export function getFloatUnderPlayer(playerState, floatState, scene) {
  const lane = getLaneAt(scene, playerState.z)
  if (lane.type !== LaneType.WATER) return null

  const laneFloats = floatState[lane.waterLaneIndex]
  const isOnAFloat = laneFloats.floats.some(
    (float) => Math.abs(float.x - playerState.x) < float.halfWidth + FROG_COLLISION_RADIUS
  )

  return isOnAFloat ? laneFloats : null
}

// True if the frog is standing on a water lane with nothing to ride
export function checkWaterHazard(playerState, floatState, scene) {
  const lane = getLaneAt(scene, playerState.z)
  if (lane.type !== LaneType.WATER) return false

  return getFloatUnderPlayer(playerState, floatState, scene) === null
}
