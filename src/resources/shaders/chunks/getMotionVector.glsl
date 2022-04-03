vec3 getMotionVector(vec4 clipPos, vec4 prevClipPos) {
    return 0.5 * vec3(clipPos / clipPos.w - prevClipPos / prevClipPos.w);
}