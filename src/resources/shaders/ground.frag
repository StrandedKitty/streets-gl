#include <versionPrecision>
#include <gBufferOut>

in vec2 vUv;
in vec3 vNormal;
in vec3 vPosition;
in vec4 vClipPos;
in vec4 vClipPosPrev;

uniform PerMesh {
    mat4 modelViewMatrix;
    mat4 modelViewMatrixPrev;
};

uniform sampler2D grass;
uniform sampler2D grassNoise;
uniform sampler2D grassNormal;
uniform sampler2D waterNormal;
uniform float time;

#include <packNormal>
#include <getMotionVector>

float sum(vec3 v) { return v.x + v.y + v.z; }

vec3 textureNoTile(sampler2D noiseSamp, sampler2D colorSamp, vec2 uv, float uvScale) {
    // sample variation pattern
    float k = texture(noiseSamp, uv / uvScale).x;// cheap (cache friendly) lookup

    // compute index
    float index = k * 8.0;
    float i = floor(index);
    float f = fract(index);

    // offsets for the different virtual patterns
    vec2 offa = sin(vec2(3.0, 7.0)*(i+0.0));
    vec2 offb = sin(vec2(3.0, 7.0)*(i+1.0));

    // compute derivatives for mip-mapping
    vec2 dx = dFdx(uv * uvScale), dy = dFdy(uv * uvScale);

    // sample the two closest virtual patterns
    vec3 cola = textureGrad(colorSamp, uv * uvScale + offa, dx, dy).rgb;
    vec3 colb = textureGrad(colorSamp, uv * uvScale + offb, dx, dy).rgb;

    // interpolate between the two virtual patterns
    return mix(cola, colb, smoothstep(0.2, 0.8, f - 0.1 * sum(cola - colb)));
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

vec3 getNormal(vec3 normalTextureValue) {
    mat3 tbn = getTBN(vNormal, vPosition, vUv);
    vec3 mapValue = normalTextureValue * 2. - 1.;
    mapValue.x *= 0.2;
    mapValue.y *= 0.2;
    vec3 normal = normalize(tbn * normalize(mapValue));

    normal *= float(gl_FrontFacing) * 2. - 1.;

    return normal;
}

void main() {
    outColor = vec4(textureNoTile(grassNoise, grass, vUv, 6.), 0.5);

    /*float borderSize = 0.005;
    if(vUv.x > 1. - borderSize || vUv.y > 1. - borderSize || vUv.x < borderSize || vUv.y < borderSize) {
        outColor = vec4(1, 0, 0, 1);
    }*/

    float waveTime = time * 0.1;
    vec2 uvOffsets[3] = vec2[](
        vec2(0.4, 0) * waveTime,
        vec2(0.3, 0.1) * waveTime,
        vec2(0, 0.2) * waveTime
    );

    vec3 normalValue =
        texture(waterNormal, vUv * 2. + uvOffsets[0]).rgb * 0.4 +
        texture(waterNormal, vUv * 5. + uvOffsets[1]).rgb * 0.5 +
        texture(waterNormal, vUv * 9. + uvOffsets[2]).rgb * 0.1;

    outNormal = packNormal(getNormal(textureNoTile(grassNoise, grassNormal, vUv, 6.)));
    //outNormal = packNormal(getNormal(normalValue));
    //outNormal = packNormal(vNormal);
    outPosition = vPosition;
    outMotion = getMotionVector(vClipPos, vClipPosPrev);
    outObjectId = 0u;
}
