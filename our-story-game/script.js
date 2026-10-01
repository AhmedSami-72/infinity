/**
 * مهمة ∞ - الفصل الأول: الخطوبة
 * 2D Platformer Game Engine
 * Characters: أحمد (Player) & إسراء (In-Game Animated Character & Narrator)
 * Pure Vanilla JavaScript & HTML5 Canvas - No External Dependencies
 */

'use strict';

/* ==========================================================================
   1. Game State & Configuration
   ========================================================================== */

const gameState = {
  currentLevel: 1,
  unlockedLevels: [1],
  health: 3,
  maxHealth: 3,
  collectiblesCollected: 0,
  collectiblesRequired: 5,
  totalInfinityFound: 0,
  checkpoints: { 1: null, 2: null, 3: null, 4: null, 5: null },
  inventory: {
    infinity: 0,
    key: false,
    card: false,
    ring: false
  },
  gameStatus: 'boot', // 'boot' | 'playing' | 'paused' | 'level_complete' | 'game_over' | 'finale'
  soundEnabled: false,
  easterEggClicks: 0
};

// Safe progress restoration
try {
  const saved = localStorage.getItem('mohema_khetoba_unlocked');
  if (saved) {
    const parsed = JSON.parse(saved);
    if (Array.isArray(parsed) && parsed.length > 0) gameState.unlockedLevels = parsed;
  }
} catch (_) {}

function saveProgress() {
  try {
    localStorage.setItem('mohema_khetoba_unlocked', JSON.stringify(gameState.unlockedLevels));
  } catch (_) {}
}

/* ==========================================================================
   2. Audio Manager (Web Audio API Synthesizer + File Fallback)
   ========================================================================== */

class AudioManager {
  constructor() {
    this.audioEl = document.getElementById('bg-audio');
    this.audioCtx = null;
    this.isPlaying = false;
    this.ambientInterval = null;
    this.masterGain = null;
    this.initAudioElement();
  }

  initAudioElement() {
    if (this.audioEl) {
      this.audioEl.volume = 0.55;
      this.audioEl.loop = true;
      this.audioEl.addEventListener('error', () => {
        // Safe procedural fallback if audio file is not present
      });
    }
  }

  initContext() {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
        this.masterGain = this.audioCtx.createGain();
        this.masterGain.gain.setValueAtTime(0.08, this.audioCtx.currentTime);
        this.masterGain.connect(this.audioCtx.destination);
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  playSfx(type) {
    if (!gameState.soundEnabled) return;
    this.initContext();
    if (!this.audioCtx) return;

    try {
      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      if (type === 'jump') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(240, now);
        osc.frequency.exponentialRampToValueAtTime(480, now + 0.14);
        gain.gain.setValueAtTime(0.09, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
        osc.start(now);
        osc.stop(now + 0.14);
      } else if (type === 'collect') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(523.25, now);
        osc.frequency.setValueAtTime(659.25, now + 0.07);
        osc.frequency.setValueAtTime(783.99, now + 0.14);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
      } else if (type === 'click') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(900, now + 0.08);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
      } else if (type === 'checkpoint') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.3);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
      } else if (type === 'hit') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(70, now + 0.18);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
        osc.start(now);
        osc.stop(now + 0.18);
      } else if (type === 'glitch') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(420, now);
        osc.frequency.setValueAtTime(120, now + 0.05);
        osc.frequency.setValueAtTime(680, now + 0.1);
        osc.frequency.setValueAtTime(80, now + 0.2);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc.start(now);
        osc.stop(now + 0.35);
      } else if (type === 'door') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.exponentialRampToValueAtTime(320, now + 0.45);
        gain.gain.setValueAtTime(0.14, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
        osc.start(now);
        osc.stop(now + 0.5);
      } else if (type === 'victory') {
        const notes = [440, 554.37, 659.25, 880];
        notes.forEach((freq, idx) => {
          const noteOsc = this.audioCtx.createOscillator();
          const noteGain = this.audioCtx.createGain();
          noteOsc.type = 'sine';
          noteOsc.frequency.setValueAtTime(freq, now + idx * 0.11);
          noteGain.gain.setValueAtTime(0.1, now + idx * 0.11);
          noteGain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.11 + 0.28);
          noteOsc.connect(noteGain);
          noteGain.connect(this.audioCtx.destination);
          noteOsc.start(now + idx * 0.11);
          noteOsc.stop(now + idx * 0.11 + 0.28);
        });
      }
    } catch (_) {}
  }

  startAmbient() {
    this.stopAmbient();
    const chords = [
      [261.63, 329.63, 392.00], // C
      [293.66, 369.99, 440.00], // D
      [329.63, 392.00, 493.88], // Em
      [349.23, 440.00, 523.25]  // F
    ];
    let chordIdx = 0;

    const playStep = () => {
      if (!this.isPlaying || !this.audioCtx) return;
      const current = chords[chordIdx % chords.length];
      current.forEach((freq, i) => {
        setTimeout(() => {
          if (this.isPlaying && this.audioCtx) {
            try {
              const now = this.audioCtx.currentTime;
              const osc = this.audioCtx.createOscillator();
              const gain = this.audioCtx.createGain();
              osc.type = 'sine';
              osc.frequency.setValueAtTime(freq, now);
              gain.gain.setValueAtTime(0.001, now);
              gain.gain.exponentialRampToValueAtTime(0.03, now + 0.3);
              gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.2);
              osc.connect(gain);
              gain.connect(this.masterGain);
              osc.start(now);
              osc.stop(now + 2.2);
            } catch (_) {}
          }
        }, i * 360);
      });
      chordIdx++;
    };

    playStep();
    this.ambientInterval = setInterval(playStep, 3200);
  }

  stopAmbient() {
    if (this.ambientInterval) {
      clearInterval(this.ambientInterval);
      this.ambientInterval = null;
    }
  }

  toggle() {
    this.initContext();
    this.isPlaying = !this.isPlaying;
    gameState.soundEnabled = this.isPlaying;

    const icon = document.getElementById('sound-icon');
    if (icon) icon.textContent = this.isPlaying ? '🔊' : '🔇';

    if (this.isPlaying) {
      if (this.audioEl && this.audioEl.src) {
        const playPromise = this.audioEl.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => this.startAmbient());
        }
      } else {
        this.startAmbient();
      }
    } else {
      if (this.audioEl) this.audioEl.pause();
      this.stopAmbient();
    }
  }
}

const audioManager = new AudioManager();

/* ==========================================================================
   3. Input Manager & Mobile Touch Controls
   ========================================================================== */

class InputManager {
  constructor() {
    this.keys = {
      left: false,
      right: false,
      jump: false,
      interact: false
    };

    this.bindKeyboard();
    this.bindTouch();
  }

  bindKeyboard() {
    window.addEventListener('keydown', (e) => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') this.keys.left = true;
      if (e.code === 'ArrowRight' || e.code === 'KeyD') this.keys.right = true;
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
        if (!this.keys.jump) this.onJumpPress();
        this.keys.jump = true;
      }
      if (e.code === 'KeyE') {
        this.keys.interact = true;
        this.onInteractPress();
      }
    });

    window.addEventListener('keyup', (e) => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') this.keys.left = false;
      if (e.code === 'ArrowRight' || e.code === 'KeyD') this.keys.right = false;
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') this.keys.jump = false;
      if (e.code === 'KeyE') this.keys.interact = false;
    });
  }

  bindTouch() {
    const bindBtn = (id, prop, onPress) => {
      const el = document.getElementById(id);
      if (!el) return;

      const start = (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.keys[prop] = true;
        el.classList.add('active');
        if (onPress) onPress();
      };

      const end = (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.keys[prop] = false;
        el.classList.remove('active');
      };

      el.addEventListener('pointerdown', start);
      el.addEventListener('pointerup', end);
      el.addEventListener('pointercancel', end);
      el.addEventListener('touchstart', start, { passive: false });
      el.addEventListener('touchend', end, { passive: false });
    };

    bindBtn('btn-left', 'left');
    bindBtn('btn-right', 'right');
    bindBtn('btn-jump', 'jump', () => this.onJumpPress());
    bindBtn('btn-action', 'interact', () => this.onInteractPress());
  }

  onJumpPress() {
    if (gameInstance && gameInstance.player) {
      gameInstance.player.jump();
    }
  }

  onInteractPress() {
    if (gameInstance) {
      gameInstance.handleInteractAction();
    }
  }
}

/* ==========================================================================
   4. Camera System
   ========================================================================== */

class Camera {
  constructor(viewportWidth, viewportHeight) {
    this.x = 0;
    this.y = 0;
    this.viewportWidth = viewportWidth;
    this.viewportHeight = viewportHeight;
    this.worldWidth = 2600;
    this.worldHeight = 700;
  }

  resize(w, h) {
    this.viewportWidth = w;
    this.viewportHeight = h;
  }

  follow(target, levelWidth, levelHeight) {
    this.worldWidth = levelWidth;
    this.worldHeight = levelHeight;

    const targetX = target.x + target.width / 2 - this.viewportWidth * 0.42;
    const targetY = target.y + target.height / 2 - this.viewportHeight * 0.58;

    this.x += (targetX - this.x) * 0.12;
    this.y += (targetY - this.y) * 0.12;

    this.x = Math.max(0, Math.min(this.x, this.worldWidth - this.viewportWidth));
    this.y = Math.max(-100, Math.min(this.y, this.worldHeight - this.viewportHeight));
  }
}

/* ==========================================================================
   5. Particle System
   ========================================================================== */

class ParticleSystem {
  constructor() {
    this.particles = [];
    this.maxParticles = 75;
  }

