#include <versionPrecision>

out vec4 FragColor;

in vec2 vUv;

uniform sampler2D tHDR;
uniform sampler2D tLabels;

uniform Uniforms {
	vec2 resolution;
};

#include <gamma>

vec2 computeUV(vec2 uv, float k, float kcube) {
	vec2 t = uv - .5;
	float r2 = t.x * t.x + t.y * t.y;
	float f = 0.;

	if (kcube == 0.) {
		f = 1. + r2 * k;
	} else {
		f = 1. + r2 * (k + kcube * sqrt(r2));
	}

	return f * t + .5;
}

// from https://iquilezles.org/articles/distfunctions
float roundedBoxSDF(vec2 CenterPosition, vec2 Size, float Radius) {
	return length(max(abs(CenterPosition)-Size+Radius,0.0))-Radius;
}

void main() {
	/*float scale = 0.72;
	vec2 uv = (vUv - 0.5) * scale + 0.5;
	vec2 distortedUv = computeUV(uv, 1., 1.);*/

	vec4 hdr = texture(tHDR, vUv);
	vec4 labels = texture(tLabels, vUv);

	float bordersSDF = roundedBoxSDF(vUv * resolution - resolution * 0.5, resolution * 0.5, 100.);
	labels.a *= smoothstep(0., -100., bordersSDF);

	vec3 sceneColor = LINEARtoSRGB(hdr.rgb);
	vec3 sceneWithLabelsColor = mix(sceneColor, labels.rgb, labels.a);

	FragColor = vec4(sceneWithLabelsColor, 1);
}