#version 300 es
precision mediump float;

// Flat placeholder color until Phong lighting is wired up
uniform vec3 uColor;

out vec4 fragColor;

void main() {
  fragColor = vec4(uColor, 1.0);
}