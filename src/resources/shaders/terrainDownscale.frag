#include <versionPrecision>

out float FragColor;

in vec2 vUv;

uniform sampler2D tMap;

void main() {
    int level = 0;
    ivec2 pos = ivec2(gl_FragCoord.xy) * 2;
    float s00 = texelFetch(tMap, pos, level).r;
    float s10 = texelFetch(tMap, pos + ivec2(1, 0), level).r;
    float s01 = texelFetch(tMap, pos + ivec2(0, 1), level).r;
    float s11 = texelFetch(tMap, pos + ivec2(1, 1), level).r;
    FragColor = (s00 + s10 + s01 + s11) / 4.;
}