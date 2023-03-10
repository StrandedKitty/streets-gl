#include <versionPrecision>

#define PI 3.141592653589793
#define PI2 6.28318530718
#define Eu 2.71828182846

#define SHADOWMAP_SOFT_RADIUS 1.
#define SELECTION_COLOR (vec3(1, 0.2, 0))

out vec4 FragColor;

in vec2 vUv;

uniform sampler2D tColor;
uniform sampler2D tNormal;
uniform sampler2D tDepth;
uniform sampler2D tRoughnessMetalness;
uniform sampler2DArray tShadowMaps;
uniform sampler2D tSSAO;
uniform sampler2D tSelectionMask;
uniform sampler2D tSelectionBlurred;
uniform sampler2D tTransmittanceLUT;
uniform sampler3D tAerialPerspectiveLUT;
uniform sampler2D tSSR;
uniform sampler2D tMotion;
uniform samplerCube tAtmosphere;

uniform MainBlock {
	mat4 viewMatrix;
	mat4 projectionMatrixInverse;
	vec3 sunDirection;
	mat4 skyRotationMatrix;
};

uniform CSM {
	vec4 CSMLightDirectionAndIntensity;
	vec2[SHADOW_CASCADES] CSMSplits;
	float[SHADOW_CASCADES] CSMResolution;
	float[SHADOW_CASCADES] CSMSize;
	vec2[SHADOW_CASCADES] CSMBias;
	mat4[SHADOW_CASCADES] CSMMatrixWorldInverse;
	float[SHADOW_CASCADES] CSMFadeOffset;
};

#include <unpackNormal>
#include <gamma>
#include <atmosphere>
#include <reconstructPositionFromDepth>

struct Light {
	vec3 direction;
	vec3 color;
	float intensity;
};

struct AngularInfo {
	float NdotL;                  // cos angle between normal and light direction
	float NdotV;                  // cos angle between normal and view direction
	float NdotH;                  // cos angle between normal and half vector
	float LdotH;                  // cos angle between light direction and half vector
	float VdotH;                  // cos angle between view direction and half vector
	vec3 padding;
};

struct MaterialInfo {
	float perceptualRoughness;    // roughness value, as authored by the model creator (input to shader)
	vec3 reflectance0;            // full reflectance color (normal incidence angle)
	float alphaRoughness;         // roughness mapped to a more linear change in the roughness
	vec3 diffuseColor;            // color contribution from diffuse lighting
	vec3 reflectance90;           // reflectance color at grazing angle
	vec3 specularColor;           // color contribution from specular lighting
};

AngularInfo getAngularInfo(vec3 pointToLight, vec3 normal, vec3 view) {
	vec3 n = normalize(normal);           // Outward direction of surface point
	vec3 v = normalize(view);             // Direction from surface point to view
	vec3 l = normalize(pointToLight);     // Direction from surface point to light
	vec3 h = normalize(l + v);            // Direction of the vector between l and v

	float NdotL = clamp(dot(n, l), 0.0, 1.0);
	float NdotV = clamp(dot(n, v), 0.0, 1.0);
	float NdotH = clamp(dot(n, h), 0.0, 1.0);
	float LdotH = clamp(dot(l, h), 0.0, 1.0);
	float VdotH = clamp(dot(v, h), 0.0, 1.0);

	return AngularInfo(
		NdotL,
		NdotV,
		NdotH,
		LdotH,
		VdotH,
		vec3(0, 0, 0)
	);
}

vec3 specularReflection(MaterialInfo materialInfo, AngularInfo angularInfo) {
	return materialInfo.reflectance0 + (materialInfo.reflectance90 - materialInfo.reflectance0) * pow(clamp(1.0 - angularInfo.VdotH, 0.0, 1.0), 5.0);
}

float visibilityOcclusion(MaterialInfo materialInfo, AngularInfo angularInfo) {
	float NdotL = angularInfo.NdotL;
	float NdotV = angularInfo.NdotV;
	float alphaRoughnessSq = materialInfo.alphaRoughness * materialInfo.alphaRoughness;

	float GGXV = NdotL * sqrt(NdotV * NdotV * (1.0 - alphaRoughnessSq) + alphaRoughnessSq);
	float GGXL = NdotV * sqrt(NdotL * NdotL * (1.0 - alphaRoughnessSq) + alphaRoughnessSq);

	float GGX = GGXV + GGXL;
	if (GGX > 0.0)
	{
		return 0.5 / GGX;
	}
	return 0.0;
}