  emit(x, y, color = '#C9A86A', count = 8, speed = 110, life = 0.6) {
    for (let i = 0; i < count; i++) {
      if (this.particles.length >= this.maxParticles) {
        this.particles.shift();
      }
      const angle = Math.random() * Math.PI * 2;
      const vel = (Math.random() * 0.8 + 0.2) * speed;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * vel,
        vy: Math.sin(angle) * vel,
        color,
        life,
        maxLife: life,
        size: Math.random() * 3 + 2
      });
    }
  }

  update(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  draw(ctx, camera) {
    ctx.save();
    for (const p of this.particles) {
      const sx = p.x - camera.x;
      const sy = p.y - camera.y;
      const alpha = Math.max(0, p.life / p.maxLife);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(sx, sy, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

/* ==========================================================================
   6. Speech Bubble Manager (Canvas Floating Speech Bubbles)
   ========================================================================== */

class SpeechBubbleManager {
  constructor() {
    this.bubbles = [];
  }

  add(speaker, text, targetObj, duration = 3.2, offset = { x: 0, y: -45 }) {
    // If a bubble from this speaker already exists, replace it
    this.bubbles = this.bubbles.filter(b => b.speaker !== speaker);
    this.bubbles.push({
      speaker,
      text,
      targetObj,
      duration,
      maxDuration: duration,
      offset
    });
  }

  update(dt) {
    for (let i = this.bubbles.length - 1; i >= 0; i--) {
      const b = this.bubbles[i];
      b.duration -= dt;
      if (b.duration <= 0) {
        this.bubbles.splice(i, 1);
      }
    }
  }

  draw(ctx, camera) {
    ctx.save();
    for (const b of this.bubbles) {
      const obj = b.targetObj;
      if (!obj) continue;

      const screenX = Math.round(obj.x + obj.width / 2 + b.offset.x - camera.x);
      const screenY = Math.round(obj.y + b.offset.y - camera.y);

      // Measure text width
      ctx.font = 'bold 12px sans-serif';
      const textMetrics = ctx.measureText(b.text);
      const padding = 12;
      const boxW = Math.max(120, textMetrics.width + padding * 2);
      const boxH = 34;

      const boxX = screenX - boxW / 2;
      const boxY = screenY - boxH;

      // Alpha fade out
      const alpha = Math.min(1, b.duration * 2);
      ctx.globalAlpha = alpha;

      // Bubble Background
      ctx.fillStyle = b.speaker === 'إسراء' ? 'rgba(30, 20, 26, 0.95)' : 'rgba(20, 20, 28, 0.95)';
      ctx.strokeStyle = b.speaker === 'إسراء' ? '#FFA6B5' : '#C9A86A';
      ctx.lineWidth = 1.5;

      // Rounded rectangle
      ctx.beginPath();
      ctx.roundRect(boxX, boxY, boxW, boxH, 10);
      ctx.fill();
      ctx.stroke();

      // Tail
      ctx.fillStyle = b.speaker === 'إسراء' ? 'rgba(30, 20, 26, 0.95)' : 'rgba(20, 20, 28, 0.95)';
      ctx.beginPath();
      ctx.moveTo(screenX - 6, boxY + boxH);
      ctx.lineTo(screenX, boxY + boxH + 6);
      ctx.lineTo(screenX + 6, boxY + boxH);
      ctx.closePath();
      ctx.fill();

      // Text
      ctx.fillStyle = '#FFFFFF';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(b.text, screenX, boxY + boxH / 2);
    }
    ctx.restore();
  }
}

/* ==========================================================================
   7. Player Class (Ahmed - Real Movement, Physics, Jump & Vector Drawing)
   ========================================================================== */

class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 28;
    this.height = 50;
    this.vx = 0;
    this.vy = 0;
    this.speed = 225;
    this.jumpForce = 510;
    this.gravity = 1180;
    this.grounded = false;
    this.facing = 1;
    this.state = 'idle';
    this.runCycle = 0;
    this.invulnerableTimer = 0;
    this.jumpCount = 0;
    this.maxJumps = 2;
  }

  applyGravity(dt) {
    this.vy += this.gravity * dt;
    if (this.vy > 900) this.vy = 900;
  }

  jump() {
    if (this.grounded || this.jumpCount < this.maxJumps) {
      if (this.grounded) {
        this.jumpCount = 1;
      } else {
        this.jumpCount = 2;
      }
      this.vy = -this.jumpForce;
      this.grounded = false;
      audioManager.playSfx('jump');
      gameInstance.particles.emit(this.x + this.width / 2, this.y + this.height, '#E7D5B0', 6, 75, 0.35);
    }
  }

  takeDamage() {
    if (this.invulnerableTimer > 0) return;
    this.invulnerableTimer = 1.2;
    gameState.health = Math.max(0, gameState.health - 1);
    UIManager.updateHealth();
    audioManager.playSfx('hit');
    gameInstance.particles.emit(this.x + this.width / 2, this.y + this.height / 2, '#E84A64', 12, 110, 0.5);

    if (gameState.health <= 0) {
      gameInstance.handleGameOver();
    } else {
      gameInstance.respawnAtCheckpoint();
    }
  }

  handleCollision(platforms) {
    if (!platforms || !Array.isArray(platforms)) return;

    // Check vertical collisions (ground & ceiling)
    for (const p of platforms) {
      if (this.collidesWith(p)) {
        if (this.vy > 0) {
          // Landing on top of a platform: stop falling
          this.y = p.y - this.height;
          this.vy = 0;
          this.grounded = true;
          this.jumpCount = 0;
        } else if (this.vy < 0) {
          // Hitting platform from below: stop upward velocity
          this.y = p.y + p.h;
          this.vy = 0;
        }
      }
    }

    // Check horizontal collisions (walls)
    for (const p of platforms) {
      if (this.collidesWith(p)) {
        if (this.vx > 0) {
          // Moving right and hitting platform wall: stop horizontal movement
          this.x = p.x - this.width;
          this.vx = 0;
        } else if (this.vx < 0) {
          // Moving left and hitting platform wall: stop horizontal movement
          this.x = p.x + p.w;
          this.vx = 0;
        }
      }
    }
  }

  update(dt, input, platforms) {
    if (this.invulnerableTimer > 0) {
      this.invulnerableTimer -= dt;
    }

    // Horizontal velocity from input
    this.vx = 0;
    if (input && input.keys) {
      if (input.keys.left) {
        this.vx = -this.speed;
        this.facing = -1;
      }
      if (input.keys.right) {
        this.vx = this.speed;
        this.facing = 1;
      }
    }

    // Apply gravity
    this.applyGravity(dt);

    // Update X position and stop when colliding with platforms
    this.x += this.vx * dt;
    this.checkHorizontalCollisions(platforms);

    // Update Y position and stop when colliding with platforms
    this.y += this.vy * dt;
    this.grounded = false;
    this.checkVerticalCollisions(platforms);

    // Comprehensive collision verification
    this.handleCollision(platforms);

    // Animation state
    if (!this.grounded) {
      this.state = this.vy < 0 ? 'jump' : 'fall';
    } else if (Math.abs(this.vx) > 10) {
      this.state = 'run';
      this.runCycle += dt * 14;
    } else {
      this.state = 'idle';
      this.runCycle = 0;
    }
  }

  checkHorizontalCollisions(platforms) {
    if (!platforms) return;
    for (const p of platforms) {
      if (this.collidesWith(p)) {
        if (this.vx > 0) {
          this.x = p.x - this.width;
          this.vx = 0;
        } else if (this.vx < 0) {
          this.x = p.x + p.w;
          this.vx = 0;
        }
      }
    }
  }

  checkVerticalCollisions(platforms) {
    if (!platforms) return;
    for (const p of platforms) {
      if (this.collidesWith(p)) {
        if (this.vy > 0) {
          this.y = p.y - this.height;
          this.vy = 0;
          this.grounded = true;
          this.jumpCount = 0;
        } else if (this.vy < 0) {
          this.y = p.y + p.h;
          this.vy = 0;
        }
      }
    }
  }

  collidesWith(rect) {
    return (
      this.x < rect.x + rect.w &&
      this.x + this.width > rect.x &&
      this.y < rect.y + rect.h &&
      this.y + this.height > rect.y
    );
  }

  draw(ctx, camera) {
    const screenX = Math.round(this.x - camera.x);
    const screenY = Math.round(this.y - camera.y);

    if (this.invulnerableTimer > 0 && Math.floor(Date.now() / 100) % 2 === 0) {
      return;
    }

    ctx.save();
    ctx.translate(screenX + this.width / 2, screenY + this.height / 2);
    if (this.facing === -1) {
      ctx.scale(-1, 1);
    }

    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.beginPath();
    ctx.ellipse(0, 24, 12, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Leg swings
    let legOffsetL = 0;
    let legOffsetR = 0;
    if (this.state === 'run') {
      legOffsetL = Math.sin(this.runCycle) * 7;
      legOffsetR = -Math.sin(this.runCycle) * 7;
    } else if (this.state === 'jump') {
      legOffsetL = -4;
      legOffsetR = 3;
    }

    // Legs
    ctx.fillStyle = '#181822';
    ctx.fillRect(-8 + legOffsetL, 8, 6, 16);
    ctx.fillRect(2 + legOffsetR, 8, 6, 16);

    // Shoes
    ctx.fillStyle = '#0E0E14';
    ctx.fillRect(-9 + legOffsetL, 22, 8, 4);
    ctx.fillRect(1 + legOffsetR, 22, 8, 4);

    // Torso / Dark Coat
    ctx.fillStyle = '#22222E';
    ctx.fillRect(-10, -10, 20, 20);

    // Collar & Gold Tie
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.moveTo(0, -10);
    ctx.lineTo(-4, -4);
    ctx.lineTo(4, -4);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#C9A86A';
    ctx.beginPath();
    ctx.moveTo(0, -6);
    ctx.lineTo(-2, 4);
    ctx.lineTo(0, 6);
    ctx.lineTo(2, 4);
    ctx.closePath();
    ctx.fill();

    // Arms
    ctx.fillStyle = '#1D1D28';
    if (this.state === 'run') {
      ctx.fillRect(-12, -8 + legOffsetR, 5, 14);
      ctx.fillRect(7, -8 + legOffsetL, 5, 14);
    } else if (this.state === 'jump') {
      ctx.fillRect(-12, -14, 5, 12);
      ctx.fillRect(7, -14, 5, 12);
    } else {
      ctx.fillRect(-12, -8, 5, 14);
      ctx.fillRect(7, -8, 5, 14);
    }

    // Head
    ctx.fillStyle = '#FCE1CD';
    ctx.fillRect(-3, -14, 6, 5);
    ctx.beginPath();
    ctx.arc(0, -18, 9, 0, Math.PI * 2);
    ctx.fill();

    // Hair
    ctx.fillStyle = '#1A1614';
    ctx.beginPath();
    ctx.arc(0, -21, 9, Math.PI, Math.PI * 2);
    ctx.lineTo(8, -18);
    ctx.lineTo(5, -14);
    ctx.lineTo(-8, -17);
    ctx.closePath();
    ctx.fill();

    // Eye & Smile
    ctx.fillStyle = '#1A1614';
    ctx.fillRect(3, -19, 2, 2.5);

    ctx.strokeStyle = '#9E4D43';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(4, -14, 2.5, 0, Math.PI * 0.8);
    ctx.stroke();

    ctx.restore();
  }
}

if (typeof window !== 'undefined') {
  window.Player = Player;
}

/* ==========================================================================
   8. In-Game Animated NPC: Esraa
   ========================================================================== */

class EsraaNPC {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 28;
    this.height = 48;
    this.facing = -1; // facing left towards player
    this.state = 'idle'; // idle | wave | talk | happy
    this.bobTimer = 0;
  }

  update(dt) {
    this.bobTimer += dt * 3;
  }

  draw(ctx, camera) {
    const screenX = Math.round(this.x - camera.x);
    const screenY = Math.round(this.y - camera.y);

    ctx.save();
    ctx.translate(screenX + this.width / 2, screenY + this.height / 2);
    if (this.facing === 1) {
      ctx.scale(-1, 1);
    }

    const gentleBob = Math.sin(this.bobTimer) * 1.5;

    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.beginPath();
    ctx.ellipse(0, 23, 11, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Elegant Burgundy & Gold Dress
    ctx.fillStyle = '#9C2746';
    ctx.beginPath();
    ctx.moveTo(-9, -7 + gentleBob);
    ctx.lineTo(9, -7 + gentleBob);
    ctx.lineTo(13, 22);
    ctx.lineTo(-13, 22);
    ctx.closePath();
    ctx.fill();

    // Gold waist ribbon
    ctx.fillStyle = '#C9A86A';
    ctx.fillRect(-10, 4 + gentleBob, 20, 2.5);

    // Neck & Face
    ctx.fillStyle = '#FCE1CD';
    ctx.fillRect(-3, -13 + gentleBob, 6, 6);
    ctx.beginPath();
    ctx.arc(0, -17 + gentleBob, 8, 0, Math.PI * 2);
    ctx.fill();

    // Hair
    ctx.fillStyle = '#2C1A1D';
    ctx.beginPath();
    ctx.arc(0, -19 + gentleBob, 9, Math.PI, Math.PI * 2);
    ctx.lineTo(9, 10 + gentleBob);
    ctx.lineTo(-9, 10 + gentleBob);
    ctx.closePath();
    ctx.fill();

    // Rose Pin in Hair
    ctx.fillStyle = '#FFA6B5';
    ctx.beginPath();
    ctx.arc(6, -19 + gentleBob, 3, 0, Math.PI * 2);
    ctx.fill();

    // Eyes & Smile
    ctx.fillStyle = '#1E1A17';
    ctx.fillRect(-4, -18 + gentleBob, 2, 2);
    ctx.fillRect(2, -18 + gentleBob, 2, 2);

    ctx.strokeStyle = '#D92B45';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(0, -14 + gentleBob, 3, 0, Math.PI);
    ctx.stroke();

    ctx.restore();
  }
}

/* ==========================================================================
   9. The Levels Configuration (المراحل وبيانات المنصات وعقبات التشتيت ورموز ∞)
   ========================================================================== */

const levels = {
  // Level 1: "لسه البداية" (Tutorial disguised in real platforming)
  1: {
    name: "المرحلة الأولى: لسه البداية",
    width: 2400,
    height: 700,
    playerStart: { x: 70, y: 480 },
    collectiblesRequired: 5,
    platforms: [
      { x: 0, y: 550, w: 460, h: 150, type: 'ground' },
      { x: 530, y: 480, w: 140, h: 24, type: 'platform' },
      { x: 740, y: 410, w: 150, h: 24, type: 'platform' },
      { x: 960, y: 470, w: 320, h: 180, type: 'ground' },
      { x: 1350, y: 430, w: 130, h: 22, type: 'moving', minX: 1330, maxX: 1530, speed: 60, dir: 1 },
      { x: 1600, y: 380, w: 160, h: 24, type: 'platform' },
      { x: 1840, y: 460, w: 160, h: 24, type: 'platform' },
      { x: 2060, y: 540, w: 340, h: 160, type: 'ground' }
    ],
    // عقبات التشتيت (Distraction Obstacles that tempt or distract Ahmed from reaching Esraa)
    distractions: [
      { x: 380, y: 505, w: 34, h: 34, icon: '☕', name: 'شاي بلبن', quote: 'سيب الشاي دلوقتي وركز يا أحمد! 😂', active: true },
      { x: 800, y: 365, w: 34, h: 34, icon: '⚽', name: 'ماتش الأهلي', quote: 'ماتش إيه اللي شاغل بالك دلوقتي! 😂', active: true },
      { x: 1210, y: 425, w: 34, h: 34, icon: '💬', name: 'إشعار واتساب', quote: 'سيب الموبايل وركز في المهمة! 😉', active: true },
      { x: 1720, y: 335, w: 34, h: 34, icon: '🎮', name: 'بلايستيشن', quote: 'اللعب الحقيقي هنا معايا! 😂', active: true }
    ],
    // توزيع عناصر الـ ∞ الخمسة
    collectibles: [
      { x: 280, y: 490, collected: false, hint: 'على الطريق' },
      { x: 600, y: 420, collected: false, hint: 'فوق منصة' },
      { x: 810, y: 350, collected: false, hint: 'قفزة رشيقة' },
      { x: 1420, y: 350, collected: false, hint: 'فوق منصة متحركة' },
      { x: 1910, y: 400, collected: false, hint: 'في الممر الأخير' }
    ],
    interactiveChests: [
      { x: 1080, y: 425, w: 34, h: 28, opened: false, label: 'صندوق سري' }
    ],
    checkpoints: [
      { x: 1000, y: 410, w: 26, h: 60, reached: false }
    ],
    exitGate: { x: 2310, y: 440, w: 60, h: 100 },
    dialogueTriggers: [
      { x: 100, speaker: "إسراء", text: "أول مرحلة بس ولسه وقعت؟ ركز 😂", triggered: false, onFall: true },
      { x: 1100, speaker: "إسراء", text: "أيوه كده... خطواتك مظبوطة!", triggered: false }
    ]
  },

  // Level 2: "مفيش حاجة ببلاش" (Exploration, Hidden Key, Seal, Esraa's Chamber)
  2: {
    name: "المرحلة الثانية: مفيش حاجة ببلاش",
    width: 2500,
    height: 700,
    playerStart: { x: 70, y: 480 },
    collectiblesRequired: 3,
    platforms: [
      { x: 0, y: 550, w: 420, h: 150, type: 'ground' },
      { x: 480, y: 460, w: 150, h: 24, type: 'platform' },
      { x: 700, y: 390, w: 160, h: 24, type: 'platform' },
      { x: 940, y: 450, w: 130, h: 22, type: 'moving', minX: 930, maxX: 1120, speed: 65, dir: 1 },
      { x: 1200, y: 520, w: 320, h: 180, type: 'ground' },
      { x: 1580, y: 440, w: 150, h: 24, type: 'platform' },
      { x: 1800, y: 540, w: 700, h: 160, type: 'ground' }
    ],
    collectibles: [
      { x: 240, y: 490, collected: false },
      { x: 780, y: 330, collected: false },
      { x: 1300, y: 460, collected: false }
    ],
    keyPickup: { x: 780, y: 350, w: 26, h: 26, collected: false },
    ringSealPickup: { x: 1400, y: 475, w: 26, h: 26, collected: false },
    checkpoints: [
      { x: 1240, y: 460, w: 26, h: 60, reached: false }
    ],
    esraaNPC: { x: 1950, y: 490, active: true },
    exitGate: { x: 2360, y: 440, w: 60, h: 100 },
    dialogueTriggers: [
      { x: 150, speaker: "إسراء", text: "كنت مستنية أشوف هتعمل إيه هنا... التصريح عندي!", triggered: false }
    ]
  },

  // Level 3: "اختبار إسراء" (Moving Platforms + Dynamic Comedy)
  3: {
    name: "المرحلة الثالثة: اختبار إسراء",
    width: 2600,
    height: 700,
    playerStart: { x: 70, y: 480 },
    collectiblesRequired: 4,
    platforms: [
      { x: 0, y: 550, w: 360, h: 150, type: 'ground' },
      { x: 420, y: 480, w: 120, h: 22, type: 'moving', minX: 410, maxX: 580, speed: 85, dir: 1 },
      { x: 660, y: 410, w: 130, h: 24, type: 'platform' },
      { x: 870, y: 360, w: 120, h: 22, type: 'moving', minX: 860, maxX: 1050, speed: 90, dir: -1 },
      { x: 1140, y: 450, w: 280, h: 150, type: 'ground' },
      { x: 1480, y: 490, w: 130, h: 22, type: 'platform' },
      { x: 1680, y: 410, w: 130, h: 24, type: 'platform' },
      { x: 1890, y: 350, w: 140, h: 24, type: 'platform' },
      { x: 2100, y: 430, w: 140, h: 22, type: 'moving', minX: 2080, maxX: 2260, speed: 95, dir: 1 },
      { x: 2340, y: 530, w: 260, h: 170, type: 'ground' }
    ],
    collectibles: [
      { x: 260, y: 490, collected: false },
      { x: 720, y: 350, collected: false },
      { x: 1260, y: 390, collected: false },
      { x: 1950, y: 290, collected: false }
    ],
    checkpoints: [
      { x: 1180, y: 390, w: 26, h: 60, reached: false }
    ],
    exitGate: { x: 2500, y: 430, w: 60, h: 100 },
    dialogueTriggers: [
      { x: 450, speaker: "إسراء", text: "خلي بالك من المنصات المتحركة...", triggered: false },
      { x: 1200, speaker: "إسراء", text: "قولتلك خلي بالك 😂 مش هضحك... خلاص بقى 😂", triggered: false }
    ]
  },

  // Level 4: "القرار" (Courtyard Encounter + Active In-World YES/NO Evasion)
  4: {
    name: "المرحلة الرابعة: القرار",
    width: 2200,
    height: 700,
    playerStart: { x: 70, y: 480 },
    collectiblesRequired: 2,
    platforms: [
      { x: 0, y: 550, w: 500, h: 150, type: 'ground' },
      { x: 570, y: 480, w: 160, h: 24, type: 'platform' },
      { x: 790, y: 410, w: 160, h: 24, type: 'platform' },
      // Grand Romantic Courtyard
      { x: 1020, y: 520, w: 1180, h: 180, type: 'ground' }
    ],
    collectibles: [
      { x: 300, y: 490, collected: false },
      { x: 860, y: 350, collected: false }
    ],
    esraaNPC: { x: 1350, y: 470, active: true },
    yesNode: { x: 1580, y: 470, w: 42, h: 42, active: true },
    noNode: { x: 1460, y: 470, w: 42, h: 42, active: true, vx: 0 },
    checkpoints: [
      { x: 1060, y: 460, w: 26, h: 60, reached: false }
    ],
    exitGate: { x: 2060, y: 420, w: 60, h: 100 },
    dialogueTriggers: [
      { x: 1100, speaker: "إسراء", text: "خلاص... وصلت لحد هنا، بس عندي سؤال أخير: هنكمل؟ ❤️", triggered: false }
    ]
  },

  // Level 5: "الباب الأخير" (Final Boss-Like Challenge + Socketing Key, Card, Ring)
  5: {
    name: "المرحلة الخامسة: الباب الأخير",
    width: 2400,
    height: 700,
    playerStart: { x: 70, y: 480 },
    collectiblesRequired: 3,
    platforms: [
      { x: 0, y: 550, w: 440, h: 150, type: 'ground' },
      { x: 500, y: 470, w: 140, h: 24, type: 'platform' },
      { x: 720, y: 400, w: 140, h: 24, type: 'platform' },
      { x: 940, y: 460, w: 120, h: 22, type: 'moving', minX: 930, maxX: 1100, speed: 75, dir: 1 },
      // Grand Temple Pedestal Floor
      { x: 1180, y: 520, w: 1220, h: 180, type: 'ground' }
    ],
    collectibles: [
      { x: 260, y: 490, collected: false },
      { x: 780, y: 340, collected: false },
      { x: 1300, y: 460, collected: false }
    ],
    pedestals: [
      { id: 1, x: 1400, y: 475, w: 34, h: 45, item: 'key', icon: '🔑', label: 'المفتاح', inserted: false },
      { id: 2, x: 1580, y: 475, w: 34, h: 45, item: 'card', icon: '🪪', label: 'التصريح', inserted: false },
      { id: 3, x: 1760, y: 475, w: 34, h: 45, item: 'ring', icon: '💍', label: 'الوعد', inserted: false }
    ],
    esraaNPC: { x: 2160, y: 470, active: true },
    grandInfinityGate: { x: 1980, y: 380, w: 90, h: 140, open: false },
    checkpoints: [
      { x: 1220, y: 460, w: 26, h: 60, reached: false }
    ],
    dialogueTriggers: [
      { x: 1250, speaker: "إسراء", text: "ضع كل عنصر في مكانه لتشغيل بوابة اللانهاية!", triggered: false }
    ]
  }
};

// Aliases for compatibility and global access
const levelsConfig = levels;
if (typeof window !== 'undefined') {
  window.levels = levels;
  window.levelsConfig = levelsConfig;
}

/* ==========================================================================
   10. UI Manager (HUD, Inventory, Modals & Toast)
   ========================================================================== */

const UIManager = {
  toastTimeout: null,

  updateHealth() {
    const healthContainer = document.getElementById('hud-health');
    if (!healthContainer) return;
    healthContainer.innerHTML = '';
    for (let i = 0; i < gameState.maxHealth; i++) {
      const heart = document.createElement('span');
      heart.className = `heart-icon ${i >= gameState.health ? 'lost' : ''}`;
      heart.textContent = '❤️';
      healthContainer.appendChild(heart);
    }
  },

  updateCollectibles() {
    const countEl = document.getElementById('hud-infinity-count');
    if (countEl) {
      countEl.textContent = `${gameState.collectiblesCollected}/${gameState.collectiblesRequired}`;
    }
  },

  updateInventory() {
    const keyBadge = document.getElementById('inv-key');
    const cardBadge = document.getElementById('inv-card');
    const ringBadge = document.getElementById('inv-ring');

    if (keyBadge) keyBadge.classList.toggle('hidden', !gameState.inventory.key);
    if (cardBadge) cardBadge.classList.toggle('hidden', !gameState.inventory.card);
    if (ringBadge) ringBadge.classList.toggle('hidden', !gameState.inventory.ring);
  },

  updateLevelLabel(name) {
    const el = document.getElementById('hud-level-name');
    if (el) el.textContent = name;
  },

  showInteractPrompt(text = 'تفاعل') {
    const prompt = document.getElementById('interact-prompt');
    const label = document.getElementById('interact-prompt-text');
    if (prompt && label) {
      label.textContent = text;
      prompt.classList.remove('hidden');
    }
  },

  hideInteractPrompt() {
    const prompt = document.getElementById('interact-prompt');
    if (prompt) prompt.classList.add('hidden');
  },

  showSystemToast(text) {
    const toast = document.getElementById('system-toast');
    const textEl = document.getElementById('system-toast-text');
    if (!toast || !textEl) return;

    textEl.textContent = text;
    toast.classList.remove('hidden');

    if (this.toastTimeout) clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => {
      toast.classList.add('hidden');
    }, 2800);
  },

  showModal(id) {
    document.querySelectorAll('.game-modal').forEach(m => m.classList.remove('active'));
    const modal = document.getElementById(id);
    if (modal) modal.classList.add('active');
  },

  closeModals() {
    document.querySelectorAll('.game-modal').forEach(m => m.classList.remove('active'));
  },

  updateLevelSelectUI() {
    for (let i = 1; i <= 5; i++) {
      const card = document.getElementById(`lvl-card-${i}`);
      if (!card) continue;
      const isUnlocked = gameState.unlockedLevels.includes(i);
      if (isUnlocked) {
        card.classList.remove('locked');
        card.classList.add('unlocked');
        const status = card.querySelector('.lvl-status');
        if (status) status.textContent = 'مفتوحة ●';
      } else {
        card.classList.remove('unlocked');
        card.classList.add('locked');
        const status = card.querySelector('.lvl-status');
        if (status) status.textContent = 'مقفولة 🔒';
      }
    }
  }
};

/* ==========================================================================
   11. Main Game Engine Class
   ========================================================================== */

class Game {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.input = new InputManager();
    this.camera = new Camera(window.innerWidth, window.innerHeight);
    this.particles = new ParticleSystem();
    this.speech = new SpeechBubbleManager();
    this.player = new Player(80, 480);
    this.esraa = new EsraaNPC(0, 0);

    this.currentLevelData = null;
    this.lastTime = 0;
    this.activeInteractable = null;

    this.initCanvasSize();
    this.bindDOM();
  }

  initCanvasSize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = window.innerWidth;
    const h = window.innerHeight;

    this.canvas.width = w * dpr;
    this.canvas.height = h * dpr;
    this.ctx.scale(dpr, dpr);
    this.camera.resize(w, h);
  }

  bindDOM() {
    window.addEventListener('resize', () => this.initCanvasSize());

    // Sound toggle
    const soundBtn = document.getElementById('btn-sound-toggle');
    if (soundBtn) soundBtn.addEventListener('click', () => audioManager.toggle());

    // Level Select Modal Trigger
    const lvlBtn = document.getElementById('btn-level-select');
    if (lvlBtn) {
      lvlBtn.addEventListener('click', () => {
        UIManager.updateLevelSelectUI();
        UIManager.showModal('modal-level-select');
      });
    }

    const closeLvlBtn = document.getElementById('btn-close-level-select');
    if (closeLvlBtn) {
      closeLvlBtn.addEventListener('click', () => {
        UIManager.closeModals();
        gameState.gameStatus = 'playing';
      });
    }

    // Start from Opening Boot Sequence
    const startMissionBtn = document.getElementById('btn-start-mission');
    if (startMissionBtn) {
      startMissionBtn.addEventListener('click', () => {
        if (!gameState.soundEnabled) audioManager.toggle();
        UIManager.closeModals();
        this.loadLevel(1);
      });
    }

    // Level Card Clicks
    for (let i = 1; i <= 5; i++) {
      const card = document.getElementById(`lvl-card-${i}`);
      if (card) {
        card.addEventListener('click', () => {
          if (gameState.unlockedLevels.includes(i)) {
            UIManager.closeModals();
            this.loadLevel(i);
          }
        });
      }
    }

    // Next Level from Victory Banner
    const nextLvlBtn = document.getElementById('btn-next-level');
    if (nextLvlBtn) {
      nextLvlBtn.addEventListener('click', () => {
        UIManager.closeModals();
        if (gameState.currentLevel < 5) {
          this.loadLevel(gameState.currentLevel + 1);
        } else {
          this.startFinale();
        }
      });
    }

    // Retry after fall / Game Over
    const retryBtn = document.getElementById('btn-retry-level');
    if (retryBtn) {
      retryBtn.addEventListener('click', () => {
        UIManager.closeModals();
        gameState.health = gameState.maxHealth;
        UIManager.updateHealth();
        this.loadLevel(gameState.currentLevel);
      });
    }

    // Reset progress completely
    const resetProgressBtn = document.getElementById('btn-reset-progress');
    if (resetProgressBtn) {
      resetProgressBtn.addEventListener('click', () => {
        gameState.unlockedLevels = [1];
        saveProgress();
        UIManager.closeModals();
        this.loadLevel(1);
      });
    }

    // Easter Egg trigger from header brand
    const brandInfinity = document.querySelector('.mission-brand .infinity-gold');
    if (brandInfinity) {
      brandInfinity.addEventListener('click', () => {
        gameState.easterEggClicks++;
        if (gameState.easterEggClicks >= 3) {
          audioManager.playSfx('victory');
          UIManager.showModal('modal-easter-egg');
        }
      });
    }

    const closeEasterBtn = document.getElementById('btn-close-easter');
    if (closeEasterBtn) {
      closeEasterBtn.addEventListener('click', () => {
        document.getElementById('modal-easter-egg').classList.remove('active');
      });
    }

    // Finale Steps
    const btnFin1 = document.getElementById('btn-finale-step-1');
    if (btnFin1) {
      btnFin1.addEventListener('click', () => {
        document.getElementById('finale-step-1').classList.add('hidden');
        document.getElementById('finale-step-2').classList.remove('hidden');
      });
    }

    const btnFin2 = document.getElementById('btn-finale-step-2');
    if (btnFin2) {
      btnFin2.addEventListener('click', () => {
        document.getElementById('finale-step-2').classList.add('hidden');
        document.getElementById('finale-step-3').classList.remove('hidden');
      });
    }

    const replayBtn = document.getElementById('btn-replay-story');
    if (replayBtn) {
      replayBtn.addEventListener('click', () => {
        UIManager.closeModals();
        this.loadLevel(1);
      });
    }

    // Intro Hook Evasive NO Button & YES Button
    const btnHookNo = document.getElementById('btn-hook-no');
    const btnHookYes = document.getElementById('btn-hook-yes');
    const hookArena = document.getElementById('hook-decision-arena');
    const hookTaunt = document.getElementById('hook-taunt-msg');
    const hookGranted = document.getElementById('hook-access-granted');
    let noAttempts = 0;

    const noQuotes = [
      "إيه؟ بتفكري؟ 😂",
      "مفيش هروب من الإجابة 😉",
      "الزرار ده بيهرب مخصوص 😂",
      "جربي تدوسي هنا... لو عرفتي 😂",
      "مفيش غير اختيار واحد بس ❤️",
      "لسه بتحاولي؟ 😂 اختاري YES وبطلي عند!"
    ];

    const evadeNoButton = (e) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      if (!btnHookNo || !hookArena) return;

      const arenaRect = hookArena.getBoundingClientRect();
      const btnRect = btnHookNo.getBoundingClientRect();

      const padding = 12;
      const maxX = Math.max(10, arenaRect.width - btnRect.width - padding);
      const maxY = Math.max(10, arenaRect.height - btnRect.height - padding);

      const randomX = Math.floor(Math.random() * maxX);
      const randomY = Math.floor(Math.random() * maxY);

      btnHookNo.style.position = 'absolute';
      btnHookNo.style.left = `${randomX}px`;
      btnHookNo.style.top = `${randomY}px`;

      noAttempts++;
      if (hookTaunt) {
        hookTaunt.textContent = noQuotes[noAttempts % noQuotes.length];
        hookTaunt.style.color = '#FFA6B5';
      }
      audioManager.playSfx('click');
    };

    if (btnHookNo) {
      btnHookNo.addEventListener('mouseenter', evadeNoButton);
      btnHookNo.addEventListener('pointerenter', evadeNoButton);
      btnHookNo.addEventListener('pointerdown', evadeNoButton);
      btnHookNo.addEventListener('touchstart', evadeNoButton, { passive: false });
    }

    if (btnHookYes) {
      btnHookYes.addEventListener('click', () => {
        if (!gameState.soundEnabled) audioManager.toggle();
        audioManager.playSfx('victory');

        if (hookGranted) hookGranted.classList.remove('hidden');
        if (hookArena) hookArena.style.pointerEvents = 'none';
        if (hookTaunt) hookTaunt.textContent = "إجابة معتمدة بنسبة 100% ❤️";

        setTimeout(() => {
          UIManager.closeModals();
          UIManager.showModal('modal-boot');
        }, 1100);
      });
    }

    // Game Over select levels button
    const gameOverLevelsBtn = document.getElementById('btn-game-over-levels');
    if (gameOverLevelsBtn) {
      gameOverLevelsBtn.addEventListener('click', () => {
        UIManager.updateLevelSelectUI();
        UIManager.showModal('modal-level-select');
      });
    }

    // Fake Ending Buttons
    const btnFakeClaim = document.getElementById('btn-fake-claim');
    if (btnFakeClaim) {
      btnFakeClaim.addEventListener('click', () => {
        audioManager.playSfx('glitch');
        const modalEl = document.querySelector('#modal-fake-ending .modal-card');
        if (modalEl) {
          modalEl.classList.add('glitch-shake');
          setTimeout(() => modalEl.classList.remove('glitch-shake'), 600);
        }
        const state1 = document.getElementById('fake-end-state-1');
        const state2 = document.getElementById('fake-end-state-2');
        if (state1) state1.classList.add('hidden');
        if (state2) state2.classList.remove('hidden');
      });
    }

    const btnFakeProceed = document.getElementById('btn-fake-proceed');
    if (btnFakeProceed) {
      btnFakeProceed.addEventListener('click', () => {
        UIManager.closeModals();
        UIManager.showModal('modal-handoff-esraa');
      });
    }

    // Esraa Handoff & Mini-game
    const btnStartMini = document.getElementById('btn-start-esraa-minigame');
    let esraaMiniTimer = null;
    let esraaTimeRemaining = 15;
    let solvedNodes = [false, false, false, false];

    if (btnStartMini) {
      btnStartMini.addEventListener('click', () => {
        UIManager.closeModals();
        UIManager.showModal('modal-esraa-minigame');

        // Reset minigame state
        solvedNodes = [false, false, false, false];
        esraaTimeRemaining = 15;
        const timerVal = document.getElementById('esraa-timer-val');
        if (timerVal) timerVal.textContent = '15';
        const feedback = document.getElementById('minigame-feedback');
        if (feedback) feedback.textContent = '';

        document.querySelectorAll('.circuit-node').forEach((node) => {
          node.classList.remove('solved');
          const stateIcon = node.querySelector('.node-state');
          if (stateIcon) stateIcon.textContent = '🔒';
        });

        if (esraaMiniTimer) clearInterval(esraaMiniTimer);
        esraaMiniTimer = setInterval(() => {
          esraaTimeRemaining--;
          if (timerVal) timerVal.textContent = String(Math.max(0, esraaTimeRemaining));
          if (esraaTimeRemaining <= 0) {
            clearInterval(esraaMiniTimer);
            if (!solvedNodes.every(Boolean)) {
              if (feedback) feedback.textContent = "الوقت خلص بس إسراء تقدر تكمل برضه 😉";
            }
          }
        }, 1000);
      });
    }

    // Circuit Nodes Taps
    document.querySelectorAll('.circuit-node').forEach((nodeBtn) => {
      nodeBtn.addEventListener('click', () => {
        const nodeIdx = parseInt(nodeBtn.getAttribute('data-node') || '0', 10);
        if (!solvedNodes[nodeIdx]) {
          solvedNodes[nodeIdx] = true;
          nodeBtn.classList.add('solved');
          const stateIcon = nodeBtn.querySelector('.node-state');
          if (stateIcon) stateIcon.textContent = '🔓';
          audioManager.playSfx('collect');

          if (solvedNodes.every(Boolean)) {
            if (esraaMiniTimer) clearInterval(esraaMiniTimer);
            audioManager.playSfx('victory');
            const feedback = document.getElementById('minigame-feedback');
            if (feedback) feedback.textContent = 'تم توصيل دوائر اللانهاية بنجاح! ✨ الطريق مفتوح لأحمد!';

            setTimeout(() => {
              UIManager.closeModals();
              UIManager.showModal('modal-handoff-ahmed');
            }, 1200);
          }
        }
      });
    });

    const btnResumeAhmed = document.getElementById('btn-resume-ahmed');
    if (btnResumeAhmed) {
      btnResumeAhmed.addEventListener('click', () => {
        UIManager.closeModals();
        this.loadLevel(4);
      });
    }
  }

  loadLevel(levelNumber) {
    gameState.currentLevel = levelNumber;
    gameState.collectiblesCollected = 0;
    gameState.gameStatus = 'playing';

    // Deep clone level data
    this.currentLevelData = JSON.parse(JSON.stringify(levelsConfig[levelNumber]));
    gameState.collectiblesRequired = this.currentLevelData.collectiblesRequired;

    // Reset player position
    const start = this.currentLevelData.playerStart;
    this.player.x = start.x;
    this.player.y = start.y;
    this.player.vx = 0;
    this.player.vy = 0;

    // Place Esraa NPC if active in level
    if (this.currentLevelData.esraaNPC && this.currentLevelData.esraaNPC.active) {
      this.esraa.x = this.currentLevelData.esraaNPC.x;
      this.esraa.y = this.currentLevelData.esraaNPC.y;
    }

    // Set Checkpoint
    gameState.checkpoints[levelNumber] = { x: start.x, y: start.y };

    UIManager.updateLevelLabel(this.currentLevelData.name);
    UIManager.updateCollectibles();
    UIManager.updateHealth();
    UIManager.updateInventory();

    audioManager.playSfx('checkpoint');
    UIManager.showSystemToast(`بدء ${this.currentLevelData.name}`);
  }

  respawnAtCheckpoint() {
    const cp = gameState.checkpoints[gameState.currentLevel] || this.currentLevelData.playerStart;
    this.player.x = cp.x;
    this.player.y = cp.y;
    this.player.vx = 0;
    this.player.vy = 0;
    audioManager.playSfx('hit');

    // Reaction Speech Bubble from Esraa on player fall
    const fallQuotes = [
      "أول مرحلة بس ولسه وقعت؟ 😂",
      "قولتلك خلي بالك 😂",
      "نبدأ من هنا... عادي 😂",
      "ركز شوية يا أحمد! 😉"
    ];
    const quote = fallQuotes[Math.floor(Math.random() * fallQuotes.length)];
    this.speech.add('إسراء', quote, this.player, 3.0);
  }

  handleGameOver() {
    gameState.gameStatus = 'game_over';
    UIManager.showModal('modal-game-over');
  }

  completeLevel(levelNumber) {
    audioManager.playSfx('victory');
    const nextLvl = levelNumber + 1;
    if (nextLvl <= 5 && !gameState.unlockedLevels.includes(nextLvl)) {
      gameState.unlockedLevels.push(nextLvl);
      saveProgress();
    }

    // Level 3 triggers the Fake Ending sequence
    if (levelNumber === 3) {
      gameState.gameStatus = 'paused';
      const fakeState1 = document.getElementById('fake-end-state-1');
      const fakeState2 = document.getElementById('fake-end-state-2');
      const fakeCard = document.querySelector('#modal-fake-ending .modal-card');
      if (fakeCard) fakeCard.classList.remove('glitch-shake');
      if (fakeState1) fakeState1.classList.remove('hidden');
      if (fakeState2) fakeState2.classList.add('hidden');
      UIManager.showModal('modal-fake-ending');
      return;
    }

    gameState.gameStatus = 'level_complete';
    const titleEl = document.getElementById('complete-level-title');
    const esraaEl = document.getElementById('complete-level-esraa');
    const unlockEl = document.getElementById('unlock-text');

    const finishQuotes = {
      1: "إسراء: ماشي... نعديهالك ونشوف المرحلة الجاية!",
      2: "إسراء: أهو كده أثبت إنك تستاهل التصريح.",
      3: "إسراء: برافو! مكنتش متوقعة إنك هتعدي المنصات دي.",
      4: "إسراء: كنت عارفة إنك هتختار YES من غير تفكير ❤️",
      5: "إسراء: أتممت المهمة كلها... خطوة الخطوبة تمت بنجاح!"
    };

    if (titleEl) titleEl.textContent = `المرحلة ${levelNumber}: ✓`;
    if (esraaEl) esraaEl.textContent = finishQuotes[levelNumber] || "إسراء: ممتاز!";
    if (unlockEl) {
      unlockEl.textContent = nextLvl <= 5 ? `تم فتح المرحلة ${nextLvl} بنجاح` : `تم فتح الخاتمة النهائية`;
    }

    UIManager.showModal('modal-level-complete');
  }

  startFinale() {
    gameState.gameStatus = 'finale';
    document.getElementById('finale-step-1').classList.remove('hidden');
    document.getElementById('finale-step-2').classList.add('hidden');
    document.getElementById('finale-step-3').classList.add('hidden');
    UIManager.showModal('modal-finale');
  }

  handleInteractAction() {
    if (!this.activeInteractable) return;
    const act = this.activeInteractable;

    // Interactive Chest in Level 1
    if (act.type === 'chest') {
      const chest = act.data;
      if (!chest.opened) {
        chest.opened = true;
        gameState.collectiblesCollected++;
        gameState.inventory.infinity++;
        UIManager.updateCollectibles();
        UIManager.showSystemToast('تم فتح الصندوق والعثور على رمز ∞ مخفي!');
        audioManager.playSfx('collect');
        this.particles.emit(chest.x + 17, chest.y + 14, '#C9A86A', 16, 110, 0.6);
      }
    }

    // Key in Level 2
    else if (act.type === 'key') {
      const keyObj = act.data;
      if (!keyObj.collected) {
        keyObj.collected = true;
        gameState.inventory.key = true;
        UIManager.updateInventory();
        UIManager.showSystemToast('تم الحصول على المفتاح الذهبي 🔑');
        audioManager.playSfx('collect');
        this.particles.emit(keyObj.x + 13, keyObj.y + 13, '#C9A86A', 14, 100, 0.5);
      }
    }

    // Ring Seal in Level 2
    else if (act.type === 'ring_seal') {
      const sealObj = act.data;
      if (!sealObj.collected) {
        sealObj.collected = true;
        gameState.inventory.ring = true;
        UIManager.updateInventory();
        UIManager.showSystemToast('تم الحصول على رمز الوعد 💍');
        audioManager.playSfx('collect');
        this.particles.emit(sealObj.x + 13, sealObj.y + 13, '#FFA6B5', 14, 100, 0.5);
      }
    }

    // Esraa NPC in Level 2 (Permit conversation)
    else if (act.type === 'esraa_l2') {
      if (gameState.inventory.key && gameState.inventory.ring) {
        if (!gameState.inventory.card) {
          gameState.inventory.card = true;
          UIManager.updateInventory();
          audioManager.playSfx('victory');
          this.speech.add('إسراء', 'شاطر! معاك المفتاح والوعد... خد بطاقة الوصول!', this.esraa, 3.8);
          UIManager.showSystemToast('تم الحصول على بطاقة الوصول 🪪');
        } else {
          this.speech.add('إسراء', 'البوابة اتفتحت خلاص... انطلق للمرحلة الجاية!', this.esraa, 3.0);
        }
      } else {
        this.speech.add('إسراء', 'لازم تلاقي المفتاح 🔑 ورمز الوعد 💍 الأول!', this.esraa, 3.5);
      }
    }

    // Pedestals in Level 5 (Socketing Items)
    else if (act.type === 'pedestal') {
      const ped = act.data;
      if (!ped.inserted) {
        if (gameState.inventory[ped.item]) {
          ped.inserted = true;
          audioManager.playSfx('click');
          this.particles.emit(ped.x + 17, ped.y + 15, '#C9A86A', 16, 120, 0.6);
          UIManager.showSystemToast(`CLICK! تم تركيب ${ped.label}`);

          // Check if all 3 pedestals are filled
          const allFilled = this.currentLevelData.pedestals.every(p => p.inserted);
          if (allFilled) {
            this.currentLevelData.grandInfinityGate.open = true;
            audioManager.playSfx('door');
            this.speech.add('إسراء', 'البوابة الكبرى اتفتحت! ادخل يا أحمد ❤️', this.esraa, 4.0);
            UIManager.showSystemToast('تم فتح بوابة اللانهاية الكبرى!');
          }
        } else {
          UIManager.showSystemToast(`محتاج ${ped.label} لتركيبه هنا!`);
        }
      }
    }
  }

  update(dt) {
    if (gameState.gameStatus !== 'playing') return;

    // Moving platforms
    if (this.currentLevelData && this.currentLevelData.platforms) {
      for (const p of this.currentLevelData.platforms) {
        if (p.type === 'moving') {
          p.x += p.speed * p.dir * dt;
          if (p.x >= p.maxX) {
            p.x = p.maxX;
            p.dir = -1;
          } else if (p.x <= p.minX) {
            p.x = p.minX;
            p.dir = 1;
          }
        }
      }
    }

    // Player update
    this.player.update(dt, this.input, this.currentLevelData.platforms);

    // Fall into bottom pit
    if (this.player.y > this.currentLevelData.height + 60) {
      this.player.takeDamage();
    }

    // Esraa NPC update
    this.esraa.update(dt);

    // Camera follow
    this.camera.follow(this.player, this.currentLevelData.width, this.currentLevelData.height);

    // Collectibles collection
    if (this.currentLevelData.collectibles) {
      for (const c of this.currentLevelData.collectibles) {
        if (!c.collected) {
          const dist = Math.hypot(this.player.x + this.player.width / 2 - c.x, this.player.y + this.player.height / 2 - c.y);
          if (dist < 32) {
            c.collected = true;
            gameState.collectiblesCollected++;
            gameState.totalInfinityFound++;
            UIManager.updateCollectibles();
            audioManager.playSfx('collect');
            this.particles.emit(c.x, c.y, '#C9A86A', 14, 120, 0.6);
            UIManager.showSystemToast('تم جمع رمز ∞');
          }
        }
      }
    }

    // Distraction Obstacles (عقبات التشتيت)
    if (this.currentLevelData.distractions) {
      for (const d of this.currentLevelData.distractions) {
        if (!d.active) continue;
        const dist = Math.hypot(
          (this.player.x + this.player.width / 2) - (d.x + d.w / 2),
          (this.player.y + this.player.height / 2) - (d.y + d.h / 2)
        );
        if (dist < 34) {
          if (!d.hitCooldown || Date.now() - d.hitCooldown > 2200) {
            d.hitCooldown = Date.now();
            audioManager.playSfx('hit');
            this.particles.emit(d.x + d.w / 2, d.y + d.h / 2, '#FFA6B5', 12, 90, 0.45);
            this.speech.add('إسراء', d.quote, this.player, 3.2);
            UIManager.showSystemToast(`عقبة تشتيت: ${d.name}! ⚠️`);
            // Gentle playful bump back
            this.player.vx = (this.player.x < d.x ? -1 : 1) * 160;
            this.player.vy = -180;
          }
        }
      }
    }

    // Level 4: Active In-World YES/NO Nodes & Evasion
    if (gameState.currentLevel === 4) {
      const lvl = this.currentLevelData;

      // When player approaches NO node, it actively runs away
      if (lvl.noNode && lvl.noNode.active) {
        const dx = lvl.noNode.x - this.player.x;
        if (Math.abs(dx) < 95) {
          // Jump ahead away from Ahmed
          lvl.noNode.x += (dx > 0 ? 1 : -1) * 160 * dt;
          // Keep inside courtyard
          lvl.noNode.x = Math.max(1200, Math.min(lvl.noNode.x, 1850));

          // Playful comments from Esraa
          if (Math.random() < 0.03) {
            const comments = ["إيه؟ بتفكر؟ 😂", "أنا مستنية.", "أحمد... 😂", "الزر ده بيهرب مخصوص 😉"];
            const comment = comments[Math.floor(Math.random() * comments.length)];
            this.speech.add('إسراء', comment, this.esraa, 2.8);
          }
        }
      }

      // Touching the YES node
      if (lvl.yesNode && lvl.yesNode.active) {
        const distYes = Math.hypot(this.player.x - lvl.yesNode.x, this.player.y - lvl.yesNode.y);
        if (distYes < 40) {
          lvl.yesNode.active = false;
          if (lvl.noNode) lvl.noNode.active = false;
          gameState.inventory.card = true;
          UIManager.updateInventory();
          audioManager.playSfx('victory');
          this.speech.add('إسراء', 'أهو كده! خد بطاقة الوصول ❤️', this.esraa, 3.5);
          UIManager.showSystemToast('تم اختيار YES والحصول على بطاقة الوصول 🪪');
          this.particles.emit(lvl.yesNode.x, lvl.yesNode.y, '#FFA6B5', 20, 140, 0.8);
        }
      }
    }

    // Checkpoint interaction
    if (this.currentLevelData.checkpoints) {
      for (const cp of this.currentLevelData.checkpoints) {
        if (!cp.reached && this.player.collidesWith(cp)) {
          cp.reached = true;
          gameState.checkpoints[gameState.currentLevel] = { x: cp.x, y: cp.y - 10 };
          audioManager.playSfx('checkpoint');
          UIManager.showSystemToast('تم فتح نقطة حفظ (Checkpoint) ✨');
          this.particles.emit(cp.x + 13, cp.y + 20, '#7BE495', 16, 90, 0.6);
        }
      }
    }

    // Story Dialogues Trigger Points
    if (this.currentLevelData.dialogueTriggers) {
      for (const d of this.currentLevelData.dialogueTriggers) {
        if (!d.triggered && !d.onFall && this.player.x >= d.x) {
          d.triggered = true;
          this.speech.add(d.speaker, d.text, d.speaker === 'إسراء' ? this.esraa : this.player, 3.8);
        }
      }
    }

    // Interactive Prompts Detection
    this.activeInteractable = null;

    // Chests (Level 1)
    if (this.currentLevelData.interactiveChests) {
      for (const chest of this.currentLevelData.interactiveChests) {
        if (!chest.opened) {
          const dist = Math.hypot(this.player.x - chest.x, this.player.y - chest.y);
          if (dist < 55) {
            this.activeInteractable = { type: 'chest', data: chest };
            UIManager.showInteractPrompt('فتح الصندوق');
            break;
          }
        }
      }
    }

    // Key & Seal (Level 2)
    if (!this.activeInteractable && this.currentLevelData.keyPickup && !this.currentLevelData.keyPickup.collected) {
      const k = this.currentLevelData.keyPickup;
      if (Math.hypot(this.player.x - k.x, this.player.y - k.y) < 50) {
        this.activeInteractable = { type: 'key', data: k };
        UIManager.showInteractPrompt('التقاط المفتاح');
      }
    }

    if (!this.activeInteractable && this.currentLevelData.ringSealPickup && !this.currentLevelData.ringSealPickup.collected) {
      const r = this.currentLevelData.ringSealPickup;
      if (Math.hypot(this.player.x - r.x, this.player.y - r.y) < 50) {
        this.activeInteractable = { type: 'ring_seal', data: r };
        UIManager.showInteractPrompt('التقاط رمز الوعد');
      }
    }

    // Esraa permit talk (Level 2)
    if (!this.activeInteractable && gameState.currentLevel === 2 && this.currentLevelData.esraaNPC) {
      if (Math.hypot(this.player.x - this.esraa.x, this.player.y - this.esraa.y) < 65) {
        this.activeInteractable = { type: 'esraa_l2', data: this.esraa };
        UIManager.showInteractPrompt('طلب التصريح من إسراء');
      }
    }

    // Pedestals in Level 5
    if (!this.activeInteractable && this.currentLevelData.pedestals) {
      for (const ped of this.currentLevelData.pedestals) {
        if (!ped.inserted && Math.hypot(this.player.x - ped.x, this.player.y - ped.y) < 55) {
          this.activeInteractable = { type: 'pedestal', data: ped };
          UIManager.showInteractPrompt(`تركيب ${ped.label}`);
          break;
        }
      }
    }

    if (!this.activeInteractable) {
      UIManager.hideInteractPrompt();
    }

    // Exit Gate Check
    const gate = this.currentLevelData.exitGate;
    if (gate && this.player.collidesWith(gate)) {
      if (gameState.currentLevel === 1) {
        if (gameState.collectiblesCollected >= gameState.collectiblesRequired) {
          this.completeLevel(1);
        } else {
          UIManager.showSystemToast(`محتاج تجمع كل رموز اللانهاية (${gameState.collectiblesRequired}) لفتح الباب!`);
        }
      } else if (gameState.currentLevel === 2) {
        if (gameState.inventory.card) {
          this.completeLevel(2);
        } else {
          UIManager.showSystemToast('الباب مقفول... اطلب تصريح الدخول من إسراء أولاً!');
        }
      } else if (gameState.currentLevel === 3) {
        if (gameState.collectiblesCollected >= gameState.collectiblesRequired) {
          this.completeLevel(3);
        } else {
          UIManager.showSystemToast('اجمع رموز اللانهاية المطلوبة لاجتياز الباب!');
        }
      } else if (gameState.currentLevel === 4) {
        if (gameState.inventory.card) {
          this.completeLevel(4);
        } else {
          UIManager.showSystemToast('محتاج موافقة واختيار YES ❤️ للمتابعة!');
        }
      }
    }

    // Grand Infinity Gate in Level 5
    if (gameState.currentLevel === 5) {
      const grandGate = this.currentLevelData.grandInfinityGate;
      if (grandGate && grandGate.open) {
        if (this.player.collidesWith(grandGate)) {
          this.completeLevel(5);
        }
      }
    }

    // Update Particles & Speech Bubbles
    this.particles.update(dt);
    this.speech.update(dt);
  }

  render() {
    const ctx = this.ctx;
    const viewW = this.camera.viewportWidth;
    const viewH = this.camera.viewportHeight;

    ctx.clearRect(0, 0, viewW, viewH);

    // Parallax Layer 1: Dark Romantic Night Sky & Stars
    ctx.fillStyle = '#0B0B0D';
    ctx.fillRect(0, 0, viewW, viewH);

    const starParallaxX = this.camera.x * 0.08;
    ctx.fillStyle = '#C9A86A';
    for (let i = 0; i < 48; i++) {
      const sx = ((i * 71 - starParallaxX) % (viewW + 100) + (viewW + 100)) % (viewW + 100) - 50;
      const sy = (i * 49) % (viewH * 0.7);
      ctx.globalAlpha = 0.3 + (i % 5) * 0.12;
      ctx.fillRect(sx, sy, 2, 2);
    }
    ctx.globalAlpha = 1.0;

    // Parallax Layer 2: Distant Skyline / Rooftops
    const cityParallaxX = this.camera.x * 0.25;
    ctx.fillStyle = '#14141E';
    for (let j = 0; j < 12; j++) {
      const cx = ((j * 260 - cityParallaxX) % (viewW + 300) + (viewW + 300)) % (viewW + 300) - 150;
      const cy = viewH - 180;
      ctx.fillRect(cx, cy, 140, 200);
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + 70, cy - 50);
      ctx.lineTo(cx + 140, cy);
      ctx.closePath();
      ctx.fill();
    }

    if (!this.currentLevelData) return;

    // Platforms
    for (const p of this.currentLevelData.platforms) {
      const sx = Math.round(p.x - this.camera.x);
      const sy = Math.round(p.y - this.camera.y);

      if (sx + p.w < 0 || sx > viewW || sy + p.h < 0 || sy > viewH) continue;

      if (p.type === 'ground') {
        ctx.fillStyle = '#C9A86A';
        ctx.fillRect(sx, sy, p.w, 4);

        ctx.fillStyle = '#1E1E28';
        ctx.fillRect(sx, sy + 4, p.w, p.h - 4);

        ctx.fillStyle = '#161622';
        ctx.fillRect(sx, sy + 18, p.w, p.h - 18);
      } else {
        ctx.fillStyle = '#E7D5B0';
        ctx.fillRect(sx, sy, p.w, 3);

        ctx.fillStyle = '#2A2A38';
        ctx.fillRect(sx, sy + 3, p.w, p.h - 3);

        ctx.strokeStyle = 'rgba(201, 168, 106, 0.4)';
        ctx.strokeRect(sx, sy, p.w, p.h);
      }
    }

    // Collectibles (Infinity Symbols)
    if (this.currentLevelData.collectibles) {
      for (const c of this.currentLevelData.collectibles) {
        if (!c.collected) {
          const sx = Math.round(c.x - this.camera.x);
          const sy = Math.round(c.y - this.camera.y);
          const bob = Math.sin(Date.now() / 250 + c.x) * 4;

          ctx.save();
          ctx.translate(sx, sy + bob);

          ctx.fillStyle = 'rgba(201, 168, 106, 0.2)';
          ctx.beginPath();
          ctx.arc(0, 0, 16, 0, Math.PI * 2);
          ctx.fill();

          ctx.font = 'bold 20px sans-serif';
          ctx.fillStyle = '#E7D5B0';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('∞', 0, 0);

          ctx.restore();
        }
      }
    }

    // Distraction Obstacles (عقبات التشتيت)
    if (this.currentLevelData.distractions) {
      for (const d of this.currentLevelData.distractions) {
        if (!d.active) continue;
        const sx = Math.round(d.x - this.camera.x);
        const sy = Math.round(d.y - this.camera.y);

        if (sx + d.w < 0 || sx > viewW || sy + d.h + 24 < 0 || sy > viewH) continue;

        const bob = Math.sin(Date.now() / 280 + d.x) * 3;

        ctx.save();
        ctx.translate(sx + d.w / 2, sy + d.h / 2 + bob);

        // Warning glow ring
        ctx.fillStyle = 'rgba(232, 74, 100, 0.16)';
        ctx.beginPath();
        ctx.arc(0, 0, 20, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = 'rgba(255, 166, 181, 0.55)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.arc(0, 0, 18, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        // Icon
        ctx.font = '20px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(d.icon, 0, -2);

        // Name tag below
        ctx.font = 'bold 9px sans-serif';
        ctx.fillStyle = '#FFA6B5';
        ctx.fillText(d.name, 0, 22);

        ctx.restore();
      }
    }

    // Interactive Chests (Level 1)
    if (this.currentLevelData.interactiveChests) {
      for (const chest of this.currentLevelData.interactiveChests) {
        const sx = Math.round(chest.x - this.camera.x);
        const sy = Math.round(chest.y - this.camera.y);

        ctx.fillStyle = chest.opened ? '#3A3A4C' : '#8E7342';
        ctx.fillRect(sx, sy, chest.w, chest.h);
        ctx.strokeStyle = '#C9A86A';
        ctx.strokeRect(sx, sy, chest.w, chest.h);

        ctx.font = '14px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(chest.opened ? '✨' : '📦', sx + chest.w / 2, sy + 18);
      }
    }

    // Key & Ring Pickups (Level 2)
    if (this.currentLevelData.keyPickup && !this.currentLevelData.keyPickup.collected) {
      const k = this.currentLevelData.keyPickup;
      const sx = Math.round(k.x - this.camera.x);
      const sy = Math.round(k.y - this.camera.y) + Math.sin(Date.now() / 250) * 3;
      ctx.font = '22px sans-serif';
      ctx.fillText('🔑', sx, sy);
    }

    if (this.currentLevelData.ringSealPickup && !this.currentLevelData.ringSealPickup.collected) {
      const r = this.currentLevelData.ringSealPickup;
      const sx = Math.round(r.x - this.camera.x);
      const sy = Math.round(r.y - this.camera.y) + Math.sin(Date.now() / 250) * 3;
      ctx.font = '22px sans-serif';
      ctx.fillText('💍', sx, sy);
    }

    // Checkpoints (Lanterns)
    if (this.currentLevelData.checkpoints) {
      for (const cp of this.currentLevelData.checkpoints) {
        const sx = Math.round(cp.x - this.camera.x);
        const sy = Math.round(cp.y - this.camera.y);

        ctx.fillStyle = '#161622';
        ctx.fillRect(sx + 10, sy + 20, 6, 40);

        ctx.fillStyle = cp.reached ? '#7BE495' : '#C9A86A';
        ctx.beginPath();
        ctx.arc(sx + 13, sy + 14, 8, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = cp.reached ? 'rgba(123, 228, 149, 0.25)' : 'rgba(201, 168, 106, 0.15)';
        ctx.beginPath();
        ctx.arc(sx + 13, sy + 14, 18, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Level 4: In-World YES & NO Nodes
    if (gameState.currentLevel === 4) {
      const lvl = this.currentLevelData;
      if (lvl.yesNode && lvl.yesNode.active) {
        const sx = Math.round(lvl.yesNode.x - this.camera.x);
        const sy = Math.round(lvl.yesNode.y - this.camera.y);
        ctx.fillStyle = '#D92B45';
        ctx.beginPath();
        ctx.roundRect(sx, sy, 58, 36, 8);
        ctx.fill();
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 14px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('YES ❤️', sx + 29, sy + 22);
      }

      if (lvl.noNode && lvl.noNode.active) {
        const sx = Math.round(lvl.noNode.x - this.camera.x);
        const sy = Math.round(lvl.noNode.y - this.camera.y);
        ctx.fillStyle = '#2A2A38';
        ctx.strokeStyle = '#555566';
        ctx.beginPath();
        ctx.roundRect(sx, sy, 52, 34, 8);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#A39E93';
        ctx.font = 'bold 13px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('NO 😏', sx + 26, sy + 21);
      }
    }

    // Pedestals (Level 5)
    if (this.currentLevelData.pedestals) {
      for (const ped of this.currentLevelData.pedestals) {
        const sx = Math.round(ped.x - this.camera.x);
        const sy = Math.round(ped.y - this.camera.y);

        ctx.fillStyle = ped.inserted ? '#3A6B44' : '#2C2C3C';
        ctx.fillRect(sx, sy, ped.w, ped.h);
        ctx.strokeStyle = ped.inserted ? '#7BE495' : '#C9A86A';
        ctx.strokeRect(sx, sy, ped.w, ped.h);

        ctx.font = '16px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(ped.icon, sx + ped.w / 2, sy + 22);

        ctx.font = '9px sans-serif';
        ctx.fillStyle = '#F5F1EA';
        ctx.fillText(ped.label, sx + ped.w / 2, sy + 38);
      }
    }

    // Grand Gateway (Level 5)
    if (gameState.currentLevel === 5 && this.currentLevelData.grandInfinityGate) {
      const gGate = this.currentLevelData.grandInfinityGate;
      const sx = Math.round(gGate.x - this.camera.x);
      const sy = Math.round(gGate.y - this.camera.y);

      ctx.fillStyle = gGate.open ? 'rgba(201, 168, 106, 0.25)' : 'rgba(25, 25, 36, 0.95)';
      ctx.fillRect(sx, sy, gGate.w, gGate.h);
      ctx.strokeStyle = gGate.open ? '#7BE495' : '#C9A86A';
      ctx.lineWidth = 4;
      ctx.strokeRect(sx, sy, gGate.w, gGate.h);

      // Grand Infinity Emblem
      ctx.font = 'bold 36px sans-serif';
      ctx.fillStyle = gGate.open ? '#7BE495' : '#E7D5B0';
      ctx.textAlign = 'center';
      ctx.fillText('∞', sx + gGate.w / 2, sy + gGate.h / 2 + 10);
    }

    // Standard Exit Gates (Levels 1 to 4)
    if (this.currentLevelData.exitGate) {
      const gate = this.currentLevelData.exitGate;
      const sx = Math.round(gate.x - this.camera.x);
      const sy = Math.round(gate.y - this.camera.y);

      ctx.fillStyle = 'rgba(25, 25, 36, 0.9)';
      ctx.fillRect(sx, sy, gate.w, gate.h);
      ctx.strokeStyle = '#C9A86A';
      ctx.lineWidth = 3;
      ctx.strokeRect(sx, sy, gate.w, gate.h);

      ctx.beginPath();
      ctx.arc(sx + gate.w / 2, sy, gate.w / 2, Math.PI, 0);
      ctx.stroke();

      ctx.font = 'bold 20px sans-serif';
      ctx.fillStyle = '#E7D5B0';
      ctx.textAlign = 'center';
      ctx.fillText('∞', sx + gate.w / 2, sy + 55);
    }

    // Draw Esraa NPC (Levels 2, 4, 5)
    if (this.currentLevelData.esraaNPC && this.currentLevelData.esraaNPC.active) {
      this.esraa.draw(ctx, this.camera);
    }

    // Draw Player Ahmed
    this.player.draw(ctx, this.camera);

    // Draw Particles
    this.particles.draw(ctx, this.camera);

    // Draw Speech Bubbles over characters
    this.speech.draw(ctx, this.camera);
  }

  gameLoop(timestamp) {
    if (!this.lastTime) this.lastTime = timestamp;
    const dt = Math.min((timestamp - this.lastTime) / 1000, 0.05);
    this.lastTime = timestamp;

    this.update(dt);
    this.render();

    requestAnimationFrame((t) => this.gameLoop(t));
  }

  start() {
    this.loadLevel(1);
    gameState.gameStatus = 'paused';
    UIManager.showModal('modal-intro-hook');
    requestAnimationFrame((t) => this.gameLoop(t));
  }
}

// Global instance
let gameInstance = null;

document.addEventListener('DOMContentLoaded', () => {
  gameInstance = new Game();
  gameInstance.start();
});
