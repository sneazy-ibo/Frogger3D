import { LaneType, LANE_DEPTH } from './scene.js'

// Cars all share one model at a fixed scale, so a single half-length
// constant covers every car instead of tracking real geometry bounds.
// Close enough for gameplay, and cheap: no per-car shape lookup.
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

// True if the frog overlaps any car in its current lane. trafficState
// is index-aligned with scene.roadLanes, so a road lane's own
// roadLaneIndex (set in buildScene) points straight at its cars —
// no search needed.
export function checkCarCollision(playerState, trafficState, scene) {
  const lane = getLaneAt(scene, playerState.z)
  if (lane.type !== LaneType.ROAD) return false

  const { cars } = trafficState[lane.roadLaneIndex]
  return cars.some((car) => Math.abs(car.x - playerState.x) < COLLISION_DISTANCE)
}

// True if the frog is standing on a water lane. There's no floating
// support yet (logs/lily pads), so for now every water lane drowns —
// once floats exist, this becomes "on water AND not on a float".
export function checkWaterHazard(playerState, scene) {
  return getLaneAt(scene, playerState.z).type === LaneType.WATER
}
