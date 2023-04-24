#include <versionPrecision>
#include <gBufferOut>

in vec3 vNormal;
in vec3 vPosition;
in vec4 vClipPos;

uniform samplerCube tSky;

uniform Uniforms {
    mat4 projectionMatrix;
    mat4 modelViewMatrix;
    mat4 viewMatrix;
    mat4 skyRotationMatrix;
};

#include <packNormal>
#include <gamma>

void main() {
    vec3 view = normalize(-vPosition);
    vec3 worldView = normalize((viewMatrix * vec4(view, 0)).xyz);

    vec3 starsDirection = (skyRotationMatrix * vec4(-worldView, 0.)).xyz;
    vec3 stars = texture(tSky, starsDirection).rgb;

    outColor = vec4(stars.rgb, 0);
    outGlow = vec3(0);
    outNormal = packNormal(vNormal);
    outRoughnessMetalnessF0 = vec3(0);
    outMotion = vec3(0);
    outObjectId = 0u;
}