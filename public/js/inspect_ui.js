// 调查界面：12月4日翻看她的东西（动作、耗时、放回原样），以及资金线拼合小游戏。
// 规则在 engine/heist.js 和 engine/content/puzzles.js，这里只负责显示和点击。
import { HEIST_OBJECTS, actionsFor, doAction, restore } from './engine/heist.js';
import { PUZZLES, checkPuzzle } from './engine/content/puzzles.js';
import { applyFx } from './engine/state.js';
import { OFFICERS, STATEMENTS, questionsFor, answer, PASS_RATIO } from './engine/content/defense.js';
import { EVIDENCE } from './engine/catalog.js';
import { escapeHtml } from './panels.js';

const $ = s => document.querySelector(s);
let host = null;   // main.js 传入：{ getState, afterFx, onClose }
let current = null;

export function bindInspect(callbacks) {
  host = callbacks;
  $('#inspect-close').onclick = closeInspect;
  $('#inspect-body').addEventListener('click', onClick);
}

export const inspectOpen = () => !$('#inspect').hidden;

export function closeInspect() {
  $('#inspect').hidden = true;
  const was = current;
  current = null;
  host.onClose(was);
}

const clock = minutes => `${Math.floor(minutes / 60)}:${String(Math.floor(minutes % 60)).padStart(2, '0')}`;

// ── 翻看物件 ───────────────────────────────────────────────
export function openInspect(objectId) {
  const state = host.getState();
  const first = !state.heist.done[objectId] && !state.heist.disturbed[objectId];
  current = { kind: 'object', id: objectId, output: first ? HEIST_OBJECTS[objectId].intro : '', order: [] };
  $('#inspect').hidden = false;
  render();
}

function renderObject(state) {
  const obj = HEIST_OBJECTS[current.id];
  const h = state.heist;
  const actions = actionsFor(state, current.id);
  const needsRestore = h.disturbed[current.id] && h.restored[current.id] !== 'right' && obj.restore.type !== 'close'
    ? restoreBox(obj) : h.disturbed[current.id] && !h.restored[current.id] ? `<button class="restore" data-close-obj>${'收好，关上'}（${obj.restore.cost ?? 5}分钟）</button>` : '';
  const done = h.restored[current.id] === 'right' ? '<p class="hint">已经放回原样了。</p>' : h.restored[current.id] === 'wrong' ? '<p class="hint warn">放回去了……但好像和原来不太一样。</p>' : '';
  return `
    <p class="clock">她出门了 · 还剩 ${clock(h.minutes)}</p>
    ${current.output ? `<p class="output">${escapeHtml(current.output)}</p>` : ''}
    <div class="actions">${actions.map(a => `<button data-action="${a.id}">${escapeHtml(a.label)}<small>${a.cost} 分钟</small></button>`).join('') || '<p class="hint">这里没什么可看的了。</p>'}</div>
    ${done}${needsRestore}`;
}

function restoreBox(obj) {
  const r = obj.restore;
  if (r.type === 'order') {
    const left = r.items.filter(i => !current.order.includes(i));
    return `<div class="restore-box"><p>${escapeHtml(r.prompt)}（${r.cost ?? 5}分钟）</p>
      <p class="hint">已放：${current.order.map(escapeHtml).join(' → ') || '（空）'}</p>
      ${left.map(i => `<button data-put="${escapeHtml(i)}">${escapeHtml(i)}</button>`).join('')}
      ${current.order.length ? '<button class="ghosty" data-reset>重来</button>' : ''}</div>`;
  }
  return `<div class="restore-box"><p>${escapeHtml(r.prompt)}（${r.cost ?? 5}分钟）</p>
    ${r.items.map(i => `<button data-page="${escapeHtml(i)}">${escapeHtml(i)}</button>`).join('')}</div>`;
}

// ── 资金线拼合 ─────────────────────────────────────────────
export function openPuzzle(id) {
  current = { kind: 'puzzle', id, picks: {}, output: '' };
  $('#inspect').hidden = false;
  render();
}

