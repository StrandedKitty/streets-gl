vec3 getWaterNormalMapValue(vec2 uv, sampler2D waterNormalTexture) {
    vec3 col = texture(waterNormalTexture, uv).rgb;
    col.y = 1. - col.y;
    return col * 2. - 1.;
}

vec3 sampleWaterNormal(vec2 uv, float time, sampler2D waterNormalTexture) {
    float waveTime = time * 0.015;

    vec3 normalValue = (
    getWaterNormalMapValue(uv * 3. + waveTime, waterNormalTexture) * 0.45 +
    getWaterNormalMapValue(uv * 12. - waveTime, waterNormalTexture) * 0.45 +
    getWaterNormalMapValue(uv * 0.3 - waveTime * 0.5, waterNormalTexture) * 0.1
    );

    normalValue.z *= 2.;

    return normalize(normalValue.xzy);
}