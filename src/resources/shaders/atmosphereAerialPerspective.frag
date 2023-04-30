#include <versionPrecision>

#define PLANET_RADIUS_OFFSET 0.00001
#define SLICES_PER_DRAW 8

out vec4 FragColor[SLICES_PER_DRAW];

in vec2 vUv;

uniform sampler2D tTransmittanceLUT;
uniform sampler2D tMultipleScatteringLUT;

uniform Common {
    mat4 projectionMatrixInverse;
    mat4 viewMatrixInverse;
    vec3 cameraPosition;
    vec3 sunDirection;
};

uniform PerDraw {
    float sliceIndexOffset;
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

        vec3 newPos = pos + t * rayDir;

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
    vec3 ClipSpace = vec3(vUv * vec2(2, -2) - vec2(1, -1), 0.5);
    vec4 HViewPos = projectionMatrixInverse * vec4(ClipSpace, 1);
    vec3 WorldDir = normalize(vec3(viewMatrixInverse * vec4(HViewPos.xyz / HViewPos.w, 0)));

    float earthR = groundRadiusMM;
    vec3 earthO = vec3(0.0, 0.0, -earthR);
    vec3 camPos = vec3(0, min(0.01, cameraPosition.y / 1000000.), 0) + vec3(0, earthR, 0);

    vec3 WorldPos = camPos;

    vec4 outputValues[SLICES_PER_DRAW];

    for (int i = 0; i < SLICES_PER_DRAW; i++) {
        float sliceIndex = float(i) + sliceIndexOffset;

        float tMax = aerialPerspectiveSliceToDepth(sliceIndex + 0.5);
        vec3 newWorldPos = WorldPos + tMax * WorldDir;

        float viewHeight = length(newWorldPos);

        // If the voxel is under the ground, make sure to offset it out on the ground.
        if (length(newWorldPos) <= groundRadiusMM + PLANET_RADIUS_OFFSET) {
            // Apply a position offset to make sure no artefact are visible close to the earth boundaries for large voxel.
            newWorldPos = normalize(newWorldPos) * (groundRadiusMM + PLANET_RADIUS_OFFSET);
            WorldDir = normalize(newWorldPos - camPos);
            tMax = length(newWorldPos - camPos);
        }

        vec4 result = raymarchScattering(WorldPos, WorldDir, -sunDirection, tMax, float(numScatteringSteps));
        result.rgb *= 5.;

        outputValues[i] = result;
    }

    FragColor = outputValues;
}