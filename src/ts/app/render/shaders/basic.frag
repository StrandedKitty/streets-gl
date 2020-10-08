#version 300 es
precision highp float;

layout(location = 0) out vec4 outColor;
layout(location = 1) out vec3 outNormal;
layout(location = 2) out vec3 outPosition;
layout(location = 3) out vec4 outMetallicRoughness;
layout(location = 4) out vec4 outEmission;

in vec2 vUv;

void main() {
	outColor = vec4(1, 0, 0, 1);
	outNormal = vec3(0);
	outPosition = vec3(0);
	outMetallicRoughness = vec4(0);
	outEmission = vec4(0);
}
