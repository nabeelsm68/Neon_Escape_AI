// Player System
class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.speed = 350;
        this.radius = 15;
        this.color = '#00f3ff';
        
        this.maxHp = 100;
        this.hp = this.maxHp;
        
        this.rotation = 0;
        
        // Shooting
        this.shootCooldown = 0;
        this.shootRate = 0.15; // seconds
        this.overdriveTimer = 0;
        this.shieldTimer = 0;
        this.damage = 10;
        
        // Abilities
        this.dashCooldown = 2.0;
        this.dashCooldownTimer = 0;
        this.isDashing = false;
        this.dashTimer = 0;
        this.dashSpeed = 1000;
        
        this.energy = 0;
        this.maxEnergy = 100;
        this.energyRegen = 5; // per second
        this.empActive = false;

        this.flashTime = 0;
        this.pulse = 0;
        this.invulnerableTimer = 0;
    }

    update(dt) {
        if (this.flashTime > 0) this.flashTime -= dt;
        if (this.invulnerableTimer > 0) this.invulnerableTimer -= dt;
        this.pulse += dt * 5;

        // Cooldowns
        if (this.shootCooldown > 0) this.shootCooldown -= dt;
        if (this.dashCooldownTimer > 0) this.dashCooldownTimer -= dt;
        
        if (this.energy < this.maxEnergy && !this.empActive) {
            this.energy = Math.min(this.maxEnergy, this.energy + this.energyRegen * dt);
        }
        if (this.overdriveTimer > 0) {
            this.overdriveTimer -= dt;
            if (this.overdriveTimer <= 0) this.color = '#00f3ff'; 
        }
        if (this.shieldTimer > 0) this.shieldTimer -= dt;

        // Mouse rotation (World coordinates)
        const mouseWorldX = Input.mouse.x + Game.camera.x;
        const mouseWorldY = Input.mouse.y + Game.camera.y;
        this.rotation = Utils.angle(this.x, this.y, mouseWorldX, mouseWorldY);

        // Abilities
        if (Input.keys.space && this.dashCooldownTimer <= 0 && !this.isDashing) {
            this.startDash();
        }

        if (Input.keys.e) {
            if (this.energy >= this.maxEnergy && !this.empActive) {
                this.startEMP();
            }
        }

        // EMP Animation
        if (this.empActive) {
            this.empRadius += 1000 * dt;
            if (this.empRadius > 400) {
                this.empActive = false;
            }
            // Damage enemies in EMP radius
            Game.enemies.forEach(enemy => {
                if (Utils.distance(this.x, this.y, enemy.x, enemy.y) < this.empRadius) {
                    enemy.takeDamage(50); // EMP Damage
                }
            });
        }

        // Movement
        if (this.isDashing) {
            this.dashTimer -= dt;
            if (this.dashTimer <= 0) {
                this.isDashing = false;
            } else {
                Particles.spawn(this.x, this.y, 2, this.color, 0.2, 0.3);
            }
        } else {
            // Normal movement
            let dx = 0;
            let dy = 0;
            if (Input.keys.w) dy -= 1;
            if (Input.keys.s) dy += 1;
            if (Input.keys.a) dx -= 1;
            if (Input.keys.d) dx += 1;

            if (dx !== 0 || dy !== 0) {
                const len = Math.sqrt(dx*dx + dy*dy);
                dx /= len;
                dy /= len;
            }

            this.vx = dx * this.speed;
            this.vy = dy * this.speed;
        }

        this.x += this.vx * dt;
        this.y += this.vy * dt;

        Collision.keepInBounds(this, Game.worldWidth, Game.worldHeight);

        // Shooting
        if (Input.mouse.left && this.shootCooldown <= 0 && !this.isDashing) {
            this.shoot();
        }
    }

    shoot() {
        const rate = this.overdriveTimer > 0 ? this.shootRate * 0.4 : this.shootRate;
        this.shootCooldown = rate;
        
        // Muzzle flash particle
        const mX = this.x + Math.cos(this.rotation) * this.radius;
        const mY = this.y + Math.sin(this.rotation) * this.radius;
        Particles.spawn(mX, mY, 3, '#fff', 0.5, 0.2);
        
        Game.playerBullets.push(new Bullet(mX, mY, this.rotation, 800, this.damage, this.color, true));
        AudioSys.playShoot();
        
        // Small recoil
        this.x -= Math.cos(this.rotation) * 2;
        this.y -= Math.sin(this.rotation) * 2;
    }

    startDash() {
        this.isDashing = true;
        this.dashTimer = 0.15;
        this.dashCooldownTimer = this.dashCooldown;
        
        // Dash in direction of movement, or direction of mouse if standing still
        let angle = this.rotation;
        if (this.vx !== 0 || this.vy !== 0) {
            angle = Math.atan2(this.vy, this.vx);
        }
        
        this.vx = Math.cos(angle) * this.dashSpeed;
        this.vy = Math.sin(angle) * this.dashSpeed;
        
        AudioSys.playDash();
        Effects.shake(0.1, 5);
    }

    startEMP() {
        this.empActive = true;
        this.empRadius = 0;
        this.energy = 0; // Consume energy
        AudioSys.playEMP();
        Effects.shake(0.5, 15);
        Particles.spawn(this.x, this.y, 50, '#00f3ff', 5.0, 1.0);
    }

    takeDamage(amount) {
        if (this.isDashing || this.invulnerableTimer > 0 || this.hp <= 0) return; // Invincible during dash/i-frames
        if (this.shieldTimer > 0) {
            amount *= 0.2;
            this.shieldTimer -= 1; 
            Particles.spawn(this.x, this.y, 10, '#ffff00', 1.0, 0.5);
        }

        this.hp -= amount;
        this.flashTime = 0.2;
        this.invulnerableTimer = 0.5; // Half second i-frames
        
        Effects.shake(0.2, 10);
        AudioSys.playPlayerHit();
        Particles.spawn(this.x, this.y, 10, '#ff3333', 1.0, 0.5);
        
        Game.resetCombo();

        if (this.hp <= 0) {
            this.hp = 0;
            Game.triggerGameOver();
        }
    }

    applyPowerup(type) {
        AudioSys.playPowerup();
        Particles.spawn(this.x, this.y, 20, type.color, 1.0, 0.5);
        
        switch(type) {
            case POWERUP_TYPES.HEALTH:
                this.hp = Math.min(this.maxHp, this.hp + 30);
                break;
            case POWERUP_TYPES.ENERGY:
                this.energy = this.maxEnergy; // Instant recharge
                break;
            case POWERUP_TYPES.OVERDRIVE:
                this.overdriveTimer = 5.0; // 5 seconds of rapid fire
                this.color = type.color;
                break;
            case POWERUP_TYPES.SHIELD:
                this.shieldTimer = 10.0;
                break;
        }
    }

    draw(ctx) {
        if (this.hp <= 0) return;

        ctx.save();
        ctx.translate(this.x, this.y);
        
        // EMP Radius
        if (this.empActive) {
            ctx.fillStyle = `rgba(0, 243, 255, ${1.0 - this.empRadius / 300})`;
            ctx.beginPath();
            ctx.arc(0, 0, this.empRadius, 0, Math.PI * 2);
            ctx.fill();
        }

        // Drop shadow for the player
        ctx.save();
        ctx.translate(10, 10);
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI*2);
        ctx.fill();
        ctx.restore();

        // Light pool
        const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, this.radius * 4);
        grad.addColorStop(0, `rgba(${this.hexToRgb(this.color)}, 0.15)`);
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius * 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.rotate(this.rotation);
        
        // Ship base
        if (this.flashTime > 0) {
            // Flash white on hit
            ctx.globalCompositeOperation = 'source-atop';
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.fillRect(-50, -50, 100, 100);
            ctx.globalCompositeOperation = 'source-over';
        }

        // Procedural Player Hull
        ctx.fillStyle = '#0a0a0c'; // Very dark hull
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 2;
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;
        
        ctx.beginPath();
        ctx.moveTo(this.radius, 0); // Nose
        ctx.lineTo(-this.radius, this.radius * 0.8); // Right Wing
        ctx.lineTo(-this.radius * 0.4, 0); // Engine indent
        ctx.lineTo(-this.radius, -this.radius * 0.8); // Left Wing
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Inner glowing core
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.arc(-this.radius * 0.1, 0, this.radius * 0.3, 0, Math.PI * 2);
        ctx.fill();
        
        // Cockpit glass
        ctx.fillStyle = '#fff';
        ctx.shadowBlur = 0;
        ctx.beginPath();
        ctx.moveTo(this.radius * 0.5, 0);
        ctx.lineTo(0, this.radius * 0.2);
        ctx.lineTo(-this.radius * 0.1, 0);
        ctx.lineTo(0, -this.radius * 0.2);
        ctx.closePath();
        ctx.fill();

        // Engine exhaust glow if moving
        if (this.vx !== 0 || this.vy !== 0) {
            const coreScale = 1 + Math.sin(this.pulse) * 0.2;
            ctx.fillStyle = 'rgba(0, 243, 255, 0.5)';
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#00f3ff';
            ctx.beginPath();
            ctx.arc(-20, 0, 6 * coreScale + (Math.random()*2), 0, Math.PI * 2);
            ctx.fill();
            
            if (Math.random() > 0.5) {
                // Occasional exhaust particle relative to rotation
                const ex = this.x - Math.cos(this.rotation) * 20;
                const ey = this.y - Math.sin(this.rotation) * 20;
                Particles.spawn(ex, ey, 1, '#00f3ff', 0.2, 0.2);
            }
        }

        // Overdrive effect
        if (this.overdriveTimer > 0) {
            ctx.strokeStyle = 'rgba(0, 243, 255, 0.5)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, this.radius + 15 + Math.sin(Date.now()*0.01)*5, 0, Math.PI*2);
            ctx.stroke();
        }

        if (this.shieldTimer > 0) {
            ctx.strokeStyle = 'rgba(255, 255, 0, 0.5)';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(0, 0, this.radius + 20 + Math.sin(Date.now()*0.01)*5, 0, Math.PI*2);
            ctx.stroke();
        }

        ctx.restore();
    }
    
    hexToRgb(hex) {
        let r = 0, g = 0, b = 0;
        if (hex.length == 7) {
            r = parseInt(hex.substring(1,3), 16);
            g = parseInt(hex.substring(3,5), 16);
            b = parseInt(hex.substring(5,7), 16);
        }
        return `${r}, ${g}, ${b}`;
    }
}
