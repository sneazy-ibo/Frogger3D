import { createBoxGeometry, transformGeometry, mergeGeometries } from '../engine/geometry.js'
import { createRandom } from '../engine/random.js'

export const LaneType = {
  GRASS: 'grass',
  ROAD: 'road',
  MEDIAN: 'median',
  WATER: 'water',
}

// Scene spans this far on both sides of x = 0
const SCENE_WIDTH = 28

// Every lane is exactly this deep, regardless of type, so a single hop
// reliably lands in the next lane no matter what type it is
export const LANE_DEPTH = 3.6

// Lane order from the player's start (near z) to the goal (far z)
const LANE_LAYOUT = [
  { type: LaneType.GRASS, depth: LANE_DEPTH },
  { type: LaneType.ROAD, depth: LANE_DEPTH },
  { type: LaneType.ROAD, depth: LANE_DEPTH },
  { type: LaneType.ROAD, depth: LANE_DEPTH },
  { type: LaneType.MEDIAN, depth: LANE_DEPTH },
  { type: LaneType.ROAD, depth: LANE_DEPTH },
  { type: LaneType.ROAD, depth: LANE_DEPTH },
  { type: LaneType.WATER, depth: LANE_DEPTH },
  { type: LaneType.WATER, depth: LANE_DEPTH },
  { type: LaneType.WATER, depth: LANE_DEPTH },
  { type: LaneType.MEDIAN, depth: LANE_DEPTH },
  { type: LaneType.WATER, depth: LANE_DEPTH },
  { type: LaneType.WATER, depth: LANE_DEPTH },
  { type: LaneType.GRASS, depth: LANE_DEPTH },
]

// Height of each lane's top surface: medians raised like a curb, water
// recessed like a riverbed, so flat lanes still read as distinct materials
const SURFACE_HEIGHT = {
  [LaneType.GRASS]: 0,
  [LaneType.ROAD]: 0,
  [LaneType.MEDIAN]: 0.08,
  [LaneType.WATER]: -0.08,
}

const SLAB_THICKNESS = 0.2

const COLORS = {
  grassA: [0.24, 0.5, 0.2],
  grassB: [0.21, 0.46, 0.18],
  road: [0.13, 0.13, 0.15],
  laneMarking: [0.85, 0.8, 0.6],
  median: [0.5, 0.46, 0.15],
  medianStripe: [0.9, 0.85, 0.2],
  waterA: [0.1, 0.35, 0.55],
  waterB: [0.13, 0.4, 0.6],
  trunk: [0.35, 0.22, 0.12],
  crown: [0.18, 0.42, 0.16],
  bush: [0.22, 0.48, 0.2],
  rock: [0.45, 0.45, 0.47],
}

// Builds the whole static level ground: lanes, lane markings, median
// stripes, and scattered decoration on the grass lanes. Everything is
// merged by color into a handful of draw calls, in the same
// {positions, normals, indices, color} shape the model loader uses.
export function buildScene(seed = 1) {
  const random = createRandom(seed)

  const geometriesByColor = new Map()
  function addGeometry(geometry, color) {
    const key = color.join(',')
    if (!geometriesByColor.has(key)) {
      geometriesByColor.set(key, { color, geometries: [] })
    }
    geometriesByColor.get(key).geometries.push(geometry)
  }

  // Reused base slab, stretched per-lane via scale on Z
  const laneSlab = createBoxGeometry(SCENE_WIDTH, SLAB_THICKNESS, 1)

  const totalDepth = LANE_LAYOUT.reduce((sum, lane) => sum + lane.depth, 0)
  const startZ = -totalDepth / 2 // center the whole level around z = 0

  // Frog should start in the middle of the first lane, not at the origin
  const playerStart = { x: 0, z: startZ + LANE_LAYOUT[0].depth / 2 }

  let cursorZ = startZ
  let grassLaneIndex = 0
  let waterLaneIndex = 0

  let previousLaneType = null

  const roadLanes = []

  // Every lane in play order, each carrying its own z-range
  const lanes = []

  for (const lane of LANE_LAYOUT) {
    const centerZ = cursorZ + lane.depth / 2
    const surfaceY = SURFACE_HEIGHT[lane.type]

    const slabColor =
      lane.type === LaneType.GRASS
        ? grassLaneIndex++ % 2 === 0
          ? COLORS.grassA
          : COLORS.grassB
        : lane.type === LaneType.WATER
          ? waterLaneIndex++ % 2 === 0
            ? COLORS.waterA
            : COLORS.waterB
          : lane.type === LaneType.MEDIAN
            ? COLORS.median
            : COLORS.road

    addGeometry(
      transformGeometry(laneSlab, {
        position: [0, surfaceY - SLAB_THICKNESS / 2, centerZ],
        scale: [1, 1, lane.depth],
      }),
      slabColor
    )

    if (lane.type === LaneType.GRASS) {
      scatterGrassProps(addGeometry, random, centerZ, lane.depth, surfaceY)
    } else if (lane.type === LaneType.MEDIAN) {
      addHazardStripes(addGeometry, centerZ, lane.depth, surfaceY)
    }

    const roadLaneIndex = lane.type === LaneType.ROAD ? roadLanes.length : null
    if (lane.type === LaneType.ROAD) {
      roadLanes.push({ centerZ, depth: lane.depth })
    }

    lanes.push({
      type: lane.type,
      startZ: cursorZ,
      endZ: cursorZ + lane.depth,
      roadLaneIndex,
    })

    // Dividers belong at boundaries between road lanes, not lane centers
    if (previousLaneType === LaneType.ROAD && lane.type === LaneType.ROAD) {
      addLaneMarkings(addGeometry, cursorZ, surfaceY)
    }

    previousLaneType = lane.type
    cursorZ += lane.depth
  }

  const parts = Array.from(geometriesByColor.values()).map(({ color, geometries }) =>
    mergeGeometries(geometries, color)
  )

  return {
    parts,
    playerStart,
    roadLanes,
    lanes,
    bounds: { width: SCENE_WIDTH, startZ, endZ: startZ + totalDepth },
  }
}

