// 移动、碰撞、附近可互动目标。纯逻辑。
import { MAPS, WORLD_W, WORLD_H } from './maps.js';
import { npcsOnMap } from './story.js';

export const PLAYER_SPEED = 230;   // 世界坐标 / 秒
const FOOT = 14;                   // 脚底碰撞半径
const REACH = 76;                  // 互动距离

export function blocked(map, x, y) {
  if (x < FOOT || y < FOOT || x > WORLD_W - FOOT || y > WORLD_H - FOOT) return true;
  return map.blocks.some(b => x > b.x - FOOT && x < b.x + b.w + FOOT && y > b.y - FOOT / 2 && y < b.y + b.h + FOOT / 2);
}

// dx, dy 为输入方向（-1/0/1）。返回是否移动了。
export function movePlayer(state, dx, dy, dt) {
  if (!dx && !dy) return false;
  const map = MAPS[state.map];
  const len = Math.hypot(dx, dy);
  const step = PLAYER_SPEED * dt;
  const mx = (dx / len) * step;
  const my = (dy / len) * step;
  const p = state.player;
  let moved = false;
  if (mx && !blocked(map, p.x + mx, p.y)) { p.x += mx; moved = true; }
  if (my && !blocked(map, p.x, p.y + my)) { p.y += my; moved = true; }
  p.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
  return moved;
}

// 最近的可互动目标：{ kind: 'npc'|'door'|'car'|'object', id, label, x, y }
export function nearestTarget(state) {
  const p = state.player;
  const candidates = [
    ...npcsOnMap(state).map(n => ({ kind: 'npc', id: n.id, label: n.label, x: n.x, y: n.y })),
    ...MAPS[state.map].spots.map(s => ({ kind: s.kind, id: s.id, label: s.label, x: s.x, y: s.y })),
  ];
  let best = null;
  let bestD = REACH;
  for (const c of candidates) {
    const d = Math.hypot(c.x - p.x, c.y - p.y);
    if (d < bestD) { best = c; bestD = d; }
  }
  return best;
}
