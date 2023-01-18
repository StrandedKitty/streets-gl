#include <versionPrecision>

in vec3 position;
in vec2 uv;

out vec2 vUv;

void main() {
    vUv = uv;
    gl_Position = vec4(position * 2. - 1., 1);
}