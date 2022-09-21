#include <versionPrecision>

#define AO_SAMPLES 4.
#define VELOCITY_THRESHOLD 0.00001

out vec4 FragColor;

in vec2 vUv;

uniform sampler2D tDepth;
uniform sampler2D tNormal;
uniform sampler2D tMotion;
uniform sampler2D tNoise;

uniform MainBlock {
    vec4 randomOffset;
    mat4 projectionMatrix;
    mat4 projectionMatrixInverse;
};

#include <reconstructPositionFromDepth>

vec3 readNormal(vec2 uv) {
    return texture(tNormal, uv).rgb * 2. - 1.;
}

vec3 readPosition(vec2 uv) {
    return reconstructPositionFromDepth(uv, texture(tDepth, uv).r, projectionMatrixInverse);
}

const float radius = 30.;
const float biasStart = 0.5;
const float biasDepthFactor = 200.;

void main() {
    vec2 noiseUv = gl_FragCoord.xy / vec2(textureSize(tNoise, 0));

    vec3 fragPos = readPosition(vUv);
    float bias = biasStart - fragPos.z / biasDepthFactor;

    vec3 normal = normalize(readNormal(vUv));
    float depth = fragPos.z;
    vec3 randomVec = normalize(texture(tNoise, noiseUv + randomOffset.xy).xyz);

    vec3 tangent = normalize(randomVec - normal * dot(randomVec, normal));
    vec3 bitangent = cross(normal, tangent);
    mat3 TBN = mat3(tangent, bitangent, normal);

    float occlusion = 0.;
    float movingSamples = 0.;

    for (float i = 0.; i < AO_SAMPLES; ++i) {
        float progress = i / AO_SAMPLES;
        vec2 sampleNoiseOffset = (i + 1.) * randomOffset.zw;
        vec3 test = texture(tNoise, noiseUv + sampleNoiseOffset).xyz;
        vec3 rotationVector = normalize(vec3(
            test.x * 2. - 1.,
            test.y * 2. - 1.,
            test.z
        ));
        rotationVector *= mix(0.1, 1., progress * progress);

        float scaledRadius = radius;
        if (-depth < 200.) scaledRadius *= -depth / 200.;

        vec3 smple = TBN * rotationVector;
        smple = fragPos + smple * scaledRadius;

        vec4 offset = projectionMatrix * vec4(smple, 1.0);
        offset.xyz /= offset.w;
        offset.xyz = offset.xyz * 0.5 + 0.5;

        float sampleDepth = readPosition(offset.xy).z;
        float rangeCheck = smoothstep(0., 1., scaledRadius / abs(depth - sampleDepth));
        occlusion += (sampleDepth >= smple.z + bias ? 1. : 0.) * rangeCheck;

        vec3 motionSample = texture(tMotion, offset.xy).xyz;
        movingSamples += step(VELOCITY_THRESHOLD, length(motionSample));
    }

    occlusion = 1. - occlusion / AO_SAMPLES;
    FragColor = vec4(occlusion, movingSamples / AO_SAMPLES, 0, 0);
}