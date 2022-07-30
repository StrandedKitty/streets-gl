#include <versionPrecision>

#define SHADOW_CASCADES 3
#define SHADOWMAP_SOFT_RADIUS 1.

out vec4 FragColor;

in vec2 vUv;

uniform sampler2D tColor;
uniform sampler2D tNormal;
uniform sampler2D tPosition;
uniform sampler2DArray tShadowMaps;
uniform mat4 viewMatrix;

uniform CSM {
	vec2[SHADOW_CASCADES] CSMSplits;
	float[SHADOW_CASCADES] CSMResolution;
	float[SHADOW_CASCADES] CSMSize;
	vec2[SHADOW_CASCADES] CSMBias;
	mat4[SHADOW_CASCADES] CSMMatrixWorldInverse;
	float[SHADOW_CASCADES] CSMFadeOffset;
};

#include <unpackNormal>

float perspectiveDepthToViewZ(const in float invClipZ, const in float near, const in float far) {
	return (near * far) / ((far - near) * invClipZ - far);
}

float orthographicDepthToViewZ( const in float linearClipZ, const in float near, const in float far ) {
	return linearClipZ * (near - far) - near;
}

float textureShadow(int shadowMapLayer, vec2 uv) {
	return -orthographicDepthToViewZ(texture(tShadowMaps, vec3(uv, shadowMapLayer)).r, 1., 10000.);
}

float textureCompare(int shadowMapLayer, vec2 uv, float compare) {
	return float(step(compare, textureShadow(shadowMapLayer, uv)));
}

float textureShadowLerp(int shadowMapLayer, vec2 size, vec2 uv, float compare) {
	const vec2 offset = vec2(0.0, 1.0);
	vec2 texelSize = vec2(1.0) / size;
	vec2 centroidUV = (floor(uv * size - 0.5) + 0.5) * texelSize;
	float lb = textureCompare(shadowMapLayer, centroidUV + texelSize * offset.xx, compare);
	float lt = textureCompare(shadowMapLayer, centroidUV + texelSize * offset.xy, compare);
	float rb = textureCompare(shadowMapLayer, centroidUV + texelSize * offset.yx, compare);
	float rt = textureCompare(shadowMapLayer, centroidUV + texelSize * offset.yy, compare);
	vec2 f = fract(uv * size + 0.5);
	float a = mix(lb, lt, f.y);
	float b = mix(rb, rt, f.y);
	float c = mix(a, b, f.x);
	return c;
}

float getShadow(int shadowMapLayer, float shadowBias, vec4 shadowPosition, float shadowFrustumSize) {
	float shadow = 1.0;
	vec2 shadowUV = shadowPosition.xy / shadowFrustumSize * 0.5 + 0.5;

	bvec4 inFrustumVec = bvec4(shadowUV.x >= 0.0, shadowUV.x <= 1.0, shadowUV.y >= 0.0, shadowUV.y <= 1.0);
	bool inFrustum = all(inFrustumVec);

	if(inFrustum && shadowPosition.z / shadowPosition.w < 1.) {
		float shadowSpaceDepth = -shadowPosition.z + shadowBias;

		shadow = textureCompare(shadowMapLayer, shadowUV.xy, shadowSpaceDepth);
	}

	return shadow;
}

