// Game Orchestration and State
const Game = {
    STATES: {
        MENU: 0,
        PLAYING: 1,
        PAUSED: 2,
        GAME_OVER: 3,
        VICTORY: 4
    },
    
    state: 0, // Starts at MENU
    width: 1280, // Screen width
    height: 720, // Screen height
    worldWidth: 2400,
    worldHeight: 1600,
    camera: { x: 0, y: 0 },
    ctx: null,
    
    player: null,
    enemies: [],
    playerBullets: [],
    enemyBullets: [],
    powerups: [],
    boss: null,
    
    objective: "",
    objectiveTarget: 0,
    objectiveProgress: 0,
    
    // Stats
    stats: {
        score: 0,
        wave: 1,
        survivalTime: 0,
        combo: 1,
        maxCombo: 1,
        comboTimer: 0,
        gesturesRecognized: 0,
        enemiesDefeated: 0,
        aiActionsTriggered: 0
    },

    // Wave Config
    waveTimer: 0,
    spawnTimer: 0,
    enemiesSpawned: 0,
    maxEnemiesPerWave: 10,
    isWaveActive: false,
    cinematicPauseTimer: 0,

    init(canvas, ctx) {
        this.ctx = ctx;
        this.width = canvas.width;
        this.height = canvas.height;
        this.state = this.STATES.MENU;
        
        UI.init();
        
        // Initialize systems immediately
        Environment.init();
        Pathfinder.init(this.worldWidth, this.worldHeight, Environment.walls);
        Effects.init(this.width, this.height);
        
        UI.showScreen('menu');
    },

    startGame() {
        this.state = this.STATES.PLAYING;
        this.player = new Player(this.worldWidth / 2, this.worldHeight / 2);
        this.enemies = [];
        this.playerBullets = [];
        this.enemyBullets = [];
        this.powerups = [];
        this.boss = null;
        this.cinematicPauseTimer = 0;
        Environment.coreNodes = [];
        Particles.clear();
        
        this.camera.x = Math.max(0, Math.min(this.player.x - this.width / 2, this.worldWidth - this.width));
        this.camera.y = Math.max(0, Math.min(this.player.y - this.height / 2, this.worldHeight - this.height));
        
        this.stats = {
            score: 0,
            wave: 1,
            survivalTime: 0,
            combo: 1,
            maxCombo: 1,
            comboTimer: 0,
            gesturesRecognized: 0,
            enemiesDefeated: 0,
            aiActionsTriggered: 0
        };
        
        this.startWave(1);
        UI.showScreen('hud');
        UI.showAnnouncement("WAVE 01");
    },

    togglePause() {
        if (this.state === this.STATES.PLAYING) {
            this.state = this.STATES.PAUSED;
            UI.showScreen('pause');
        } else if (this.state === this.STATES.PAUSED) {
            this.state = this.STATES.PLAYING;
            UI.showScreen('hud');
        }
    },

    returnToMenu() {
        this.state = this.STATES.MENU;
        this.player = null; // Free memory slightly
        UI.showScreen('menu');
    },

    triggerGameOver() {
        if (this.state === this.STATES.GAME_OVER) return;
        this.state = this.STATES.GAME_OVER;
        
        // Massive player death explosion
        if (this.player) {
            Particles.spawn(this.player.x, this.player.y, 50, this.player.color, 3.0, 1.5);
            Particles.spawn(this.player.x, this.player.y, 30, '#ffffff', 5.0, 2.0);
        }
        
        UI.updateGameOver(this.stats);
        UI.showScreen('gameOver');
        AudioSys.playTone(50, 'square', 1.0, 0.5); // Death sound
    },

    triggerVictory() {
        this.state = this.STATES.VICTORY;
        UI.updateVictory(this.stats);
        UI.showScreen('victory');
        AudioSys.playWaveComplete();
        setTimeout(() => AudioSys.playWaveComplete(), 500);
    },

    triggerVictorySequence() {
        this.isWaveActive = false;
        // Clear all remaining enemies
        for (let e of this.enemies) {
            Particles.spawn(e.x, e.y, 10, e.color || '#ff0000', 2, 1);
        }
        this.enemies = [];
        this.enemyBullets = [];
        
        UI.showAnnouncement("VOID SENTINEL<br>DESTROYED", 3000);
        
        setTimeout(() => {
            UI.showAnnouncement("CORE STABILIZED", 2000);
            setTimeout(() => {
                UI.showAnnouncement("MISSION COMPLETE", 3000);
                setTimeout(() => {
                    this.triggerVictory();
                }, 3000);
            }, 2500);
        }, 3500);
    },

    startWave(waveNum) {
        this.stats.wave = waveNum;
        this.isWaveActive = true;
        this.spawnTimer = 2.0; 
        
        if (waveNum === 1) {
            this.objective = "ELIMINATE 5 HOSTILES";
            this.objectiveTarget = 5;
            this.objectiveProgress = 0;
            UI.showAnnouncement("LEVEL 1 - AI VISION<br>ELIMINATE HOSTILES");
            if(UI.showNovaMessage) UI.showNovaMessage("CALIBRATION COMPLETE. COMMENCING COMBAT PROTOCOL.", 4000);
        } else if (waveNum === 2) {
            this.objective = "SURVIVE THE HUNTER ASSAULT";
            this.objectiveTarget = 6;
            this.objectiveProgress = 0;
            UI.showAnnouncement("LEVEL 2 - AI COMBAT<br>WARNING: HUNTERS DETECTED");
            if(UI.showNovaMessage) UI.showNovaMessage("MULTIPLE HOSTILES DETECTED. RECOMMEND EVASIVE ACTION.", 4000);
        } else if (waveNum === 3) {
            this.objective = "DESTROY 7 ARMORED UNITS";
            this.objectiveTarget = 7;
            this.objectiveProgress = 0;
            UI.showAnnouncement("LEVEL 3 - AI ADAPTATION<br>ARMORED UNITS DEPLOYED");
            if(UI.showNovaMessage) UI.showNovaMessage("ENEMIES ARE ADAPTING TO YOUR MOVEMENT. USE GESTURES CAREFULLY.", 4000);
        } else if (waveNum === 4) {
            this.objective = "SECURE THE CORE";
            this.objectiveTarget = 3;
            this.objectiveProgress = 0;
            if (typeof Environment.spawnCoreNodes === 'function') Environment.spawnCoreNodes();
            UI.showAnnouncement("LEVEL 4 - AI CORE<br>CORE FAILURE IMMINENT");
            if(UI.showNovaMessage) UI.showNovaMessage("SECURE THE CORES BEFORE THE SYSTEM COLLAPSES.", 4000);
        } else if (waveNum === 5) {
            this.isWaveActive = false;
            this.objective = "DESTROY THE VOID SENTINEL";
            this.objectiveTarget = 1;
            this.objectiveProgress = 0;
            
            this.cinematicPauseTimer = 1.0; // Freeze gameplay temporarily
            UI.showAnnouncement("FINAL LEVEL<br>VOID SENTINEL DETECTED", 3000);
            
            setTimeout(() => {
                UI.showAnnouncement("FINAL THREAT<br>VOID SENTINEL", 3000);
                setTimeout(() => {
                    this.boss = new VoidSentinel(this.width / 2, -100, waveNum);
                    AudioSys.playTone(100, 'square', 2.0, 0.5);
                    this.isWaveActive = true;
                }, 3000);
            }, 3500);
        }
    },

    completeWave() {
        if (!this.isWaveActive) return;
        this.isWaveActive = false;
        
        // Clear remaining enemies immediately
        for (let e of this.enemies) {
            Particles.spawn(e.x, e.y, 15, e.color || '#ff0000', 3, 1);
        }
        this.enemies = [];
        this.enemyBullets = [];
        
        AudioSys.playWaveComplete();
        
        if (this.stats.wave === 1) {
            UI.showAnnouncement("OBJECTIVE COMPLETE<br>8 HOSTILES ELIMINATED", 3000);
        } else if (this.stats.wave === 4) {
            UI.showAnnouncement("CORE SYSTEM STABILIZED", 3000);
        } else {
            UI.showAnnouncement("OBJECTIVE COMPLETE", 3000);
        }
        
        this.waveTimer = 4.0; // Wait before starting next wave
    },

    spawnEnemy() {
        if (this.objectiveProgress >= this.objectiveTarget) return; // Stop spawning when objective met
        const maxConcurrent = Math.min(3 + (this.stats.wave - 1), 5);
        if (this.enemies.length >= maxConcurrent) return;
        
        let x, y;
        let validSpawn = false;
        let attempts = 0;
        
        while (!validSpawn && attempts < 10) {
            attempts++;
            if (Math.random() > 0.5) {
                x = Math.random() > 0.5 ? this.camera.x - 50 : this.camera.x + this.width + 50;
                y = Utils.random(this.camera.y - 50, this.camera.y + this.height + 50);
            } else {
                x = Utils.random(this.camera.x - 50, this.camera.x + this.width + 50);
                y = Math.random() > 0.5 ? this.camera.y - 50 : this.camera.y + this.height + 50;
            }
            
            x = Utils.clamp(x, 20, this.worldWidth - 20);
            y = Utils.clamp(y, 20, this.worldHeight - 20);

            validSpawn = true;
            for (const wall of Environment.walls) {
                if (Collision.circleRect({x: x, y: y, radius: 20}, wall)) {
                    validSpawn = false;
                    break;
                }
            }
        }

        const waveMult = 1 + (this.stats.wave * 0.1);
        let type = 'chaser';
        
        if (this.stats.wave === 2 && Math.random() < 0.4) type = 'hunter';
        if (this.stats.wave === 3) type = Math.random() < 0.3 ? 'tank' : (Math.random() < 0.5 ? 'hunter' : 'chaser');
        if (this.stats.wave === 4) type = Math.random() < 0.2 ? 'tank' : (Math.random() < 0.4 ? 'hunter' : 'chaser');

        let enemy;
        if (type === 'chaser') enemy = new Chaser(x, y, waveMult);
        else if (type === 'hunter') enemy = new Hunter(x, y, waveMult);
        else if (type === 'tank') enemy = new Tank(x, y, waveMult);

        this.enemies.push(enemy);
    },

    spawnEnemyBullet(x, y, angle, speed) {
        this.enemyBullets.push(new Bullet(x, y, angle, speed, 10, '#9d00ff', false));
    },

    enemyDied(enemy) {
        this.addScore(enemy.scoreValue);
        this.stats.enemiesDefeated++;
        
        if (this.stats.wave === 1 || this.stats.wave === 2) {
            this.objectiveProgress++;
        } else if (this.stats.wave === 3 && enemy instanceof Tank) {
            this.objectiveProgress++;
        }
    },

    spawnPowerup(x, y) {
        const rand = Math.random();
        let type = POWERUP_TYPES.HEALTH;
        if (rand > 0.4) type = POWERUP_TYPES.ENERGY;
        if (rand > 0.7) type = POWERUP_TYPES.OVERDRIVE;
        if (rand > 0.9) type = POWERUP_TYPES.SHIELD;
        
        this.powerups.push(new Powerup(x, y, type));
    },

    addScore(points) {
        this.stats.score += points * this.stats.combo;
        this.stats.combo++;
        if (this.stats.combo > this.stats.maxCombo) {
            this.stats.maxCombo = this.stats.combo;
        }
        this.stats.comboTimer = 3.0; // 3 seconds to keep combo alive
    },

    resetCombo() {
        this.stats.combo = 1;
        this.stats.comboTimer = 0;
    },

    update(dt) {
        if (this.state !== this.STATES.PLAYING) {
            if (this.state === this.STATES.MENU) {
                // Cinematic slow camera pan over the new environment
                this.camera.x += dt * 30;
                this.camera.y += dt * 15;
                if (this.camera.x > this.worldWidth - this.width) this.camera.x = 0;
                if (this.camera.y > this.worldHeight - this.height) this.camera.y = 0;
            }
            
            // Allow particles to update during GAME_OVER or VICTORY
            if (this.state === this.STATES.GAME_OVER || this.state === this.STATES.VICTORY) {
                Particles.update(dt);
            }
            
            // Still update background effects in menu/gameover
            Effects.update(dt, this.width, this.height);
            return;
        }

        // Stats updates
        this.stats.survivalTime += dt;
        if (this.stats.comboTimer > 0) {
            this.stats.comboTimer -= dt;
            if (this.stats.comboTimer <= 0) this.resetCombo();
        }

        if (this.cinematicPauseTimer > 0) {
            this.cinematicPauseTimer -= dt;
            // Particles and camera still update, but entities are frozen
            Particles.update(dt);
            Effects.update(dt, this.width, this.height);
            UI.updateHUD(this.player, this.stats);
            return;
        }

        // Check node interaction logic for wave 4
        if (this.stats.wave === 4 && Input.keys.e) {
            if (typeof Environment.interactWithNode === 'function') {
                if (Environment.interactWithNode(this.player)) {
                    this.objectiveProgress++;
                }
            }
        }

        // Update player
        if (this.player) {
            this.player.update(dt);
            // Smooth Camera Follow
            const targetCamX = this.player.x - this.width / 2;
            const targetCamY = this.player.y - this.height / 2;
            this.camera.x += (targetCamX - this.camera.x) * dt * 5;
            this.camera.y += (targetCamY - this.camera.y) * dt * 5;
            
            // Clamp Camera
            this.camera.x = Utils.clamp(this.camera.x, 0, this.worldWidth - this.width);
            this.camera.y = Utils.clamp(this.camera.y, 0, this.worldHeight - this.height);
        }

        // Update boss
        if (this.boss) {
            this.boss.update(dt, this.player);
            if (!this.boss.active && !this.boss.deathSequenceStarted) {
                this.boss.deathSequenceStarted = true;
                this.triggerVictorySequence();
            }
        }

        // Wave Logic
        if (this.isWaveActive && !this.boss) {
            this.spawnTimer -= dt;
            if (this.spawnTimer <= 0) {
                this.spawnEnemy();
                this.spawnTimer = Math.max(0.5, 2.0 - (this.stats.wave * 0.2)); 
            }
            
            // Check for wave complete
            if (this.objectiveProgress >= this.objectiveTarget) {
                this.completeWave();
            }
        } else if (!this.isWaveActive && !this.boss) {
            // Waiting for next wave
            if (this.waveTimer > 0) {
                this.waveTimer -= dt;
                if (this.waveTimer <= 0) {
                    const nextWave = this.stats.wave + 1;
                    if (nextWave !== 5) {
                        UI.showAnnouncement(`NEXT SECTOR<br>WAVE ${String(nextWave).padStart(2, '0')}`, 2000);
                        setTimeout(() => this.startWave(nextWave), 2500);
                    } else {
                        this.startWave(nextWave);
                    }
                }
            }
        }

        // Entities
        for (let i = this.playerBullets.length - 1; i >= 0; i--) {
            const b = this.playerBullets[i];
            b.update(dt);
            if (!b.active) this.playerBullets.splice(i, 1);
        }

        for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
            const b = this.enemyBullets[i];
            b.update(dt);
            if (Collision.circleCircle(this.player, b) && !this.player.isDashing && this.player.invulnerableTimer <= 0) {
                this.player.takeDamage(b.damage);
                b.active = false;
            }
            if (!b.active) this.enemyBullets.splice(i, 1);
        }

        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const e = this.enemies[i];
            e.update(dt, this.player);
            
            // Player collision
            if (Collision.circleCircle(this.player, e) && !this.player.isDashing && this.player.invulnerableTimer <= 0) {
                this.player.takeDamage(e.damage);
                // Push enemy back
                e.x -= e.vx * dt * 5;
                e.y -= e.vy * dt * 5;
            }

            // Bullet collision
            for (let j = this.playerBullets.length - 1; j >= 0; j--) {
                const b = this.playerBullets[j];
                if (Collision.circleCircle(b, e)) {
                    e.takeDamage(b.damage, false);
                    b.active = false;
                }
            }

            if (!e.active) this.enemies.splice(i, 1);
        }
        
        // Boss Collision with Player Bullets
        if (this.boss && this.boss.active) {
            for (let j = this.playerBullets.length - 1; j >= 0; j--) {
                const b = this.playerBullets[j];
                if (Collision.circleCircle(b, this.boss)) {
                    // Check if critical
                    const isCrit = Math.random() < 0.2;
                    const dmg = isCrit ? b.damage * 2 : b.damage;
                    this.boss.takeDamage(dmg, isCrit);
                    b.active = false;
                }
            }
        }

        for (let i = this.powerups.length - 1; i >= 0; i--) {
            const p = this.powerups[i];
            p.update(dt);
            if (Collision.circleCircle(this.player, p)) {
                this.player.applyPowerup(p.type);
                p.active = false;
            }
            if (!p.active) this.powerups.splice(i, 1);
        }

        Particles.update(dt);
        Effects.update(dt, this.width, this.height);
        
        // Update UI
        UI.updateHUD(this.player, this.stats);
    },

    draw() {
        const ctx = this.ctx;
        
        ctx.save();
        Effects.applyShake(ctx);

        // Draw Environment (Background + Walls)
        Environment.draw(ctx, this.camera.x, this.camera.y, this.width, this.height);
        
        // Translate for dynamic entities
        ctx.translate(-this.camera.x, -this.camera.y);

        // Draw entities based on state
        if (this.state === this.STATES.PLAYING || this.state === this.STATES.PAUSED || this.state === this.STATES.GAME_OVER || this.state === this.STATES.VICTORY) {
            this.powerups.forEach(p => p.draw(ctx));
            this.enemies.forEach(e => e.draw(ctx));
            if (this.boss) this.boss.draw(ctx);
            this.playerBullets.forEach(b => b.draw(ctx));
            this.enemyBullets.forEach(b => b.draw(ctx));
            Particles.draw(ctx);
            
            // Draw player last so they are on top
            if (this.player && this.player.hp > 0) this.player.draw(ctx);
        }
        
        ctx.restore();
    }
};
