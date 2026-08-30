// Enemy Classes
class Enemy {
    constructor(x, y, hp, speed, damage, scoreValue, color, radius) {
        this.x = x;
        this.y = y;
        this.hp = hp;
        this.maxHp = hp;
        this.speed = speed;
        this.damage = damage;
        this.scoreValue = scoreValue;
        this.color = color;
        this.radius = radius;
        this.active = true;
        this.spawnTimer = 1.0; // 1 second portal spawn animation
        this.isSpawning = true;
        this.vx = 0;
        this.vy = 0;
        this.flashTime = 0;
        this.path = [];
        this.pathTimer = 0;
    }

    navigateTowards(dt, targetX, targetY) {
        this.pathTimer -= dt;
        
        const hasLineOfSight = Collision.checkLineOfSight(this.x, this.y, targetX, targetY, Environment.walls);
        const distToTarget = Utils.distance(this.x, this.y, targetX, targetY);

        if (!hasLineOfSight || (distToTarget >= 250 && this.pathTimer <= 0)) {
            if (this.pathTimer <= 0 && typeof Pathfinder !== 'undefined') {
                this.path = Pathfinder.findPath(this.x, this.y, targetX, targetY);
                this.pathTimer = 0.5 + Math.random() * 0.2; 
            }
        } else if (hasLineOfSight && distToTarget < 250) {
            this.path = null;
        }

        let nextX = targetX;
        let nextY = targetY;

        if (this.path && this.path.length > 0) {
            const nextNode = this.path[0];
            const distToNode = Utils.distance(this.x, this.y, nextNode.x, nextNode.y);
            if (distToNode < 30) {
                this.path.shift();
            }
            if (this.path.length > 0) {
                nextX = this.path[0].x;
                nextY = this.path[0].y;
            }
        }

        const angle = Utils.angle(this.x, this.y, nextX, nextY);
        this.rotation = Utils.angle(this.x, this.y, targetX, targetY);
        this.vx = Math.cos(angle) * this.speed;
        this.vy = Math.sin(angle) * this.speed;
    }

    update(dt, player) {
        if (this.isSpawning) {
            this.spawnTimer -= dt;
            if (this.spawnTimer <= 0) {
                this.isSpawning = false;
            }
            return; // Don't move or take damage while spawning
        }

        if (this.flashTime > 0) this.flashTime -= dt;
        
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        
        Collision.keepInBounds(this, Game.worldWidth, Game.worldHeight);
    }
    
    updateThreatHUD(behavior) {
        if (this.behaviorState !== behavior) {
            this.behaviorState = behavior;
            if (UI.elements.aiBehaviorDisplay) {
                UI.elements.aiBehaviorDisplay.textContent = behavior;
                UI.elements.aiBehaviorDisplay.style.color = '#ff3333';
            }
        }
    }

    takeDamage(amount, isCrit = false) {
        if (this.isSpawning) return; // Invincible while spawning
        
        this.hp -= amount;
        this.flashTime = 0.1;
        Particles.spawnDamageNumber(this.x, this.y, amount, isCrit);
        AudioSys.playHit();
        
        if (this.hp <= 0) {
            this.active = false;
            Particles.spawn(this.x, this.y, 20, this.color, 1, 1);
            AudioSys.playEnemyDeath();
            if (typeof Game.enemyDied === 'function') {
                Game.enemyDied(this);
            } else {
                Game.addScore(this.scoreValue);
            }
            
            // Chance to drop powerup
            if (Math.random() < 0.05) {
                Game.spawnPowerup(this.x, this.y);
            }
        } else {
            Particles.spawn(this.x, this.y, 5, this.color, 0.5, 0.5);
        }
    }
    
    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        
        if (this.isSpawning) {
            // Spawn Portal Effect
            const scale = 1 - this.spawnTimer; // 0 to 1
            const rot = this.spawnTimer * Math.PI * 4;
            
            ctx.rotate(rot);
            ctx.scale(scale, scale);
            
            ctx.strokeStyle = this.color;
            ctx.shadowBlur = 15;
            ctx.shadowColor = this.color;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, this.radius + Math.random()*5, 0, Math.PI * 2);
            ctx.stroke();
            
