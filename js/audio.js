// Procedural Audio System using Web Audio API
const AudioSys = {
    ctx: null,
    enabled: false,

    init() {
        if (this.ctx) return;
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContext();
            this.enabled = true;
        } catch (e) {
            console.warn("Web Audio API not supported", e);
            this.enabled = false;
        }
    },

    playTone(freq, type, duration, vol = 0.1) {
        if (!this.enabled || !this.ctx) return;
        
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        
        gain.gain.setValueAtTime(vol, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);
        
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        
        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    },

    playShoot() {
        if (!this.enabled) return;
        this.playTone(Utils.random(400, 600), 'square', 0.1, 0.05);
        this.playTone(Utils.random(600, 800), 'sawtooth', 0.1, 0.05);
    },

    playHit() {
        this.playTone(Utils.random(100, 200), 'sawtooth', 0.2, 0.1);
    },

    playEnemyDeath() {
        this.playTone(Utils.random(50, 100), 'square', 0.3, 0.2);
    },

    playPlayerHit() {
        this.playTone(150, 'sawtooth', 0.4, 0.3);
    },

    playDash() {
        this.playTone(300, 'sine', 0.2, 0.1);
        // Frequency sweep
        if (!this.enabled || !this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.frequency.setValueAtTime(200, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(800, this.ctx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.2);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.2);
    },

    playEMP() {
        this.playTone(50, 'square', 1.0, 0.3);
        this.playTone(200, 'sawtooth', 1.0, 0.2);
    },

    playPowerup() {
        this.playTone(600, 'sine', 0.1, 0.1);
        setTimeout(() => this.playTone(800, 'sine', 0.2, 0.1), 100);
    },
    
    playMenuHover() {
        this.playTone(400, 'sine', 0.05, 0.05);
    },

    playMenuClick() {
        this.playTone(600, 'square', 0.1, 0.1);
    },
    
    playWaveComplete() {
        this.playTone(400, 'square', 0.2, 0.1);
        setTimeout(() => this.playTone(600, 'square', 0.2, 0.1), 200);
        setTimeout(() => this.playTone(800, 'square', 0.4, 0.1), 400);
    }
};
