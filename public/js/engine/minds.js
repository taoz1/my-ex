// NPC 对话的第二步“决定”：玩家行为（act，由 AI 归类）→ NPC 意图（intent，交给 AI 说出来）。
// 规则写死在这里，同样的情况 NPC 总是同样反应；AI 不做决定，也就不会前后矛盾。
// 行为和意图的含义见 backend/npc-cards.mjs 的 ACTS / INTENTS。
//
// 剧情关键处先看脚本里的选项（选项的 on 写明哪种行为会触发它，见 script.js 的 matchOption）；
// 没有选项对得上时，才按这里的规则让 NPC 回一句，剧情停在原处。

// 所有人的默认反应
const BASE = {
  support: { intent: 'warm', trust: 1 },
  challenge: { intent: 'defensive', trust: -1 },
  pressure: { intent: 'defensive', trust: -1 },
  propose: { intent: 'answer' },
  agree: { intent: 'answer' },
  refuse: { intent: 'answer' },
  ask: { intent: 'answer' },
  chat: { intent: 'answer' },
  leave: { intent: 'goodbye' },
};

// 各人的性格差异：只写和默认不同的地方。mood 是头像表情（backend 角色卡的 emotions）。
export const MINDS = {
  qingqing: {
    support: { intent: 'warm', trust: 1, mood: 'sweet' },
    challenge: { intent: 'defensive', trust: -1, mood: 'angry' },
    pressure: { intent: 'refuse', trust: -1, mood: 'cold' },
  },
  laokuang: {
    pressure: { intent: 'defensive', trust: -1, mood: 'panic' },
  },
  fangjie: {},
  // 妈妈不记仇：被顶撞也只是接着说
  chen_mother: {
    challenge: { intent: 'answer' },
    pressure: { intent: 'answer' },
  },
};

export const TRUST_MIN = -3;
export const TRUST_MAX = 3;

export function trust(state, npc) {
  return state.minds[npc]?.trust ?? 0;
}

export function changeTrust(state, npc, delta) {
  state.minds[npc] ??= { trust: 0 };
  state.minds[npc].trust = Math.max(TRUST_MIN, Math.min(TRUST_MAX, state.minds[npc].trust + delta));
}

// said：AI 归类的结果 { act, topic, amount }。atChoice：剧情正等着玩家表态。
// 返回 NPC 意图 { act, mood, amount }，同时结算对 NPC 心态的影响。
export function react(state, npc, said, { atChoice = false } = {}) {
  const rule = { ...BASE[said.act], ...MINDS[npc]?.[said.act] };
  if (rule.trust) changeTrust(state, npc, rule.trust);
  // 剧情等着他表态时想走：把人留住（真要走可以点 ×）
  const act = said.act === 'leave' && atChoice ? 'hold' : rule.intent;
  return { act, mood: rule.mood ?? null, amount: said.amount ?? null };
}
