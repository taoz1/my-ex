// 手机界面：消息、搜索、法院案件系统、监狱查询、证据。
// 只负责显示和点击；查询规则在 engine/phone.js，内容在 engine/content/phone_content.js。
import { contactList, search, findCase, caseComplete, inmateLookup, comparePhotos, COURT_CASES } from './engine/phone.js';
import { applyFx } from './engine/state.js';
import { SPEAKERS, CLAIMS, EVIDENCE, ANCHORS, VERSION_TOPICS } from './engine/catalog.js';
import { itemImage } from './assets.js';
import { escapeHtml } from './panels.js';

const $ = s => document.querySelector(s);
const APPS = [
  ['messages', '消息'],
  ['search', '搜索'],
  ['court', '法院案件'],
  ['inmate', '监狱查询'],
  ['evidence', '证据'],
];
const STATUS_TEXT = { unverified: '未核实', doubtful: '存疑', overturned: '已推翻' };

let host = null;   // main.js 传入：{ getState, playPhoneScript, openContact, playScript, afterFx }
let app = 'messages';
let view = null;   // 当前 app 内的子页面

export function bindPhone(callbacks) {
  host = callbacks;
  $('#phone-close').onclick = closePhone;
  $('#phone-apps').addEventListener('click', e => {
    const b = e.target.closest('[data-app]');
    if (b) { app = b.dataset.app; view = null; render(); }
  });
  $('#phone-body').addEventListener('click', onClick);
  $('#phone-body').addEventListener('submit', onSubmit);
  $('#reader-close').onclick = closeReader;
  $('#reader-body').addEventListener('click', onPin);
}

export function openPhone(startApp) {
  if (startApp) { app = startApp; view = null; }
  $('#phone').hidden = false;
  render();
}

export function closePhone() {
  $('#phone').hidden = true;
}

export const phoneOpen = () => !$('#phone').hidden || !$('#reader').hidden;

// 结算搜索结果、卷宗等带来的效果，并把提示交给 main.js
function fx(effects) {
  host.afterFx(applyFx(host.getState(), effects));
}

function render() {
  const state = host.getState();
  $('#phone-apps').innerHTML = APPS.map(([id, name]) => `<button class="${id === app ? 'active' : ''}" data-app="${id}">${name}${id === 'messages' && state.phone.unread ? `<span class="badge">${state.phone.unread}</span>` : ''}</button>`).join('');
  $('#phone-body').innerHTML = { messages, search: searchApp, court, inmate, evidence }[app](state);
  $('#phone-body input')?.focus();
}

// ── 消息 ───────────────────────────────────────────────────
function messages(state) {
  const pending = state.phone.pending
    ? `<button class="pending" data-pending>新消息 · ${escapeHtml(SPEAKERS[state.phone.from || 'qingqing']?.name || '')}<small>点开查看</small></button>` : '';
  const list = contactList(state);
  const rows = list.map(c => `<button class="contact ${c.blocked ? 'blocked' : ''}" data-contact="${c.id}">
      <b>${escapeHtml(c.name)}</b><small>${c.blocked ? '你已被对方拉黑' : escapeHtml(c.hint || '')}</small></button>`).join('');
  return `${pending}${rows || '<p class="empty">还没有联系人。</p>'}`;
}

// ── 搜索引擎 ───────────────────────────────────────────────
function searchApp(state) {
  if (view?.result) {
    const r = view.result;
    return `<button class="back" data-back>‹ 返回结果</button>
      <article class="article"><h3>${escapeHtml(r.title)}</h3><small>${escapeHtml(r.source)}</small>${r.text.split('\n').map(p => `<p>${escapeHtml(p)}</p>`).join('')}</article>
      ${compareBox(state, r)}`;
  }
  const query = view?.query || '';
  const results = query ? search(state, query) : [];
  const list = query
    ? (results.length ? results.map(r => `<button class="result" data-result="${r.id}"><b>${escapeHtml(r.title)}</b><small>${escapeHtml(r.source)}</small><span>${escapeHtml(r.snippet)}</span></button>`).join('')
      : '<p class="empty">没有找到相关结果。换个关键词试试。</p>')
    : `<p class="empty">名字、地名、案号……先记下来，再来搜。${state.notebook.length ? `<br>你记下的：${state.notebook.map(n => escapeHtml(n.text)).join('、')}` : ''}</p>`;
  return `<form class="phone-form" data-form="search"><input name="q" value="${escapeHtml(query)}" placeholder="搜索" autocomplete="off"><button>搜</button></form>${list}`;
}

