
uniform float uTime;
uniform float uScaleFactor;
uniform float uSize;
attribute float aRandomSpeed; 
attribute vec3 aColor; // Per-particle color

varying vec3 vPosition;
varying vec3 vColor; // Pass to fragment

void main() {
    vPosition = position;
    vColor = aColor;
    vec3 animatedPosition = position;
    
    // Add time-based expansion/movement
    float speed = aRandomSpeed * uTime * 0.1;
    animatedPosition += normalize(position) * speed; 

    // Apply gesture scale factor (Expansion/Contraction)
    animatedPosition *= uScaleFactor;

    // Final projection
    vec4 mvPosition = modelViewMatrix * vec4(animatedPosition, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    
    // Set size
    gl_PointSize = uSize * (10.0 / -mvPosition.z); 
}
