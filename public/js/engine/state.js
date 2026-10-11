// 游戏状态与效果（fx）结算。纯逻辑，不依赖 DOM，可在 Node 里测试。
import { CLAIMS, EVIDENCE, ANCHORS, VERSION_TOPICS } from './catalog.js';
import { QUESTS } from './quests.js';
import { MAPS } from './maps.js';

export const SAVE_VERSION = 1;
export const STAT_KEYS = ['attachment', 'clarity', 'doubt', 'cred'];

export function createState() {
  const spawn = MAPS.chinatown_street.spawn;
  return {
    version: SAVE_VERSION,
    map: 'chinatown_street',
    player: { x: spawn.x, y: spawn.y, dir: 'up' },
    quest: 'P0',
    stats: { attachment: 0, clarity: 10, doubt: 0, cred: 20 },
    flags: {},
    claims: {},        // id -> { status }
    evidence: [],      // 证据 id 列表
    anchors: {},       // id -> { overturned }
    versions: {},      // topic -> [{ audience, text }]
    destinations: ['chinatown_street'],
    phone: { unlocked: false, pending: null, unread: 0, log: [] },
    memories: {},      // npcId -> 最近对话摘要
    notes: ['2025年2月。老邝打来电话，说租车出了点麻烦，请你去当个和事佬。'],
    stories: [],       // 第一幕日常中听过的炫富故事
    ended: false,
  };
}

const clamp = v => Math.max(0, Math.min(100, v));

// 结算一组效果，返回给玩家看的提示文本（toast）。
export function applyFx(state, fx = {}) {
  const events = [];
  if (fx.stats) {
    for (const [key, delta] of Object.entries(fx.stats)) {
      if (!STAT_KEYS.includes(key)) throw Error(`Unknown stat ${key}`);
      state.stats[key] = clamp(state.stats[key] + delta);
    }
  }
  if (fx.flags) Object.assign(state.flags, fx.flags);
  for (const id of list(fx.claim)) {
    if (!CLAIMS[id]) throw Error(`Unknown claim ${id}`);
    if (!state.claims[id]) {
      state.claims[id] = { status: 'unverified' };
      events.push('线索板：记下一条她说过的话');
    }
  }
  for (const id of list(fx.doubtClaim)) {
    if (state.claims[id] && state.claims[id].status === 'unverified') {
      state.claims[id].status = 'doubtful';
      events.push('线索板：一条说法被标为存疑');
    }
  }
  for (const id of list(fx.evidence)) {
    if (!EVIDENCE[id]) throw Error(`Unknown evidence ${id}`);
    if (!state.evidence.includes(id)) {
      state.evidence.push(id);
      events.push(`获得：${EVIDENCE[id].name}`);
    }
  }
  for (const id of list(fx.anchor)) {
    if (!ANCHORS[id]) throw Error(`Unknown anchor ${id}`);
    if (!state.anchors[id]) {
      state.anchors[id] = { overturned: false };
      events.push(`认知锚点：${ANCHORS[id].title}`);
    }
  }
  if (fx.version) {
    const [topic, audience, text] = fx.version;
    if (!VERSION_TOPICS[topic]) throw Error(`Unknown version topic ${topic}`);
    state.versions[topic] ??= [];
    if (!state.versions[topic].some(v => v.audience === audience && v.text === text)) {
      state.versions[topic].push({ audience, text });
      events.push(`版本档案：${VERSION_TOPICS[topic].title}`);
    }
  }
  for (const id of list(fx.story)) if (!state.stories.includes(id)) state.stories.push(id);
  for (const id of list(fx.unlock)) {
    if (!MAPS[id]) throw Error(`Unknown map ${id}`);
    if (!state.destinations.includes(id)) {
      state.destinations.push(id);
      events.push(`可以开车前往：${MAPS[id].name}`);
    }
  }
  if (fx.note) state.notes.unshift(fx.note);
  if (fx.phone) {
    state.phone.unlocked = true;
    if (fx.phone.pending !== undefined) state.phone.pending = fx.phone.pending;
    if (fx.phone.pending) {
      state.phone.unread += 1;
      events.push('手机：有新消息');
    }
  }
  if (fx.phoneLog) state.phone.log.push(...list(fx.phoneLog));
  if (fx.travel) travel(state, fx.travel);
  if (fx.quest) {
    if (!QUESTS[fx.quest]) throw Error(`Unknown quest ${fx.quest}`);
    state.quest = fx.quest;
    events.push(`任务更新：${QUESTS[fx.quest].title}`);
  }
  if (fx.end) state.ended = true;
  return events;
}

export function travel(state, target) {
  const mapId = typeof target === 'string' ? target : target.map;
  const map = MAPS[mapId];
  if (!map) throw Error(`Unknown map ${mapId}`);
  const spawn = typeof target === 'object' && target.x !== undefined ? target : map.spawn;
  state.map = mapId;
  state.player.x = spawn.x;
  state.player.y = spawn.y;
  state.player.dir = 'up';
}

export function rememberChat(state, npc, line) {
  state.memories[npc] ??= [];
  state.memories[npc].push(line);
  state.memories[npc] = state.memories[npc].slice(-6);
}

export function serialize(state) {
  return JSON.stringify(state);
}

export function deserialize(text) {
  const data = JSON.parse(text);
  if (!data || data.version !== SAVE_VERSION || !QUESTS[data.quest] || !MAPS[data.map]) {
    throw Error('Incompatible save');
  }
  return { ...createState(), ...data };
}

function list(value) {
  if (value === undefined || value === null) return [];
  return Array.isArray(value) ? value : [value];
}
