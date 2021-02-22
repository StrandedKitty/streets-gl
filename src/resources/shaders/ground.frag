#version 300 es
precision highp float;
precision highp int;

layout(location = 0) out vec4 outColor;
layout(location = 1) out vec3 outNormal;
layout(location = 2) out vec3 outPosition;
layout(location = 3) out vec4 outMetallicRoughness;
layout(location = 4) out vec4 outEmission;
layout(location = 5) out vec3 outMotion;
layout(location = 6) out uint outObjectId;

in vec2 vUv;
in vec3 vNormal;
in vec3 vPosition;
in vec4 vClipPos;
in vec4 vClipPosPrev;

uniform sampler2D map;

void main() {
    outColor = texture(map, vUv);

    float borderSize = 0.005;
    if(vUv.x > 1. - borderSize || vUv.y > 1. - borderSize || vUv.x < borderSize || vUv.y < borderSize) {
        outColor = vec4(1, 0, 0, 1);
    }

    outNormal = vNormal * 0.5 + 0.5;
    outPosition = vPosition;
    outMetallicRoughness = vec4(0);
    outEmission = vec4(0);
    outMotion = 0.5 * vec3(vClipPos / vClipPos.w - vClipPosPrev / vClipPosPrev.w);
    outObjectId = 0u;
}
