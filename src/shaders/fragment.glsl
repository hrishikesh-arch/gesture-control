
uniform float uColorHue; 
varying vec3 vPosition; 
varying vec3 vColor;

void main() {
    // 1. Base Color from Vertex Shader
    vec3 color = vColor;
    
    // 2. Shape: circular/soft-edge look using gl_PointCoord
    vec2 c = gl_PointCoord - 0.5; // Center at (0, 0)
    float dist = dot(c, c) * 4.0; // 0 to 4 (edge)
    
    if (dist > 1.0) discard; // Round particles

    // 3. alpha calculation for 'Glossy' look
    // Sharp core, soft glow
    float alpha = 1.0 - dist; 
    alpha = pow(alpha, 2.0); // Sharper falloff to make it look like a light point
    
    // Add a bit of "brightness" boost to the center
    color += vec3(0.2) * (1.0 - dist); // White highlight in center

    // Final Output (Additive blending handles the rest)
    gl_FragColor = vec4(color, alpha);
}
