import './style.css'

const canvas = document.getElementById('canvas')
const gl = canvas.getContext('webgl2')

if (!gl) {
  throw new Error('WebGL2 is not supported.')
}

function resize() {
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight

  gl.viewport(0, 0, canvas.width, canvas.height)
}

window.addEventListener('resize', resize)
resize()

gl.clearColor(0.1, 0.1, 0.1, 1.0)

function render() {
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

  requestAnimationFrame(render)
}

render()
