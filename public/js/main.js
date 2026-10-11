// 入口：游戏循环、输入、对话 / 手机 / 开车流程、存档。
import { createState, applyFx, travel, rememberChat, serialize, deserialize } from './engine/state.js';
import { MAPS, DESTINATIONS, ARRIVALS } from './engine/maps.js';
import { interaction, CHAT_SUGGESTIONS } from './engine/story.js';
import { startScript, nextStep, choose } from './engine/script.js';
import { movePlayer, nearestTarget } from './engine/world.js';
import { SPEAKERS } from './engine/catalog.js';
import { draw, debug } from './render.js';
import { renderPanels, bindPanels, escapeHtml } from './panels.js';
import { portraitImage, uiImage, preload } from './assets.js';

const SAVE_KEY = 'fourth-version-save-v1';
const $ = s => document.querySelector(s);
const canvas = $('#game');
const ctx = canvas.getContext('2d');
const keys = new Set();

let state = createState();
let target = null;
let started = false;
let ai = { connected: false, reason: '正在检测 AI 连接……' };
let last = performance.now();
let saveTimer = 0;

// 对话控制器状态
const talk = { open: false, mode: null, run: null, waiting: false, chat: null, busy: false, phone: false, turns: 0 };

// ── 存档 ─────────────────────────────
function save() {
  try { localStorage.setItem(SAVE_KEY, serialize(state)); } catch { /* 隐私模式等情况下忽略 */ }
}
function loadSave() {
  try {
    const text = localStorage.getItem(SAVE_KEY);
    return text ? deserialize(text) : null;
  } catch { return null; }
}

// ── 提示 ─────────────────────────────
function toast(message) {
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = message;
  const box = $('#toasts');
  box.append(el);
  while (box.children.length > 4) box.firstChild.remove();
  setTimeout(() => el.remove(), 3300);
}
function flushEvents(events) {
  for (const e of events.splice(0)) toast(e);
}

// ── 对话框 ───────────────────────────
function setPortrait(speakerId, emotion) {
  const sp = SPEAKERS[speakerId] || SPEAKERS.narrator;
  const el = $('#portrait');
  $('#speaker').textContent = sp.name || '';
  $('#speaker-role').textContent = sp.role || '';
  if (!sp.portrait || sp.voice) {
    el.classList.add('hidden');
    return;
  }
  el.classList.remove('hidden');
  const img = portraitImage(sp.portrait, emotion);
  el.classList.toggle('blank', !img);
  el.dataset.initial = sp.name.slice(0, 1);
  el.style.setProperty('--pc', sp.color);
  el.style.backgroundImage = img ? `url(${img.src})` : '';
}

function appendLine(speakerId, text) {
  const sp = SPEAKERS[speakerId] || SPEAKERS.narrator;
  const div = document.createElement('div');
  div.className = 'line';
  if (speakerId === 'chen') div.classList.add('me');
  if (speakerId === 'narrator') div.classList.add('narrator');
  if (sp.voice) { div.classList.add('voice'); div.style.setProperty('--vc', sp.color); }
  const who = speakerId === 'narrator' ? '' : `<span class="who">${escapeHtml(speakerId === 'chen' ? '你' : sp.name)}</span>`;
  div.innerHTML = `${who}${escapeHtml(text)}`;
  const box = $('#transcript');
  box.querySelectorAll('.line:not(.old)').forEach((l, i, all) => { if (all.length > 5 && i < all.length - 5) l.classList.add('old'); });
  box.append(div);
  box.scrollTop = box.scrollHeight;
}

function openBox({ phone = false } = {}) {
  talk.open = true;
  talk.phone = phone;
  keys.clear();
  $('#dialogue').hidden = false;
  $('#dialogue').classList.toggle('phone', phone);
  $('#transcript').innerHTML = '';
  $('#choices').innerHTML = '';
  $('#chat-form').hidden = true;
  $('#close-dialogue').hidden = true;
  $('#continue-hint').hidden = true;
  $('#prompt').hidden = true;
  if (phone) { $('#speaker').textContent = '微信 · 晴晴'; $('#speaker-role').textContent = ''; }
}

