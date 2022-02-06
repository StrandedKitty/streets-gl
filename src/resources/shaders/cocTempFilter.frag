#version 300 es
precision highp float;
precision highp int;
precision highp sampler2D;
precision highp usampler2D;
precision highp sampler2DArray;
precision highp sampler3D;

out vec4 FragColor;

in vec2 vUv;

uniform sampler2D tCoC;
uniform sampler2D tCoCAccum;
uniform sampler2D tMotion;

const vec2 offsets[] = vec2[](
    vec2(1, 0),
    vec2(-1, 0),
    vec2(0, 1),
    vec2(0, -1)
);

void main() {
    vec2 texelSize = 1. / vec2(textureSize(tCoC, 0));

    float newSample = texture(tCoC, vUv).r;

    float maxNeighbor = newSample;
    float minNeighbor = newSample;

    vec3 closest = vec3(0.0, 0.0, newSample);

    for(int i = 0; i < 4; i++) {
        vec2 neighborUv = vUv + offsets[i] * texelSize;
        float neighborTexel = texture(tCoC, neighborUv).r;

        maxNeighbor = max(maxNeighbor, neighborTexel);
        minNeighbor = min(minNeighbor, neighborTexel);

        closest = neighborTexel < closest.z ? vec3(offsets[i], neighborTexel) : closest;
    }

    vec2 velocity = texture(tMotion, vUv + closest.xy * texelSize).xy;
    vec2 oldUV = vUv - velocity.xy;
    float accumSample = texture(tCoCAccum, oldUV).r;

    accumSample = clamp(accumSample, minNeighbor, maxNeighbor);

    float mixFactor = 0.1;

    bool a = any(greaterThan(oldUV, vec2(1)));
    bool b = any(lessThan(oldUV, vec2(0)));

    if(a || b) {
        mixFactor = 1.;
    }

    FragColor = vec4(vec3(mix(accumSample, newSample, mixFactor)), 1);
}