#version 300 es
precision highp float;
precision highp int;
precision highp sampler3D;

#define PI 3.141592653589793
#define PI2 6.28318530718
#define Eu 2.71828182846

out vec4 FragColor;

in vec2 vUv;

uniform sampler2D tColor;
uniform sampler2D tDepth;
uniform sampler2D tNormal;
uniform sampler2D tPosition;
uniform mat4 viewMatrix;

struct Light {
	vec3 direction;
	float range;
	vec3 color;
	float intensity;
	vec3 position;
	float innerConeCos;
	float outerConeCos;
	int type;
	vec2 padding;
};

uniform Light uLight;

const float GAMMA = 2.2;
const float INV_GAMMA = 1.0 / GAMMA;

vec3 LINEARtoSRGB(vec3 color) {
	return pow(color, vec3(INV_GAMMA));
}

vec4 SRGBtoLINEAR(vec4 srgbIn) {
	return vec4(pow(srgbIn.xyz, vec3(GAMMA)), srgbIn.w);
}

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

/*vec3 getIBLContribution(MaterialInfo materialInfo, vec3 n, vec3 v) {
	float NdotV = clamp(dot(n, v), 0.0, 1.0);

	float mipCount = 11.;
	float lod = clamp(materialInfo.perceptualRoughness * mipCount, 0.0, mipCount);
	vec3 reflection = normalize(reflect(-v, n));
	reflection.y = abs(reflection.y);

	vec2 brdfSamplePoint = clamp(vec2(NdotV, materialInfo.perceptualRoughness), vec2(0.0, 0.0), vec2(1.0, 1.0));
	//vec2 brdf = texture(tBRDF, brdfSamplePoint).rg;
	vec2 brdf = vec2(1);

	vec4 diffuseSample = texture(sky, n);

	vec4 specularSample = textureLod(sky, reflection, lod);

	vec3 diffuseLight = SRGBtoLINEAR(diffuseSample).rgb;
	vec3 specularLight = SRGBtoLINEAR(specularSample).rgb;

	vec3 diffuse = diffuseLight * materialInfo.diffuseColor;
	vec3 specular = specularLight * (materialInfo.specularColor * brdf.x + brdf.y);

	return diffuse * 0. + specular;
}*/

void main() {
	vec4 baseColor = SRGBtoLINEAR(texture(tColor, vUv));
	vec3 normal = texture(tNormal, vUv).rgb * 2. - 1.;
	vec3 position = texture(tPosition, vUv).xyz;

	vec3 view = normalize(vec3(0) - position);
	vec3 worldView = normalize((viewMatrix * vec4(view, 0)).xyz);
	vec3 worldNormal = normalize((viewMatrix * vec4(normal, 0)).xyz);

	float perceptualRoughness = 0.95;
	float metallic = 0.0;
	vec3 f0 = vec3(0.01);
	vec3 diffuseColor = baseColor.rgb * (vec3(1.0) - f0) * (1.0 - metallic);
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

	vec3 color = vec3(0);

	Light light = uLight;

	color += applyDirectionalLight(light, materialInfo, worldNormal, worldView) * 0.75;
	color += materialInfo.diffuseColor * 0.25;

	FragColor = vec4(LINEARtoSRGB(color), 1);
}