            if (Math.random() > 0.5) {
                Particles.spawn(this.x, this.y, 1, this.color, 0.5, 0.2);
            }
            
            ctx.restore();
            return;
        }

        // Add drop shadow
        ctx.save();
        ctx.translate(10, 10);
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI*2);
        ctx.fill();
        ctx.restore();
        
        // Add light pool
        const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, this.radius * 4);
        grad.addColorStop(0, `rgba(${this.hexToRgb(this.color)}, 0.15)`);
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius * 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.rotate(this.rotation);

        if (this.flashTime > 0) {
            ctx.globalCompositeOperation = 'source-atop';
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.fillRect(-this.radius*2, -this.radius*2, this.radius*4, this.radius*4);
            ctx.globalCompositeOperation = 'source-over';
        }

        // Draw Enemy Procedural Body
        ctx.fillStyle = '#111';
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius * 0.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
    
    // Helper
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

class Chaser extends Enemy {
    constructor(x, y, waveMultiplier) {
        super(x, y, 30 * waveMultiplier, 90 + (waveMultiplier * 5), 10, 100, '#ff3333', 12);
        this.rotation = 0;
    }

    update(dt, player) {
        this.navigateTowards(dt, player.x, player.y);
        this.updateThreatHUD('PURSUIT');
        super.update(dt, player);
    }

    draw(ctx) {
        super.draw(ctx);
    }
}

class Hunter extends Enemy {
    constructor(x, y, waveMultiplier) {
        super(x, y, 20 * waveMultiplier, 70 + (waveMultiplier * 5), 15, 200, '#9d00ff', 10);
        this.rotation = 0;
        this.fireTimer = Utils.random(1.0, 3.0);
    }

    update(dt, player) {
        const dist = Utils.distance(this.x, this.y, player.x, player.y);
        if (dist > 350) {
            this.navigateTowards(dt, player.x, player.y);
            this.updateThreatHUD('PURSUIT');
        } else if (dist < 200) {
            const angle = Utils.angle(this.x, this.y, player.x, player.y);
            this.vx = -Math.cos(angle) * this.speed * 0.5;
            this.vy = -Math.sin(angle) * this.speed * 0.5;
            this.rotation = angle;
            this.updateThreatHUD('EVADE');
        } else {
            this.vx *= 0.9;
            this.vy *= 0.9;
            this.rotation = Utils.angle(this.x, this.y, player.x, player.y);
            this.updateThreatHUD('INTERCEPT');
        }

        if (!this.isSpawning) {
            this.fireTimer -= dt;
            if (this.fireTimer <= 0) {
                if (typeof Game.spawnEnemyBullet === 'function') {
                    Game.spawnEnemyBullet(this.x, this.y, this.rotation, 15);
                }
                this.fireTimer = Utils.random(2.0, 4.0);
            }
        }

        super.update(dt, player);
    }

    draw(ctx) {
        super.draw(ctx);
        
        // Scanner beam additive
        if (!this.isSpawning) {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.rotation);
            ctx.fillStyle = 'rgba(157, 0, 255, 0.1)';
            ctx.shadowBlur = 0;
            ctx.beginPath();
            ctx.moveTo(this.radius * 1.2, 0);
            ctx.lineTo(this.radius * 6, this.radius * 1.5);
            ctx.lineTo(this.radius * 6, -this.radius * 1.5);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        }
    }
}

class Tank extends Enemy {
    constructor(x, y, waveMultiplier) {
        super(x, y, 150 * waveMultiplier, 45 + (waveMultiplier * 5), 30, 350, '#ff00ff', 20);
        this.pulse = 0;
    }

    update(dt, player) {
        this.navigateTowards(dt, player.x, player.y);
        this.pulse += dt * 3;
        this.updateThreatHUD('GUARD');
        super.update(dt, player);
    }

    draw(ctx) {
        super.draw(ctx);
    }
}
