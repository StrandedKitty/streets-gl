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
in vec3 vLocalPosition;
in vec3 vNormal;
in vec3 vColor;
in vec4 vClipPos;
in vec4 vClipPosPrev;
in vec3 vCenter;
flat in int vTextureId;

uniform sampler2DArray tMap;

float edgeFactor() {
	float widthFactor = 1.;
	vec3 d = fwidth(vCenter.xyz);
	vec3 a3 = smoothstep(vec3(0), d * widthFactor, vCenter.xyz);

	return min(min(a3.x, a3.y), a3.z);
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

vec3 getNormal(vec3 normalMapValue) {
	mat3 tbn = getTBN(vNormal, vPosition, vUv);
	vec3 mapValue = normalMapValue * 2. - 1.;
	vec3 normal = normalize(tbn * mapValue);

	normal *= float(gl_FrontFacing) * 2. - 1.;

	return normal;
}

void main() {
	//if (edgeFactor() > 0.99) discard;

	vec2 mapUV = vLocalPosition.xz * 0.1;

	vec4 color = texture(tMap, vec3(mapUV, vTextureId * 3));
	vec3 normal = getNormal(texture(tMap, vec3(mapUV, vTextureId * 3 + 1)).xyz);
	vec3 mask = texture(tMap, vec3(mapUV, vTextureId * 3 + 2)).rgb;

	outColor = color;
	outNormal = normal * 0.5 + 0.5;
	outPosition = vPosition;
	outMetallicRoughness = vec4(0);
	outEmission = vec4(0);
	outMotion = 0.5 * vec3(vClipPos / vClipPos.w - vClipPosPrev / vClipPosPrev.w);
	outObjectId = 0u;
}
