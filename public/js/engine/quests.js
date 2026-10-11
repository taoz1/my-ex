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
  A2_09: { act: '第二幕 · 裂', title: '玩一玩', date: '2025年4月底', copy: '明天就要出发去赌场了。去晴晴家。' },
  A2_10: { act: '第二幕 · 裂', title: '赌场三日', date: '2025年5月初', copy: '沙漠赌场度假村的套房。找她说话，熬过这三天。' },
  A2_10B: { act: '第二幕 · 裂', title: '台阶', date: '2025年5月初', copy: '被赶出门的几天后，她发来了消息。看看手机。' },
  A2_11: { act: '第二幕 · 裂', title: '你的名字', date: '2025年5月', copy: '她要搬到五分钟外的新房子。开车去橡树谷的新家。' },
  A2_12: { act: '第二幕 · 裂', title: '投行面试', date: '2025年5月', copy: '开车送她去金融区的“投行”大楼面试。在大楼门口等她。' },
  A2_13: { act: '第二幕 · 裂', title: '看房的女人', date: '2025年6月', copy: '陪她去山景高地看豪宅。' },
  A2_14: { act: '第二幕 · 裂', title: '电费账单', date: '2025年6月底', copy: '回她的新家。听说阿珍要来。' },
  A2_14B: { act: '第二幕 · 裂', title: '风声', date: '2025年7月初', copy: '去她家。' },
  A3_15: { act: '第三幕 · 冻', title: '第一张卡', date: '2025年7月10日', copy: '你回到了自己的住处。' },
};

export const QUEST_ORDER = Object.keys(QUESTS);

export function questCopy(state) {
  const q = QUESTS[state.quest];
  return q.copy.replace('{stories}', String(state.stories.length));
}

export function questProgress(state) {
  return (QUEST_ORDER.indexOf(state.quest) + 1) / QUEST_ORDER.length;
}

// 剧情是否已经推进到某个任务（含）之后
export function questAtLeast(state, id) {
  return QUEST_ORDER.indexOf(state.quest) >= QUEST_ORDER.indexOf(id);
}