// 照片比对：调出你拍过、没被她删掉的照片，挑出对得上的特征
function compareBox(state, r) {
  if (!r.compare || !r.compare.when(state)) return '';
  if (state.flags[r.compare.flag]) return `<p class="hint">${escapeHtml(r.compare.done)}</p>`;
  const picked = view.picked || [];
  return `<div class="compare"><p class="hint">${escapeHtml(r.compare.prompt)}</p>
    <div class="compare-pics"><div>${escapeHtml(r.compare.left)}</div><div>${escapeHtml(r.compare.right)}</div></div>
    ${r.compare.features.map(f => `<button class="feature ${picked.includes(f) ? 'on' : ''}" data-feature="${escapeHtml(f)}">${escapeHtml(f)}</button>`).join('')}
    <button class="phone-go" data-compare>比对</button>${view.compareMsg ? `<p class="hint">${escapeHtml(view.compareMsg)}</p>` : ''}</div>`;
}

// ── 法院案件系统 ───────────────────────────────────────────
function court(state) {
  const msg = view?.msg ? `<p class="empty">${escapeHtml(view.msg)}</p>` : '';
  const known = Object.keys(COURT_CASES).filter(id => state.notebook.some(n => n.id === `case:${id}`));
  const shortcuts = known.map(id => `<button class="result" data-case="${id}"><b>${escapeHtml(id)}</b><small>${escapeHtml(COURT_CASES[id].title)}</small><span>${caseComplete(state, id) ? '关键段落已全部钉到线索板' : `已钉 ${(state.pinned[id] || []).length} 段`}</span></button>`).join('');
  return `<p class="hint">联邦法院公开案件查询。输入案号。</p>
    <form class="phone-form" data-form="court"><input name="no" placeholder="案号，例如 2:24-cr-00000" autocomplete="off"><button>查询</button></form>${msg}${shortcuts}`;
}

// ── 联邦监狱查询 ───────────────────────────────────────────
function inmate(state) {
  const r = view?.inmate;
  return `<p class="hint">联邦在押人员查询。输入姓名。</p>
    <form class="phone-form" data-form="inmate"><input name="name" placeholder="姓名" autocomplete="off"><button>查询</button></form>
    ${r ? `<p class="inmate ${r.found ? 'found' : ''}">${escapeHtml(r.text)}</p>` : ''}`;
}

// ── 证据（原来的线索板 / 版本档案）────────────────────────
function evidence(state) {
  const items = state.evidence.map(id => {
    const img = itemImage(EVIDENCE[id].img);
    return `<div class="ev"><div class="thumb" style="${img ? `background-image:url(${img.src})` : ''}"></div><div><b>${escapeHtml(EVIDENCE[id].name)}</b><p>${escapeHtml(EVIDENCE[id].desc)}</p></div></div>`;
  }).join('');
  const anchors = Object.entries(state.anchors).map(([id, a]) => `<div class="claim ${a.overturned ? 'overturned' : ''}"><span class="tag">${a.overturned ? '已推翻' : '你的认知'}</span>${escapeHtml(ANCHORS[id].title)}</div>`).join('');
  const claims = Object.entries(state.claims).map(([id, c]) => `<div class="claim ${c.status}"><span class="tag">${STATUS_TEXT[c.status]}</span>${escapeHtml(SPEAKERS[CLAIMS[id].who].name)}：${escapeHtml(CLAIMS[id].text)}</div>`).join('');
  const versions = Object.entries(state.versions).map(([topic, list]) => `<div class="version-topic"><b>${escapeHtml(VERSION_TOPICS[topic].title)}</b>${list.map(v => `<p><i>${escapeHtml(v.audience)}</i> ${escapeHtml(v.text)}</p>`).join('')}</div>`).join('');
  const notes = state.notebook.map(n => `<li>${escapeHtml(n.text)}</li>`).join('');
  return `${section('物件', items)}${section('你的认知', anchors)}${section('她说过的话', claims)}${section('版本档案', versions)}${section('记下的', notes ? `<ul>${notes}</ul>` : '')}`;
}

const section = (title, body) => (body ? `<h4>${title}</h4>${body}` : '');

