#version 300 es
precision highp float;
precision highp int;
precision highp sampler2D;
precision highp sampler2DArray;

layout(location = 0) out vec4 outColor;
layout(location = 1) out vec3 outNormal;
layout(location = 2) out vec3 outPosition;
layout(location = 3) out vec4 outMetallicRoughness;
layout(location = 4) out vec4 outEmission;
layout(location = 5) out vec3 outMotion;
layout(location = 6) out uint outObjectId;

in vec2 vUv;
in vec3 vPosition;
in vec3 vNormal;
in vec3 vColor;
in vec4 vClipPos;
in vec4 vClipPosPrev;
in vec3 vCenter;

float edgeFactor() {
	float widthFactor = 1.;
	vec3 d = fwidth(vCenter.xyz);
	vec3 a3 = smoothstep(vec3(0), d * widthFactor, vCenter.xyz);

	return min(min(a3.x, a3.y), a3.z);
}

void main() {
	//if (edgeFactor() > 0.99) discard;

	outColor = vec4(0.2, 0.2, 0.2, 1);
	outNormal = vNormal * 0.5 + 0.5;
	outPosition = vPosition;
	outMetallicRoughness = vec4(0);
	outEmission = vec4(0);
	outMotion = 0.5 * vec3(vClipPos / vClipPos.w - vClipPosPrev / vClipPosPrev.w);
	outObjectId = 0u;
}
