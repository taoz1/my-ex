// Canvas 渲染：有美术图就画图，没有就画占位方块。
import { MAPS, WORLD_W, WORLD_H } from './engine/maps.js';
import { npcsOnMap } from './engine/story.js';
import { SPEAKERS } from './engine/catalog.js';
import { mapImage, spriteImage } from './assets.js';

export const VIEW_W = 960;
export const VIEW_H = 640;
const DIRS = ['down', 'left', 'right', 'up'];
const SPRITE_SIZE = 84;
// 路人和没有专属行走图的配角共用一张 8 人行走图，按序号取帧
const GENERIC = { uncle: 0, waiter: 4, tony: 2 };
// 调试：把碰撞方块叠在地图图片上（__game.showBlocks() 切换）
export const debug = { blocks: false };

export function camera(state) {
  const p = state.player;
  return {
    x: Math.max(0, Math.min(WORLD_W - VIEW_W, p.x - VIEW_W / 2)),
    y: Math.max(0, Math.min(WORLD_H - VIEW_H, p.y - VIEW_H / 2)),
  };
}

export function draw(ctx, state, target, time) {
  const map = MAPS[state.map];
  const cam = camera(state);
  ctx.save();
  ctx.translate(-Math.round(cam.x), -Math.round(cam.y));

  const bg = mapImage(map.art || state.map);
  if (bg) ctx.drawImage(bg, 0, 0, WORLD_W, WORLD_H);
  else drawPlaceholderMap(ctx, map);

  if (debug.blocks && bg) drawBlockOverlay(ctx, map);
  for (const s of map.spots) drawSpot(ctx, s, target?.id === s.id, time);

  const people = [
    ...npcsOnMap(state).map(n => ({ ...n, npc: true })),
    { id: 'chen', label: '陈默', x: state.player.x, y: state.player.y, dir: state.player.dir, player: true },
  ].sort((a, b) => a.y - b.y);
  for (const p of people) drawPerson(ctx, p, target?.id === p.id, map.scale || 1);

  ctx.restore();
}

function drawPlaceholderMap(ctx, map) {
  ctx.fillStyle = map.floor;
  ctx.fillRect(0, 0, WORLD_W, WORLD_H);
  // 地面格纹
  ctx.fillStyle = '#ffffff08';
  for (let y = 0; y < WORLD_H; y += 64) for (let x = (y / 64) % 2 ? 64 : 0; x < WORLD_W; x += 128) ctx.fillRect(x, y, 64, 64);
  for (const z of map.zones || []) { ctx.fillStyle = z.c; ctx.fillRect(z.x, z.y, z.w, z.h); }
  for (const b of map.blocks) {
    ctx.fillStyle = b.c;
    ctx.fillRect(b.x, b.y, b.w, b.h);
    if (b.label) {
      ctx.fillStyle = '#00000040';
      ctx.fillRect(b.x, b.y + b.h - 6, b.w, 6);
      label(ctx, b.label, b.x + b.w / 2, b.y + b.h / 2 + 5, '#f1eadb', 15);
    }
  }
}

function drawBlockOverlay(ctx, map) {
  ctx.lineWidth = 2;
  for (const b of map.blocks) {
    ctx.fillStyle = '#ff303040';
    ctx.fillRect(b.x, b.y, b.w, b.h);
    ctx.strokeStyle = '#ff3030';
    ctx.strokeRect(b.x, b.y, b.w, b.h);
  }
  ctx.font = '12px monospace';
  ctx.fillStyle = '#ffff00';
  for (let x = 0; x < WORLD_W; x += 128) for (let y = 0; y < WORLD_H; y += 128) ctx.fillText(`${x},${y}`, x + 2, y + 12);
}

function drawSpot(ctx, s, active, time) {
  const bob = Math.sin(time / 300) * 3;
  ctx.fillStyle = active ? '#e8b24a' : '#e8b24a88';
  ctx.beginPath();
  ctx.moveTo(s.x, s.y - 12 + bob);
  ctx.lineTo(s.x + 8, s.y + bob);
  ctx.lineTo(s.x, s.y + 12 + bob);
  ctx.lineTo(s.x - 8, s.y + bob);
  ctx.fill();
  if (active) label(ctx, s.label, s.x, s.y - 20, '#e8b24a', 14);
}

function drawPerson(ctx, p, selected, scale) {
  const size = SPRITE_SIZE * scale;
  const sheetId = p.player ? 'chen_mo' : (GENERIC[p.id] !== undefined ? 'npc_generic' : p.id);
  const sheet = spriteImage(sheetId);
  if (sheet) {
    const frames = sheetId === 'npc_generic' ? 8 : 4;
    const index = sheetId === 'npc_generic' ? GENERIC[p.id] : Math.max(0, DIRS.indexOf(p.dir || 'down'));
    const fw = sheet.width / frames;
    ctx.drawImage(sheet, index * fw, 0, fw, sheet.height, p.x - size / 2, p.y - size + 10 * scale, size, size);
  } else {
    const color = p.player ? SPEAKERS.chen.color : (p.color || SPEAKERS[p.id]?.color || '#888');
    ctx.fillStyle = '#00000040';
    ctx.beginPath(); ctx.ellipse(p.x, p.y + 8, 16, 6, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = color; ctx.fillRect(p.x - 12, p.y - 26, 24, 28);
    ctx.fillStyle = '#d9b08c'; ctx.fillRect(p.x - 9, p.y - 42, 18, 16);
    ctx.fillStyle = '#2a2f3a'; ctx.fillRect(p.x - 11, p.y + 2, 9, 8); ctx.fillRect(p.x + 2, p.y + 2, 9, 8);
  }
  if (selected) {
    ctx.strokeStyle = '#e8b24a'; ctx.lineWidth = 2;
    ctx.strokeRect(p.x - 22 * scale, p.y - 60 * scale, 44 * scale, 74 * scale);
  }
  label(ctx, p.label, p.x, p.y - (sheet ? size - 4 * scale : 50), p.player ? '#e8b24a' : '#f5f0e7', 14);
}

function label(ctx, text, x, y, color, size) {
  ctx.font = `600 ${size}px system-ui, "PingFang SC", sans-serif`;
  ctx.textAlign = 'center';
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#0d1118cc';
  ctx.strokeText(text, x, y);
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
}
