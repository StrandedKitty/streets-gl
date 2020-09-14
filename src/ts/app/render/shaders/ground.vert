#version 300 es
precision highp float;

in vec3 position;
in vec2 uv;

out vec2 vUv;

uniform mat4 projectionMatrix;
uniform mat4 modelViewMatrix;

void main() {
	vUv = uv;

	vec3 transformed = position;

	gl_Position = projectionMatrix * modelViewMatrix * vec4(transformed, 1);
}
