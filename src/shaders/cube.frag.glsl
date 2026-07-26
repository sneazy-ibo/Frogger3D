#version 300 es
precision mediump float;

// Matches the vertex shader's "out vec3 color"
in vec3 color;

// Output a final pixel color (RGBA)
out vec4 outputColor;

void main() {
  outputColor = vec4(color, 1.0);
}