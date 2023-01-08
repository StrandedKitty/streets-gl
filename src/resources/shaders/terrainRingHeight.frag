#include <versionPrecision>

out float FragColor;

in vec2 vUv;

uniform sampler2D tHeight;

uniform PerMesh {
    vec3 transformHeight;
    vec2 morphOffset;
    float size;
    float segmentCount;
    float isLastRing;
    vec2 cameraPosition;
    int levelId;
};

float sampleHeight(sampler2D tex, vec2 offset, int level, vec2 textureSize) {
    return texelFetch(tex, ivec2(offset * textureSize) / int(pow(2., float(level))), level).r;
}

void main() {
    //float height = texture(tHeight, vUv).r;

    vec2 vertexUV = (vUv - 0.5 / (segmentCount + 1.)) * ((segmentCount + 1.) / (segmentCount));
    vertexUV = (gl_FragCoord.xy - 0.5) / segmentCount;

    vec2 position = vec2(vertexUV.x, 1. - vertexUV.y) * size - size / 2.;

    vec2 dst = abs(cameraPosition - position);
    float morphFactor = max(dst.x, dst.y) / (size / 2.) * 2. - 1.;
    morphFactor = (morphFactor - 0.25) * 4.;
    morphFactor = clamp(morphFactor, 0., 1.);

    //if (levelId == 0) morphFactor = 1.;
    //if (levelId == 1) morphFactor = 0.;

    vec2 heightTexSize = vec2(textureSize(tHeight, 0));
    vec2 heightUV = vec2(vertexUV.x, 1. - vertexUV.y);

    vec2 heightSelfUV = transformHeight.xy + heightUV * transformHeight.z;
    float height = sampleHeight(tHeight, heightSelfUV, levelId, heightTexSize);

    vec2 t = mod(vertexUV * segmentCount + morphOffset, 2.);
    vec2 t2 = mod(vertexUV * segmentCount + morphOffset, 4.);
    //t = round(t);
    //t2 = round(t2);

    float heightSum = 0.;
    float heightWeight = 0.;

    vec2 offsetLeft = vec2(-1. / segmentCount, 0);
    vec2 offsetRight = vec2(1. / segmentCount, 0);

    vec2 offset = heightSelfUV;

    if (t.x == 0. && t.y == 0.) {
        heightSum += sampleHeight(tHeight, heightSelfUV, levelId + 1, heightTexSize);
        heightWeight += 1.;
    } else if (t.x == 1. && t.y == 0.) {
        heightSum += sampleHeight(tHeight, offset + offsetLeft.xy * transformHeight.z, levelId + 1, heightTexSize);
        heightSum += sampleHeight(tHeight, offset + offsetRight.xy * transformHeight.z, levelId + 1, heightTexSize);

        heightWeight += 2.;
    } else if (t.x == 0. && t.y == 1.) {
        heightSum += sampleHeight(tHeight, offset + offsetLeft.yx * transformHeight.z, levelId + 1, heightTexSize);
        heightSum += sampleHeight(tHeight, offset + offsetRight.yx * transformHeight.z, levelId + 1, heightTexSize);

        heightWeight += 2.;
    } else if (t.x == 1. && t.y == 1.) {
        float type = abs(t2.x - t2.y);

        if (type == 0.) {
            vec2 offset0 = vec2(-1. / segmentCount, -1. / segmentCount);
            vec2 offset1 = vec2(1. / segmentCount, 1. / segmentCount);

            heightSum += sampleHeight(tHeight, offset + offset0 * transformHeight.z, levelId + 1, heightTexSize);
            heightSum += sampleHeight(tHeight, offset + offset1 * transformHeight.z, levelId + 1, heightTexSize);

            heightWeight += 2.;
        } else {
            vec2 offset0 = vec2(-1. / segmentCount, 1. / segmentCount);
            vec2 offset1 = vec2(1. / segmentCount, -1. / segmentCount);

            heightSum += sampleHeight(tHeight, offset + offset0 * transformHeight.z, levelId + 1, heightTexSize);
            heightSum += sampleHeight(tHeight, offset + offset1 * transformHeight.z, levelId + 1, heightTexSize);

            heightWeight += 2.;
        }
    }

    if (heightWeight != 0.) {
        height = mix(height, heightSum / heightWeight, morphFactor);
    }

    //height = float(levelId) * 15.;

    FragColor = height;
}