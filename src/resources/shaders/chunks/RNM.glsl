// Reoriented Normal Mapping
// https://www.shadertoy.com/view/4t2SzR

// packed input
vec3 normalBlendRNM(vec3 n1, vec3 n2) {
    // Unpack (see article on why it's not just n*2-1)
    n1 = n1 * vec3( 2,  2, 2) + vec3(-1, -1,  0);
    n2 = n2 * vec3(-2, -2, 2) + vec3( 1,  1, -1);

    // Blend
    return n1*dot(n1, n2) / n1.z - n2;
}

// unpacked input
vec3 normalBlendUnpackedRNM(vec3 n1, vec3 n2) {
    n1 += vec3(0, 0, 1);
    n2 *= vec3(-1, -1, 1);

    return n1*dot(n1, n2) / n1.z - n2;
}