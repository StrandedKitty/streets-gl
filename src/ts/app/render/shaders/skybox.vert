#version 300 es
precision highp float;

in vec3 position;

out vec3 vNormal;

uniform mat4 projectionMatrix;
uniform mat4 modelViewMatrix;

void main() {
	vNormal = normalize(position);
	gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
