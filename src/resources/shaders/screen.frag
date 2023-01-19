#include <versionPrecision>

out vec4 FragColor;

in vec2 vUv;

uniform sampler2D tHDR;
uniform sampler2D tLabels;
uniform sampler2D tDebug;

uniform Uniforms {
	vec2 resolution;
};

#include <gamma>

// from https://iquilezles.org/articles/distfunctions
float roundedBoxSDF(vec2 CenterPosition, vec2 Size, float Radius) {
	return length(max(abs(CenterPosition) - Size + Radius, 0.0)) - Radius;
}

void main() {
	vec2 uv = vUv;

	/*vec2 debugUV = uv * 4.;
	vec2 debugUV2 = uv * 4. - vec2(2, 0);

	if (debugUV.x >= 0. && debugUV.x <= 1. && debugUV.y >= 0. && debugUV.y <= 1.) {
		FragColor = vec4(fract(textureLod(tDebug, debugUV, 0.).rrr / 100.), 1);
		return;
	}

	if (debugUV2.x >= 0. && debugUV2.x <= 1. && debugUV2.y >= 0. && debugUV2.y <= 1.) {
		FragColor = vec4(fract(textureLod(tDebug, debugUV2, 1.).rrr / 100.), 1);
		return;
	}*/

	vec4 labels = vec4(0);

	#if LABELS_ENABLED == 1
		labels = texture(tLabels, uv);

		float bordersSDF = roundedBoxSDF(vUv * resolution - resolution * 0.5, resolution * 0.5, 100.);
		labels.a *= smoothstep(0., -100., bordersSDF);
	#endif

	vec3 sceneColor = LINEARtoSRGB(texture(tHDR, uv).rgb);
	vec3 sceneWithLabelsColor = mix(sceneColor, labels.rgb, labels.a);

	FragColor = vec4(sceneWithLabelsColor, 1);
}