float microfacetDistribution(MaterialInfo materialInfo, AngularInfo angularInfo) {
	float alphaRoughnessSq = materialInfo.alphaRoughness * materialInfo.alphaRoughness;
	float f = (angularInfo.NdotH * alphaRoughnessSq - angularInfo.NdotH) * angularInfo.NdotH + 1.0;
	return alphaRoughnessSq / (PI * f * f);
}

// Lambert lighting
// https://seblagarde.wordpress.com/2012/01/08/pi-or-not-to-pi-in-game-lighting-equation/
vec3 diffuse(MaterialInfo materialInfo) {
	return materialInfo.diffuseColor / PI;
}

vec3 getPointShade(vec3 pointToLight, MaterialInfo materialInfo, vec3 normal, vec3 view) {
	AngularInfo angularInfo = getAngularInfo(pointToLight, normal, view);

	if (angularInfo.NdotL > 0.0 || angularInfo.NdotV > 0.0) {
		// Calculate the shading terms for the microfacet specular shading model
		vec3 F = specularReflection(materialInfo, angularInfo);
		float Vis = visibilityOcclusion(materialInfo, angularInfo);
		float D = microfacetDistribution(materialInfo, angularInfo);

		// Calculation of analytical lighting contribution
		vec3 diffuseContrib = (1.0 - F) * diffuse(materialInfo);
		vec3 specContrib = F * Vis * D;

		// Obtain final intensity as reflectance (BRDF) scaled by the energy of the light (cosine law)
		return angularInfo.NdotL * (diffuseContrib + specContrib);
	}

	return vec3(0.0, 0.0, 0.0);
}

vec3 applyDirectionalLight(Light light, MaterialInfo materialInfo, vec3 normal, vec3 view) {
	vec3 pointToLight = -light.direction;
	vec3 shade = getPointShade(pointToLight, materialInfo, normal, view);
	return light.intensity * light.color * shade;
}

// Trowbridge-Reitz distribution to Mip level, following the logic of http://casual-effects.blogspot.ca/2011/08/plausible-environment-lighting-in-two.html
float getSpecularMIPLevel(float roughness, int maxMIPLevel) {
	float maxMIPLevelScalar = float(maxMIPLevel);
	float sigma = PI * roughness * roughness / (1.0 + roughness);
	float desiredMIPLevel = maxMIPLevelScalar + log2(sigma);

	return clamp(desiredMIPLevel, 0.0, maxMIPLevelScalar);
}

// https://www.unrealengine.com/blog/physically-based-shading-on-mobile - environmentBRDF for GGX on mobile
vec2 integrateSpecularBRDF(float dotNV, float roughness) {
	const vec4 c0 = vec4(-1, -0.0275, -0.572, 0.022);
	const vec4 c1 = vec4(1, 0.0425, 1.04, -0.04);
	vec4 r = roughness * c0 + c1;
	float a004 = min(r.x * r.x, exp2(-9.28 * dotNV)) * r.x + r.y;
	return vec2(-1.04, 1.04) * a004 + r.zw;
}

vec3 getIBLContribution(MaterialInfo materialInfo, vec3 n, vec3 v, vec4 reflectionColor) {
	float lod = getSpecularMIPLevel(materialInfo.perceptualRoughness, 9);
	vec3 reflection = normalize(reflect(-v, n));

	float NdotV = clamp(dot(n, v), 0.0, 1.0);
	//vec2 brdfSamplePoint = clamp(vec2(NdotV, materialInfo.perceptualRoughness), vec2(0, 0), vec2(1, 1));
	//vec2 brdf = texture(tBRDF, brdfSamplePoint).rg;
	vec2 brdf = integrateSpecularBRDF(NdotV, materialInfo.perceptualRoughness);

	//vec4 diffuseSample = textureLod(tSky, n, 0.);
	vec4 specularSample = textureLod(tAtmosphere, reflection, lod);
	specularSample.rgb = mix(specularSample.rgb, reflectionColor.rgb, reflectionColor.a);

	//vec3 diffuseLight = SRGBtoLINEAR(diffuseSample).rgb;
	vec3 specularLight = specularSample.rgb;

	//vec3 diffuse = diffuseLight * materialInfo.diffuseColor;
	vec3 specular = specularLight * (materialInfo.specularColor * brdf.x + brdf.y);

	return /*diffuse + */specular;
}

float perspectiveDepthToViewZ(const in float invClipZ, const in float near, const in float far) {
	return (near * far) / ((far - near) * invClipZ - far);
}

