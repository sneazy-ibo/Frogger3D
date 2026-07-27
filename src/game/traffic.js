import { createRandom } from '../engine/random.js'

// One car model, many positioned instances per road lane. Direction and
// speed are fixed per lane so all cars in a lane move together, the way
// Frogger traffic reads.

// Spacing is center-to-center; actual gap = spacing minus car length
const CAR_SPACING_MIN = 6.5
const CAR_SPACING_MAX = 9.5
const BASE_SPEED = 2.5 // world units per second
const SPEED_VARIATION_PER_LANE = 1.5

// How far past the scene edge a car travels before wrapping to the
// opposite edge. Needs to be at least the car's own length so it
// disappears off-screen before popping back into view.
const WRAP_MARGIN = 3

// Builds initial car state for every road lane: a fixed direction/speed
// for the lane, and a row of cars spaced out along it.
export function createTrafficState(roadLanes, bounds, seed = 7) {
  const random = createRandom(seed)
  const halfWidth = bounds.width / 2

  return roadLanes.map((lane, laneIndex) => {
    // Alternate direction lane-by-lane so adjacent lanes read as
    // opposing traffic instead of one big block moving the same way
    const direction = laneIndex % 2 === 0 ? 1 : -1
    const speed = (BASE_SPEED + random() * SPEED_VARIATION_PER_LANE) * direction

    const cars = []
    let x = -halfWidth - WRAP_MARGIN + random() * CAR_SPACING_MAX
    while (x < halfWidth + WRAP_MARGIN) {
      cars.push({ x })
      x += CAR_SPACING_MIN + random() * (CAR_SPACING_MAX - CAR_SPACING_MIN)
    }

    return { centerZ: lane.centerZ, direction, speed, halfWidth, cars }
  })
}

// Advances every car's x position, wrapping it to the opposite edge
// once it's fully off-screen so lanes loop seamlessly.
export function updateTraffic(trafficState, deltaMs) {
  const deltaSeconds = deltaMs / 1000

  for (const lane of trafficState) {
    const wrapSpan = (lane.halfWidth + WRAP_MARGIN) * 2

    for (const car of lane.cars) {
      car.x += lane.speed * deltaSeconds

      if (car.x > lane.halfWidth + WRAP_MARGIN) car.x -= wrapSpan
      if (car.x < -lane.halfWidth - WRAP_MARGIN) car.x += wrapSpan
    }
  }
}
