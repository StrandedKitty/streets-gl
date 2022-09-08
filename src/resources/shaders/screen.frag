#include <versionPrecision>

out vec4 FragColor;

in vec2 vUv;

uniform sampler2D tHDR;

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

void main() {
	/*float scale = 0.72;
	vec2 uv = (vUv - 0.5) * scale + 0.5;
	vec2 distortedUv = computeUV(uv, 1., 1.);*/

	vec4 hdr = texture(tHDR, vUv);

	FragColor = vec4(LINEARtoSRGB(hdr.rgb), 1);
}