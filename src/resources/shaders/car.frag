#include <versionPrecision>
#include <gBufferOut>

in vec3 vColor;
in vec3 vNormal;
in vec3 vPosition;
in vec4 vClipPos;
in vec4 vClipPosPrev;

#include <packNormal>
#include <getMotionVector>

void main() {
	outColor = vec4(vColor, 1.0);
	outGlow = vec3(0);

	vec3 normal = normalize(vNormal) * (float(gl_FrontFacing) * 2.0 - 1.0);
	outNormal = packNormal(normal);

	outRoughnessMetalnessF0 = vec3(0.7, 0.05, 0.04);
	outMotion = getMotionVector(vClipPos, vClipPosPrev);
	outObjectId = 0u;
}
