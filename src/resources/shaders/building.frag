#include <versionPrecision>
#include <gBufferOut>

in vec3 vColor;
in vec2 vUv;
in vec3 vNormal;
in vec3 vPosition;
flat in int vTextureId;
flat in uint vObjectId;
in vec4 vClipPos;
in vec4 vClipPosPrev;

uniform PerMesh {
    mat4 modelViewMatrix;
    mat4 modelViewMatrixPrev;
    uint tileId;
};

uniform sampler2DArray tRoofColor;
uniform sampler2DArray tRoofNormal;

#include <packNormal>
#include <getMotionVector>

vec3 getFlatNormal(vec3 position) {
    return normalize(cross(dFdx(position), dFdy(position)));
}

mat3 getTBN(vec3 N, vec3 p, vec2 uv) {
    /* get edge vectors of the pixel triangle */
    vec3 dp1 = dFdx(p);
    vec3 dp2 = dFdy(p);
    vec2 duv1 = dFdx(uv);
    vec2 duv2 = dFdy(uv);

    /* solve the linear system */
    vec3 dp2perp = cross(dp2, N);
    vec3 dp1perp = cross(N, dp1);
    vec3 T = dp2perp * duv1.x + dp1perp * duv2.x;
    vec3 B = dp2perp * duv1.y + dp1perp * duv2.y;

    /* construct a scale-invariant frame */
    float invmax = inversesqrt(max(dot(T, T), dot(B, B)));
    return mat3(T * invmax, -B * invmax, N);
}

vec3 getRoofNormal() {
    mat3 tbn = getTBN(vNormal, vPosition, vUv);
    vec3 mapValue = texture(tRoofNormal, vec3(vUv, vTextureId - 1)).xyz * 2. - 1.;
    vec3 normal = normalize(tbn * mapValue);

    normal *= float(gl_FrontFacing) * 2. - 1.;

    return normal;
}

void main() {
    vec3 n = vec3(modelViewMatrix * vec4(vNormal, 0));
    float fr = dot(n, vec3(0, 0, 1)) * 0.5 + 0.5;

    if(vTextureId == 0) {
        outColor = vec4(vColor, 1);
        outNormal = packNormal(vNormal);
    } else {
        outColor = texture(tRoofColor, vec3(vUv, 0.));
        outNormal = packNormal(getRoofNormal());
    }

    outColor.rgb *= fr;
    outPosition = vPosition;
    outMotion = getMotionVector(vClipPos, vClipPosPrev);
    outObjectId = vObjectId;
}