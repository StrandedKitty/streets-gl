#version 300 es
precision highp float;
precision highp int;
precision highp sampler3D;

out vec4 FragColor;

in vec2 vUv;

uniform sampler2D tHDR;

const float GAMMA = 2.2;
const float INV_GAMMA = 1.0 / GAMMA;

vec3 LINEARtoSRGB(vec3 color) {
	return pow(color, vec3(INV_GAMMA));
}

void main() {
	FragColor = vec4(LINEARtoSRGB(texture(tHDR, vUv).rgb), 1);
}