function closeBox() {
  talk.open = false;
  talk.mode = null;
  talk.run = null;
  talk.chat = null;
  talk.waiting = false;
  $('#dialogue').hidden = true;
  save();
  renderPanels(state);
  if (state.ended && !state.flags.act1_seen) {
    state.flags.act1_seen = true;
    showActEnd();
  }
}

function playScript(id, { phone = false } = {}) {
  openBox({ phone });
  talk.mode = 'script';
  talk.run = startScript(id);
  advance();
}

function advance() {
  const run = talk.run;
  const prevMap = state.map;
  const step = nextStep(state, run);
  flushEvents(run.events);
  if (state.map !== prevMap) onMapChanged();
  renderPanels(state);
  $('#choices').innerHTML = '';
  $('#continue-hint').hidden = true;
  talk.waiting = false;

  if (step.type === 'line') {
    if (!talk.phone) setPortrait(step.speaker, step.emotion);
    appendLine(step.speaker, step.text);
    if (talk.phone) state.phone.log.push(`${SPEAKERS[step.speaker]?.name || ''}：${step.text}`);
    talk.waiting = true;
    $('#continue-hint').hidden = false;
  } else if (step.type === 'choice') {
    $('#choices').innerHTML = step.options.map((o, i) => `<button data-choice="${o.index}">${i + 1}. ${escapeHtml(o.text)}</button>`).join('');
    $('#choices button')?.focus();
  } else if (step.type === 'chat') {
    enterChat(step.npc, step.scene);
  } else {
    closeBox();
  }
}

function pickChoice(index) {
  const text = choose(state, talk.run, index);
  appendLine('chen', text);
  if (talk.phone) state.phone.log.push(`你：${text}`);
  advance();
}

// ── AI 自由对话 ──────────────────────
function enterChat(npc, scene) {
  talk.mode = 'chat';
  talk.chat = { npc, scene };
  talk.turns = 0;
  if (!talk.phone) setPortrait(npc, 'neutral');
  $('#chat-form').hidden = false;
  $('#close-dialogue').hidden = false;
  $('#suggestions').innerHTML = (CHAT_SUGGESTIONS[scene] || []).map(s => `<button type="button" data-say="${escapeHtml(s)}">${escapeHtml(s)}</button>`).join('');
  setChatStatus(ai.connected ? 'AI 角色会按自己的性格和知道的事回应你。按 Esc 或 × 结束。' : `AI 未连接：${ai.reason}`, !ai.connected);
  $('#chat-input').focus();
}

