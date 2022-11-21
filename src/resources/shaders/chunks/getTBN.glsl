mat3 getTBN(vec3 N, vec3 p, vec2 uv) {
    /* get edge vectors of the pixel triangle */
    vec3 dp1 = dFdx(p);
    vec3 dp2 = dFdy(p);
    vec2 duv1 = dFdx(uv);
    vec2 duv2 = dFdy(uv);

    /* solve the linear system */
    vec3 dp2perp = cross(dp2, N);
    vec3 dp1perp = cross(N, dp1);
    vec3 T = dp2perp * duv1.x + dp1perp * duv2.x;
    vec3 B = dp2perp * duv1.y + dp1perp * duv2.y;

    /* construct a scale-invariant frame */
    float invmax = inversesqrt(max(dot(T, T), dot(B, B)));
    return mat3(T * invmax, -B * invmax, N);
}