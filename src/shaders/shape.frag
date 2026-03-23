precision lowp float;
uniform vec4 color;
varying vec2 uv;

uniform float width;
uniform float power;
uniform sampler2D texture;
uniform vec2 mouse;
uniform int N;
uniform float k0;

#include ./utils/pack.frag

void main(){
    // Beam always centered
    float source_x = 0.5;
    float uvx = uv.x;

    float A = smoothstep(0.0, 4.0/float(N), width*0.5-abs(uv.x-source_x))/sqrt(width)*0.025;

    float cs2 = pow((uvx-source_x), 2.0) * power;
    // Clamp to avoid sqrt of negative when beam is near edges
    float safe = max(0.0, 1.0 - cs2*power);
    float angle = k0 * cs2 / (1.0 + sqrt(safe));

    int n = int(uv.x * float(N));
    vec2 u = vec2(
        cos(angle),
        sin(angle)
    )*A;

    vec2 x = rgba2vec(texture2D(texture, uv));

    // Inject wave at the top row
    x = mix(
        x,
        u,
        step(1.0-1.0/float(N), uv.y)
    );

    // Absorbing border
    float border = clamp(1.0-min(float(n), float(N-n-1))/20.0, 0.0, 1.0);
    x = x*exp(-border*0.1);

    gl_FragColor = vec2rgba(x);
}
