// 侧栏：任务、属性、笔记、线索板、版本档案。
import { QUESTS, questCopy, questProgress } from './engine/quests.js';
import { SPEAKERS, CLAIMS, EVIDENCE, ANCHORS, VERSION_TOPICS } from './engine/catalog.js';
import { itemImage, uiImage } from './assets.js';

const $ = s => document.querySelector(s);
export const escapeHtml = s => String(s).replace(/[&<>'"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c]));

const STATS = [
  ['attachment', '依恋', '#c98fa5'],
  ['clarity', '清醒', '#64b5f6'],
  ['doubt', '自我怀疑', '#e07a6e'],
  ['cred', '可信度', '#81c784'],
];
const STATUS_TEXT = { unverified: '未核实', doubtful: '存疑', overturned: '已推翻' };
const TOPIC_TEXT = { qin_business: '老秦的生意', family: '她的家世', qin_identity: '老秦是谁', tattoo: '纹身', qin_assets: '老秦的财富', money: '钱从哪来' };

let openEvidence = null;

export function renderPanels(state) {
  const q = QUESTS[state.quest];
  $('#act-label').textContent = q.act;
  $('#date-label').textContent = q.date;
  $('#quest-act').textContent = q.act;
  $('#quest-title').textContent = q.title;
  $('#quest-copy').textContent = questCopy(state);
  $('#quest-progress').style.width = `${Math.round(questProgress(state) * 100)}%`;
  $('#stats').innerHTML = STATS.map(([key, name, color]) => `
    <div class="stat" style="--sc:${color}"><span>${name}</span><div class="bar"><span style="width:${state.stats[key]}%"></span></div><b>${state.stats[key]}</b></div>`).join('');
  $('#journal').innerHTML = state.notes.slice(0, 5).map((n, i) => `<div class="note ${i === 0 ? 'new' : ''}">${escapeHtml(n)}</div>`).join('');
  renderBoard(state);
  renderVersions(state);
  const badge = $('#phone-badge');
  badge.hidden = !state.phone.unread;
  badge.textContent = state.phone.unread;
}

function renderBoard(state) {
  const cork = uiImage('clue_board');
  const panel = document.querySelector('[data-panel=board]');
  panel.classList.toggle('cork', !!cork);
  if (cork) panel.style.setProperty('--cork', `url(${cork.src})`);

  const anchors = Object.entries(state.anchors).map(([id, a]) => `
    <div class="card anchor"><span class="tag ${a.overturned ? 'overturned' : 'unverified'}">${a.overturned ? '已推翻' : '认知锚点'}</span>
      <div class="who">${escapeHtml(ANCHORS[id].title)}</div>${escapeHtml(ANCHORS[id].text)}<br><small>${escapeHtml(ANCHORS[id].effect)}</small></div>`).join('');

  const byTopic = {};
  for (const [id, c] of Object.entries(state.claims)) (byTopic[CLAIMS[id].topic] ??= []).push([id, c]);
  const claims = Object.entries(byTopic).map(([topic, items]) => `
    <div class="board-section"><span class="label">${escapeHtml(TOPIC_TEXT[topic] || topic)}</span>
      ${items.map(([id, c]) => `<div class="card"><span class="tag ${c.status}">${STATUS_TEXT[c.status]}</span>
        <div class="who">${escapeHtml(SPEAKERS[CLAIMS[id].who].name)}说：</div>${escapeHtml(CLAIMS[id].text)}</div>`).join('')}
    </div>`).join('');

  const evidence = state.evidence.map(id => {
    const img = itemImage(EVIDENCE[id].img);
    return `<button class="evidence" data-evidence="${id}"><div class="thumb" style="${img ? `background-image:url(${img.src})` : ''}"></div>${escapeHtml(EVIDENCE[id].name)}</button>`;
  }).join('');
  const detail = openEvidence && state.evidence.includes(openEvidence)
    ? `<div class="evidence-detail"><b>${escapeHtml(EVIDENCE[openEvidence].name)}</b><br>${escapeHtml(EVIDENCE[openEvidence].desc)}</div>` : '';

  $('#board').innerHTML = `
    ${anchors ? `<div class="board-section"><span class="label">认知锚点</span>${anchors}</div>` : ''}
    <div class="board-section"><span class="label">证据与物件</span>
      ${evidence ? `<div class="evidence-grid">${evidence}</div>${detail}` : '<p class="empty">还没有收集到东西。</p>'}</div>
    ${claims || '<p class="empty">还没有记下任何人说过的话。</p>'}`;
}

function renderVersions(state) {
  const topics = Object.entries(state.versions);
  $('#versions').innerHTML = topics.length ? topics.map(([topic, list]) => `
    <div class="version-topic"><h3>${escapeHtml(VERSION_TOPICS[topic].title)}</h3><div class="hint">${escapeHtml(VERSION_TOPICS[topic].hint)}</div>
      ${list.map(v => `<div class="version"><b>${escapeHtml(v.audience)}</b>${escapeHtml(v.text)}</div>`).join('')}</div>`).join('')
    : '<p class="empty">同一件事，不同的人、不同的听众、不同的时间，讲法都不一样。听到的版本会记在这里。</p>';
}

export function bindPanels(getState) {
  document.querySelector('.tabs').addEventListener('click', e => {
    const tab = e.target.closest('[data-tab]');
    if (!tab) return;
    document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t === tab));
    document.querySelectorAll('.tab-panel').forEach(p => { p.hidden = p.dataset.panel !== tab.dataset.tab; });
  });
  $('#board').addEventListener('click', e => {
    const b = e.target.closest('[data-evidence]');
    if (!b) return;
    openEvidence = openEvidence === b.dataset.evidence ? null : b.dataset.evidence;
    renderBoard(getState());
  });
}
