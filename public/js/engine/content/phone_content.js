// 手机内容：联系人、搜索结果、法院卷宗。编剧直接改这里。
// 人名地名全部虚构；失踪者的下落在任何内容里都不揭晓。
import { questAtLeast } from '../quests.js';

// 联系人。scene 是和他自由聊天时用的 AI 场景（backend/npc-cards.mjs 的 SCENES），可以随剧情变化。
export const CONTACTS = {
  qingqing: {
    name: '晴晴',
    hint: '微信',
    npc: 'qingqing',
    scene: s => (questAtLeast(s, 'A2_09') ? 'a2_daily' : questAtLeast(s, 'A1_03') ? 'a1_daily' : 'a1_job_wechat'),
  },
  // 第二幕起
  akang: {
    name: '阿康',
    hint: '打个电话，把最近的事跟他理一理',
    npc: 'akang',
    scene: 'recap',
    // 阿康只知道你跟他念叨过的事：你的随身笔记
    context: s => s.notes.slice(0, 8).reverse().map(n => `陈默的笔记：${n}`),
  },
  xiaowen: { name: '小雯', hint: '国内的老朋友', npc: 'xiaowen', scene: 'xiaowen_chat' },
  shenman: { name: '沈曼', hint: '编剧，橡树谷的房东', npc: 'shenman', scene: 'a2_newhouse' },
  azhen: { name: '阿珍', hint: '华埠的护肤品直销', npc: 'azhen', scene: 'azhen_shop' },
};

// 搜索结果：keys 是关键词组（一组里的词都出现才命中），when 控制何时能搜到，fx 是第一次读到时的效果。
export const SEARCH_RESULTS = [];

// 法院公开卷宗：案号 -> { title, pages: [{ heading, paras: [{ text, key?, label?, fx? }] }], onComplete }
// 带 key 的是关键段落，玩家要自己找出来钉到线索板；其余是程序性内容。
export const COURT_CASES = {};
