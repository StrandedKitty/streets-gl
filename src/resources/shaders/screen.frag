#include <versionPrecision>

out vec4 FragColor;

in vec2 vUv;

uniform sampler2D tHDR;

#include <gamma>

void main() {
	vec4 hdr = texture(tHDR, vUv);

	FragColor = vec4(LINEARtoSRGB(hdr.rgb), 1);
}