float orthographicDepthToViewZ( const in float linearClipZ, const in float near, const in float far ) {
	return linearClipZ * (near - far) - near;
}

float textureShadow(int shadowMapLayer, vec2 uv) {
	return -orthographicDepthToViewZ(texture(tShadowMaps, vec3(uv, shadowMapLayer)).r, SHADOW_CAMERA_NEAR, SHADOW_CAMERA_FAR);
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

vec3 applySelectionOverlay(vec3 color) {
	float selectionMask = texture(tSelectionBlurred, vUv).r * (1. - texture(tSelectionMask, vUv).r);

	return mix(color.rgb, SELECTION_COLOR, smoothstep(0., 1., selectionMask * 2.));
}

void main() {
	vec4 baseColor = SRGBtoLINEAR(texture(tColor, vUv));
	vec3 normal = unpackNormal(texture(tNormal, vUv).xyz);
	vec3 position = reconstructPositionFromDepth(vUv, texture(tDepth, vUv).r, projectionMatrixInverse);
	vec3 roughnessMetalness = texture(tRoughnessMetalness, vUv).rgb;

	vec3 worldPosition = vec3(viewMatrix * vec4(position, 1));
	vec3 view = normalize(-position);
	vec3 worldView = normalize((viewMatrix * vec4(view, 0)).xyz);
	vec3 worldNormal = normalize((viewMatrix * vec4(normal, 0)).xyz);

	vec3 sunColor = getValFromTLUT(tTransmittanceLUT, vec3(0, groundRadiusMM + worldPosition.y * 0.000001, 0), -sunDirection);

	if (baseColor.a == 0.) {
		FragColor.rgb = applySelectionOverlay(baseColor.rgb);
		return;
	}

	float perceptualRoughness = roughnessMetalness.x;
	float metallic = roughnessMetalness.y;
	vec3 f0 = vec3(roughnessMetalness.z);
	vec3 diffuseColor = baseColor.rgb * (vec3(1.) - f0) * (1. - metallic);
	vec3 specularColor = mix(f0, baseColor.rgb, metallic);

	float alphaRoughness = perceptualRoughness * perceptualRoughness;
	float reflectance = max(max(specularColor.r, specularColor.g), specularColor.b);
	vec3 specularEnvironmentR0 = specularColor.rgb;
	vec3 specularEnvironmentR90 = vec3(clamp(reflectance * 50.0, 0.0, 1.0));

	MaterialInfo materialInfo = MaterialInfo(
		perceptualRoughness,
		specularEnvironmentR0,
		alphaRoughness,
		diffuseColor,
		specularEnvironmentR90,
		specularColor
	);

	float shadowFactor = 1.;

	#if SHADOW_ENABLED == 1
	for(int i = 0; i < SHADOW_CASCADES; i++) {
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
	#endif

	Light light = Light(
		CSMLightDirectionAndIntensity.xyz,
		vec3(1) * sunColor,
		CSMLightDirectionAndIntensity.w
	);

	vec3 color = vec3(0);
	vec4 reflectionColor = vec4(0);

	#if SSR_ENABLED == 1
	if (baseColor.a < 1.) {
		vec2 velocity = texture(tMotion, vUv).xy;
		vec2 oldUV = vUv - velocity.xy;

		if (oldUV.x >= 0. && oldUV.x <= 1. && oldUV.y >= 0. && oldUV.y <= 1.) {
			reflectionColor = texture(tSSR, vUv - velocity.xy);
		}
	}
	#endif

	color += getIBLContribution(materialInfo, worldNormal, worldView, reflectionColor);
	color += applyDirectionalLight(light, materialInfo, worldNormal, worldView) * shadowFactor;

	color = min(color, vec3(500.));

	#if SSAO_ENABLED == 1
		color += materialInfo.diffuseColor * 0.2 * texture(tSSAO, vUv).r;
	#else
		color += materialInfo.diffuseColor * 0.2;
	#endif

	vec2 aerialPerspectiveUV = vUv;
	aerialPerspectiveUV.y = 1. - aerialPerspectiveUV.y;
	vec4 aerialPerspective = texture(
		tAerialPerspectiveLUT,
		vec3(aerialPerspectiveUV, aerialPerspectiveDepthToSlice(-position.z) / (aerialPerspectiveSliceCount - 1.))
	);

	color = color * clamp(aerialPerspective.a, 0., 1.) + aerialPerspective.rgb;
	//color = worldNormal;

	color = applySelectionOverlay(color);

	FragColor = vec4(color, 1);
}