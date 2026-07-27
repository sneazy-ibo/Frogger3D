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

// Inverse transpose of the upper 3x3 of uModel, so normals stay correct
// under non-uniform scaling (unlike just reusing uModel directly)
uniform mat3 uNormalMatrix;

// Passed to the fragment shader for per-pixel Phong lighting
out vec3 vNormal;
out vec3 vWorldPosition;

void main() {
  vec4 worldPosition = uModel * vec4(vertexPosition, 1.0);
  vWorldPosition = worldPosition.xyz;
  vNormal = normalize(uNormalMatrix * vertexNormal);

  gl_Position = uProjection * uView * worldPosition;
}