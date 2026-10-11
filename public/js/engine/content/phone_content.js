// 手机内容：联系人、搜索结果、法院卷宗。编剧直接改这里。
// 人名地名全部虚构；失踪者的下落在任何内容里都不揭晓。
import { questAtLeast } from '../quests.js';

// 联系人。scene 是和他自由聊天时用的 AI 场景（backend/npc-cards.mjs 的 SCENES），可以随剧情变化。
export const CONTACTS = {
  qingqing: {
    name: '晴晴',
    hint: '微信',
    npc: 'qingqing',
    scene: s => (questAtLeast(s, 'A1_03') ? 'a1_daily' : 'a1_job_wechat'),
  },
};

// 搜索结果：keys 是关键词组（一组里的词都出现才命中），when 控制何时能搜到，fx 是第一次读到时的效果。
export const SEARCH_RESULTS = [];

// 法院公开卷宗：案号 -> { title, pages: [{ heading, paras: [{ text, key?, label?, fx? }] }], onComplete }
// 带 key 的是关键段落，玩家要自己找出来钉到线索板；其余是程序性内容。
export const COURT_CASES = {};
