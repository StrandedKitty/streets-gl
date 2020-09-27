#version 300 es
precision highp float;
out vec4 FragColor;

in vec2 vUv;

void main() {
	FragColor = vec4(vUv, 0, 1);
}
