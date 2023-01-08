vec4 sampleCatmullRom(sampler2D sampler, vec2 uv, vec2 textureSize) {
    vec2 position = textureSize * uv;
    vec2 centerPosition = floor(position - 0.5) + 0.5;
    vec2 f = position - centerPosition;
    vec2 f2 = f * f;
    vec2 f3 = f * f2;

    float c = 0.5;
    vec2 w0 =        -c  * f3 +  2.0 * c         * f2 - c * f;
    vec2 w1 =  (2.0 - c) * f3 - (3.0 - c)        * f2         + 1.0;
    vec2 w2 = -(2.0 - c) * f3 + (3.0 -  2.0 * c) * f2 + c * f;
    vec2 w3 =         c  * f3 -                c * f2;

    vec2 w12 = w1 + w2;
    vec2 offset12 = w2 / (w1 + w2);

    vec2 tc0 = (centerPosition - 1.) / textureSize;
    vec2 tc3 = (centerPosition + 2.) / textureSize;
    vec2 tc12 = (centerPosition + offset12) / textureSize;

    return texture(sampler, vec2(tc12.x, tc0.y)) * (w12.x * w0.y) +
    texture(sampler, vec2(tc0.x, tc12.y)) * (w0.x  * w12.y) +
    texture(sampler, vec2(tc12.x, tc12.y)) * (w12.x * w12.y) +
    texture(sampler, vec2(tc3.x, tc12.y)) * (w3.x  * w12.y) +
    texture(sampler, vec2(tc12.x, tc3.y)) * (w12.x * w3.y);
}