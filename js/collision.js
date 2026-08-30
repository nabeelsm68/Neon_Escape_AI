// Collision Detection
const Collision = {
    // Circle-Circle collision
    circleCircle(c1, c2) {
        const dx = c2.x - c1.x;
        const dy = c2.y - c1.y;
        const distanceSq = dx * dx + dy * dy;
        const radiiSum = c1.radius + c2.radius;
        return distanceSq < radiiSum * radiiSum;
    },

    // Point in Circle
    pointCircle(px, py, cx, cy, r) {
        const dx = px - cx;
        const dy = py - cy;
        return (dx * dx + dy * dy) < (r * r);
    },

    // Circle-Rectangle Collision (AABB)
    circleRect(circle, rect) {
        const testX = Utils.clamp(circle.x, rect.x, rect.x + rect.w);
        const testY = Utils.clamp(circle.y, rect.y, rect.y + rect.h);

        const distX = circle.x - testX;
        const distY = circle.y - testY;
        const distance = Math.sqrt((distX*distX) + (distY*distY));

        return distance <= circle.radius;
    },
    
    // Line-Line Intersection
    lineLine(x1, y1, x2, y2, x3, y3, x4, y4) {
        const den = ((y4-y3)*(x2-x1) - (x4-x3)*(y2-y1));
        if (den === 0) return false;
        
        const uA = ((x4-x3)*(y1-y3) - (y4-y3)*(x1-x3)) / den;
        const uB = ((x2-x1)*(y1-y3) - (y2-y1)*(x1-x3)) / den;
        
        return (uA >= 0 && uA <= 1 && uB >= 0 && uB <= 1);
    },

    // Line-Rectangle Intersection
    lineRect(x1, y1, x2, y2, rx, ry, rw, rh) {
        const left = this.lineLine(x1, y1, x2, y2, rx, ry, rx, ry + rh);
        const right = this.lineLine(x1, y1, x2, y2, rx + rw, ry, rx + rw, ry + rh);
        const top = this.lineLine(x1, y1, x2, y2, rx, ry, rx + rw, ry);
        const bottom = this.lineLine(x1, y1, x2, y2, rx, ry + rh, rx + rw, ry + rh);
        
        if ((x1 > rx && x1 < rx + rw && y1 > ry && y1 < ry + rh) ||
            (x2 > rx && x2 < rx + rw && y2 > ry && y2 < ry + rh)) {
            return true;
        }

        return left || right || top || bottom;
    },
    
    // Check if path is clear
    checkLineOfSight(x1, y1, x2, y2, walls) {
        if (!walls) return true;
        for (let i = 0; i < walls.length; i++) {
            const w = walls[i];
            if (this.lineRect(x1, y1, x2, y2, w.x, w.y, w.w, w.h)) {
                return false;
            }
        }
        return true;
    },
    
    // Resolve collision between circle and walls by pushing circle out
    resolveWallCollision(entity, walls) {
        for (let i = 0; i < walls.length; i++) {
            const rect = walls[i];
            
            // Find the closest point to the circle within the rectangle
            const closestX = Utils.clamp(entity.x, rect.x, rect.x + rect.w);
            const closestY = Utils.clamp(entity.y, rect.y, rect.y + rect.h);
            
            const distanceX = entity.x - closestX;
            const distanceY = entity.y - closestY;
            const distanceSq = (distanceX * distanceX) + (distanceY * distanceY);
            
            if (distanceSq < entity.radius * entity.radius) {
                // Collision detected! Calculate penetration depth
                const distance = Math.sqrt(distanceSq);
                
                // If distance is 0, center of circle is inside the rect, push out based on shortest distance to edge
                if (distance === 0) {
                    const distToLeft = entity.x - rect.x;
                    const distToRight = (rect.x + rect.w) - entity.x;
                    const distToTop = entity.y - rect.y;
                    const distToBottom = (rect.y + rect.h) - entity.y;
                    
                    const min = Math.min(distToLeft, distToRight, distToTop, distToBottom);
                    if (min === distToLeft) entity.x = rect.x - entity.radius;
                    else if (min === distToRight) entity.x = rect.x + rect.w + entity.radius;
                    else if (min === distToTop) entity.y = rect.y - entity.radius;
                    else if (min === distToBottom) entity.y = rect.y + rect.h + entity.radius;
                } else {
                    const overlap = entity.radius - distance;
                    // Push the entity out
                    entity.x += (distanceX / distance) * overlap;
                    entity.y += (distanceY / distance) * overlap;
                }
            }
        }
    },

    // Handle bounding box constraint (keeps entity inside arena)
    keepInBounds(entity, width, height) {
        if (entity.x - entity.radius < 0) entity.x = entity.radius;
        if (entity.x + entity.radius > width) entity.x = width - entity.radius;
        if (entity.y - entity.radius < 0) entity.y = entity.radius;
        if (entity.y + entity.radius > height) entity.y = height - entity.radius;
        
        // Also keep out of internal walls
        if (Environment && Environment.walls) {
            this.resolveWallCollision(entity, Environment.walls);
        }
    }
};
