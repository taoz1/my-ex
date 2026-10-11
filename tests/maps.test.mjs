import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { MAPS, ARRIVALS, WORLD_W, WORLD_H } from '../public/js/engine/maps.js';
import { blocked } from '../public/js/engine/world.js';
import { npcsOnMap } from '../public/js/engine/story.js';
import { createState } from '../public/js/engine/state.js';
import { QUEST_ORDER } from '../public/js/engine/quests.js';

const CELL = 16;
const REACH = 76;

// 从起点出发能走到的格子
function reachable(map, start) {
  const seen = new Set();
  const queue = [[Math.round(start.x / CELL), Math.round(start.y / CELL)]];
  while (queue.length) {
    const [cx, cy] = queue.pop();
    const key = `${cx},${cy}`;
    if (seen.has(key) || blocked(map, cx * CELL, cy * CELL)) continue;
    seen.add(key);
    queue.push([cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]);
  }
  return [...seen].map(k => k.split(',').map(n => Number(n) * CELL));
}

const nearAny = (cells, p) => cells.some(([x, y]) => Math.hypot(x - p.x, y - p.y) < REACH - 8);

test('spawn and arrival points are walkable', () => {
  for (const [id, map] of Object.entries(MAPS)) {
    assert.ok(!blocked(map, map.spawn.x, map.spawn.y), `${id} spawn blocked`);
    if (ARRIVALS[id]) assert.ok(!blocked(map, ARRIVALS[id].x, ARRIVALS[id].y), `${id} arrival blocked`);
  }
});

test('every spot and every NPC (in every quest) can be reached', () => {
  for (const [id, map] of Object.entries(MAPS)) {
    const cells = reachable(map, map.spawn);
    for (const s of map.spots) assert.ok(nearAny(cells, s), `${id}: spot ${s.id} unreachable`);
    for (const quest of QUEST_ORDER) {
      const state = { ...createState(), map: id, quest };
      for (const n of npcsOnMap(state)) assert.ok(nearAny(cells, n), `${id}: ${n.id} unreachable in ${quest}`);
    }
  }
});

test('all coordinates stay inside the world', () => {
  for (const [id, map] of Object.entries(MAPS)) {
    for (const b of map.blocks) assert.ok(b.x >= 0 && b.y >= 0 && b.x + b.w <= WORLD_W && b.y + b.h <= WORLD_H, `${id} block out of bounds`);
  }
});

test('every map has its artwork file under assets/maps (placeholder maps excepted)', () => {
  for (const [id, map] of Object.entries(MAPS)) {
    if (map.placeholder) continue;
    const file = new URL(`../assets/maps/${map.art || id}.png`, import.meta.url);
    assert.ok(existsSync(file), `${id}: missing assets/maps/${map.art || id}.png`);
  }
});

test('second-batch scenes keep conditional NPCs on reachable floor', () => {
  const scenes = ['casino_suite', 'qingqing_house_b', 'financial_district', 'mansion_hills', 'chen_home', 'police_station', 'seaside_restaurant', 'club_gym'];
  for (const id of scenes) {
    const map = MAPS[id];
    const cells = reachable(map, map.spawn);
    for (const quest of QUEST_ORDER) {
      const state = { ...createState(), map: id, quest };
      state.phone.contacts.push('coco');
      Object.assign(state.flags, { eric_called: true, a4_called: true });
      for (const npc of npcsOnMap(state)) {
        assert.ok(!blocked(map, npc.x, npc.y), `${id}: ${npc.id} stands inside furniture in ${quest}`);
        assert.ok(nearAny(cells, npc), `${id}: conditional ${npc.id} unreachable in ${quest}`);
      }
    }
  }
});
