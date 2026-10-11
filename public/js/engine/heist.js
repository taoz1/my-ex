// 第四幕 12月4日：她出门的三个小时（潜入式调查）。纯逻辑，可在 Node 里测试。
// 时间是游戏分钟：走动时按现实时间流逝（约现实13分钟走完3小时），每个动作另扣分钟。
// 动过的东西要放回原样；放错或没放回的，会在第二天她“诈问”时被她看出来。
import { HEIST_OBJECTS } from './content/heist_content.js';
import { applyFx } from './state.js';

export { HEIST_OBJECTS };

export const HEIST_MINUTES = 180;
export const HEIST_MINUTES_HARD = 120;        // 第三幕当面戳穿了她：她只出去两个小时
export const MINUTES_PER_SECOND = 180 / (13 * 60);

export function startHeist(state) {
  state.heist = {
    active: true,
    minutes: state.flags.block_early ? HEIST_MINUTES_HARD : HEIST_MINUTES,
    done: {},          // objectId -> [actionId]
    disturbed: {},     // objectId -> true
    restored: {},      // objectId -> 'right' | 'wrong'
  };
}

// 走动时的流逝。返回 true 表示时间到了。
export function tick(state, seconds) {
  const h = state.heist;
  if (!h?.active) return false;
  h.minutes = Math.max(0, h.minutes - seconds * MINUTES_PER_SECOND);
  return h.minutes <= 0;
}

// 某个物件现在能做的动作（requires：要先做过某个动作）
export function actionsFor(state, objectId) {
  const done = state.heist.done[objectId] || [];
  return HEIST_OBJECTS[objectId].actions.filter(a => !done.includes(a.id) && (!a.requires || done.includes(a.requires)));
}

// 做一个动作：扣时间、结算效果、标记“动过”。返回给玩家看的文字和提示。
export function doAction(state, objectId, actionId) {
  const h = state.heist;
  const action = HEIST_OBJECTS[objectId].actions.find(a => a.id === actionId);
  if (!action || h.minutes <= 0) return { text: '来不及了。', events: [] };
  h.minutes = Math.max(0, h.minutes - action.cost);
  (h.done[objectId] ??= []).push(actionId);
  if (action.disturb !== false) {
    h.disturbed[objectId] = true;
    delete h.restored[objectId];
  }
  const events = action.fx ? applyFx(state, action.fx) : [];
  return { text: action.text, events };
}

// 放回原样：answer 是玩家给出的顺序（数组）或页面（字符串）
export function restore(state, objectId, answer) {
  const obj = HEIST_OBJECTS[objectId];
  const h = state.heist;
  h.minutes = Math.max(0, h.minutes - (obj.restore.cost ?? 5));
  const right = obj.restore.type === 'order'
    ? JSON.stringify(answer) === JSON.stringify(obj.restore.answer)
    : obj.restore.type === 'page' ? answer === obj.restore.answer : true;
  h.restored[objectId] = right ? 'right' : 'wrong';
  return right;
}

// 没放回、或放错了的物件数
export function flaws(state) {
  const h = state.heist;
  return Object.keys(h.disturbed).filter(id => h.restored[id] !== 'right').length;
}

export function endHeist(state) {
  state.heist.active = false;
  state.flags.restore_flaws = flaws(state);
}
