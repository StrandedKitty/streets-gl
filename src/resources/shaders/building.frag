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
flat in int vTextureId;
flat in uint vObjectId;

uniform sampler2DArray tRoofColor;
uniform sampler2DArray tRoofNormal;

vec3 getFlatNormal(vec3 position) {
	return normalize(cross(dFdx(position), dFdy(position)));
}

mat3 getTBN(vec3 N, vec3 p, vec2 uv) {
	/* get edge vectors of the pixel triangle */
	vec3 dp1 = dFdx(p);
	vec3 dp2 = dFdy(p);
	vec2 duv1 = dFdx(uv);
	vec2 duv2 = dFdy(uv);

	/* solve the linear system */
	vec3 dp2perp = cross(dp2, N);
	vec3 dp1perp = cross(N, dp1);
	vec3 T = dp2perp * duv1.x + dp1perp * duv2.x;
	vec3 B = dp2perp * duv1.y + dp1perp * duv2.y;

	/* construct a scale-invariant frame */
	float invmax = inversesqrt(max(dot(T, T), dot(B, B)));
	return mat3(T * invmax, -B * invmax, N);
}

vec3 getRoofNormal() {
	mat3 tbn = getTBN(vNormal, vPosition, vUv);
	vec3 mapValue = texture(tRoofNormal, vec3(vUv, vTextureId - 1)).xyz * 2. - 1.;
	vec3 normal = normalize(tbn * mapValue);

	normal *= float(gl_FrontFacing) * 2. - 1.;

	return normal;
}

void main() {
	if(vTextureId == 0) {
		outColor = vec4(vColor, 1);
		outNormal = vNormal * 0.5 + 0.5;
	} else {
		outColor = texture(tRoofColor, vec3(vUv, vTextureId - 1));
		outNormal = getRoofNormal() * 0.5 + 0.5;
	}

	outPosition = vPosition;
	outMetallicRoughness = vec4(0);
	outEmission = vec4(0);
	outMotion = 0.5 * vec3(vClipPos / vClipPos.w - vClipPosPrev / vClipPosPrev.w);
	outObjectId = vObjectId;
}
