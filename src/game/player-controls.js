import { Direction, startHop } from './player.js'

const KEY_DIRECTIONS = {
  arrowup: Direction.FORWARD,
  w: Direction.FORWARD,
  arrowdown: Direction.BACKWARD,
  s: Direction.BACKWARD,
  arrowleft: Direction.LEFT,
  a: Direction.LEFT,
  arrowright: Direction.RIGHT,
  d: Direction.RIGHT,
}

export function initPlayerControls(playerState, getTimeMs) {
  window.addEventListener('keydown', (event) => {
    const direction = KEY_DIRECTIONS[event.key.toLocaleLowerCase()]
    if (!direction) return

    startHop(playerState, direction, getTimeMs())
  })
}
