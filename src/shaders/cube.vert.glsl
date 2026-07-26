#version 300 es
precision mediump float;

in vec3 vertexPosition;
in vec3 vertexColor;

// This gets passed forward to the fragment shader
out vec3 color;

// Standard MVP trio:
// model = object -> world
// view = world -> camera,
// projection = camera -> clip space (perspective + aspect)
uniform mat4 uModel;
uniform mat4 uView;
uniform mat4 uProjection;

void main() {
  color = vertexColor;

  gl_Position = uProjection * uView * uModel * vec4(vertexPosition, 1.0);
}