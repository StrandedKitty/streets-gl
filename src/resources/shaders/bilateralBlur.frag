#version 300 es
precision highp float;
precision highp int;
precision highp sampler2D;
precision highp sampler3D;
precision highp usampler2D;

#define KERNEL_RADIUS 8.

out vec4 FragColor;

in vec2 vUv;

uniform sampler2D tColor;
uniform sampler2D tPosition;
uniform vec2 direction;

float getDepth(float offset, vec2 resolution) {
	return -texture(tPosition, vUv + (1. / resolution) * offset * direction).z;
}

vec4 getColor(float offset, vec2 resolution) {
	return texture(tColor, vUv + (1. / resolution) * offset * direction);
}

float crossBilateralWeight(float r, float z, float z0) {
	const float BlurSigma = (KERNEL_RADIUS + 1.) * 0.5;
	const float BlurFalloff = 1. / (2. * BlurSigma*BlurSigma);

	float dz = z0 - z;
	return exp2(-r * r * BlurFalloff - dz * dz);
}

void main() {
	vec2 texSize = vec2(textureSize(tPosition, 0));
	float centerDepth = getDepth(0., texSize);
	vec4 totalColor = getColor(0., texSize);

	float totalWeight = crossBilateralWeight(0., centerDepth, centerDepth);

	for(float i = 1.; i <= KERNEL_RADIUS; i += 1.)
	{
		float w = crossBilateralWeight(i, getDepth(i, texSize), centerDepth);
		totalColor += getColor(i, texSize) * w;
		totalWeight += w;

		w = crossBilateralWeight(i, getDepth(-i, texSize), centerDepth);
		totalColor += getColor(-i, texSize) * w;
		totalWeight += w;
	}

	FragColor = totalColor / totalWeight;
}