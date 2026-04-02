// ============================================
// ARISE V3.0 — Attribute Radar Chart
// Interactive 6-axis canvas radar
// ============================================

import { ATTRIBUTES, getStatRank, getStatRankColor } from '../../engine/attributes.js';
import gameState from '../../state/gameState.js';

export function drawRadarChart(canvas) {
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const size = Math.min(canvas.parentElement.clientWidth, 280);

  canvas.width = size * dpr;
  canvas.height = size * dpr;
  canvas.style.width = size + 'px';
  canvas.style.height = size + 'px';
  ctx.scale(dpr, dpr);

  const cx = size / 2;
  const cy = size / 2;
  const radius = size * 0.33; // Reduced from 0.38 for padding
  const attrs = gameState.get('attributes');
  const keys = Object.keys(ATTRIBUTES);
  const count = keys.length;

  // Find max for scaling
  const maxVal = Math.max(100, ...Object.values(attrs));

  ctx.clearRect(0, 0, size, size);

  // Draw grid rings
  for (let ring = 1; ring <= 5; ring++) {
    const r = (radius / 5) * ring;
    ctx.beginPath();
    for (let i = 0; i <= count; i++) {
      const angle = (Math.PI * 2 / count) * i - Math.PI / 2;
      const x = cx + Math.cos(angle) * r;
      const y = cy + Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = `rgba(0, 229, 255, ${0.05 + ring * 0.02})`;
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // Draw axes
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 / count) * i - Math.PI / 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius);
    ctx.strokeStyle = 'rgba(0, 229, 255, 0.1)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // Draw data polygon
  ctx.beginPath();
  for (let i = 0; i <= count; i++) {
    const idx = i % count;
    const key = keys[idx];
    const val = attrs[key] || 0;
    const normalized = Math.min(val / maxVal, 1);
    const angle = (Math.PI * 2 / count) * idx - Math.PI / 2;
    const r = normalized * radius;
    const x = cx + Math.cos(angle) * r;
    const y = cy + Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();

  // Fill
  const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
  gradient.addColorStop(0, 'rgba(0, 229, 255, 0.15)');
  gradient.addColorStop(1, 'rgba(0, 229, 255, 0.05)');
  ctx.fillStyle = gradient;
  ctx.fill();

  // Stroke
  ctx.strokeStyle = 'rgba(0, 229, 255, 0.7)';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Draw data points
  for (let i = 0; i < count; i++) {
    const key = keys[i];
    const val = attrs[key] || 0;
    const normalized = Math.min(val / maxVal, 1);
    const angle = (Math.PI * 2 / count) * i - Math.PI / 2;
    const r = normalized * radius;
    const x = cx + Math.cos(angle) * r;
    const y = cy + Math.sin(angle) * r;

    // Glow
    ctx.beginPath();
    ctx.arc(x, y, 6, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 229, 255, 0.2)';
    ctx.fill();

    // Point
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fillStyle = '#00E5FF';
    ctx.fill();
  }

  // Draw labels
  for (let i = 0; i < count; i++) {
    const key = keys[i];
    const val = attrs[key] || 0;
    const rank = getStatRank(val);
    const angle = (Math.PI * 2 / count) * i - Math.PI / 2;
    const labelR = radius + 32; // Increased padding for labels
    const x = cx + Math.cos(angle) * labelR;
    const y = cy + Math.sin(angle) * labelR;

    ctx.font = '700 10px Rajdhani, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = getStatRankColor(rank);
    ctx.fillText(`${key.toUpperCase()} [${rank}]`, x, y - 6);

    ctx.font = '10px "Share Tech Mono", monospace';
    ctx.fillStyle = '#9CA3AF';
    ctx.fillText(val.toString(), x, y + 8);
  }
}
