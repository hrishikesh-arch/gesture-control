import * as THREE from 'three';
import { HandDetector } from './core/HandDetector.js';
import { ParticleSystem } from './core/ParticleSystem.js';

async function init() {
    // 1. Setup Three.js Scene
    const container = document.getElementById('canvas-container');
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 10;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // 2. Initialize Particle System
    const particleSystem = new ParticleSystem(scene, 15000);

    // 3. Initialize Hand Detector
    const handDetector = new HandDetector();
    try {
        await handDetector.initialize();
        document.getElementById('loading').style.display = 'none';
        document.getElementById('ui').style.display = 'block';
    } catch (e) {
        console.error("Failed to initialize hand detector:", e);
        document.getElementById('loading').innerText = "Error: " + e.message;
    }

    // 4. UI Controls
    document.getElementById('btn-sphere').addEventListener('click', () => particleSystem.setTemplate('sphere'));
    document.getElementById('btn-saturn').addEventListener('click', () => particleSystem.setTemplate('saturn'));
    document.getElementById('btn-flower').addEventListener('click', () => particleSystem.setTemplate('flower'));
    document.getElementById('btn-fireworks').addEventListener('click', () => particleSystem.setTemplate('fireworks'));

    // 5. Animation Loop
    const clock = new THREE.Clock();

    function animate() {
        requestAnimationFrame(animate);

        const time = clock.getElapsedTime();

        // Update Hand Tracker
        if (handDetector.isReady) {
            handDetector.update();
        }

        // Update Particles
        particleSystem.update(time, handDetector.data);

        // Render
        renderer.render(scene, camera);
    }

    // Handle Resize
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    animate();
}

init();