async function sendChat(message) {
  message = message.trim();
  if (!message || talk.busy || !talk.chat) return;
  const { npc, scene } = talk.chat;
  talk.busy = true;
  appendLine('chen', message);
  setChatStatus('对方正在想……');
  let result;
  try {
    const res = await fetch('/api/dialogue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ npc, scene, message, memories: (state.memories[npc] || []).slice(-6) }),
      signal: AbortSignal.timeout(45000),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw Error(data.error || `服务器返回 ${res.status}`);
    result = data;
    setAi(true, '');
    setChatStatus('AI 回应完成。');
  } catch (e) {
    const reason = e.name === 'TimeoutError' ? 'AI 回应超时（45 秒）。' : e.name === 'TypeError' ? '连不上游戏服务器。' : e.message;
    if (talk.chat) {
      appendError(`AI 没有回应：${reason}`);
      setChatStatus(`AI 未连接：${reason}`, true);
    }
    return;
  } finally {
    talk.busy = false;
  }
  if (!talk.chat) return; // 等待期间对话已关闭
  talk.turns++;
  if (!talk.phone) setPortrait(npc, result.emotion);
  appendLine(npc, result.reply);
  rememberChat(state, npc, `陈默：“${message}” ${SPEAKERS[npc].name}：“${result.reply}”`);
  save();
}

function setChatStatus(text, error = false) {
  const el = $('#chat-status');
  el.textContent = text;
  el.classList.toggle('error', error);
}

function appendError(text) {
  const div = document.createElement('div');
  div.className = 'line error';
  div.textContent = text;
  $('#transcript').append(div);
  $('#transcript').scrollTop = $('#transcript').scrollHeight;
}

// ── 手机 ─────────────────────────────
function openPhone() {
  if (talk.open || !started) return;
  if (!state.phone.unlocked) { toast('还没有新消息。'); return; }
  state.phone.unread = 0;
  if (state.phone.pending) {
    playScript(state.phone.pending, { phone: true });
    return;
  }
  openBox({ phone: true });
  const history = state.phone.log.slice(-12);
  if (!history.length) appendLine('narrator', '没有新消息。');
  for (const line of history) {
    const mine = line.startsWith('你：');
    appendLine(mine ? 'chen' : 'narrator', mine ? line.slice(2) : line);
  }
  enterChat('qingqing', 'a1_job_wechat');
}

// ── 开车 ─────────────────────────────
function openTravel() {
  const list = DESTINATIONS.filter(id => state.destinations.includes(id) && id !== state.map);
  $('#travel-list').innerHTML = list.map(id => `<button data-dest="${id}">${escapeHtml(MAPS[id].name)}</button>`).join('');
  $('#travel').hidden = false;
  keys.clear();
}
function closeTravel() { $('#travel').hidden = true; }
function driveTo(id) {
  closeTravel();
  travel(state, { map: id, ...ARRIVALS[id] });
  onMapChanged();
  save();
}

function onMapChanged() {
  const name = MAPS[state.map].name;
  $('#map-name').textContent = name;
  toast(`来到：${name}`);
  renderPanels(state);
}

// ── 互动 ─────────────────────────────
function act() {
  if (!started || talk.open || !$('#travel').hidden) return;
  target = nearestTarget(state);
  if (!target) return;
  const result = interaction(state, target);
  if (result.toast) toast(result.toast);
  if (result.menu === 'travel') openTravel();
  if (result.travel) { travel(state, result.travel); onMapChanged(); save(); }
  if (result.script) playScript(result.script);
}

// ── 主循环 ───────────────────────────
function update(dt) {
  if (!started || talk.open || !$('#travel').hidden) return;
  let dx = 0, dy = 0;
  if (keys.has('arrowleft') || keys.has('a')) dx--;
  if (keys.has('arrowright') || keys.has('d')) dx++;
  if (keys.has('arrowup') || keys.has('w')) dy--;
  if (keys.has('arrowdown') || keys.has('s')) dy++;
  movePlayer(state, dx, dy, dt);
  target = nearestTarget(state);
  $('#prompt').hidden = !target;
  if (target) $('#prompt').textContent = `按 E ${target.kind === 'npc' ? `和${target.label}说话` : target.label}`;
  saveTimer += dt;
  if (saveTimer > 5) { saveTimer = 0; save(); }
}

function frame(now) {
  const dt = Math.min((now - last) / 1000, 0.05);
  last = now;
  update(dt);
  draw(ctx, state, talk.open ? null : target, now);
  requestAnimationFrame(frame);
}

// ── 开始 / 结束 ──────────────────────
function startGame(fresh) {
  if (fresh) state = createState();
  started = true;
  $('#title-screen').hidden = true;
  $('#map-name').textContent = MAPS[state.map].name;
  renderPanels(state);
  save();
  if (fresh) toast('任务：押金');
  if (!ai.connected) toast(`AI 未连接：${ai.reason}`);
}

function showActEnd() {
  const s = state.stats;
  const facts = [
    ['依恋', s.attachment], ['清醒', s.clarity], ['自我怀疑', s.doubt], ['可信度', s.cred],
    ['记下的说法', Object.keys(state.claims).length], ['物件', state.evidence.length],
    ['搬去同住', state.flags.moved_in ? '是' : '否'], ['帮她换汇', state.flags.exchange_helped ? '是' : '否'],
  ];
  $('#act-summary').innerHTML = facts.map(([k, v]) => `<span>${k}</span><b>${v}</b>`).join('');
  $('#act-end').hidden = false;
}

function setAi(connected, reason) {
  ai = { ...ai, connected, reason };
  const badge = $('#ai-badge');
  badge.textContent = connected ? `AI 已连接 · ${ai.model || 'DeepSeek'}` : 'AI 未连接';
  badge.title = connected ? '' : reason;
  badge.classList.toggle('ready', connected);
  badge.classList.toggle('offline', !connected);
  const line = $('#title-ai');
  line.textContent = connected ? `AI 已连接（${ai.model || 'DeepSeek'}），NPC 可以自由对话。` : `AI 未连接：${reason} 剧情可以照常进行，但不能和 NPC 自由对话。`;
  line.classList.toggle('error', !connected);
}

async function checkAi() {
  try {
    const res = await fetch('/api/status', { signal: AbortSignal.timeout(20000) });
    const data = await res.json();
    ai.model = data.model;
    setAi(!!data.connected, data.error || '');
  } catch {
    setAi(false, '连不上游戏服务器。');
  }
  if (!ai.connected && started) toast(`AI 未连接：${ai.reason}`);
}

// ── 事件绑定 ─────────────────────────
addEventListener('keydown', e => {
  if (e.target.matches('input')) {
    if (e.key === 'Escape' && talk.mode === 'chat') closeBox();
    return;
  }
  const k = e.key.toLowerCase();
  if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) e.preventDefault();
  if (talk.open) {
    if ((k === ' ' || k === 'e' || k === 'enter') && talk.waiting) advance();
    else if (/^[1-9]$/.test(k)) $(`#choices button:nth-child(${k})`)?.click();
    else if (k === 'escape' && talk.mode === 'chat') closeBox();
    return;
  }
  if (!$('#travel').hidden) { if (k === 'escape') closeTravel(); return; }
  keys.add(k);
  if (k === 'e' || k === ' ') act();
  if (k === 'p') openPhone();
});
addEventListener('keyup', e => keys.delete(e.key.toLowerCase()));
addEventListener('blur', () => keys.clear());

