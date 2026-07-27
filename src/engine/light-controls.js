export function initLightControls(lightState) {
  ;['x', 'y', 'z'].forEach((axis, index) => {
    bindSlider(axis, (value) => {
      lightState.position[index] = value
    })
  })

  bindSlider('intensity', (value) => {
    lightState.intensity = value
  })

  // <input type="color"> gives us "#rrggbb", WebGL wants floats in [0, 1]
  document.getElementById('light-color').addEventListener('input', (event) => {
    lightState.color = hexToRgb(event.target.value)
  })
}

function bindSlider(id, onChange) {
  const input = document.getElementById(`light-${id}`)
  const output = document.getElementById(`light-${id}-value`)

  input.addEventListener('input', () => {
    output.textContent = input.value
    onChange(Number(input.value))
  })
}

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255
  return [r, g, b]
}
