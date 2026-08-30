// UI Management
const UI = {
    screens: {},
    elements: {},

    init() {
        // Cache screens
        this.screens.menu = document.getElementById('menu-screen');
        this.screens.howToPlay = document.getElementById('how-to-play-screen');
        this.screens.credits = document.getElementById('credits-screen');
        this.screens.hud = document.getElementById('hud-screen');
        this.screens.pause = document.getElementById('pause-screen');
        this.screens.gameOver = document.getElementById('game-over-screen');
        this.screens.victory = document.getElementById('victory-screen');
        this.screens.howAiWorks = document.getElementById('how-ai-works-screen');
        this.screens.calibration = document.getElementById('calibration-screen');

        // Cache HUD elements
        this.elements.healthFill = document.getElementById('health-bar-fill');
        this.elements.energyFill = document.getElementById('energy-bar-fill');
        this.elements.wave = document.getElementById('wave-display');
        this.elements.score = document.getElementById('score-display');
        this.elements.combo = document.getElementById('combo-display');
        this.elements.time = document.getElementById('time-display');
        this.elements.dash = document.getElementById('dash-cooldown');
        this.elements.emp = document.getElementById('emp-cooldown');
        this.elements.announcement = document.getElementById('announcement-display');
        this.elements.objective = document.getElementById('objective-display');
        
        // AI Vision Elements
        this.elements.cameraStatus = document.getElementById('camera-status');
        this.elements.gestureDisplay = document.getElementById('gesture-display');
        this.elements.confidenceDisplay = document.getElementById('confidence-display');
        this.elements.aiBehaviorDisplay = document.getElementById('ai-behavior-display');
        this.elements.novaMessage = document.getElementById('nova-ai-message');

        // Cache Game Over / Victory elements
        this.elements.goScore = document.getElementById('go-score');
        this.elements.goWave = document.getElementById('go-wave');
        this.elements.goTime = document.getElementById('go-time');
        this.elements.goCombo = document.getElementById('go-combo');
        this.elements.goRank = document.getElementById('go-rank');

        this.elements.vicGestures = document.getElementById('vic-gestures');
        this.elements.vicKills = document.getElementById('vic-kills');
        this.elements.vicCombo = document.getElementById('vic-combo');
        this.elements.vicTime = document.getElementById('vic-time');
        this.elements.vicActions = document.getElementById('vic-actions');

        this.setupButtons();
    },

    setupButtons() {
        const bindBtn = (id, callback) => {
            const btn = document.getElementById(id);
            if (btn) {
                btn.addEventListener('click', () => {
                    AudioSys.init(); // Initialize audio context on first user interaction
                    AudioSys.playMenuClick();
                    callback();
                });
                btn.addEventListener('mouseenter', () => AudioSys.playMenuHover());
            }
        };

        // Main Menu
        bindBtn('btn-play', () => {
            // Check if AIVision exists and is ready
            if (typeof AIVision !== 'undefined') {
                AIVision.prepareCalibration();
            } else {
                Game.startGame();
            }
        });
        bindBtn('btn-how-to-play', () => this.showScreen('howToPlay'));
        bindBtn('btn-how-ai-works', () => this.showScreen('howAiWorks'));
        bindBtn('btn-credits', () => this.showScreen('credits'));
        
        // Back buttons
        bindBtn('btn-back-menu', () => this.showScreen('menu'));
        bindBtn('btn-back-menu-credits', () => this.showScreen('menu'));
        bindBtn('btn-back-menu-ai', () => this.showScreen('menu'));
        
        // Calibration
        bindBtn('btn-enable-camera', () => {
            if (typeof AIVision !== 'undefined') {
                AIVision.startCalibration();
            }
        });
        bindBtn('btn-start-sim', () => Game.startGame());
        
        // Pause Menu
        bindBtn('btn-resume', () => Game.togglePause());
        bindBtn('btn-restart-pause', () => Game.startGame());
        bindBtn('btn-menu-pause', () => Game.returnToMenu());
        
        // Game Over
        bindBtn('btn-retry', () => Game.startGame());
        bindBtn('btn-menu-go', () => Game.returnToMenu());
        
        // Victory
        bindBtn('btn-play-again', () => {
            if (typeof AIVision !== 'undefined') {
                AIVision.prepareCalibration();
            } else {
                Game.startGame();
            }
        });
        bindBtn('btn-vic-how-ai-works', () => this.showScreen('howAiWorks'));
        bindBtn('btn-menu-vic', () => Game.returnToMenu());
    },

    showScreen(screenName) {
        // Hide all screens
        Object.values(this.screens).forEach(screen => {
            if (screen) {
                screen.classList.remove('active');
                screen.classList.add('hidden');
            }
        });

        // Show target screen
        const target = this.screens[screenName];
        if (target) {
            target.classList.remove('hidden');
            // Small timeout to allow display block to apply before opacity transition
            setTimeout(() => target.classList.add('active'), 10);
        }
    },

    updateHUD(player, gameStats) {
        if (!player || !gameStats) return;

        // Health
        const hpPercent = Math.max(0, (player.hp / player.maxHp) * 100);
        this.elements.healthFill.style.width = `${hpPercent}%`;
        if (hpPercent < 30) {
            this.elements.healthFill.classList.add('low');
        } else {
            this.elements.healthFill.classList.remove('low');
        }

        // Energy
        const nrgPercent = Math.max(0, Math.min(100, (player.energy / player.maxEnergy) * 100));
        this.elements.energyFill.style.width = `${nrgPercent}%`;

        // Stats
        this.elements.wave.textContent = `WAVE ${gameStats.wave.toString().padStart(2, '0')}`;
        this.elements.score.textContent = gameStats.score;
        this.elements.time.textContent = Utils.formatTime(gameStats.survivalTime);

        if (Game.objective) {
            this.elements.objective.textContent = `${Game.objective}: ${Math.min(Game.objectiveProgress, Game.objectiveTarget)} / ${Game.objectiveTarget}`;
        } else {
            this.elements.objective.textContent = "";
        }

        // Combo
        if (gameStats.combo > 1) {
            this.elements.combo.textContent = `COMBO x${gameStats.combo}`;
            this.elements.combo.classList.remove('hidden');
        } else {
            this.elements.combo.classList.add('hidden');
        }

        // Abilities Cooldown
        if (player.dashCooldownTimer <= 0) {
            this.elements.dash.textContent = 'READY';
            this.elements.dash.classList.add('ready');
        } else {
            this.elements.dash.textContent = player.dashCooldownTimer.toFixed(1) + 's';
            this.elements.dash.classList.remove('ready');
        }

        if (player.energy >= player.maxEnergy) {
            this.elements.emp.textContent = 'READY';
            this.elements.emp.classList.add('ready');
        } else {
            this.elements.emp.textContent = Math.floor((player.energy / player.maxEnergy) * 100) + '%';
            this.elements.emp.classList.remove('ready');
        }
    },

    showAnnouncement(text, duration = 2000) {
        this.elements.announcement.innerHTML = text;
        this.elements.announcement.classList.remove('hidden');
        this.elements.announcement.classList.add('show');
        
        setTimeout(() => {
            this.elements.announcement.classList.remove('show');
            setTimeout(() => this.elements.announcement.classList.add('hidden'), 300); // Wait for fade out
        }, duration);
    },

    showNovaMessage(text, duration = 3000) {
        if (!this.elements.novaMessage) return;
        this.elements.novaMessage.textContent = `NOVA: ${text}`;
        this.elements.novaMessage.classList.remove('hidden');
        
        // Clear previous timeout if exists
        if (this.novaTimeout) clearTimeout(this.novaTimeout);
        
        this.novaTimeout = setTimeout(() => {
            this.elements.novaMessage.classList.add('hidden');
        }, duration);
    },

    calculateRank(score) {
        if (score >= 12000) return 'S';
        if (score >= 8000) return 'A';
        if (score >= 4000) return 'B';
        return 'C';
    },

    updateGameOver(stats) {
        this.elements.goScore.textContent = stats.score;
        this.elements.goWave.textContent = stats.wave;
        this.elements.goTime.textContent = Utils.formatTime(stats.survivalTime);
        this.elements.goCombo.textContent = `x${stats.maxCombo}`;
        this.elements.goRank.textContent = this.calculateRank(stats.score);
    },

    updateVictory(stats) {
        this.elements.vicGestures.textContent = stats.gesturesRecognized || 0;
        this.elements.vicKills.textContent = stats.enemiesDefeated || 0;
        this.elements.vicCombo.textContent = `x${stats.maxCombo}`;
        this.elements.vicTime.textContent = Utils.formatTime(stats.survivalTime);
        this.elements.vicActions.textContent = stats.aiActionsTriggered || 0;
    }
};
