#include <versionPrecision>
#include <gBufferOut>

in vec3 vNormal;
in vec3 vPosition;
in vec3 vWorldPosition;
in vec4 vClipPos;
in vec4 vClipPosPrev;

uniform samplerCube tSky;
uniform samplerCube tAtmosphere;
uniform sampler2D tTransmittanceLUT;

uniform Uniforms {
    mat4 projectionMatrix;
    mat4 modelViewMatrix;
    mat4 modelViewMatrixPrev;
    mat4 viewMatrix;
    mat4 skyRotationMatrix;
    vec3 sunDirection;
};

#include <packNormal>
#include <getMotionVector>
#include <atmosphere>
#include <gamma>

vec3 sunWithBloom(vec3 rayDir, vec3 sunDir) {
    const float sunSolidAngle = 0.53*PI/180.0;
    const float minSunCosTheta = cos(sunSolidAngle);

    float cosTheta = dot(rayDir, sunDir);
    if (cosTheta >= minSunCosTheta) return vec3(1.0);

    float offset = minSunCosTheta - cosTheta;
    float gaussianBloom = exp(-offset*50000.0)*0.5;
    float invBloom = 1.0/(0.02 + offset*300.0)*0.01;
    return vec3(gaussianBloom+invBloom);
}

void main() {
    vec3 view = normalize(-vPosition);
    vec3 worldView = normalize((viewMatrix * vec4(view, 0)).xyz);
    vec3 worldPosition = vec3(viewMatrix * vec4(vPosition, 1));

    vec3 sunColor = getValFromTLUT(tTransmittanceLUT, vec3(0, groundRadiusMM + worldPosition.y * 0.000001, 0), -sunDirection);
    vec4 skyColor = textureLod(tAtmosphere, -worldView, 0.);
    vec3 sunLum = sunWithBloom(worldView, sunDirection);
    sunLum = smoothstep(0.002, 1.0, sunLum) * 5.;
    if (length(sunLum) > 0.) {
        if (rayIntersectSphere(worldPosition, worldView, groundRadiusMM) >= 0.0) {
            sunLum = vec3(0);
        } else {
            sunLum *= sunColor;
        }

    }

    vec3 starsDirection = (skyRotationMatrix * vec4(-worldView, 0.)).xyz;
    vec3 stars = SRGBtoLINEAR(texture(tSky, starsDirection)).rgb;
    stars = pow(stars, vec3(5)) * 0.25;

    outColor = vec4(skyColor.rgb + sunLum + stars * skyColor.a, 0);
    outColor.rgb = LINEARtoSRGB(outColor.rgb);
    outNormal = packNormal(vNormal);
    outPosition = vPosition;
    outMotion = getMotionVector(vClipPos, vClipPosPrev);
    outObjectId = 0u;
}