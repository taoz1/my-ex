// 主线任务（序章 + 第一幕）。id 顺序即推进顺序。
export const QUESTS = {
  P0: { act: '序章', title: '押金', date: '2025年2月', copy: '老邝的租车行出了纠纷。走进华埠的“老邝租车行”。' },
  P1: { act: '序章', title: '和事佬', date: '2025年2月', copy: '分别和老邝、那个女人聊聊，摸清双方底线，再提出一个两边都能接受的方案。' },
  A1_01: { act: '第一幕 · 饵', title: '菠菜', date: '2025年2月底', copy: '晴晴给你发了微信。打开手机看看（按 P 或点“手机”）。' },
  A1_02: { act: '第一幕 · 饵', title: '商场', date: '2025年3月初', copy: '开车（走到你的车旁按 E）去西岭购物中心，陪晴晴逛街。' },
  A1_03: { act: '第一幕 · 饵', title: '樱花节前夜', date: '2025年3月中', copy: '她邀你前一晚住她家，第二天一早去邻市日本城看樱花。开车去晴晴家。' },
  A1_03B: { act: '第一幕 · 饵', title: '樱花节', date: '2025年3月中', copy: '在日本城的樱花树下找到晴晴。' },
  A1_04: { act: '第一幕 · 饵', title: '异地恋', date: '2025年3月下旬', copy: '回家后，她不停给你发消息。看看手机。' },
  A1_05: { act: '第一幕 · 饵', title: '那个生意', date: '2025年4月初', copy: '去晴晴家，问问南屿那份工作到底怎么样了。' },
  A1_06: { act: '第一幕 · 饵', title: '印记', date: '2025年4月初', copy: '夜深了。去客房休息。' },
  A1_07: { act: '第一幕 · 饵', title: '见父母', date: '2025年4月', copy: '她说想见你的父母。开车带她回父母家吃饭，饭后和妈妈聊聊。' },
  A1_08: { act: '第一幕 · 饵', title: '大哥的女人', date: '2025年4月', copy: '同居的日子：陪她去高尔夫练习场、下午茶、商场。听她讲以前的事。（已听 {stories}/3）' },
  A1_09: { act: '第一幕 · 饵', title: '第26条', date: '2025年4月中', copy: '回到晴晴家。她说有样东西要给你看。' },
  END1: { act: '第一幕 · 完', title: '待续', date: '2025年4月底', copy: '第一幕结束。第二幕“裂”正在开发中。' },
};

export const QUEST_ORDER = Object.keys(QUESTS);

export function questCopy(state) {
  const q = QUESTS[state.quest];
  return q.copy.replace('{stories}', String(state.stories.length));
}

export function questProgress(state) {
  return (QUEST_ORDER.indexOf(state.quest) + 1) / QUEST_ORDER.length;
}
