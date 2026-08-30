// js/ai_vision.js
const AIVision = {
    video: null,
    gestureRecognizer: null,
    lastVideoTime: -1,
    isCalibrating: false,
    calibrationStep: 1,
    isActive: false,
    isInitialized: false,
    currentGesture: 'None',
    confidence: 0,
    
    // Fallback variables
    cameraFailed: false,

    async init() {
        // Create hidden video element
        this.video = document.createElement('video');
        this.video.style.display = 'none';
        this.video.autoplay = true;
        this.video.playsInline = true;
        document.body.appendChild(this.video);

        try {
            const { GestureRecognizer, FilesetResolver } = await import("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/vision_bundle.mjs");

            const vision = await FilesetResolver.forVisionTasks(
                "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
            );
            this.gestureRecognizer = await GestureRecognizer.createFromOptions(vision, {
                baseOptions: {
                    modelAssetPath: "https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task",
                    delegate: "GPU"
                },
                runningMode: "VIDEO",
                numHands: 1
            });
            this.isInitialized = true;
        } catch(e) {
            console.error("AI Vision Model Load Failed:", e);
            this.handleCameraFailure(e);
        }
    },

    async startCamera() {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            console.error("getUserMedia is not supported in this browser. Ensure you are running on localhost or HTTPS.");
            this.handleCameraFailure(new Error("getUserMedia not supported (requires localhost/HTTPS)"));
            return false;
        }
        
        if (UI.elements.cameraStatus) {
            UI.elements.cameraStatus.textContent = "INITIALIZING...";
            UI.elements.cameraStatus.style.color = "#f39c12";
        }
        
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            this.video.srcObject = stream;
            
            // Wait for video to actually be ready
            return new Promise((resolve) => {
                this.video.addEventListener('loadeddata', () => {
                    this.isActive = true;
                    if (UI.elements.cameraStatus) {
                        UI.elements.cameraStatus.textContent = "ONLINE";
                        UI.elements.cameraStatus.style.color = "#00f3ff";
                    }
                    this.predictLoop();
                    resolve(true);
                });
            });
        } catch(e) {
            console.error("Camera Access Failed. Error details:", e.name, e.message);
            if (e.name === 'NotAllowedError') console.error("Permission denied by user.");
            else if (e.name === 'NotFoundError') console.error("No camera found on device.");
            else if (e.name === 'NotReadableError') console.error("Camera is already in use by another application.");
            else console.error(e);
            
            this.handleCameraFailure(e);
            return false;
        }
    },

    handleCameraFailure(error) {
        this.cameraFailed = true;
        this.isActive = false;
        if (UI.elements.cameraStatus) {
            if (error && error.name === 'NotAllowedError') {
                UI.elements.cameraStatus.textContent = "DENIED - KEYBOARD ENABLED";
            } else {
                UI.elements.cameraStatus.textContent = "UNAVAILABLE - KEYBOARD ENABLED";
            }
            UI.elements.cameraStatus.style.color = "#ff3333";
        }
    },

    async prepareCalibration() {
        UI.showScreen('calibration');
        document.getElementById('calibration-steps').classList.add('hidden');
        document.getElementById('btn-enable-camera').classList.remove('hidden');
        document.getElementById('calib-complete-msg').classList.add('hidden');
        document.getElementById('btn-start-sim').classList.add('hidden');
    },

    async startCalibration() {
        document.getElementById('btn-enable-camera').classList.add('hidden');
        document.getElementById('calibration-steps').classList.remove('hidden');
        document.getElementById('calib-step-1').innerHTML = "LOADING AI MODEL... <span class='status' style='color:#f39c12;'>PLEASE WAIT</span>";
        
        if (!this.isInitialized) {
            await this.init();
        }
        
        document.getElementById('calib-step-1').innerHTML = 'STEP 1: Show OPEN PALM <span class="status" style="color: #ff3333;">WAITING...</span>';
        
        if (!this.cameraFailed && !this.isActive) {
            const success = await this.startCamera();
            if (!success) {
                // Wait briefly so they see the error in the HUD, then start
                setTimeout(() => Game.startGame(), 2000);
                return;
            }
        } else if (this.cameraFailed) {
            setTimeout(() => Game.startGame(), 2000);
            return;
        }

        this.isCalibrating = true;
        this.calibrationStep = 1;
        this.updateCalibrationUI();
        
        // Reset status text
        document.querySelector('#calib-step-1 .status').textContent = 'WAITING...';
        document.querySelector('#calib-step-1 .status').style.color = '#ff3333';
        document.querySelector('#calib-step-2 .status').textContent = 'WAITING...';
        document.querySelector('#calib-step-2 .status').style.color = '#ff3333';
        document.querySelector('#calib-step-3 .status').textContent = 'WAITING...';
        document.querySelector('#calib-step-3 .status').style.color = '#ff3333';
        document.getElementById('calib-complete-msg').classList.add('hidden');
        document.getElementById('btn-start-sim').classList.add('hidden');
    },

    updateCalibrationUI() {
        document.getElementById('calib-step-1').style.opacity = this.calibrationStep === 1 ? '1' : '0.5';
        document.getElementById('calib-step-2').style.opacity = this.calibrationStep === 2 ? '1' : '0.5';
        document.getElementById('calib-step-3').style.opacity = this.calibrationStep === 3 ? '1' : '0.5';
        
        if (this.calibrationStep > 3) {
            document.getElementById('calib-complete-msg').classList.remove('hidden');
            document.getElementById('btn-start-sim').classList.remove('hidden');
            this.isCalibrating = false;
        }
    },

    predictLoop() {
        if (!this.isActive || !this.gestureRecognizer) return;

        let startTimeMs = performance.now();
        if (this.video.currentTime !== this.lastVideoTime) {
            this.lastVideoTime = this.video.currentTime;
            
            const results = this.gestureRecognizer.recognizeForVideo(this.video, startTimeMs);
            
            if (results.gestures.length > 0) {
                const gestureName = results.gestures[0][0].categoryName;
                const score = results.gestures[0][0].score;
                
                this.currentGesture = gestureName;
                this.confidence = Math.round(score * 100);
                
                // Note: The model returns 0 to 1 coordinates for landmarks.
                // We use index finger tip (landmark 8) for aiming.
                const landmarks = results.landmarks[0];
                if (landmarks && landmarks.length > 0) {
                    const indexFinger = landmarks[8];
                    // Map to game width/height. Flip X for mirror effect.
                    const mappedX = (1 - indexFinger.x) * Game.width;
                    const mappedY = indexFinger.y * Game.height;
                    
                    if (this.currentGesture !== 'None' && Game.state === Game.STATES.PLAYING) {
                         Input.mouse.x = mappedX;
                         Input.mouse.y = mappedY;
                    }
                }
                
                this.processGesture(this.currentGesture, this.confidence);
                
                if (UI.elements.gestureDisplay) {
                    UI.elements.gestureDisplay.textContent = this.currentGesture;
                    UI.elements.confidenceDisplay.textContent = this.confidence + "%";
                }
            } else {
                this.currentGesture = 'None';
                this.confidence = 0;
                if (UI.elements.gestureDisplay) {
                    UI.elements.gestureDisplay.textContent = 'UNCERTAIN';
                    UI.elements.confidenceDisplay.textContent = '0%';
                }
            }
        }
        
        // Loop at roughly 30 FPS to save performance
        setTimeout(() => {
            requestAnimationFrame(() => this.predictLoop());
        }, 1000 / 30);
    },

    processGesture(gesture, confidence) {
        if (confidence < 60) return;

        if (this.isCalibrating) {
            if (this.calibrationStep === 1 && gesture === 'Open_Palm') {
                document.querySelector('#calib-step-1 .status').textContent = 'LEARNED ✓';
                document.querySelector('#calib-step-1 .status').style.color = '#00ff00';
                this.calibrationStep = 2;
                this.updateCalibrationUI();
            } else if (this.calibrationStep === 2 && gesture === 'Pointing_Up') {
                document.querySelector('#calib-step-2 .status').textContent = 'LEARNED ✓';
                document.querySelector('#calib-step-2 .status').style.color = '#00ff00';
                this.calibrationStep = 3;
                this.updateCalibrationUI();
            } else if (this.calibrationStep === 3 && gesture === 'Closed_Fist') {
                document.querySelector('#calib-step-3 .status').textContent = 'LEARNED ✓';
                document.querySelector('#calib-step-3 .status').style.color = '#00ff00';
                this.calibrationStep = 4;
                this.updateCalibrationUI();
            }
            return;
        }

        if (Game.state !== Game.STATES.PLAYING) return;

        // Reset virtual keys before applying new ones to avoid sticking
        Input.keys.space = false;
        Input.keys.e = false;
        Input.mouse.left = false;

        // Throttle AI action counter so it doesn't just zoom up
        const timeNow = performance.now();
        if (!this.lastActionTime) this.lastActionTime = 0;
        const canCountAction = (timeNow - this.lastActionTime > 500);

        if (gesture === 'Pointing_Up') {
            Input.mouse.left = true;
            if (canCountAction && Game.stats) {
                Game.stats.aiActionsTriggered++;
                this.lastActionTime = timeNow;
            }
        } else if (gesture === 'Closed_Fist') {
            Input.keys.e = true;
            if (canCountAction && Game.stats) {
                Game.stats.aiActionsTriggered++;
                this.lastActionTime = timeNow;
            }
        } else if (gesture === 'Thumb_Up') {
            Input.keys.space = true;
            if (canCountAction && Game.stats) {
                Game.stats.aiActionsTriggered++;
                this.lastActionTime = timeNow;
            }
        } else if (gesture === 'Open_Palm') {
            // For Open_Palm, maybe it acts as a shield or just recognizes it.
            if (canCountAction && Game.stats) {
                Game.stats.gesturesRecognized++;
                this.lastActionTime = timeNow;
            }
        }
        
        if (canCountAction && gesture !== 'None' && Game.stats) {
            Game.stats.gesturesRecognized++;
            this.lastActionTime = timeNow;
        }
    }
};
