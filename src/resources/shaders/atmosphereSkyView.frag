#include <versionPrecision>

out vec4 FragColor;

in vec2 vUv;

uniform sampler2D tTransmittanceLUT;
uniform sampler2D tMultipleScatteringLUT;

uniform Uniforms {
    vec3 sunDirection;
    float cameraHeight;
};

#include <atmosphere>

const int numScatteringSteps = 32;

vec4 raymarchScattering(vec3 pos, vec3 rayDir, vec3 sunDir, float tMax, float numSteps) {
    float cosTheta = dot(rayDir, sunDir);

    float miePhaseValue = getMiePhase(cosTheta);
    float rayleighPhaseValue = getRayleighPhase(-cosTheta);

    vec3 lum = vec3(0.0);
    vec3 transmittance = vec3(1.0);
    float t = 0.0;
    for (float i = 0.0; i < numSteps; i += 1.0) {
        float newT = ((i + 0.3)/numSteps)*tMax;
        float dt = newT - t;
        t = newT;

        vec3 newPos = pos + t*rayDir;

        vec3 rayleighScattering, extinction;
        float mieScattering;
        getScatteringValues(newPos, rayleighScattering, mieScattering, extinction);

        vec3 sampleTransmittance = exp(-dt*extinction);

        vec3 sunTransmittance = getValFromTLUT(tTransmittanceLUT, newPos, sunDir);
        vec3 psiMS = getValFromMultiScattLUT(tMultipleScatteringLUT, newPos, sunDir);

        vec3 rayleighInScattering = rayleighScattering*(rayleighPhaseValue*sunTransmittance + psiMS);
        vec3 mieInScattering = mieScattering*(miePhaseValue*sunTransmittance + psiMS);
        vec3 inScattering = (rayleighInScattering + mieInScattering);

        // Integrated scattering within path segment.
        vec3 scatteringIntegral = (inScattering - inScattering * sampleTransmittance) / extinction;

        lum += scatteringIntegral*transmittance;

        transmittance *= sampleTransmittance;
    }
    return vec4(lum, transmittance);
}

void main() {
    float azimuthAngle = (vUv.x - 0.5) * 2. * PI;
    // Non-linear mapping of altitude. See Section 5.3 of the paper.
    float adjV;
    if (vUv.y < 0.5) {
        float coord = 1.0 - 2.0 * vUv.y;
        adjV = -coord * coord;
    } else {
        float coord = vUv.y * 2.0 - 1.0;
        adjV = coord * coord;
    }

    float height = groundRadiusMM + cameraHeight;
    float horizonAngle = safeacos(sqrt(height * height - groundRadiusMM * groundRadiusMM) / height) - 0.5 * PI;
    float altitudeAngle = adjV * 0.5 * PI - horizonAngle;

    float cosAltitude = cos(altitudeAngle);
    vec3 rayDir = vec3(cosAltitude*sin(azimuthAngle), sin(altitudeAngle), -cosAltitude * cos(azimuthAngle));

    float atmoDist = rayIntersectSphere(viewPos, rayDir, atmosphereRadiusMM);
    float groundDist = rayIntersectSphere(viewPos, rayDir, groundRadiusMM);
    float tMax = (groundDist < 0.0) ? atmoDist : groundDist;

    FragColor = raymarchScattering(viewPos, rayDir, -sunDirection, tMax, float(numScatteringSteps));
}