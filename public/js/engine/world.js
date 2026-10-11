// 移动、碰撞、附近可互动目标。纯逻辑。
import { MAPS, WORLD_W, WORLD_H } from './maps.js';
import { npcsOnMap, approachingNpc } from './story.js';

export const PLAYER_SPEED = 230;   // 世界坐标 / 秒
const FOOT = 14;                   // 脚底碰撞半径
const REACH = 76;                  // 互动距离
const NPC_SPEED = 150;             // NPC 主动走向玩家的速度
const TALK_DIST = 70;              // NPC 走到这个距离内就开口

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

// NPC 主动找玩家：进图 delay 秒后朝玩家走，走到跟前返回要播放的脚本 id。
// 每帧调用；没有要主动搭话的 NPC 时只累计 mapTime。
export function updateApproach(state, dt) {
  state.mapTime = (state.mapTime || 0) + dt;
  const npc = approachingNpc(state);
  if (!npc || state.mapTime < (npc.approach.delay || 0)) return null;
  const p = state.player;
  const dist = Math.hypot(p.x - npc.x, p.y - npc.y);
  if (dist < TALK_DIST) return npc.approach.script;
  const map = MAPS[state.map];
  const step = Math.min(NPC_SPEED * dt, dist - TALK_DIST + 1);
  const mx = ((p.x - npc.x) / dist) * step;
  const my = ((p.y - npc.y) / dist) * step;
  const pos = { x: npc.x, y: npc.y };
  if (!blocked(map, pos.x + mx, pos.y)) pos.x += mx;
  if (!blocked(map, pos.x, pos.y + my)) pos.y += my;
  pos.dir = Math.abs(mx) > Math.abs(my) ? (mx > 0 ? 'right' : 'left') : (my > 0 ? 'down' : 'up');
  state.npcPos = { ...state.npcPos, [npc.id]: pos };
  return null;
}
