#version 300 es
precision highp float;

layout(location = 0) out vec4 outColor;
layout(location = 1) out vec3 outNormal;
layout(location = 2) out vec3 outPosition;
layout(location = 3) out vec4 outMetallicRoughness;
layout(location = 4) out vec4 outEmission;
layout(location = 5) out vec3 outMotion;

in vec2 vUv;
in vec3 vPosition;
in vec3 vColor;
in vec4 vClipPos;
in vec4 vClipPosPrev;

vec3 getFlatNormal(vec3 position) {
	return normalize(cross(dFdx(position), dFdy(position)));
}

void main() {
	outColor = vec4(vColor, 1);
	outNormal = getFlatNormal(vPosition) * 0.5 + 0.5;
	outPosition = vPosition;
	outMetallicRoughness = vec4(0);
	outEmission = vec4(0);
	outMotion = 0.5 * vec3(vClipPos / vClipPos.w - vClipPosPrev / vClipPosPrev.w);
}
