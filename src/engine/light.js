export const lightState = {
  position: [5, 8, 5],
  color: [1, 1, 1],
  intensity: 1,
}

export function computeLightColor() {
  return lightState.color.map((channel) => channel * lightState.intensity)
}
