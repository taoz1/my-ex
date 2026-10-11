// 侧栏：当前任务说明和手机未读数。
import { QUESTS, questCopy, questProgress } from './engine/quests.js';

const $ = s => document.querySelector(s);
export const escapeHtml = s => String(s).replace(/[&<>'"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c]));

export function renderPanels(state) {
  const q = QUESTS[state.quest];
  $('#act-label').textContent = q.act;
  $('#date-label').textContent = q.date;
  $('#quest-act').textContent = q.act;
  $('#quest-title').textContent = q.title;
  $('#quest-copy').textContent = questCopy(state);
  $('#quest-progress').style.width = `${Math.round(questProgress(state) * 100)}%`;
  const badge = $('#phone-badge');
  badge.hidden = !state.phone.unread;
  badge.textContent = state.phone.unread;
}
