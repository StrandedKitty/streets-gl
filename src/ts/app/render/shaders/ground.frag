#version 300 es
precision highp float;
out vec4 FragColor;

in vec2 vUv;

uniform sampler2D map;

void main() {
	FragColor = texture(map, vUv);
}
