#version 300 es
precision highp float;
precision highp sampler2DArray;
precision highp samplerCube;
out vec4 FragColor;

in vec2 vUv;

uniform sampler2D map;

void main() {
	vec4 s = texture(map, vUv);
	FragColor = s;
}