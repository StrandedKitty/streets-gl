#include <versionPrecision>

out float FragColor;

in vec2 vUv;

uniform usampler2D tMap;

ivec2 decodePosition(uint v) {
    return ivec2(v & 0xFFFFu, v >> 16);
}

float getDistance(ivec2 samplePosition) {
    uint value = texelFetch(tMap, samplePosition, 0).x;
    vec2 pos = vec2(decodePosition(value));

    return distance(vec2(samplePosition), pos);
}

void main() {
    ivec2 pos = ivec2(gl_FragCoord.xy) * 2;

    float a = getDistance(pos);
    float b = getDistance(pos + ivec2(1, 0));
    float c = getDistance(pos + ivec2(0, 1));
    float d = getDistance(pos + ivec2(1, 1));

    FragColor = (a + b + c + d) * 0.25 / 8.;
}