// Low-poly tree: a trunk box topped by a wider crown box
function addTree(addGeometry, random, x, z, surfaceY) {
  const trunkHeight = 0.8 + random() * 0.3
  const trunk = createBoxGeometry(0.25, trunkHeight, 0.25)
  addGeometry(
    transformGeometry(trunk, {
      position: [x, surfaceY + trunkHeight / 2, z],
      rotationY: random() * Math.PI,
    }),
    COLORS.trunk
  )

  const crownSize = 0.9 + random() * 0.4
  const crown = createBoxGeometry(crownSize, crownSize, crownSize)
  addGeometry(
    transformGeometry(crown, {
      position: [x, surfaceY + trunkHeight + crownSize / 2 - 0.1, z],
      rotationY: random() * Math.PI,
    }),
    COLORS.crown
  )
}

function addBush(addGeometry, random, x, z, surfaceY) {
  const size = 0.35 + random() * 0.25
  const height = size * 0.8
  const bush = createBoxGeometry(size, height, size)
  addGeometry(
    transformGeometry(bush, {
      position: [x, surfaceY + height / 2, z],
      rotationY: random() * Math.PI,
    }),
    COLORS.bush
  )
}

function addRock(addGeometry, random, x, z, surfaceY) {
  const size = 0.2 + random() * 0.2
  const height = size * 0.7
  const rock = createBoxGeometry(size, height, size * 0.8)
  addGeometry(
    transformGeometry(rock, {
      position: [x, surfaceY + height / 2, z],
      rotationY: random() * Math.PI,
    }),
    COLORS.rock
  )
}

// Scatters trees/bushes/rocks across a grass lane
function scatterGrassProps(addGeometry, random, centerZ, depth, surfaceY) {
  const propCount = 22
  for (let i = 0; i < propCount; i++) {
    const x = (random() - 0.5) * (SCENE_WIDTH - 1.5)
    const z = centerZ + (random() - 0.5) * (depth - 0.4)

    const roll = random()
    if (roll < 0.35) {
      addTree(addGeometry, random, x, z, surfaceY)
    } else if (roll < 0.7) {
      addBush(addGeometry, random, x, z, surfaceY)
    } else {
      addRock(addGeometry, random, x, z, surfaceY)
    }
  }
}

// Dashed divider line along a boundary between two road lanes
function addLaneMarkings(addGeometry, boundaryZ, surfaceY) {
  const dashWidth = 0.6
  const gap = 0.4
  const dashDepth = 0.12
  const dashHeight = 0.02
  const step = dashWidth + gap

  for (let x = -SCENE_WIDTH / 2 + dashWidth; x < SCENE_WIDTH / 2; x += step) {
    const dash = createBoxGeometry(dashWidth, dashHeight, dashDepth)
    addGeometry(
      transformGeometry(dash, { position: [x, surfaceY + dashHeight / 2, boundaryZ] }),
      COLORS.laneMarking
    )
  }
}

// Alternating yellow/black hazard stripes on median strips
function addHazardStripes(addGeometry, centerZ, depth, surfaceY) {
  const stripeWidth = 0.6
  const stripeHeight = 0.02

  for (
    let x = -SCENE_WIDTH / 2 + stripeWidth / 2, i = 0;
    x < SCENE_WIDTH / 2;
    x += stripeWidth, i++
  ) {
    if (i % 2 !== 0) continue
    const stripe = createBoxGeometry(stripeWidth, stripeHeight, depth * 0.8)
    addGeometry(
      transformGeometry(stripe, { position: [x, surfaceY + stripeHeight / 2, centerZ] }),
      COLORS.medianStripe
    )
  }
}
