#include <versionPrecision>

out uint FragColor;

in vec2 vUv;

uniform MainBlock {
    float step;
};

uniform usampler2D tMap;

ivec2 decodePosition(uint v) {
    return ivec2(v & 0xFFFFu, v >> 16);
}

uint encodePosition(ivec2 v) {
    return uint(v.x) | (uint(v.y) << 16);
}

vec2 fetchPosition(ivec2 pos) {
    uint color = texelFetch(tMap, pos, 0).x;

    return vec2(decodePosition(color));
}

// Jump Flooding in GPU with Applications to Voronoi Diagram and Distance Transform
// https://www.shadertoy.com/view/WlGyR3
// https://www.shadertoy.com/view/4syGWK

void main() {
    uint color = texture(tMap, vUv).x;

    int stepSize = int(exp2(step));

    ivec2 tc = ivec2(gl_FragCoord.xy);

    float best_dist = 999999.0;
    vec2 best_coord = vec2(0.0);
    vec2 center = vec2(tc);

    // search the 3x3 neighborhood
    for (int y = -1; y <= 1; ++y) {
        for (int x = -1; x <= 1; ++x) {
            ivec2 fc = tc + ivec2(x, y) * stepSize;
            vec2 ntc = fetchPosition(fc);

            if ((ntc.x != 0.) && (ntc.y != 0.)) {
                // compare the squared distance
                //vec2 diff = ntc - center;
                //float d = dot(diff, diff);

                float d = distance(ntc, center);

                if (d < best_dist) {
                    best_dist = d;
                    best_coord = ntc;
                }
            }
        }
    }

    FragColor = encodePosition(ivec2(best_coord));
}