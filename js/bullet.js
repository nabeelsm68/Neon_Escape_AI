// Bullets and Projectiles
class Bullet {
    constructor(x, y, angle, speed, damage, color, isPlayerBullet) {
        this.x = x;
        this.y = y;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.damage = damage;
        this.color = color;
        this.isPlayerBullet = isPlayerBullet;
        this.radius = 4;
        this.active = true;
    }

    update(dt) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        
        // Add trail particle occasionally
        if (Math.random() > 0.5) {
            Particles.list.push(new Particle(
                this.x, this.y, 
                0, 0, 
                0.2, this.color, 2
            ));
        }

        // Out of bounds check
        if (this.x < 0 || this.x > Game.worldWidth || this.y < 0 || this.y > Game.worldHeight) {
            this.active = false;
        }
    }

    draw(ctx) {
        ctx.save();
        
        // Light pool
        ctx.translate(this.x, this.y);
        ctx.rotate(Math.atan2(this.vy, this.vx));
        
        const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, this.radius * 3);
        grad.addColorStop(0, `rgba(255, 255, 255, 0.5)`);
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius * 3, 0, Math.PI * 2);
        ctx.fill();

        // Bullet core (Stretched for motion blur)
        const stretch = 1.5 + Math.sqrt(this.vx*this.vx + this.vy*this.vy) * 0.002;
        ctx.scale(stretch, 1);
        
        ctx.fillStyle = '#fff';
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Inner core
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius * 0.5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
}
