// ============================================
// ARISE V3.0 — Particle Weather System
// Ambient background particles (Canvas)
// ============================================

export class ParticleWeather {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.particles = [];
    this.maxParticles = 60;
    this.running = false;
    this.animFrame = null;
    this.speedMultiplier = 1;
    this.color = { r: 0, g: 229, b: 255 };

    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  setIntensity(chainMultiplier) {
    this.speedMultiplier = 0.3 + (chainMultiplier - 1) * 0.5;
    this.maxParticles = Math.min(150, 40 + Math.floor(chainMultiplier * 20));
  }

  setRankColor(rank) {
    const colors = {
      e: { r: 107, g: 114, b: 128 },
      d: { r: 96, g: 165, b: 250 },
      c: { r: 0, g: 229, b: 255 },
      b: { r: 167, g: 139, b: 250 },
      a: { r: 192, g: 132, b: 252 },
      s: { r: 0, g: 229, b: 255 },
    };
    this.color = colors[rank] || colors.c;
  }

  spawn() {
    if (this.particles.length >= this.maxParticles) return;

    const side = Math.random();
    let x, y;

    if (side < 0.5) {
      x = Math.random() * this.canvas.width;
      y = this.canvas.height + 5;
    } else {
      x = -5;
      y = Math.random() * this.canvas.height;
    }

    this.particles.push({
      x,
      y,
      size: Math.random() * 2.5 + 0.5,
      speedX: (Math.random() * 0.5 + 0.1) * this.speedMultiplier,
      speedY: -(Math.random() * 0.8 + 0.2) * this.speedMultiplier,
      opacity: Math.random() * 0.5 + 0.1,
      life: 1,
      decay: Math.random() * 0.003 + 0.001,
      wobble: Math.random() * Math.PI * 2,
      wobbleSpeed: Math.random() * 0.02 + 0.005,
    });
  }

  update() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.wobble += p.wobbleSpeed;
      p.x += p.speedX + Math.sin(p.wobble) * 0.3;
      p.y += p.speedY;
      p.life -= p.decay;

      if (p.life <= 0 || p.y < -10 || p.x > this.canvas.width + 10) {
        this.particles.splice(i, 1);
      }
    }

    // Spawn new
    const spawnRate = Math.ceil(this.maxParticles / 60);
    for (let i = 0; i < spawnRate; i++) {
      this.spawn();
    }
  }

  draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    for (const p of this.particles) {
      const alpha = p.opacity * p.life;
      const { r, g, b } = this.color;

      // Glow
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
      this.ctx.fillStyle = `rgba(${r},${g},${b},${alpha * 0.1})`;
      this.ctx.fill();

      // Core
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
      this.ctx.fill();
    }
  }

  loop() {
    if (!this.running) return;
    this.update();
    this.draw();
    this.animFrame = requestAnimationFrame(() => this.loop());
  }

  start() {
    this.running = true;
    this.loop();
  }

  stop() {
    this.running = false;
    if (this.animFrame) cancelAnimationFrame(this.animFrame);
  }

  destroy() {
    this.stop();
    window.removeEventListener('resize', this.resize);
  }
}
