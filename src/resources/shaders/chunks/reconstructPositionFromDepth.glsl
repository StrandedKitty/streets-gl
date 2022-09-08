vec3 reconstructPositionFromDepth(vec2 uv, float depth, mat4 inverseProjectionMatrix) {
    vec4 clipSpacePosition = vec4(uv * 2. - 1., depth * 2. - 1., 1.);
    vec4 position = inverseProjectionMatrix * clipSpacePosition;

    return position.xyz / position.w;
}