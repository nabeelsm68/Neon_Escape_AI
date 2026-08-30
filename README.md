# NEON ESCAPE

**NEON ESCAPE** is a fast-paced, high-intensity cyberpunk top-down survival shooter. Survive the digital void against increasingly difficult waves of enemies and defeat the final Void Sentinel boss. 

Built entirely with HTML5 Canvas, CSS3, and Vanilla JavaScript, without any external game engines or frameworks.

## Features
- **Fluid Top-Down Shooter Mechanics**: Fast, responsive movement and aiming.
- **Wave-Based Progression**: Difficulty scales up as you progress through waves.
- **Unique Enemies**: 
  - *Chaser*: Basic swarm enemy.
  - *Hunter*: Fast, predictive enemy.
  - *Tank*: Slow, heavily armored, high damage.
- **Boss Battle**: Face the formidable Void Sentinel with multiple phases and attack patterns.
- **Special Abilities**: Use Dash for mobility/invincibility and EMP to clear surrounding enemies.
- **Procedural Visuals**: Cyberpunk neon aesthetic created entirely using Canvas drawing APIs (glows, particles, grids).
- **Web Audio API**: Procedural sound effects synthesized directly in the browser.

## Controls
- **W A S D**: Move
- **MOUSE**: Aim
- **LEFT CLICK**: Shoot
- **SPACE**: Dash (Brief invulnerability & speed boost)
- **E**: EMP Special Ability (Area of Effect damage)
- **ESC**: Pause Game

## How to Run
Simply open the `index.html` file in any modern web browser (Google Chrome, Microsoft Edge, or Firefox recommended).
No build steps or local servers are required to play.

## Technologies
- HTML5 (Canvas API for all rendering)
- CSS3 (For UI overlays and styling)
- Vanilla JavaScript (ES6+ for game logic and orchestration)
- Web Audio API (For procedural sound generation)

## Game Systems
- **Game Loop**: Utilizes `requestAnimationFrame` and Delta Time to decouple physics/movement from frame rate.
- **Collision Detection**: Custom Circle-Circle distance-based collision logic.
- **Enemy AI**: Predictive aiming and rotation tracking towards the player.
- **Particle System**: Custom particle class managing movement, rotation, fading, and pooling.
- **State Management**: Simple state machine separating Menu, Playing, Paused, Game Over, and Victory states.

## Project Structure
- `index.html`: Main HTML entry point and UI layers.
- `style.css`: All styling, CSS animations, and UI positioning.
- `js/`: Modular JavaScript files:
  - `main.js`: Initialization, game loop, and window resizing.
  - `game.js`: Orchestrator, wave manager, rendering manager.
  - `player.js`: Player physics, health, and ability logic.
  - `enemy.js`: Enemy class inheritance (Chaser, Hunter, Tank).
  - `boss.js`: Void Sentinel boss logic and attack patterns.
  - `bullet.js`: Projectile physics.
  - `powerups.js`: Logic for Health, Energy, and Overdrive drops.
  - `collision.js`: Math logic for intersections.
  - `input.js`: Keyboard and Mouse tracking.
  - `audio.js`: Web Audio API synthesizer.
  - `ui.js`: DOM manipulation for menus and HUD.
  - `effects.js`: Screen shake and background grid rendering.
  - `particles.js`: Visual particle effects.
  - `utils.js`: Math and random generation helpers.

## Credits
An original student project. 
Designed to demonstrate proficient use of raw Web APIs to construct a complete, polished, and playable game experience.
