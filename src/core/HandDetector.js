
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';

export class HandDetector {
    constructor() {
        this.video = null;
        this.handLandmarker = null;
        this.lastVideoTime = -1;
        this.results = null;

        // Public data structure to be read by the main loop
        this.data = {
            xNormalized: 0.5,
            pinchDistance: 0.0,
            proximity: 0.1, // Default
            isClosed: false,
            landmarks: []
        };

        this.isReady = false;
    }

    async initialize() {
        // 1. Setup Webcam
        this.video = document.getElementById('webcam');
        if (!this.video) {
            throw new Error("Video element not found");
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: 1280,
                    height: 720,
                    facingMode: "user"
                }
            });
            this.video.srcObject = stream;
            await new Promise(resolve => this.video.onloadedmetadata = () => {
                this.video.play();
                resolve();
            });
        } catch (err) {
            if (err.name === 'NotReadableError') {
                throw new Error("Camera is in use by another application.");
            } else if (err.name === 'NotAllowedError') {
                throw new Error("Camera permission denied.");
            } else if (err.name === 'NotFoundError') {
                throw new Error("No camera found.");
            } else {
                throw err;
            }
        }

        // 2. Setup MediaPipe HandLandmarker
        const vision = await FilesetResolver.forVisionTasks(
            "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
        );

        this.handLandmarker = await HandLandmarker.createFromOptions(vision, {
            baseOptions: {
                modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
                delegate: "CPU"
            },
            runningMode: "VIDEO",
            numHands: 1
        });

        this.isReady = true;
        console.log("Hand Detector Ready");
    }

    update() {
        if (!this.isReady || !this.video) return;

        let startTimeMs = performance.now();
        if (this.video.currentTime !== this.lastVideoTime) {
            this.lastVideoTime = this.video.currentTime;
            this.results = this.handLandmarker.detectForVideo(this.video, startTimeMs);
        }

        if (this.results && this.results.landmarks && this.results.landmarks.length > 0) {
            const landmarks = this.results.landmarks[0];
            this.processLandmarks(landmarks);
        } else {
            // Soft reset or keep last known good state?
            // tailored for continuous interaction, maybe slowly drift to center?
            // For now, we just don't update data, keeping last specific value
            this.data.pinchDistance = Math.max(0, this.data.pinchDistance - 0.05); // Decay pinch
        }
    }

    processLandmarks(landmarks) {
        this.data.landmarks = landmarks;

        const wrist = landmarks[0];
        const middleMCP = landmarks[9]; // Middle Finger Knuckle

        // 1. X Position (Flip X because webcam is mirrored)
        this.data.xNormalized = 1.0 - wrist.x;

        // 2. Proximity (Hand Size estimation)
        // Distance between Wrist and Middle Knuckle (relatively stable bone)
        const handSize = Math.sqrt(
            Math.pow(middleMCP.x - wrist.x, 2) +
            Math.pow(middleMCP.y - wrist.y, 2) +
            Math.pow(middleMCP.z - wrist.z, 2)
        );
        this.data.proximity = handSize;

        // 3. Openness (Average distance of all 5 fingertips from wrist, NORMALIZED by hand size)
        const tips = [4, 8, 12, 16, 20];
        let totalDist = 0;

        for (let i of tips) {
            const tip = landmarks[i];
            const dist = Math.sqrt(
                Math.pow(tip.x - wrist.x, 2) +
                Math.pow(tip.y - wrist.y, 2) +
                Math.pow(tip.z - wrist.z, 2)
            );
            totalDist += dist;
        }

        const avgDist = totalDist / 5;

        // Ratio of Tip-Dist to Hand-Size makes it independent of camera distance
        const opennessRatio = avgDist / handSize;

        // Empirically: Closed ~ 1.0 - 1.2, Open ~ 1.8 - 2.5
        const minRatio = 1.1;
        const maxRatio = 1.8;

        // 0.0 = Closed, 1.0 = Open
        this.data.pinchDistance = Math.max(0, Math.min(1, (opennessRatio - minRatio) / (maxRatio - minRatio)));

        // 4. Closed Fist Logic for switching/clutching
        this.data.isClosed = this.data.pinchDistance < 0.2;
    }
}
