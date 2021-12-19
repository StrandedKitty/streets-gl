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
uniform sampler2D grass;
uniform sampler2D noise;

float sum(vec3 v) { return v.x + v.y + v.z; }

vec3 textureNoTile(sampler2D noiseSamp, sampler2D colorSamp, vec2 uv, float uvScale)
{
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

void main() {
    outColor = vec4(textureNoTile(noise, grass, vUv, 4.), 1);

    float borderSize = 0.005;
    if(vUv.x > 1. - borderSize || vUv.y > 1. - borderSize || vUv.x < borderSize || vUv.y < borderSize) {
        //outColor = vec4(1, 0, 0, 1);
    }

    outNormal = vNormal * 0.5 + 0.5;
    outPosition = vPosition;
    outMetallicRoughness = vec4(0);
    outEmission = vec4(0);
    outMotion = 0.5 * vec3(vClipPos / vClipPos.w - vClipPosPrev / vClipPosPrev.w);
    outObjectId = 0u;
}
