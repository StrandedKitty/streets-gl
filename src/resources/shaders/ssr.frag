#include <versionPrecision>

out vec4 FragColor;

in vec2 vUv;

uniform sampler2D tColor;
uniform sampler2D tNoise;
uniform sampler2D tNormal;
uniform sampler2D tPosition;

uniform MainBlock {
	mat4 projectionMatrix;
	vec2 noiseOffset;
};

const float rayStep = 300.;
const int iterationCount = 4;
const float distanceBias = 10.;
const bool isAdaptiveStepEnabled = true;

#include <unpackNormal>

vec3 generatePositionFromDepth(vec2 texturePos, float depth) {
	vec4 ndc = vec4((texturePos - 0.5) * 2., depth, 1);
	vec4 inversed = inverse(projectionMatrix) * ndc;// going back from projected
	inversed /= inversed.w;
	return inversed.xyz;
}

vec3 generateProjectedPosition(vec3 pos){
	vec4 samplePosition = projectionMatrix * vec4(pos, 1);
	samplePosition.xyz = (samplePosition.xyz / samplePosition.w) * 0.5 + 0.5;
	return samplePosition.xyz;
}

vec4 SSR(vec3 position, vec3 reflection) {
	vec2 noiseUv = gl_FragCoord.xy / vec2(textureSize(tNoise, 0)) + noiseOffset;
	float noiseValue = texture(tNoise, noiseUv).r;

	vec3 step = rayStep * reflection;
	vec3 marchingPosition = position + step * noiseValue;
	float delta;
	float depthFromScreen;
	vec2 screenPosition;

	for (int i = 0; i < iterationCount; i++) {
		vec3 projectedPosition = generateProjectedPosition(marchingPosition);

		if (
			projectedPosition.x < 0. || projectedPosition.x > 1. ||
			projectedPosition.y < 0. || projectedPosition.y > 1. ||
			projectedPosition.z < 0. || projectedPosition.z > 1.
		) {
			return vec4(0);
		}

		screenPosition.xy = projectedPosition.xy;
		depthFromScreen = -texture(tPosition, screenPosition).z;
		delta = -marchingPosition.z - depthFromScreen;

		if (delta > distanceBias) {
			return texture(tColor, screenPosition);
		}

		if (isAdaptiveStepEnabled){
			float directionSign = sign(abs(marchingPosition.z) - depthFromScreen);
			//this is sort of adapting step, should prevent lining reflection by doing sort of iterative converging
			//some implementation doing it by binary search, but I found this idea more cheaty and way easier to implement
			step = step * (1.0 - rayStep * max(directionSign, 0.0));
			marchingPosition += step * (-directionSign);
		}
		else {
			marchingPosition += step;
		}
		step *= 1.5;
	}

	return vec4(0.0);
}

void main() {
	vec4 color = texture(tColor, vUv);
	vec3 normal = unpackNormal(texture(tNormal, vUv).xyz);
	vec3 position = texture(tPosition, vUv).xyz;
	vec3 view = normalize(-position);

	//vec3 worldPosition = vec3(viewMatrix * vec4(position, 1));
	//vec3 worldView = normalize((viewMatrix * vec4(view, 0)).xyz);
	//vec3 worldNormal = normalize((viewMatrix * vec4(normal, 0)).xyz);

	vec3 reflectDir = normalize(reflect(view, normalize(normal)));
	vec4 ssr = SSR(position, -reflectDir);

	if (ssr.a > 0.5) {
		FragColor = vec4(ssr.rgb, 1);
	} else {
		FragColor = vec4(0);
	}
}