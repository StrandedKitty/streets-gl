#version 300 es
precision highp float;
precision highp int;
precision highp sampler2D;
precision highp usampler2D;
precision highp sampler2DArray;
precision highp sampler3D;

out vec4 FragColor;

in vec2 vUv;

uniform sampler2D tPosition;
uniform sampler2D tNormal;
uniform sampler2D tNoise;
uniform vec3 samples[16];
uniform mat4 cameraProjectionMatrix;

vec3 readNormal(vec2 uv) {
    return texture(tNormal, uv).rgb * 2. - 1.;
}

vec3 readPosition(vec2 uv) {
    return vec3(texture(tPosition, uv)).rgb;
}

float readDepth(vec2 uv) {
    return readPosition(uv).z;
}

const int kernelSize = 16;
const float radius = 15.;
const float biasStart = 0.5;
const float biasDepthFactor = 1000.;

void main() {
    vec2 noiseScale = vec2(textureSize(tPosition, 0)) / vec2(textureSize(tNoise, 0));

    vec3 fragPos = readPosition(vUv);
    float bias = biasStart - fragPos.z / biasDepthFactor;

    vec3 normal = normalize(readNormal(vUv));
    float depth = readDepth(vUv);
    vec3 randomVec = normalize(texture(tNoise, vUv * noiseScale).xyz);

    vec3 tangent = normalize(randomVec - normal * dot(randomVec, normal));
    vec3 bitangent = cross(normal, tangent);
    mat3 TBN = mat3(tangent, bitangent, normal);

    float occlusion = 0.0;

    for (int i = 0; i < kernelSize; ++i) {
        vec3 smple = TBN * samples[i];
        smple = fragPos + smple * radius;

        vec4 offset = cameraProjectionMatrix * vec4(smple, 1.0);
        offset.xyz /= offset.w;
        offset.xyz = offset.xyz * 0.5 + 0.5;

        float sampleDepth = readDepth(offset.xy);

        float rangeCheck = smoothstep(0.0, 1.0, radius / abs(depth - sampleDepth));
        occlusion += (sampleDepth >= smple.z + bias ? 1.0 : 0.0) * rangeCheck;
    }

    occlusion = 1.0 - (occlusion / float(kernelSize));

    FragColor = vec4(vec3(occlusion), 1.0);
}