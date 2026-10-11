// 剧情脚本解释器。
//
// 一段脚本是步骤数组，步骤类型：
//   { s: 说话人, e?: 表情, t: 文本 | (state)=>文本 }   台词（s 为 v_* 时是内心声音）
//   { fx: {...} }                                    结算效果（见 state.js applyFx）
//   { choice: [{ t, on?, fx?, goto?, when? }] }      剧情走向。玩家自由输入，AI 归类成行为后按 on 匹配（见 matchOption）；
//                                                    t 是一句示范说法（测试和文档用）。when(state) 为假时不参与；
//                                                    once: true 的选项走过一次就不再出现（之后由 NPC 性格规则接话）
//   { label: '名字' } / { goto: '名字' }               跳转
//   { call: '脚本id' }                                转到另一段脚本继续（不返回）
//   { if: (state)=>bool, goto: '名字' }               条件跳转
//   { check: 'clarity', min: 30, goto: '名字' }       属性检定，成功则跳转
//   { chat: { npc, scene } }                         脚本结束，转入 AI 自由对话
//   { do: (state)=>{} }                              直接改状态（只用于少数算分的地方）
//   { open: 'heist' | 小游戏 id }                    打开一个玩法界面（放在脚本最后）
//   { end: true }                                    脚本结束
import { applyFx } from './state.js';
import { SCRIPTS } from './story.js';

const pickedKey = (run, index) => `picked:${run.id}:${run.pc}:${index}`;

// 选项现在能不能走：when 条件成立，且 once 的选项还没走过
function isOpen(state, run, index) {
  const c = SCRIPTS[run.id][run.pc].choice[index];
  return (!c.when || c.when(state)) && !(c.once && state.flags[pickedKey(run, index)]);
}

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
    if (st.do) { st.do(state); run.pc++; continue; }
    if (st.open) { run.pc++; return { type: 'open', id: st.open }; }
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
        .filter(o => isOpen(state, run, o.index));
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
  if (!option || !isOpen(state, run, index)) throw Error('Invalid choice');
  if (option.once) state.flags[pickedKey(run, index)] = true;
  if (option.fx) run.events.push(...applyFx(state, option.fx));
  if (option.goto) jump(run, option.goto); else run.pc++;
  return option.t;
}

// 所有走向都没有分支和效果时，玩家说什么剧情都一样往下走，不必问 AI。
export function choiceIsFree(run) {
  const st = SCRIPTS[run.id][run.pc];
  return !!st?.choice && st.choice.every(c => !c.fx && !c.goto && !c.on);
}

// 选项的 on：一个或几个匹配条件，满足任意一个就走这条。条件写法：
//   '*'                                  什么话都算（放在最后，当作“其他”）
//   { act: 'ask', topic: '话题' }         玩家问到这个话题（话题原文会发给 AI 做归类）
//   { act: 'propose', min?, max? }       玩家提出的数额落在范围里（含两端）
//   { act: 'support' } 等                只看行为
//   { topic: '话题' }                     不管什么行为，只要说的是这个话题
const asList = v => (v === undefined ? [] : Array.isArray(v) ? v : [v]);

function matches(m, said) {
  if (m === '*') return true;
  if (m.act && m.act !== said.act) return false;
  if (m.topic && m.topic !== said.topic) return false;
  if (m.min !== undefined && !(said.amount >= m.min)) return false;
  if (m.max !== undefined && !(said.amount <= m.max)) return false;
  return true;
}

// 当前选项步骤上，第一个和玩家这句话对得上的选项（原始下标），没有则 -1。'*' 只在别的都对不上时才算。
export function matchOption(state, run, said) {
  const open = SCRIPTS[run.id][run.pc].choice.map((c, index) => ({ c, index })).filter(({ index }) => isOpen(state, run, index));
  const hit = open.find(({ c }) => asList(c.on).some(m => m !== '*' && matches(m, said)))
    || open.find(({ c }) => asList(c.on).includes('*'));
  return hit ? hit.index : -1;
}

// 当前选项步骤上要让 AI 认的话题
export function choiceTopics(state, run) {
  const st = SCRIPTS[run.id][run.pc];
  const topics = st.choice.filter((c, index) => isOpen(state, run, index)).flatMap(c => asList(c.on)).map(m => m.topic).filter(Boolean);
  return [...new Set(topics)];
}

// 测试与调试用：按给定选项序列把脚本跑完，返回所有台词。选项用完后总选最后一个（通常是“离开”）。
// 遇到 open（玩法界面）记下来继续往下跑。
export function runScript(state, id, picks = []) {
  const run = startScript(id);
  const lines = [];
  const opened = [];
  let pick = 0;
  for (;;) {
    const step = nextStep(state, run);
    if (step.type === 'line') { lines.push(step); continue; }
    if (step.type === 'open') { opened.push(step.id); continue; }
    if (step.type === 'choice') {
      const index = picks[pick++] ?? step.options[step.options.length - 1].index;
      choose(state, run, index);
      continue;
    }
    return { lines, last: step, events: run.events, opened };
  }
}
