#version 300 es

in vec3 vertexPosition;
in vec3 vertexNormal;

// Standard MVP trio:
// model = object -> world
// view = world -> camera,
// projection = camera -> clip space (perspective + aspect)
uniform mat4 uModel;
uniform mat4 uView;
uniform mat4 uProjection;

void main() {
  gl_Position = uProjection * uView * uModel * vec4(vertexPosition, 1.0);
}