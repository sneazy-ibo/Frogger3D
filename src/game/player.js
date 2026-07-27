import { LANE_DEPTH } from './scene.js'

// A hop always covers exactly one lane, so movement stays on a
// consistent grid no matter what's in the way
const HOP_DISTANCE = LANE_DEPTH
const HOP_DURATION_MS = 200
const HOP_HEIGHT = 0.6

export const DeathType = {
  SQUASHED_GROUND: 'squashed-ground', // hit by a car while standing in the lane
  SQUASHED_AIR: 'squashed-air', // hit by a car mid-hop, so it falls first
  DROWNED: 'drowned', // sank in water
}

const DEATH_DURATION_MS = 900

// Air-squash knockback: launches upward like a projectile, gravity
// carries it back down through the impact height to the ground, with
// a forward somersault (rotation on X) timed to finish right as it lands.
const AIR_DEATH_LAUNCH_VELOCITY = 1.5
const AIR_DEATH_AIRBORNE_FRACTION = 0.55 // portion of the animation spent airborne

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
    death: null, // { type, startTimeMs } while the death animation plays, else null
  }
}

// Queues a hop one lane in `direction`. If the frog is already mid-air,
// the direction is remembered and fired the instant it lands instead of
// being dropped, otherwise spamming the movement keys mid animation
// would eat inputs
export function startHop(playerState, direction, timeMs) {
  if (playerState.death) return

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

export function resetPlayer(playerState, startPosition) {
  playerState.x = startPosition.x
  playerState.z = startPosition.z
  playerState.facing = 0
  playerState.hopHeight = 0
  playerState.hop = null
  playerState.queuedDirection = null
  playerState.death = null
}

// Starts the death animation in place (current x/z)
export function startDeath(playerState, type, timeMs) {
  if (playerState.death) return

  playerState.hop = null
  playerState.queuedDirection = null

  // Ground and water deaths happen right at ground level. An air squash
  // is the exception: it keeps whatever height the frog was at on
  // impact, since the animation needs to fall from there.
  if (type !== DeathType.SQUASHED_AIR) {
    playerState.hopHeight = 0
  }

  playerState.death = { type, startTimeMs: timeMs }
}

export function isDeathFinished(playerState, timeMs) {
  return playerState.death !== null && timeMs - playerState.death.startTimeMs >= DEATH_DURATION_MS
}

export function getDeathTransform(playerState, timeMs) {
  if (!playerState.death) return null

  const t = Math.min((timeMs - playerState.death.startTimeMs) / DEATH_DURATION_MS, 1)

  if (playerState.death.type === DeathType.SQUASHED_GROUND) {
    // Most of the squash happens fast, then holds flat for the rest
    const squashT = Math.min(t / 0.35, 1)
    const eased = 1 - (1 - squashT) ** 3
    return {
      scaleX: lerp(1, 2, eased),
      scaleY: lerp(1, 0.05, eased),
      scaleZ: lerp(1, 2, eased),
      rotationZ: 0,
      offsetY: 0,
    }
  }

  if (playerState.death.type === DeathType.SQUASHED_AIR) {
    // playerState.hopHeight is frozen at whatever height the frog was
    // hit at, since startDeath left it alone and updatePlayer no
    // longer touches it once death is set.
    const impactHeight = playerState.hopHeight

    if (t < AIR_DEATH_AIRBORNE_FRACTION) {
      const airT = t / AIR_DEATH_AIRBORNE_FRACTION

      // Projectile arc: launched at AIR_DEATH_LAUNCH_VELOCITY, with
      // gravity picked so it lands exactly at -impactHeight (the
      // ground, relative to the frozen hop height) when airT reaches 1.
      const gravity = 2 * (AIR_DEATH_LAUNCH_VELOCITY + impactHeight)
      const heightOffset = AIR_DEATH_LAUNCH_VELOCITY * airT - 0.5 * gravity * airT * airT

      return {
        scaleX: 1,
        scaleY: 1,
        scaleZ: 1,
        rotationX: airT * Math.PI * 2, // one head-over-heels flip, forward
        offsetY: heightOffset,
      }
    }

    const squashT = (t - AIR_DEATH_AIRBORNE_FRACTION) / (1 - AIR_DEATH_AIRBORNE_FRACTION)
    const eased = 1 - (1 - squashT) ** 3
    return {
      scaleX: lerp(1, 2, eased),
      scaleY: lerp(1, 0.05, eased),
      scaleZ: lerp(1, 2, eased),
      rotationX: Math.PI * 2, // flip already finished, holds steady
      offsetY: -impactHeight, // landed, flattens right at ground level
    }
  }

  // Drowned
  return {
    scaleX: 1,
    scaleY: 1,
    scaleZ: 1,
    rotationZ: t * Math.PI * 3, // barrel-rolls as it goes under
    offsetY: -t * 1.4, // sinks below the water surface
  }
}

function easeInOutQuad(t) {
  return t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2
}

function lerp(a, b, t) {
  return a + (b - a) * t
}

// Advances an in progress hop; a does nothing once the frog is back on the ground
export function updatePlayer(playerState, timeMs) {
  if (playerState.death) return
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
  }
}

export function fireQueuedHop(playerState, timeMs) {
  if (playerState.hop || !playerState.queuedDirection) return

  const direction = playerState.queuedDirection
  playerState.queuedDirection = null
  beginHop(playerState, direction, timeMs)
}
