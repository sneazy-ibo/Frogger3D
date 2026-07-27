#version 300 es
precision mediump float;

in vec3 vNormal;
in vec3 vWorldPosition;

uniform vec3 uColor;

// Configurable via the light panel in index.html, see engine/light.js
uniform vec3 uLightPosition;
uniform vec3 uLightColor;
uniform vec3 uViewPosition;

out vec4 fragColor;

void main() {
  vec3 normal = normalize(vNormal);

  // Ambient: keeps faces pointing away from the light from going fully black
  float ambientStrength = 0.2;
  vec3 ambient = ambientStrength * uLightColor;

  // Diffuse: Lambert term, depends on the angle between normal and light direction
  vec3 lightDir = normalize(uLightPosition - vWorldPosition);
  float diff = max(dot(normal, lightDir), 0.0);
  vec3 diffuse = diff * uLightColor;

  // Specular: highlight, depends on the angle between reflection and view direction
  float specularStrength = 0.5;
  float shininess = 32.0;
  vec3 viewDir = normalize(uViewPosition - vWorldPosition);
  vec3 reflectDir = reflect(-lightDir, normal);
  float spec = pow(max(dot(viewDir, reflectDir), 0.0), shininess);
  vec3 specular = specularStrength * spec * uLightColor;

  vec3 result = (ambient + diffuse + specular) * uColor;
  fragColor = vec4(result, 1.0);
}