$('#dialogue').addEventListener('click', e => {
  const choice = e.target.closest('[data-choice]');
  if (choice) { pickChoice(Number(choice.dataset.choice)); return; }
  const say = e.target.closest('[data-say]');
  if (say) { sendChat(say.dataset.say); return; }
  if (talk.waiting && !e.target.closest('form')) advance();
});
$('#close-dialogue').onclick = closeBox;
$('#chat-form').onsubmit = e => {
  e.preventDefault();
  const input = $('#chat-input');
  const text = input.value;
  input.value = '';
  sendChat(text);
};
$('#travel-list').onclick = e => { const b = e.target.closest('[data-dest]'); if (b) driveTo(b.dataset.dest); };
$('#travel-cancel').onclick = closeTravel;
$('#phone-btn').onclick = openPhone;
$('#btn-new').onclick = () => startGame(true);
$('#btn-continue').onclick = () => startGame(false);
$('#btn-act-close').onclick = () => { $('#act-end').hidden = true; };
$('#reset').onclick = () => {
  if (!confirm('确定要从头开始吗？当前进度会被覆盖。')) return;
  closeBox();
  $('#act-end').hidden = true;
  startGame(true);
};
$('#mobile-action').onclick = () => { if (talk.open && talk.waiting) advance(); else act(); };
document.querySelectorAll('[data-move]').forEach(b => {
  const k = { up: 'arrowup', down: 'arrowdown', left: 'arrowleft', right: 'arrowright' }[b.dataset.move];
  b.addEventListener('pointerdown', e => { e.preventDefault(); keys.add(k); });
  for (const ev of ['pointerup', 'pointercancel', 'pointerleave']) b.addEventListener(ev, e => { e.preventDefault(); keys.delete(k); });
});
bindPanels(() => state);

// ── 启动 ─────────────────────────────
const saved = loadSave();
if (saved) { state = saved; $('#btn-continue').hidden = false; }
preload(['assets/ui/title_keyart.png', 'assets/maps/chinatown_street.png', 'assets/maps/rental_shop.png', 'assets/sprites/chen_mo.png']);
const art = uiImage('title_keyart');
setTimeout(() => {
  const img = uiImage('title_keyart') || art;
  if (img) { $('#title-screen').classList.add('has-art'); $('#title-screen').style.backgroundImage = `linear-gradient(#07090e88, #07090ecc), url(${img.src})`; }
}, 600);
renderPanels(state);
checkAi();
requestAnimationFrame(frame);

// 调试入口：仅在地址带 ?debug 时暴露，供自动化测试和开发时跳关。
if (new URLSearchParams(location.search).has('debug')) {
  window.__game = {
    get state() { return state; },
    get talk() { return talk; },
    teleport(x, y) { state.player.x = x; state.player.y = y; },
    act, driveTo, openPhone,
    showBlocks() { debug.blocks = !debug.blocks; return debug.blocks; },
  };
}
