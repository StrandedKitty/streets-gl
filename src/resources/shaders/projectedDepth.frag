#include <versionPrecision>

in vec2 vUv;
flat in int vTextureId;

uniform sampler2DArray tMap;

void main() {
	int layer = (vTextureId - 1) * 3;
	vec4 color = texture(tMap, vec3(vUv, layer));

	if (color.a < 0.5) {
		discard;
	}
}
