#include <versionPrecision>
#include <gBufferOut>

in vec3 vNormal;

#include <packNormal>

void main() {
    outColor = vec4(normalize(vNormal) * 0.5 + 0.5, 1);
    outNormal = packNormal(vNormal);
    outPosition = vec3(0, 0, -1e8);
}