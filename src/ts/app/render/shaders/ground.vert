#version 300 es
precision highp float;

in vec3 position;
in vec2 uv;
in vec3 normal;
in float weight;

out vec2 vUv;
out vec3 vNormal;

uniform mat4 projectionMatrix;
uniform mat4 modelViewMatrix;

void main() {
	vUv = uv;
	vNormal = (modelViewMatrix * vec4(normal, 0)).xyz;

	vec3 transformed = position;

	gl_Position = projectionMatrix * modelViewMatrix * vec4(transformed, 1);
}