function renderPuzzle() {
  const p = PUZZLES[current.id];
  return `<p class="hint">${escapeHtml(p.prompt)}</p>
    ${p.rows.map((row, i) => `<div class="row"><span>${escapeHtml(row.label)}</span>
      ${p.options.map(o => `<button class="${current.picks[i] === o ? 'on' : ''}" data-pick="${i}" data-opt="${escapeHtml(o)}">${escapeHtml(o)}</button>`).join('')}</div>`).join('')}
    <button class="restore" data-check>拼起来看看</button>
    ${current.output ? `<p class="output">${escapeHtml(current.output)}</p>` : ''}`;
}

// ── 警局笔录：出示证据 ─────────────────────────────────────
export function openDefense() {
  const state = host.getState();
  current = { kind: 'defense', questions: questionsFor(state), index: 0, score: 0, reply: '', answered: false };
  $('#inspect').hidden = false;
  render();
}

function renderDefense(state) {
  const d = current;
  if (d.index >= d.questions.length) {
    return `<p class="output">笔录做完了。两位警官对视了一眼。</p><button class="restore" data-finish>签字，离开询问室</button>`;
  }
  const q = d.questions[d.index];
  const evidence = state.evidence.map(id => `<button data-show="${id}">出示：${escapeHtml(EVIDENCE[id].name)}</button>`).join('');
  const statements = Object.entries(STATEMENTS).map(([id, text]) => `<button data-show="${id}">说：“${escapeHtml(text)}”</button>`).join('');
  return `<p class="clock">第 ${d.index + 1} / ${d.questions.length} 问</p>
    <p class="output"><b>${escapeHtml(OFFICERS[q.who])}：</b>${escapeHtml(q.ask(state))}</p>
    ${d.answered ? `<p class="output">${escapeHtml(d.reply)}</p><button class="restore" data-next>下一个问题</button>`
      : `<div class="actions">${evidence}${statements}</div>`}`;
}

function render() {
  const state = host.getState();
  const titles = { object: () => HEIST_OBJECTS[current.id].title, puzzle: () => PUZZLES[current.id].title, defense: () => '询问室 · 笔录' };
  $('#inspect-title').textContent = titles[current.kind]();
  $('#inspect-body').innerHTML = current.kind === 'object' ? renderObject(state) : current.kind === 'puzzle' ? renderPuzzle() : renderDefense(state);
}

function onClick(e) {
  const state = host.getState();
  const b = e.target.closest('button');
  if (!b) return;
  if (current.kind === 'defense') {
    const d = current;
    if (b.dataset.show) {
      const out = answer(d.questions[d.index], b.dataset.show);
      d.score += out.delta;
      d.reply = out.text;
      d.answered = true;
    } else if (b.dataset.next !== undefined) {
      d.index += 1;
      d.answered = false;
    } else if (b.dataset.finish !== undefined) {
      state.flags.defense_score = d.score;
      state.flags.defense_passed = d.score >= Math.ceil(d.questions.length * PASS_RATIO);
      d.finished = true;
      closeInspect();
      return;
    }
    render();
    return;
  }
  if (current.kind === 'puzzle') {
    if (b.dataset.pick !== undefined) { current.picks[b.dataset.pick] = b.dataset.opt; render(); return; }
    if (b.dataset.check !== undefined) {
      const out = checkPuzzle(current.id, current.picks);
      current.output = out.text;
      if (out.ok && !state.flags[PUZZLES[current.id].flag]) {
        host.afterFx(applyFx(state, PUZZLES[current.id].fx));
        current.solved = true;
      }
      render();
    }
    return;
  }
  if (b.dataset.action) {
    const out = doAction(state, current.id, b.dataset.action);
    current.output = out.text;
    host.afterFx(out.events);
  } else if (b.dataset.put) {
    current.order.push(b.dataset.put);
    const r = HEIST_OBJECTS[current.id].restore;
    if (current.order.length === r.items.length) {
      restore(state, current.id, current.order);
      current.order = [];
      current.output = '你把东西放了回去。';
    }
  } else if (b.dataset.reset !== undefined) {
    current.order = [];
  } else if (b.dataset.page) {
    restore(state, current.id, b.dataset.page);
    current.output = '你把手机放回床头柜，屏幕暗了下去。';
  } else if (b.dataset.closeObj !== undefined) {
    restore(state, current.id, null);
    current.output = '你把东西收好，关上了。';
  }
  host.afterFx([]);
  if (state.heist.minutes <= 0) { closeInspect(); return; }
  render();
}
