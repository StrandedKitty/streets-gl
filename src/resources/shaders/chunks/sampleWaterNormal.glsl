vec3 getWaterNormalMapValue(vec2 uv, float scale, sampler2D normalTexture, sampler2D noiseTexture) {
    vec3 col = textureNoTile(noiseTexture, normalTexture, uv, 256. * scale, scale);
    return col * 2. - 1.;
}

vec3 sampleWaterNormal(sampler2D normalTexture, sampler2D noiseTexture, vec2 uv, float time) {
    float waveTime = time * 0.001 / 256.;

    vec3 normalValue = (
        getWaterNormalMapValue(uv + waveTime, 16., normalTexture, noiseTexture) * 0.5 +
        getWaterNormalMapValue(uv - waveTime, 8., normalTexture, noiseTexture) * 0.5
    );

    normalValue = mix(normalValue, vec3(0, 0, 1), 0.9);

    return normalize(normalValue.xzy);
}