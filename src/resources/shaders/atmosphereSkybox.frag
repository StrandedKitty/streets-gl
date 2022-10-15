#include <versionPrecision>

#define PI 3.141592653589793
#define PI2 6.28318530718

out vec4 FragColor;

in vec2 vUv;

uniform sampler2D tMap;

uniform MainBlock {
    float faceId;
};

#include <atmosphere>

vec3 getFaceUVW(vec2 uv, float faceId) {
    float a = 2. * uv.x;
    float b = 2. * uv.y;

    /*if (faceId == 0.) return vec3(-a + 1., 1., 1. - b);// right
    if (faceId == 1.) return vec3(a - 1., -1., 1. - b);// left
    if (faceId == 2.) return vec3(-b + 1., a - 1., -1.);// top
    if (faceId == 3.) return vec3(b - 1., a - 1., 1.);// bottom
    if (faceId == 4.) return vec3(1., a - 1., 1. - b);// front
    if (faceId == 5.) return vec3(-1., 1. - a, 1. - b);// back*/

    if (faceId == 0.) return vec3(-1., b - 1., a - 1.);
    if (faceId == 1.) return vec3(1., b - 1., 1. - a);
    if (faceId == 2.) return vec3(1. - a, -1., 1. - b);
    if (faceId == 3.) return vec3(1. - a, 1., b - 1.);
    if (faceId == 4.) return vec3(1. - a, b - 1., -1.);
    if (faceId == 5.) return vec3(a - 1., b - 1., 1.);

    return vec3(0);
}

vec4 getValFromSkyLUT(vec3 rayDir, vec3 sunDir) {
    float height = length(viewPos);
    vec3 up = viewPos / height;

    float horizonAngle = safeacos(sqrt(height * height - groundRadiusMM * groundRadiusMM) / height);
    float altitudeAngle = horizonAngle - acos(dot(rayDir, up)); // Between -PI/2 and PI/2
    float azimuthAngle; // Between 0 and 2*PI
    if (abs(altitudeAngle) > (0.5*PI - .0001)) {
        // Looking nearly straight up or down.
        azimuthAngle = 0.0;
    } else {
        vec3 right = cross(sunDir, up);
        vec3 forward = cross(up, right);

        vec3 projectedDir = normalize(rayDir - up*(dot(rayDir, up)));
        float sinTheta = dot(projectedDir, right);
        float cosTheta = dot(projectedDir, forward);
        azimuthAngle = atan(sinTheta, cosTheta) + PI;
    }

    // Non-linear mapping of altitude angle. See Section 5.3 of the paper.
    float v = 0.5 + 0.5 * sign(altitudeAngle) * sqrt(abs(altitudeAngle) * 2.0 / PI);
    vec2 uv = vec2(azimuthAngle / (2.0 * PI), v);

    uv.y = 1. - uv.y;
    return texture(tMap, uv);
}

vec2 equiRectToCubeMap(vec2 uv, float faceId) {
    vec3 p = getFaceUVW(uv, faceId);

    // spheric to surface
    //float theta = atan(p.y,p.x);
    //float r = length(p);

    // correct spheric distortion for top and bottom faces
    // instead of just atan(p.z,r)
    //float phi =  asin(p.z / r);

    vec3 rayDir = normalize(p);
    vec3 pos = viewPos;
    float height = length(pos);
    vec3 up = pos / height;

    float horizonAngle = safeacos(sqrt(height * height - groundRadiusMM * groundRadiusMM) / height);
    float altitudeAngle = horizonAngle - acos(dot(rayDir, up)); // Between -PI/2 and PI/2
    float azimuthAngle; // Between 0 and 2*PI
    if (abs(altitudeAngle) > (0.5*PI - .0001)) {
        // Looking nearly straight up or down.
        azimuthAngle = 0.0;
    } else {
        vec3 right = cross(vec3(0, 0, 1), up);
        vec3 forward = cross(up, right);

        vec3 projectedDir = normalize(rayDir - up*(dot(rayDir, up)));
        float sinTheta = dot(projectedDir, right);
        float cosTheta = dot(projectedDir, forward);
        azimuthAngle = atan(sinTheta, cosTheta) + PI;
    }

    float v = 0.5 + 0.5 * sign(altitudeAngle) * sqrt(abs(altitudeAngle) * 2.0 / PI);
    vec2 uv2 = vec2(azimuthAngle / (2.0 * PI), v);

    FragColor = vec4(p,1);


    return uv2;

    //float v = 0.5 + 0.5 * sign(phi) * sqrt(abs(phi) * 2.0 / PI);
    //vec2 s = vec2(theta / (2.0 * PI), v);

    //s.y = 1. - s.y;

    //return s;
    //return 0.5 + vec2(theta / PI2, -phi / PI);
}

void main() {
    vec2 uv = vUv;
    uv.y = 1. - uv.y;
    //FragColor = texture(tMap, equiRectToCubeMap(vUv, faceId));
    //FragColor.rgb *= 5.;
    //FragColor.rgb = normalize(getFaceUVW(vUv, faceId));

    FragColor = getValFromSkyLUT(normalize(getFaceUVW(vUv, faceId)), vec3(0, 0, 1));
    FragColor.rgb *= 5.;
}