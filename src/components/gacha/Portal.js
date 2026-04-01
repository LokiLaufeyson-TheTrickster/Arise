// ============================================
// ARISE V3.0 — Shadow Extraction Portal
// Black-hole particle animation (Canvas)
// ============================================

export class PortalAnimation {
  constructor(canvas, onComplete) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.onComplete = onComplete;
    this.particles = [];
    this.phase = 'gathering'; // gathering | flash | done
    this.timer = 0;
    this.maxTimer = 180; // ~3 seconds at 60fps
    this.flashTimer = 0;
    this.running = false;

    this.resize();
    this.cx = this.canvas.width / 2;
    this.cy = this.canvas.height / 2;
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  start() {
    this.running = true;
    this.particles = [];
    this.phase = 'gathering';
    this.timer = 0;
    this.flashTimer = 0;

    // Pre-spawn particles in a ring
    for (let i = 0; i < 200; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 200 + Math.random() * 300;
      this.particles.push({
        x: this.cx + Math.cos(angle) * dist,
        y: this.cy + Math.sin(angle) * dist,
        angle,
        dist,
        speed: 1 + Math.random() * 3,
        size: Math.random() * 3 + 1,
        angularSpeed: (Math.random() - 0.5) * 0.05,
        color: Math.random() > 0.7
          ? { r: 123, g: 47, b: 190 }
          : { r: 0, g: 229, b: 255 },
        opacity: Math.random() * 0.8 + 0.2,
      });
    }

    this.loop();
  }

  update() {
    this.timer++;
    const progress = this.timer / this.maxTimer;

    if (this.phase === 'gathering') {
      for (const p of this.particles) {
        p.angle += p.angularSpeed * (1 + progress * 3);
        p.dist -= p.speed * (0.5 + progress * 2);

        p.x = this.cx + Math.cos(p.angle) * p.dist;
        p.y = this.cy + Math.sin(p.angle) * p.dist;

        if (p.dist < 5) {
          p.dist = 200 + Math.random() * 200;
        }
      }

      if (this.timer >= this.maxTimer) {
        this.phase = 'flash';
        this.flashTimer = 0;
      }
    } else if (this.phase === 'flash') {
      this.flashTimer++;
      if (this.flashTimer > 15) {
        this.phase = 'done';
        this.running = false;
        if (this.onComplete) this.onComplete();
      }
    }
  }

  draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    const progress = this.timer / this.maxTimer;

    if (this.phase === 'gathering') {
      // Draw black hole center
      const gradient = this.ctx.createRadialGradient(
        this.cx, this.cy, 0,
        this.cx, this.cy, 80 + progress * 40
      );
      gradient.addColorStop(0, 'rgba(0,0,0,1)');
      gradient.addColorStop(0.5, 'rgba(0,0,0,0.8)');
      gradient.addColorStop(0.7, `rgba(123,47,190,${0.2 + progress * 0.3})`);
      gradient.addColorStop(1, 'transparent');

      this.ctx.beginPath();
      this.ctx.arc(this.cx, this.cy, 80 + progress * 40, 0, Math.PI * 2);
      this.ctx.fillStyle = gradient;
      this.ctx.fill();

      // Draw particles
      for (const p of this.particles) {
        const { r, g, b } = p.color;
        const alpha = p.opacity * (1 - Math.max(0, 1 - p.dist / 50));

        // Trail
        const trailAngle = p.angle - p.angularSpeed * 5;
        const trailX = this.cx + Math.cos(trailAngle) * (p.dist + 10);
        const trailY = this.cy + Math.sin(trailAngle) * (p.dist + 10);

        this.ctx.beginPath();
        this.ctx.moveTo(trailX, trailY);
        this.ctx.lineTo(p.x, p.y);
        this.ctx.strokeStyle = `rgba(${r},${g},${b},${alpha * 0.3})`;
        this.ctx.lineWidth = p.size * 0.5;
        this.ctx.stroke();

        // Glow
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.size * 2, 0, Math.PI * 2);
        this.ctx.fillStyle = `rgba(${r},${g},${b},${alpha * 0.2})`;
        this.ctx.fill();

        // Core
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        this.ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
        this.ctx.fill();
      }
    } else if (this.phase === 'flash') {
      const flashProgress = this.flashTimer / 15;
      const alpha = flashProgress < 0.3
        ? flashProgress / 0.3
        : 1 - (flashProgress - 0.3) / 0.7;

      this.ctx.fillStyle = `rgba(0,229,255,${alpha * 0.8})`;
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

      // White center
      const centerAlpha = Math.max(0, alpha * 1.5);
      const grad = this.ctx.createRadialGradient(
        this.cx, this.cy, 0,
        this.cx, this.cy, 200
      );
      grad.addColorStop(0, `rgba(255,255,255,${centerAlpha})`);
      grad.addColorStop(1, 'transparent');
      this.ctx.fillStyle = grad;
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }

  loop() {
    if (!this.running && this.phase !== 'flash') return;
    this.update();
    this.draw();
    requestAnimationFrame(() => {
      if (this.running || this.phase === 'flash') this.loop();
    });
  }

  destroy() {
    this.running = false;
  }
}
