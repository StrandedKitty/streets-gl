#include <versionPrecision>
#include <gBufferOut>

in vec2 vUv;
in vec3 vNormal;
in vec3 vPosition;
in vec4 vClipPos;
in vec4 vClipPosPrev;

uniform MainBlock {
    mat4 projectionMatrix;
    mat4 modelMatrix;
    mat4 viewMatrix;
    mat4 modelViewMatrixPrev;
};

uniform sampler2DArray tColor;
uniform sampler2DArray tNormal;
uniform sampler2D tVolumeNormal;

#include <packNormal>
#include <getMotionVector>

vec4 readDiffuse(vec2 uv) {
    return texture(tColor, vec3(uv, 0));
}

vec4 readNormal(vec2 uv) {
    return texture(tNormal, vec3(uv, 0));
}

vec4 readVolumeNormal(vec2 uv) {
    return texture(tVolumeNormal, uv);
}

vec3 getNormal() {
    vec2 uv = gl_FrontFacing ? vUv : -vUv;

    vec3 pos_dx = dFdx(vPosition);
    vec3 pos_dy = dFdy(vPosition);
    vec3 tex_dx = dFdx(vec3(uv, 0));
    vec3 tex_dy = dFdy(vec3(uv, 0));
    vec3 t = (tex_dy.t * pos_dx - tex_dx.t * pos_dy) / (tex_dx.s * tex_dy.t - tex_dy.s * tex_dx.t);

    vec3 ng = normalize(vNormal);

    t = normalize(t - ng * dot(ng, t));
    vec3 b = normalize(cross(ng, t));
    mat3 tbn = mat3(t, b, ng);

    vec3 map1 = readNormal(vUv).rgb * 2. - 1.;
    vec3 map2 = readVolumeNormal(vUv).rgb * 2. - 1.;

    vec3 normal = normalize(tbn * mix(map1, map2, 0.5));

    normal *= float(gl_FrontFacing) * 2.0 - 1.0;

    return normal;
}

void main() {
    vec4 color = readDiffuse(vUv);

    if (color.a < 0.5) {
        discard;
    }

    outColor = vec4(color.rgb, 1);
    outNormal = packNormal(vNormal * (float(gl_FrontFacing) * 2.0 - 1.0));
    outPosition = vPosition;
    outMotion = getMotionVector(vClipPos, vClipPosPrev);
    outObjectId = 0u;
}
