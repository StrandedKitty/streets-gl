#version 300 es
precision highp float;
precision highp int;
precision highp sampler3D;
out vec4 FragColor;

in vec2 vUv;

uniform sampler2D tColor;
uniform sampler2D tDepth;
uniform sampler2D tNormal;
uniform sampler2D tPosition;

const float GAMMA = 2.2;
const float INV_GAMMA = 1.0 / GAMMA;

vec3 LINEARtoSRGB(vec3 color) {
	return pow(color, vec3(INV_GAMMA));
}

vec4 SRGBtoLINEAR(vec4 srgbIn) {
	return vec4(pow(srgbIn.xyz, vec3(GAMMA)), srgbIn.w);
}

void main() {
	vec4 baseColor = SRGBtoLINEAR(texture(tColor, vUv));
	vec3 normal = texture(tNormal, vUv).rgb * 2. - 1.;

	float diff = max(dot(normal, vec3(0, 0, 1)), 0.0);

	FragColor = vec4(LINEARtoSRGB(baseColor.rgb) * diff, 1);
}