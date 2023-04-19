vec3 textureNoTile(sampler2D noiseSamp, sampler2D colorSamp, vec2 uv, float uvScale, float uvScaleNoise) {
    // sample variation pattern
    float k = texture(noiseSamp, uv * uvScaleNoise).x;// cheap (cache friendly) lookup

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

    vec3 delta = cola - colb;
    float sum = delta.x + delta.y + delta.z;

    // interpolate between the two virtual patterns
    return mix(cola, colb, smoothstep(0.2, 0.8, f - 0.1 * sum));
}