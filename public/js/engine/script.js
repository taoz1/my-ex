// 剧情脚本解释器。
//
// 一段脚本是步骤数组，步骤类型：
//   { s: 说话人, e?: 表情, t: 文本 | (state)=>文本 }   台词（s 为 v_* 时是内心声音）
//   { fx: {...} }                                    结算效果（见 state.js applyFx）
//   { choice: [{ t, fx?, goto?, when? }] }           选项；when(state) 为假时隐藏
//   { label: '名字' } / { goto: '名字' }               跳转
//   { call: '脚本id' }                                转到另一段脚本继续（不返回）
//   { if: (state)=>bool, goto: '名字' }               条件跳转
//   { check: 'clarity', min: 30, goto: '名字' }       属性检定，成功则跳转
//   { chat: { npc, scene, suggestions } }            脚本结束，转入 AI 自由对话
//   { end: true }                                    脚本结束
import { applyFx } from './state.js';
import { SCRIPTS } from './story.js';

export function startScript(id) {
  if (!SCRIPTS[id]) throw Error(`Unknown script ${id}`);
  return { id, pc: 0, events: [] };
}

function jump(run, label) {
  const index = SCRIPTS[run.id].findIndex(st => st.label === label);
  if (index < 0) throw Error(`Unknown label ${label} in ${run.id}`);
  run.pc = index;
}

// 推进到下一个需要展示的步骤，返回 { type: 'line'|'choice'|'chat'|'end', ... }。
export function nextStep(state, run) {
  for (let guard = 0; guard < 500; guard++) {
    const steps = SCRIPTS[run.id];
    if (run.pc >= steps.length) return { type: 'end' };
    const st = steps[run.pc];
    if (st.label !== undefined) { run.pc++; continue; }
    if (st.fx) { run.events.push(...applyFx(state, st.fx)); run.pc++; continue; }
    if (st.if) { if (st.if(state)) jump(run, st.goto); else run.pc++; continue; }
    if (st.check) {
      if (state.stats[st.check] >= st.min) jump(run, st.goto); else run.pc++;
      continue;
    }
    if (st.call) {
      if (!SCRIPTS[st.call]) throw Error(`Unknown script ${st.call}`);
      run.id = st.call;
      run.pc = 0;
      continue;
    }
    if (st.goto) { jump(run, st.goto); continue; }
    if (st.s) {
      run.pc++;
      const text = typeof st.t === 'function' ? st.t(state) : st.t;
      return { type: 'line', speaker: st.s, emotion: st.e || 'neutral', text };
    }
    if (st.choice) {
      const options = st.choice
        .map((c, index) => ({ index, text: c.t }))
        .filter(o => !st.choice[o.index].when || st.choice[o.index].when(state));
      return { type: 'choice', options };
    }
    if (st.chat) { run.pc = Infinity; return { type: 'chat', ...st.chat }; }
    if (st.end) { run.pc = Infinity; return { type: 'end' }; }
    throw Error(`Bad step in ${run.id} at ${run.pc}`);
  }
  throw Error(`Script ${run.id} loops`);
}

// 在当前选项步骤上做选择（index 为原始选项下标）。
export function choose(state, run, index) {
  const st = SCRIPTS[run.id][run.pc];
  if (!st?.choice) throw Error('Not at a choice');
  const option = st.choice[index];
  if (!option || (option.when && !option.when(state))) throw Error('Invalid choice');
  if (option.fx) run.events.push(...applyFx(state, option.fx));
  if (option.goto) jump(run, option.goto); else run.pc++;
  return option.t;
}

// 测试与调试用：按给定选项序列把脚本跑完，返回所有台词。选项用完后总选最后一个（通常是“离开”）。
export function runScript(state, id, picks = []) {
  const run = startScript(id);
  const lines = [];
  let pick = 0;
  for (;;) {
    const step = nextStep(state, run);
    if (step.type === 'line') { lines.push(step); continue; }
    if (step.type === 'choice') {
      const index = picks[pick++] ?? step.options[step.options.length - 1].index;
      choose(state, run, index);
      continue;
    }
    return { lines, last: step, events: run.events };
  }
}
