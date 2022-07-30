#include <versionPrecision>

out vec4 FragColor;

in vec2 vUv;

uniform sampler2D tHDR;

void main() {
	vec4 s = texture(tHDR, vUv);

	FragColor = vec4(s.rgb, 1);
}