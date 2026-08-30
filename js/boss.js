// Boss System
class VoidSentinel {
    constructor(x, y, waveMultiplier) {
        this.x = x;
        this.y = y;
        this.maxHp = 1500 * (waveMultiplier * 0.5);
        this.hp = this.maxHp;
        this.radius = 40;
        this.color = '#00f3ff';
        this.active = true;
        this.phase = 1;
        this.scoreValue = 2000;
        
        this.speed = 50;
        this.rotation = 0;
        this.pulse = 0;
        this.flashTime = 0;
        
        this.attackTimer = 2.0;
        this.bullets = [];
        this.isSpawning = true;
        this.spawnTimer = 4.0;
    }

    update(dt, player) {
        if (this.isSpawning) {
            this.spawnTimer -= dt;
            Effects.shake(0.1, 5); // Rumble while spawning
            if (this.spawnTimer <= 0) {
                this.isSpawning = false;
                Effects.shake(0.5, 20); // Big impact when fully spawned
                UI.showAnnouncement("VOID SENTINEL INITIATED", 3000);
            }
            return;
        }

        if (this.flashTime > 0) this.flashTime -= dt;
        this.pulse += dt * 2;
        
        // Move towards center generally, but track player slightly
        const targetX = Game.worldWidth / 2;
        const targetY = Game.worldHeight / 2 - 100;
        
        // Simple movement logic: drift near center, look at player
        this.x += (targetX - this.x) * dt * 0.5;
        this.y += (targetY - this.y) * dt * 0.5;
        
        this.rotation = Utils.angle(this.x, this.y, player.x, player.y);
        
        // Phase check
        if (this.phase === 1 && this.hp < this.maxHp * 0.5) {
            this.enterPhase2();
        }

        // Attacks
        this.attackTimer -= dt;
        if (this.attackTimer <= 0) {
            this.attack(player);
        }

        // Update own bullets
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const b = this.bullets[i];
            b.update(dt);
            // Player collision
            if (Collision.circleCircle(b, player)) {
                player.takeDamage(b.damage);
                b.active = false;
            }
            if (!b.active) {
                this.bullets.splice(i, 1);
            }
        }
    }

    enterPhase2() {
        this.phase = 2;
        this.color = '#ff0000'; // Turns red
        this.speed = 100;
        
        Game.cinematicPauseTimer = 1.0;
        
        UI.showAnnouncement("PHASE 2<br>VOID SENTINEL // ENRAGED", 3000);
        Effects.shake(0.5, 10);
        AudioSys.playTone(200, 'square', 1.0, 0.5);
    }

    attack(player) {
        const attackType = Utils.randomInt(0, 1);
        
        if (this.phase === 1) {
            if (attackType === 0) {
                // Ring attack
                for(let i=0; i<12; i++) {
                    const angle = (i / 12) * Math.PI * 2;
                    this.bullets.push(new Bullet(this.x, this.y, angle, 150, 15, this.color, false));
                }
                this.attackTimer = 2.5;
            } else {
                // Burst at player
                const angle = this.rotation;
                for(let i=0; i<3; i++) {
                    setTimeout(() => {
                        if(this.active) {
                            this.bullets.push(new Bullet(this.x, this.y, angle + (Math.random()-0.5)*0.2, 300, 10, this.color, false));
                            AudioSys.playShoot();
                        }
                    }, i * 200);
                }
                this.attackTimer = 2.0;
            }
        } else {
            // Phase 2 attacks (faster, more projectiles)
            if (attackType === 0) {
                // Double ring attack
                for(let i=0; i<16; i++) {
                    const angle = (i / 16) * Math.PI * 2;
                    this.bullets.push(new Bullet(this.x, this.y, angle, 200, 15, this.color, false));
                }
                setTimeout(() => {
                    if(this.active) {
                        for(let i=0; i<16; i++) {
                            const angle = (i / 16) * Math.PI * 2 + (Math.PI/16);
                            this.bullets.push(new Bullet(this.x, this.y, angle, 200, 15, this.color, false));
                        }
                    }
                }, 400);
                this.attackTimer = 2.0;
            } else {
                // Spray at player
                const angle = this.rotation;
                for(let i=0; i<8; i++) {
                    setTimeout(() => {
                        if(this.active) {
                            this.bullets.push(new Bullet(this.x, this.y, angle + (Math.random()-0.5)*0.8, 350, 15, this.color, false));
                            AudioSys.playShoot();
                        }
                    }, i * 100);
                }
                this.attackTimer = 1.5;
            }
        }
    }

    takeDamage(amount, isCrit = false) {
        if (this.isSpawning) return;
        this.hp -= amount;
        this.flashTime = 0.1;
        Particles.spawnDamageNumber(this.x, this.y, amount, isCrit);
        AudioSys.playHit();
        
        if (this.hp <= 0) {
            this.active = false;
            // Massive death explosion
            Particles.spawn(this.x, this.y, 200, this.color, 15.0, 3.0);
            Particles.spawn(this.x, this.y, 100, '#ffffff', 20.0, 4.0);
            AudioSys.playEnemyDeath();
            Effects.shake(2.0, 30);
            setTimeout(() => AudioSys.playExplosion(), 300);
            setTimeout(() => AudioSys.playExplosion(), 600);
            Game.addScore(this.scoreValue);
        } else {
            Particles.spawn(this.x, this.y, 8, this.color, 1, 0.5);
        }
    }

    draw(ctx) {
        // Draw boss bullets
        this.bullets.forEach(b => b.draw(ctx));

        if (!this.active) return;

        ctx.save();
        ctx.translate(this.x, this.y);
        
        if (this.isSpawning) {
            // Massive entrance portal
            const scale = 1 - this.spawnTimer/4.0; 
            ctx.rotate(this.spawnTimer * Math.PI * 4);
            ctx.scale(scale, scale);
            
            ctx.strokeStyle = this.color;
            ctx.shadowBlur = 30;
            ctx.shadowColor = this.color;
            ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.arc(0, 0, this.radius * 2 + Math.random()*20, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
            return;
        }

        // Drop shadow for the boss
        ctx.save();
        ctx.translate(15, 15); // Large offset for height
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.beginPath();
        ctx.arc(0, 0, this.radius * 2, 0, Math.PI*2);
        ctx.fill();
        ctx.restore();

        // Massive light pool
        const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, this.radius * 6);
        grad.addColorStop(0, `rgba(${this.phase === 2 ? '255, 0, 255' : '0, 243, 255'}, 0.2)`);
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius * 6, 0, Math.PI * 2);
        ctx.fill();

        ctx.rotate(this.rotation);
        
        if (this.flashTime > 0) {
            ctx.globalCompositeOperation = 'source-atop';
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.fillRect(-this.radius*3, -this.radius*3, this.radius*6, this.radius*6);
            ctx.globalCompositeOperation = 'source-over';
        }
        
        ctx.shadowBlur = 20;
        ctx.shadowColor = this.phase === 2 ? '#ff00ff' : this.color;
        
        const s = 1 + Math.sin(this.pulse) * 0.05;
        ctx.scale(s, s);

        // Draw outer rotating mechanical ring - keep for some dynamic layering if desired
        // Boss Procedural Body
        ctx.fillStyle = '#111317';
        ctx.strokeStyle = this.phase === 2 ? '#ff00ff' : this.color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const a = (i / 6) * Math.PI * 2;
            const x = Math.cos(a) * this.radius * 1.5;
            const y = Math.sin(a) * this.radius * 1.5;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // Inner glowing eye
        ctx.fillStyle = this.phase === 2 ? '#ff00ff' : '#00f3ff';
        ctx.beginPath();
        ctx.arc(0, 0, this.radius * 0.6, 0, Math.PI * 2);
        ctx.fill();

        // Attack Telegraph (Laser sight)
        if (this.attackTimer < 0.5 && !this.isSpawning) {
            ctx.save();
            ctx.globalCompositeOperation = 'lighter';
            ctx.strokeStyle = this.phase === 2 ? 'rgba(255, 0, 0, 0.3)' : 'rgba(0, 243, 255, 0.3)';
            ctx.lineWidth = 2 + Math.random() * 2;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(2000, 0);
            ctx.stroke();
            ctx.restore();
        }

        ctx.restore();

        // Health bar above boss
        ctx.save();
        const hpPercent = Math.max(0, this.hp / this.maxHp);
        const barWidth = 100;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(this.x - barWidth/2, this.y - this.radius - 30, barWidth, 6);
        ctx.fillStyle = this.phase === 1 ? '#00f3ff' : '#ff0000';
        ctx.fillRect(this.x - barWidth/2, this.y - this.radius - 30, barWidth * hpPercent, 6);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.strokeRect(this.x - barWidth/2, this.y - this.radius - 30, barWidth, 6);
        ctx.restore();
    }
}
