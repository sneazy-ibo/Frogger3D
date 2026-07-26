function compileShader(gl, type, source) {
  const shader = gl.createShader(type)
  gl.shaderSource(shader, source)
  gl.compileShader(shader)

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const info = gl.getShaderInfoLog(shader)
    gl.deleteShader(shader)
    throw new Error(info)
  }

  return shader
}

export function createProgram(gl, vertexSource, fragmentSource) {
  const vertexShader = compileShader(gl, gl.VERTEX_SHADER, vertexSource)
  const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource)

  const program = gl.createProgram()
  gl.attachShader(program, vertexShader)
  gl.attachShader(program, fragmentShader)
  gl.linkProgram(program)

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error(gl.getProgramInfoLog(program))
  }

  // Shaders are linked into the program now, don't need the standalone objects anymore
  gl.deleteShader(vertexShader)
  gl.deleteShader(fragmentShader)

  return program
}

export function getAttribLocation(gl, program, name) {
  const location = gl.getAttribLocation(program, name)
  if (location < 0) {
    throw new Error(`Failed to get attrib location for ${name}`)
  }
  return location
}

// Uniform locations are objects, not numbers, so null (not < 0) means "not found"
export function getUniformLocation(gl, program, name) {
  const location = gl.getUniformLocation(program, name)
  if (location === null) {
    throw new Error(`Failed to get uniform location for ${name}`)
  }
  return location
}