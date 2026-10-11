// 手机里的数据：联系人、搜索引擎、法院案件系统、联邦监狱查询。纯数据 + 纯逻辑，可在 Node 里测试。
// 具体内容（搜索结果、卷宗正文）在 content/ 下按幕编写，这里只负责查询规则。
import { SEARCH_RESULTS, COURT_CASES, CONTACTS } from './content/phone_content.js';

export { CONTACTS, COURT_CASES };

// 联系人列表：解锁了的才显示；被拉黑的仍显示，但发不出消息。
export function contactList(state) {
  return state.phone.contacts
    .filter(id => CONTACTS[id])
    .map(id => ({ id, ...CONTACTS[id], blocked: state.phone.blocked.includes(id) }));
}

// 某个联系人当前用哪个 AI 场景聊天
export function contactScene(state, id) {
  const scene = CONTACTS[id].scene;
  return typeof scene === 'function' ? scene(state) : scene;
}

// ── 搜索引擎 ───────────────────────────────────────────────
// 每条结果有若干组关键词（keys），查询里包含某一组的全部词就算命中；when 控制什么时候能搜到。
const normalize = text => text.toLowerCase().replace(/\s+/g, '');

export function search(state, query) {
  const q = normalize(query);
  if (!q) return [];
  return SEARCH_RESULTS.filter(r => {
    if (r.when && !r.when(state)) return false;
    const groups = typeof r.keys === 'function' ? r.keys(state) : r.keys;
    return groups.some(group => group.every(word => q.includes(normalize(word))));
  });
}

// 照片比对小游戏：选中的特征要和 compare.match 完全一致才算认出来
export function comparePhotos(result, picked) {
  const { match } = result.compare;
  const wrong = picked.filter(f => !match.includes(f));
  if (wrong.length) return { ok: false, text: `${wrong.join('、')}——这些很容易变，不能当证据。看骨相。` };
  if (picked.length < match.length) return { ok: false, text: '还不够确定。再看看。' };
  return { ok: true, text: '侧脸、鼻梁、下巴……越看越像。' };
}

// ── 法院案件系统 ───────────────────────────────────────────
// 只有记下了案号（notebook 里有）才查得到；输入时容忍空格和大小写。
export function findCase(state, input) {
  const key = normalize(input);
  const id = Object.keys(COURT_CASES).find(no => normalize(no) === key);
  if (!id) return null;
  return { id, ...COURT_CASES[id] };
}

// 卷宗里钉到线索板的关键段落是否齐了
export function caseComplete(state, id) {
  const keys = COURT_CASES[id].pages.flatMap(p => p.paras).filter(p => p.key).map(p => p.key);
  const pinned = state.pinned[id] || [];
  return keys.every(k => pinned.includes(k));
}

// ── 联邦监狱查询 ───────────────────────────────────────────
export function inmateLookup(state, name) {
  const n = normalize(name);
  if (!n) return null;
  const qin = ['秦岳', 'qinyue', 'yueqin', 'damon'].some(alias => n.includes(alias));
  if (!qin) return { found: false, text: `查无此人：“${name.trim()}”。请核对姓名拼写或在押人员编号。` };
  if (state.flags.qin_deported) return { found: false, text: '查无此人。（这个名字已经不在系统里了。）' };
  return { found: true, text: 'QIN, YUE　在押　联邦拘留中心（湾城北）　释放日期：UNKNOWN' };
}
