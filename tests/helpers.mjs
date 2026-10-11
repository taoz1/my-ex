// 测试辅助：不经过 DOM，直接模拟玩家和某个目标互动。
import { interaction, npcsOnMap } from '../public/js/engine/story.js';
import { MAPS } from '../public/js/engine/maps.js';
import { travel } from '../public/js/engine/state.js';
import { runScript } from '../public/js/engine/script.js';

export function interact(state, id, picks = []) {
  const target = npcsOnMap(state).find(n => n.id === id) || MAPS[state.map].spots.find(s => s.id === id);
  if (!target) throw Error(`${id} is not on ${state.map} during ${state.quest}`);
  const result = interaction(state, { id, kind: target.kind || 'npc' });
  if (result.travel) travel(state, result.travel);
  if (result.script) return runScript(state, result.script, picks);
  return result;
}

export function drive(state, map) {
  if (!state.destinations.includes(map)) throw Error(`${map} not unlocked`);
  travel(state, map);
}
