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

// Turns a list of {positions, normals, indices, color} parts into one VAO and draw info per part
export function createRenderableParts(gl, parts, { positionLocation, normalLocation }) {
  return parts.map((part) => {
    const vao = gl.createVertexArray()
    gl.bindVertexArray(vao)

    const positionBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, part.positions, gl.STATIC_DRAW)
    gl.enableVertexAttribArray(positionLocation)
    gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0)

    const normalBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, part.normals, gl.STATIC_DRAW)
    gl.enableVertexAttribArray(normalLocation)
    gl.vertexAttribPointer(normalLocation, 3, gl.FLOAT, false, 0, 0)

    // Indexed drawing: shared vertices are referenced instead of duplicated
    const indexBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer)
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, part.indices, gl.STATIC_DRAW)

    gl.bindVertexArray(null)

    const indexType = part.indices instanceof Uint32Array ? gl.UNSIGNED_INT : gl.UNSIGNED_SHORT

    return {
      vao,
      indexType,
      indexCount: part.indices.length,
      color: part.color,
    }
  })
}
