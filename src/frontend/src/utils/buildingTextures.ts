import * as THREE from "three";

const textureCache = new Map<string, THREE.CanvasTexture>();

function createCanvas(size: number): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  return canvas;
}

function makeBrickTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = createCanvas(size);
  const ctx = canvas.getContext("2d")!;

  // Mortar background
  ctx.fillStyle = "#8a7a6e";
  ctx.fillRect(0, 0, size, size);

  const brickW = 40;
  const brickH = 18;
  const mortarGap = 3;

  for (let row = 0; row * (brickH + mortarGap) < size + brickH; row++) {
    const y = row * (brickH + mortarGap);
    const offset = row % 2 === 0 ? 0 : brickW / 2;
    for (let col = -1; col * (brickW + mortarGap) < size + brickW; col++) {
      const x = col * (brickW + mortarGap) + offset;
      // Vary brick color
      const hue = 12 + Math.sin(row * 7.3 + col * 3.1) * 6;
      const sat = 45 + Math.sin(row * 2.1 + col * 5.7) * 10;
      const lit = 38 + Math.sin(row * 4.1 + col * 2.3) * 8;
      ctx.fillStyle = `hsl(${hue}, ${sat}%, ${lit}%)`;
      ctx.fillRect(x + mortarGap / 2, y + mortarGap / 2, brickW, brickH);

      // Subtle highlight on top edge
      ctx.fillStyle = `hsla(${hue}, ${sat}%, ${lit + 12}%, 0.4)`;
      ctx.fillRect(x + mortarGap / 2, y + mortarGap / 2, brickW, 2);

      // Subtle shadow on bottom edge
      ctx.fillStyle = `hsla(${hue}, ${sat}%, ${lit - 15}%, 0.5)`;
      ctx.fillRect(
        x + mortarGap / 2,
        y + mortarGap / 2 + brickH - 2,
        brickW,
        2,
      );
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

function makeConcreteTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = createCanvas(size);
  const ctx = canvas.getContext("2d")!;

  // Base concrete gray
  ctx.fillStyle = "#7a7e82";
  ctx.fillRect(0, 0, size, size);

  // Add noise/variation
  for (let i = 0; i < 3000; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const brightness =
      Math.random() > 0.5 ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.04)";
    ctx.fillStyle = brightness;
    ctx.fillRect(x, y, 2, 2);
  }

  // Horizontal panel lines
  ctx.strokeStyle = "rgba(0,0,0,0.25)";
  ctx.lineWidth = 1.5;
  const panelH = 48;
  for (let y = 0; y < size; y += panelH) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(size, y);
    ctx.stroke();
  }

  // Vertical panel lines
  const panelW = 64;
  for (let x = 0; x < size; x += panelW) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, size);
    ctx.stroke();
  }

  // Occasional staining streaks
  for (let i = 0; i < 8; i++) {
    const sx = Math.random() * size;
    const sy = Math.random() * size;
    const grad = ctx.createLinearGradient(sx, sy, sx + 4, sy + 30);
    grad.addColorStop(0, "rgba(80,70,60,0.15)");
    grad.addColorStop(1, "rgba(80,70,60,0)");
    ctx.fillStyle = grad;
    ctx.fillRect(sx, sy, 4, 30);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

function makeGlassTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = createCanvas(size);
  const ctx = canvas.getContext("2d")!;

  // Deep blue base
  ctx.fillStyle = "#0d1f35";
  ctx.fillRect(0, 0, size, size);

  const colW = 32;
  const rowH = 28;
  const gap = 3;

  for (let row = 0; row * (rowH + gap) < size; row++) {
    const y = row * (rowH + gap) + gap;
    for (let col = 0; col * (colW + gap) < size; col++) {
      const x = col * (colW + gap) + gap;

      // Window pane
      const alpha = 0.55 + Math.sin(row * 3.1 + col * 2.7) * 0.2;
      ctx.fillStyle = `rgba(30, 90, 140, ${alpha})`;
      ctx.fillRect(x, y, colW, rowH);

      // Reflective highlight (top-left diagonal)
      const refGrad = ctx.createLinearGradient(
        x,
        y,
        x + colW * 0.6,
        y + rowH * 0.6,
      );
      refGrad.addColorStop(0, "rgba(180,220,255,0.25)");
      refGrad.addColorStop(1, "rgba(180,220,255,0)");
      ctx.fillStyle = refGrad;
      ctx.fillRect(x, y, colW, rowH);

      // Thin bright edge top
      ctx.fillStyle = "rgba(150,210,255,0.35)";
      ctx.fillRect(x, y, colW, 1);
      ctx.fillRect(x, y, 1, rowH);
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

function makeStoneTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = createCanvas(size);
  const ctx = canvas.getContext("2d")!;

  // Base stone color
  ctx.fillStyle = "#8e8878";
  ctx.fillRect(0, 0, size, size);

  // Draw irregular stone blocks
  const blocks = [
    { x: 0, y: 0, w: 60, h: 50 },
    { x: 63, y: 0, w: 80, h: 50 },
    { x: 146, y: 0, w: 55, h: 50 },
    { x: 204, y: 0, w: 52, h: 50 },
    { x: 0, y: 53, w: 45, h: 55 },
    { x: 48, y: 53, w: 70, h: 55 },
    { x: 121, y: 53, w: 65, h: 55 },
    { x: 189, y: 53, w: 67, h: 55 },
    { x: 0, y: 111, w: 68, h: 50 },
    { x: 71, y: 111, w: 52, h: 50 },
    { x: 126, y: 111, w: 75, h: 50 },
    { x: 204, y: 111, w: 52, h: 50 },
    { x: 0, y: 164, w: 55, h: 52 },
    { x: 58, y: 164, w: 80, h: 52 },
    { x: 141, y: 164, w: 58, h: 52 },
    { x: 202, y: 164, w: 54, h: 52 },
    { x: 0, y: 219, w: 70, h: 37 },
    { x: 73, y: 219, w: 58, h: 37 },
    { x: 134, y: 219, w: 68, h: 37 },
    { x: 205, y: 219, w: 51, h: 37 },
  ];

  for (const b of blocks) {
    const lightness = 50 + Math.sin(b.x * 0.1 + b.y * 0.07) * 12;
    ctx.fillStyle = `hsl(40, 12%, ${lightness}%)`;
    ctx.fillRect(b.x + 2, b.y + 2, b.w - 2, b.h - 2);

    // Top-left highlight
    ctx.fillStyle = `hsla(40, 10%, ${lightness + 15}%, 0.6)`;
    ctx.fillRect(b.x + 2, b.y + 2, b.w - 2, 3);
    ctx.fillRect(b.x + 2, b.y + 2, 3, b.h - 2);

    // Bottom-right shadow
    ctx.fillStyle = `hsla(40, 10%, ${lightness - 20}%, 0.5)`;
    ctx.fillRect(b.x + 2, b.y + b.h - 3, b.w - 2, 3);
    ctx.fillRect(b.x + b.w - 3, b.y + 2, 3, b.h - 2);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

function makeAsphaltTexture(): THREE.CanvasTexture {
  const size = 512;
  const canvas = createCanvas(size);
  const ctx = canvas.getContext("2d")!;

  // Dark asphalt base
  ctx.fillStyle = "#282c2e";
  ctx.fillRect(0, 0, size, size);

  // Aggregate speckle
  for (let i = 0; i < 6000; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const r = Math.random() * 2;
    const v = Math.floor(35 + Math.random() * 25);
    ctx.fillStyle = `rgb(${v},${v},${v})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Subtle crack lines
  ctx.strokeStyle = "rgba(10,10,10,0.6)";
  ctx.lineWidth = 1;
  for (let i = 0; i < 6; i++) {
    ctx.beginPath();
    const sx = Math.random() * size;
    const sy = Math.random() * size;
    ctx.moveTo(sx, sy);
    ctx.lineTo(
      sx + (Math.random() - 0.5) * 80,
      sy + (Math.random() - 0.5) * 80,
    );
    ctx.stroke();
  }

  // Very subtle grid lines to hint at block segments
  ctx.strokeStyle = "rgba(50,55,55,0.4)";
  ctx.lineWidth = 0.5;
  const gridSpacing = 64;
  for (let x = 0; x < size; x += gridSpacing) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, size);
    ctx.stroke();
  }
  for (let y = 0; y < size; y += gridSpacing) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(size, y);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

export type BuildingTextureStyle = "brick" | "concrete" | "glass" | "stone";

export function getBuildingTexture(
  style: BuildingTextureStyle,
): THREE.CanvasTexture {
  if (textureCache.has(style)) return textureCache.get(style)!;
  let tex: THREE.CanvasTexture;
  switch (style) {
    case "brick":
      tex = makeBrickTexture();
      break;
    case "concrete":
      tex = makeConcreteTexture();
      break;
    case "glass":
      tex = makeGlassTexture();
      break;
    case "stone":
      tex = makeStoneTexture();
      break;
  }
  textureCache.set(style, tex);
  return tex;
}

export function getGroundTexture(): THREE.CanvasTexture {
  const key = "asphalt";
  if (textureCache.has(key)) return textureCache.get(key)!;
  const tex = makeAsphaltTexture();
  textureCache.set(key, tex);
  return tex;
}
