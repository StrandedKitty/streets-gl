#include <versionPrecision>
#include <gBufferOut>

in vec3 vColor;
in vec3 vNormal;
in vec3 vPosition;

uniform PerMesh {
    mat4 modelViewMatrix;
};

#include <packNormal>

void main() {
    vec3 n = vec3(modelViewMatrix * vec4(vNormal, 0));
    float fr = dot(n, vec3(0, 0, 1));

    outColor = vec4(vColor * fr, 1);
    outNormal = packNormal(vNormal);
    outPosition = vPosition;
}