// ── 交互 ───────────────────────────────────────────────────
function onClick(e) {
  const state = host.getState();
  if (e.target.closest('[data-back]')) { view = { query: view.query }; render(); return; }
  const feature = e.target.closest('[data-feature]');
  if (feature) {
    const f = feature.dataset.feature;
    const picked = view.picked || [];
    view = { ...view, picked: picked.includes(f) ? picked.filter(x => x !== f) : [...picked, f], compareMsg: null };
    render();
    return;
  }
  if (e.target.closest('[data-compare]')) {
    const r = view.result;
    const out = comparePhotos(r, view.picked || []);
    view = { ...view, compareMsg: out.text };
    if (out.ok) fx(r.compare.fx);
    render();
    if (out.ok) afterRead(r);
    return;
  }
  if (e.target.closest('[data-pending]')) { closePhone(); host.playPhoneScript(); return; }
  const contact = e.target.closest('[data-contact]');
  if (contact) { closePhone(); host.openContact(contact.dataset.contact); return; }
  const result = e.target.closest('[data-result]');
  if (result) {
    const r = search(state, view.query).find(x => x.id === result.dataset.result);
    view = { query: view.query, result: r };
    if (!state.searched.includes(r.id)) {
      state.searched.push(r.id);
      if (r.fx) fx(typeof r.fx === 'function' ? r.fx(state) : r.fx);
    }
    render();
    afterRead(r);
    return;
  }
  const kase = e.target.closest('[data-case]');
  if (kase) openReader(kase.dataset.case);
}

// 读完一条结果后，可能触发一段剧情（比如三条线索凑齐）
function afterRead(r) {
  const next = r.then?.(host.getState());
  if (next) { closePhone(); host.playScript(next); }
}

function onSubmit(e) {
  e.preventDefault();
  const state = host.getState();
  const form = e.target.dataset.form;
  const value = new FormData(e.target).values().next().value || '';
  if (form === 'search') view = { query: value.trim() };
  if (form === 'inmate') view = { inmate: inmateLookup(state, value) };
  if (form === 'court') {
    const found = findCase(state, value);
    if (!found || !state.notebook.some(n => n.id === `case:${found.id}`)) {
      view = { msg: value.trim() ? `没有查到案号“${value.trim()}”。` : '请输入案号。' };
    } else {
      openReader(found.id);
      return;
    }
  }
  render();
}

// ── 卷宗阅读器：逐页读，点段落钉到线索板 ───────────────────
let reading = null;

function openReader(id) {
  reading = { id, page: 0 };
  closePhone();
  $('#reader').hidden = false;
  renderReader();
}

function closeReader() {
  $('#reader').hidden = true;
  reading = null;
  openPhone('court');
}

function renderReader() {
  const state = host.getState();
  const kase = COURT_CASES[reading.id];
  const page = kase.pages[reading.page];
  const pinned = state.pinned[reading.id] || [];
  const keys = kase.pages.flatMap(p => p.paras).filter(p => p.key).length;
  $('#reader-title').textContent = `${reading.id} · ${kase.title}`;
  $('#reader-body').innerHTML = `
    <p class="hint">第 ${reading.page + 1} / ${kase.pages.length} 页 · 点一段文字把它钉到线索板（已钉关键段落 ${pinned.length} / ${keys}）</p>
    <h3>${escapeHtml(page.heading)}</h3>
    ${page.paras.map((p, i) => `<p class="para ${p.key && pinned.includes(p.key) ? 'pinned' : ''}" data-para="${i}">${escapeHtml(p.text)}</p>`).join('')}
    <div class="reader-nav">
      <button data-page="-1" ${reading.page === 0 ? 'disabled' : ''}>‹ 上一页</button>
      <button data-page="1" ${reading.page === kase.pages.length - 1 ? 'disabled' : ''}>下一页 ›</button>
    </div>`;
}

function onPin(e) {
  const state = host.getState();
  const nav = e.target.closest('[data-page]');
  if (nav) { reading.page += Number(nav.dataset.page); renderReader(); $('#reader-body').scrollTop = 0; return; }
  const para = e.target.closest('[data-para]');
  if (!para) return;
  const kase = COURT_CASES[reading.id];
  const p = kase.pages[reading.page].paras[Number(para.dataset.para)];
  if (!p.key) {
    host.afterFx(['这一段是程序性内容，和你要找的事关系不大。']);
    return;
  }
  state.pinned[reading.id] ??= [];
  if (state.pinned[reading.id].includes(p.key)) return;
  state.pinned[reading.id].push(p.key);
  const events = p.fx ? applyFx(state, p.fx) : [];
  host.afterFx([`钉到线索板：${p.label}`, ...events]);
  if (caseComplete(state, reading.id)) {
    if (kase.onComplete) fx(kase.onComplete);
    if (kase.then) {
      $('#reader').hidden = true;
      reading = null;
      host.playScript(kase.then);
      return;
    }
  }
  renderReader();
}
