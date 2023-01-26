#include <versionPrecision>

out float FragColor;

in vec2 vUv;

uniform sampler2DArray tMap;

uniform MainBlock {
    int layer;
};

void main() {
    int level = 0;
    ivec3 pos = ivec3(ivec2(gl_FragCoord.xy) * 2, layer);
    float s00 = texelFetch(tMap, pos, level).r;
    float s10 = texelFetch(tMap, pos + ivec3(1, 0, 0), level).r;
    float s01 = texelFetch(tMap, pos + ivec3(0, 1, 0), level).r;
    float s11 = texelFetch(tMap, pos + ivec3(1, 1, 0), level).r;
    FragColor = (s00 + s10 + s01 + s11) / 4.;
}