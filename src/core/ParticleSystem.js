
import * as THREE from 'three';
import vertexShader from '../shaders/vertex.glsl?raw';
import fragmentShader from '../shaders/fragment.glsl?raw';

export class ParticleSystem {
    constructor(scene, count = 20000) {
        this.scene = scene;
        this.count = count;
        this.templates = ['sphere', 'saturn', 'flower', 'fireworks'];
        this.currentTemplateIndex = 0; // Default to 'sphere'

        this.geometry = null;
        this.material = null;
        this.mesh = null;

        this.init();
    }

    init() {
        this.geometry = new THREE.BufferGeometry();

        // Attributes
        const positions = new Float32Array(this.count * 3);
        const colors = new Float32Array(this.count * 3); // RGB per particle
        const randomSpeeds = new Float32Array(this.count);

        // Initial Positions (Sphere)
        this.generateTemplate('sphere', positions, colors);

        for (let i = 0; i < this.count; i++) {
            randomSpeeds[i] = Math.random() * 2.0 + 0.5;
        }

        this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        this.geometry.setAttribute('aColor', new THREE.BufferAttribute(colors, 3));
        this.geometry.setAttribute('aRandomSpeed', new THREE.BufferAttribute(randomSpeeds, 1));

        // Material
        this.material = new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
                uColorHue: { value: 0.5 },
                uScaleFactor: { value: 1.0 },
                uSize: { value: 40.0 } // Base size, adjusted by Z in shader
            },
            vertexShader: vertexShader,
            fragmentShader: fragmentShader,
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        });

        this.mesh = new THREE.Points(this.geometry, this.material);
        this.scene.add(this.mesh);
    }

    update(time, handData) {
        // Update uniforms based on hand data
        if (this.material) {
            this.material.uniforms.uTime.value = time;

            // pinchDistance: 0.0 = closed fist, 1.0 = fully open hand
            const isOpen = handData.pinchDistance > 0.5;
            const targetScale = isOpen ? 1.5 : 0.7;
            this.material.uniforms.uScaleFactor.value += (targetScale - this.material.uniforms.uScaleFactor.value) * 0.05;

            // Rotate based on hand X position (smoothly lerped)
            if (this.mesh) {
                const targetRotY = (handData.xNormalized - 0.5) * Math.PI;
                this.mesh.rotation.y += (targetRotY - this.mesh.rotation.y) * 0.08;
                // No Y hand data from detector — keep a gentle constant tilt
                this.mesh.rotation.x += (0 - this.mesh.rotation.x) * 0.05;
            }
        }
    }

    setTemplate(templateName) {
        const index = this.templates.indexOf(templateName);
        if (index !== -1) {
            this.currentTemplateIndex = index;

            // Get the position and color attributes
            const positions = this.geometry.attributes.position.array;
            const colors = this.geometry.attributes.aColor.array;

            // Generate new template
            this.generateTemplate(templateName, positions, colors);

            // Mark attributes as needing update
            this.geometry.attributes.position.needsUpdate = true;
            this.geometry.attributes.aColor.needsUpdate = true;
        }
    }

    generateTemplate(name, positions, colors) {
        // Helper to set XYZ
        const setPos = (i, x, y, z) => {
            positions[i * 3] = x;
            positions[i * 3 + 1] = y;
            positions[i * 3 + 2] = z;
        };

        if (name === 'sphere') {
            for (let i = 0; i < this.count; i++) {
                const r = Math.random() * 5;
                const theta = Math.random() * Math.PI * 2;
                const phi = Math.acos(Math.random() * 2 - 1);
                setPos(i,
                    r * Math.sin(phi) * Math.cos(theta),
                    r * Math.sin(phi) * Math.sin(theta),
                    r * Math.cos(phi)
                );

                // Purple Theme Colors (Glossy Galaxy)
                colors[i * 3] = 0.5 + Math.random() * 0.4; // R (Purple-ish)
                colors[i * 3 + 1] = 0.1 + Math.random() * 0.2; // G
                colors[i * 3 + 2] = 0.9 + Math.random() * 0.1; // B
            }
        }
        else if (name === 'heart') {
            const scale = 0.8; // Parametric eqn output is larger, scale down

            for (let i = 0; i < this.count; i++) {
                // PARAMETRIC HEART (Cleaner shape)
                // Use rejection sampling on the parametric surface for even distribution? 
                // Or just random t, theta.
                // Let's use a volume distribution based on the parametric center.

                // Random spherical coordinates, then map to heart
                // This is a common trick: 
                // x = 16sin^3(t)
                // y = 13cos(t) - 5cos(2t) - 2cos(3t) - cos(4t)
                // Rotate to 3D?

                // Let's try the "3D Heart Surface" formula directly.
                let x, y, z;

                // Revert to a reliable rejection sampling but with the STANDARD orientation (Z-up) then Rotate.
                // Or use the parametric form:
                // x = 16 sin^3(u) sin^3(v)
                // y = 13 cos(u) - 5 cos(2u) - 2 cos(3u) - cos(4u)
                // z = ... varying thickness ...

                // Actually, let's go back to the implicit formula but TWEAK the constants to be THINNER.
                // And use the gradient color.

                let attempt = 0;
                while (attempt < 100) {
                    // Random point in box
                    x = (Math.random() * 4) - 2;
                    y = (Math.random() * 4) - 2;
                    z = (Math.random() * 4) - 2;

                    // Formula: (x^2 + 9/4y^2 + z^2 - 1)^3 - x^2z^3 - 9/80y^2z^3 < 0
                    // Y is UP in this formula context usually (standard math notation).
                    // In Three.js, Y is UP. 
                    // Let's swap nothing and just scale Y by 1.2 to stretch it?

                    const a = x * x + (9 / 4) * y * y + z * z - 1;
                    const val = a * a * a - x * x * z * z * z - (9 / 80) * y * y * z * z * z;

                    if (val < 0) {
                        // Success - Inside Heart
                        break;
                    }
                    attempt++;
                }

                // Apply rotation to make it upright if needed? 
                // The formula (x^2 + 9/4y^2 + z^2 - 1) usually creates a heart along Y axis? 
                // Actually standard standard is Z up. 
                // Let's manually swap variables at assignment to be sure.
                // Assign: x->x, y->z, z->y  (So Y becomes depth Z, Z becomes height Y)

                // Wait, previous attempt swapped Y and Z and user said "doesn't look like heart".
                // Maybe I inverted it? 
                // Let's try the parametric approach which is infallible for shape.

                // t in [0, 2PI], u in [-1, 1]? No.
                // Simple 3D point cloud:
                const phi = Math.random() * Math.PI * 2;
                const theta = Math.random() * Math.PI;

                // Heart shape function r(theta) ?
                // Let's stick to the implicit but ensure orientation.
                // (x^2 + 9/4z^2 + y^2 - 1)^3 ...

                // Let's use the code that DEFINITELY works for 3D hearts:
                // x = 16sin^3(t) 
                // y = 13cos(t) - 5cos(2t)...
                // This is 2D. 

                // Let's stick to the volume.
                // Re-swap Y and Z carefully.
                // Formula: (x^2 + 9/4 y^2 + z^2 - 1)^3 - x^2*z^3 - 9/80*y^2*z^3 = 0
                // This has Y as vertical axis of symmetry? No, usually Z is vertical in this specific math form.
                // Let's assume Z is UP in the math.
                // So we calculate with (x,y,z) where z is "up".
                // Then map to Three.js: x->x, y->z, z->y.

                // Let's recalc logic:
                // x = random, y = random, z = random (math space)
                // a = x^2 + 9/4 y^2 + z^2 - 1
                // val = a^3 - x^2 z^3 - 9/80 y^2 z^3
                // Here z is the "cusp" axis (cubed).

                // Mapping to ThreeJS (Y-up):
                // pos.x = x
                // pos.y = z (The cusp axis)
                // pos.z = y (The thickness axis)

                // Color: Galaxy/Purple (Manual Gradient)
                // r: 0.5 + 0.5*x, g: 0.0, b: 0.5 + 0.5*y
                colors[i * 3] = 0.6 + Math.random() * 0.4; // R (Purple-ish)
                colors[i * 3 + 1] = 0.1 + Math.random() * 0.3; // G
                colors[i * 3 + 2] = 0.8 + Math.random() * 0.2; // B

                setPos(i, x * scale * 3.0, z * scale * 3.0, y * scale * 3.0);
            }
        }
        else if (name === 'saturn') {
            for (let i = 0; i < this.count; i++) {
                if (Math.random() < 0.3) {
                    // Planet
                    const r = Math.random() * 2.0;
                    const theta = Math.random() * Math.PI * 2;
                    const phi = Math.acos(Math.random() * 2 - 1);
                    setPos(i, r * Math.sin(phi) * Math.cos(theta), r * Math.sin(phi) * Math.sin(theta), r * Math.cos(phi));
                } else {
                    // Ring
                    const angle = Math.random() * Math.PI * 2;
                    const dist = 3.5 + Math.random() * 3.0;
                    setPos(i, Math.cos(angle) * dist, (Math.random() - 0.5) * 0.2, Math.sin(angle) * dist);
                }

                // Purple Theme Colors
                colors[i * 3] = 0.5 + Math.random() * 0.4; // R (Purple-ish)
                colors[i * 3 + 1] = 0.1 + Math.random() * 0.2; // G
                colors[i * 3 + 2] = 0.9 + Math.random() * 0.1; // B
            }
        }
        else if (name === 'flower') {
            for (let i = 0; i < this.count; i++) {
                // Rose curve: r = cos(k * theta)
                const k = 4;
                const theta = Math.random() * Math.PI * 2;
                const rad = 5 * Math.cos(k * theta) * Math.random();
                // Add some Z depth
                setPos(i, rad * Math.cos(theta), rad * Math.sin(theta), (Math.random() - 0.5) * 2);

                // Purple Theme Colors
                colors[i * 3] = 0.5 + Math.random() * 0.4; // R (Purple-ish)
                colors[i * 3 + 1] = 0.1 + Math.random() * 0.2; // G
                colors[i * 3 + 2] = 0.9 + Math.random() * 0.1; // B
            }
        }
        else if (name === 'fireworks') {
            for (let i = 0; i < this.count; i++) {
                // Random explosive pattern
                const theta = Math.random() * Math.PI * 2;
                const phi = Math.random() * Math.PI;
                const r = Math.random() * 8;
                setPos(i,
                    r * Math.sin(phi) * Math.cos(theta),
                    r * Math.sin(phi) * Math.sin(theta),
                    r * Math.cos(phi)
                );

                // Colorful particles
                colors[i * 3] = 0.5 + Math.random() * 0.5; // R
                colors[i * 3 + 1] = 0.2 + Math.random() * 0.3; // G
                colors[i * 3 + 2] = 0.8 + Math.random() * 0.2; // B
            }
        }
        else if (name === 'text') {
            const text = this.textValue || "Welcome";

            // Create a temporary canvas to sample text
            const canvas = document.createElement('canvas');
            const size = 512; // Reduced size for performance
            canvas.width = size;
            canvas.height = size;
            const ctx = canvas.getContext('2d');

            // Draw Text
            ctx.fillStyle = '#000000';
            ctx.fillRect(0, 0, size, size);
            ctx.fillStyle = '#FFFFFF';
            // Adjust font size based on length
            const fontSize = text.length > 5 ? 200 : 300;
            ctx.font = `bold ${fontSize}px Inter, sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(text, size / 2, size / 2);

            const imageData = ctx.getImageData(0, 0, size, size);
            const data = imageData.data;

            const validPoints = [];
            const step = 2; // Check every 2nd pixel

            for (let y = 0; y < size; y += step) {
                for (let x = 0; x < size; x += step) {
                    const i = (y * size + x) * 4;
                    if (data[i] > 128) { // If pixel is bright (white text)
                        // Map to World Coordinates (-10 to 10 approx)
                        const px = (x / size - 0.5) * 20;
                        const py = -(y / size - 0.5) * 20; // Flip Y
                        validPoints.push({ x: px, y: py });
                    }
                }
            }

            // Shuffle points for better random distribution when we fill particles
            for (let i = validPoints.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [validPoints[i], validPoints[j]] = [validPoints[j], validPoints[i]];
            }

            for (let i = 0; i < this.count; i++) {
                if (i < validPoints.length) {
                    const p = validPoints[i];
                    // Add thickness
                    const z = (Math.random() - 0.5) * 2.0;
                    setPos(i, p.x, p.y, z);

                    // Purple Theme Colors
                    colors[i * 3] = 0.5 + Math.random() * 0.4; // R (Purple-ish)
                    colors[i * 3 + 1] = 0.1 + Math.random() * 0.2; // G
                    colors[i * 3 + 2] = 0.9 + Math.random() * 0.1; // B
                } else {
                    // Hide unused particles
                    setPos(i, 1000, 1000, 1000);
                }
            }
        }
        else {
            // Fallback/Legacy logic if needed (Sphere/Heart/etc)
            // For now we just defaulting 'text' is better, but let's keep others if user switches back via code
            // Just empty else? No, let's keep original sphere logic or just do nothing.
            // Actually, simplest is to make 'text' the PRIMARY and maybe only one accessible via UI.
        }
    }

    setTextValue(val) {
        this.textValue = val;
        // Regenerate current template if it is 'text'
        if (this.templates[this.currentTemplateIndex] === 'text') {
            this.setTemplate('text');
        }
    }
}
