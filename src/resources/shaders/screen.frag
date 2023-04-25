#include <versionPrecision>

out vec4 FragColor;

in vec2 vUv;

uniform sampler2D tHDR;
uniform sampler2D tLabels;
uniform sampler2D tSlippyMap;

uniform Uniforms {
	vec2 resolution;
	float slippyMapFactor;
};

#include <gamma>

// from https://iquilezles.org/articles/distfunctions
float roundedBoxSDF(vec2 CenterPosition, vec2 Size, float Radius) {
	return length(max(abs(CenterPosition) - Size + Radius, 0.0)) - Radius;
}

void main() {
	vec2 uv = vUv;

	vec4 labels = vec4(0);

	#if LABELS_ENABLED == 1
		labels = texture(tLabels, uv);

		float bordersSDF = roundedBoxSDF(vUv * resolution - resolution * 0.5, resolution * 0.5, 100.);
		labels.a *= smoothstep(0., -100., bordersSDF);
	#endif

	vec3 sceneColor = LINEARtoSRGB(texture(tHDR, uv).rgb);
	vec3 sceneWithLabelsColor = mix(sceneColor, labels.rgb, labels.a);

	FragColor = vec4(sceneWithLabelsColor, 1);

	if (slippyMapFactor > 0.) {
		FragColor = texture(tSlippyMap, uv);
	}
}