import { LANE_DEPTH } from './scene.js'

// A hop always covers exactly one lane, so movement stays on a
// consistent grid no matter what's in the way
const HOP_DISTANCE = LANE_DEPTH
const HOP_DURATION_MS = 200
const HOP_HEIGHT = 0.6

export const Direction = {
  FORWARD: 'forward', // +z, toward the goal
  BACKWARD: 'backward', // -z, back toward the start
  LEFT: 'left', // +x
  RIGHT: 'right', // -x
}

const DIRECTION_OFFSET = {
  [Direction.FORWARD]: [0, 1],
  [Direction.BACKWARD]: [0, -1],
  [Direction.LEFT]: [1, 0],
  [Direction.RIGHT]: [-1, 0],
}

// Which way the frog should face after hopping in that direction
const DIRECTION_FACING = {
  [Direction.FORWARD]: 0,
  [Direction.BACKWARD]: Math.PI,
  [Direction.LEFT]: Math.PI / 2,
  [Direction.RIGHT]: -Math.PI / 2,
}

export function createPlayerState(startPosition, bounds) {
  return {
    x: startPosition.x,
    z: startPosition.z,
    bounds,
    facing: 0,
    hopHeight: 0,
    hop: null, // { from, to, startTimeMs } while mid-air, else null
    queuedDirection: null, // a key press that arrived mid-hop, fired on landing
  }
}

// Queues a hop one lane in `direction`. If the frog is already mid-air,
// the direction is remembered and fired the instant it lands instead of
// being dropped, otherwise spamming the movement keys mid animation
// would eat inputs
export function startHop(playerState, direction, timeMs) {
  if (playerState.hop) {
    playerState.queuedDirection = direction
    return
  }

  beginHop(playerState, direction, timeMs)
}

function beginHop(playerState, direction, timeMs) {
  const [dx, dz] = DIRECTION_OFFSET[direction]
  const { bounds } = playerState
  const to = {
    x: playerState.x + dx * HOP_DISTANCE,
    z: playerState.z + dz * HOP_DISTANCE,
  }

  if (to.x < -bounds.width / 2 || to.x > bounds.width / 2) return
  if (to.z < bounds.startZ || to.z > bounds.endZ) return

  playerState.facing = DIRECTION_FACING[direction]
  playerState.hop = { from: { x: playerState.x, z: playerState.z }, to, startTimeMs: timeMs }
}

function easeInOutQuad(t) {
  return t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2
}

function lerp(a, b, t) {
  return a + (b - a) * t
}

// Advances an in progress hop; a does nothing once the frog is back on the ground
export function updatePlayer(playerState, timeMs) {
  if (!playerState.hop) return

  const t = Math.min((timeMs - playerState.hop.startTimeMs) / HOP_DURATION_MS, 1)
  const eased = easeInOutQuad(t)

  playerState.x = lerp(playerState.hop.from.x, playerState.hop.to.x, eased)
  playerState.z = lerp(playerState.hop.from.z, playerState.hop.to.z, eased)
  // Parabolic arc: 0 at takeoff/landing, HOP_HEIGHT at the midpoint
  playerState.hopHeight = Math.sin(t * Math.PI) * HOP_HEIGHT

  if (t >= 1) {
    playerState.hop = null
    playerState.hopHeight = 0

    if (playerState.queuedDirection) {
      const direction = playerState.queuedDirection
      playerState.queuedDirection = null
      beginHop(playerState, direction, timeMs)
    }
  }
}