float getShadowSoft(int shadowMapLayer, float shadowBias, vec4 shadowPosition, float shadowFrustumSize, vec2 shadowMapSize, float shadowRadius) {
	float shadow = 1.0;
	vec2 shadowUV = (shadowPosition.xy / shadowFrustumSize + 1.) / 2.;
	bvec4 inFrustumVec = bvec4(shadowUV.x >= 0.0, shadowUV.x <= 1.0, shadowUV.y >= 0.0, shadowUV.y <= 1.0);
	bool inFrustum = all(inFrustumVec);

	if(inFrustum && shadowPosition.z / shadowPosition.w < 1.) {
		float shadowSpaceDepth = -shadowPosition.z + shadowBias;
		vec2 texelSize = vec2(1) / shadowMapSize;

		float dx0 = -texelSize.x * shadowRadius;
		float dy0 = -texelSize.y * shadowRadius;
		float dx1 = +texelSize.x * shadowRadius;
		float dy1 = +texelSize.y * shadowRadius;

		shadow = (
		textureShadowLerp(shadowMapLayer, shadowMapSize, shadowUV.xy + vec2(dx0, dy0), shadowSpaceDepth) +
		textureShadowLerp(shadowMapLayer, shadowMapSize, shadowUV.xy + vec2(0.0, dy0), shadowSpaceDepth) +
		textureShadowLerp(shadowMapLayer, shadowMapSize, shadowUV.xy + vec2(dx1, dy0), shadowSpaceDepth) +
		textureShadowLerp(shadowMapLayer, shadowMapSize, shadowUV.xy + vec2(dx0, 0.0), shadowSpaceDepth) +
		textureShadowLerp(shadowMapLayer, shadowMapSize, shadowUV.xy + vec2(0.0, 0.0), shadowSpaceDepth) +
		textureShadowLerp(shadowMapLayer, shadowMapSize, shadowUV.xy + vec2(dx1, 0.0), shadowSpaceDepth) +
		textureShadowLerp(shadowMapLayer, shadowMapSize, shadowUV.xy + vec2(dx0, dy1), shadowSpaceDepth) +
		textureShadowLerp(shadowMapLayer, shadowMapSize, shadowUV.xy + vec2(0.0, dy1), shadowSpaceDepth) +
		textureShadowLerp(shadowMapLayer, shadowMapSize, shadowUV.xy + vec2(dx1, dy1), shadowSpaceDepth)
		) * (1. / 9.);
	}

	return shadow;
}

float getShadowFactorForCascade(int cascadeId, vec3 worldPosition) {
	mat4 shadowMatrixWorldInverse = CSMMatrixWorldInverse[cascadeId];
	float shadowResolution = CSMResolution[cascadeId];
	float shadowSize = CSMSize[cascadeId];
	float shadowBias = CSMBias[cascadeId].x;

	vec4 shadowPosition = shadowMatrixWorldInverse * vec4(worldPosition, 1.);

	return getShadowSoft(cascadeId, shadowBias, shadowPosition, shadowSize, vec2(shadowResolution), SHADOWMAP_SOFT_RADIUS);
}

void main() {
	vec4 color = texture(tColor, vUv);
	vec3 normal = unpackNormal(texture(tNormal, vUv).xyz);
	vec3 position = texture(tPosition, vUv).xyz;

	vec3 worldPosition = vec3(viewMatrix * vec4(position, 1.));
	vec3 view = normalize(-position);
	vec3 worldView = normalize((viewMatrix * vec4(view, 0)).xyz);
	vec3 worldNormal = normalize((viewMatrix * vec4(normal, 0)).xyz);

	float fr = dot(normal, vec3(0, 0, 1)) * 0.5 + 0.5;

	if (color.a == 0.) {
		FragColor = vec4(color.rgb, 1);
		return;
	}

	float shadowFactor = 1.;

	for(int i = 0; i < 3; i++) {
		if(-position.z > CSMSplits[i].x && -position.z <= CSMSplits[i].y) {
			float shadowValue = 1. - getShadowFactorForCascade(i, worldPosition + worldNormal * CSMBias[i].y);
			float fadeOffset = CSMFadeOffset[i];

			if(-position.z > CSMSplits[i].y - fadeOffset) {
				float f = (position.z + CSMSplits[i].y) / fadeOffset;
				shadowValue *= smoothstep(0., 1., f);
			} else if(i > 0 && -position.z < CSMSplits[i - 1].y) {
				float f = 1. - (position.z + CSMSplits[i - 1].y) / CSMFadeOffset[i - 1];
				shadowValue *= smoothstep(0., 1., f);
			}

			shadowFactor -= shadowValue;
		}
	}

	FragColor = vec4(color.rgb * fr * shadowFactor, 1);
}