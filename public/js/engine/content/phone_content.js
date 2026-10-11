// 手机内容：联系人、搜索结果、法院卷宗。编剧直接改这里。
// 人名地名全部虚构；失踪者的下落在任何内容里都不揭晓。
import { questAtLeast } from '../quests.js';

// 联系人。scene 是和他自由聊天时用的 AI 场景（backend/npc-cards.mjs 的 SCENES），可以随剧情变化。
export const CONTACTS = {
  qingqing: {
    name: '晴晴',
    hint: '微信',
    npc: 'qingqing',
    scene: s => (questAtLeast(s, 'A3_15') ? 'a3_qingqing' : questAtLeast(s, 'A2_09') ? 'a2_daily' : questAtLeast(s, 'A1_03') ? 'a1_daily' : 'a1_job_wechat'),
    // 剧情需要你主动找她的时候，点开她就进剧情
    script: s => (s.quest === 'A3_19' ? 'a3_19_voice' : null),
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
  // 第三幕：三个帮她换过汇的朋友。第一次点开是他们的来电。
  laozhong: { name: '老钟', hint: '账户被冻，房贷的钱在里面', npc: 'laozhong', scene: 'a3_frozen', script: friendCall('laozhong') },
  michael: { name: '麦可', hint: '账户被冻，要她退钱', npc: 'michael', scene: 'a3_frozen', script: friendCall('michael') },
  xiaomo: { name: '小莫', hint: '只收了三千多，也被冻了', npc: 'xiaomo', scene: 'a3_frozen', script: friendCall('xiaomo') },
};

// 二十八天期间（她第一次解释之后），三个朋友各有一通电话
function friendCall(id) {
  return s => (s.quest === 'A3_16' && s.flags.a3_explained && !s.flags[`${id}_called`] ? `a3_${id}` : null);
}

// 搜索结果：keys 是关键词组（一组里的词都出现才命中），when 控制何时能搜到，fx 是第一次读到时的效果。
// 鹿鸣案的几条结果共用一套关键词：知道她的真名后，加上“网红”“失踪”“南屿”就能搜到（高清醒度可以提前发现）；
// 到了九月（A3_18），只搜名字也能搜到。直接搜“鹿鸣”“小鹿”永远能搜到。
const lunaKeys = s => [
  ['鹿鸣'], ['小鹿', 'luna'], ['小鹿luna'],
  ...(s.flags.knows_real_name ? [['许嘉晴', '网红'], ['许嘉晴', '失踪'], ['许嘉晴', '南屿'], ['许嘉晴', '博主'], ['许嘉晴', '闺蜜']] : []),
  ...(questAtLeast(s, 'A3_18') ? [['许嘉晴']] : []),
];
// 三条线索（名字、照片、K）凑齐，就进入“汗毛都竖起来”的那一刻
const lunaThen = s => (s.flags.clue_name && s.flags.clue_photo && s.flags.clue_k && !s.flags.luna_realized ? 'a3_18_realize' : null);

export const SEARCH_RESULTS = [
  {
    id: 'xjq_other',
    keys: [['许嘉晴']],
    when: s => s.flags.knows_real_name && !questAtLeast(s, 'A3_18'),
    title: '县第一中学2015届期中表彰名单',
    source: '某县教育信息网',
    snippet: '……高一（3）班：许嘉晴、王……',
    text: '高一年级期中考试进步奖名单。\n高一（3）班：许嘉晴、王思远、刘洋……\n（一个中部县城的中学网站。大概只是同名的人。）',
  },
  {
    id: 'luna_main',
    keys: lunaKeys,
    title: '旅游博主“小鹿 Luna”南屿失联两年　家人：至今没有音讯',
    source: '湾区华文报 · 2025年3月',
    snippet: '2023年5月底，百万粉丝的旅游博主鹿鸣告诉家人，要陪一位闺蜜去南屿散心……',
    text: [
      '2023年5月底，拥有百万粉丝的旅游博主鹿鸣（网名“小鹿 Luna”）告诉家人，要陪一位闺蜜去南屿散心。6月初，她在圣罗莎港落地后与家人失去联系，至今下落不明。',
      '据鹿鸣的朋友回忆，约她出行的闺蜜名叫许嘉晴，两人在伦敦相识。鹿鸣出发前说，闺蜜“和男朋友分手了，心情不好”。',
      '事发后，许嘉晴的社交账号陆续注销。南屿警方表示，案件仍在调查中。',
      '鹿鸣的母亲说：“我们只想知道她在哪里。”',
    ].join('\n'),
    fx: s => ({ flags: { clue_name: !!s.flags.knows_real_name, read_luna: true }, jot: { id: 'name:鹿鸣', text: '鹿鸣（小鹿 Luna），2023年6月在南屿失联' } }),
    then: lunaThen,
  },
  {
    id: 'luna_photo',
    keys: lunaKeys,
    title: '网友整理：“小鹿”失联前最后一张合照',
    source: '社交平台 · 2023年9月（网友存档）',
    snippet: '三个人：鹿鸣、一个侧着脸的年轻女子、一位年长女性……',
    text: [
      '2023年5月的一张合照：鹿鸣、一个侧着脸的年轻女子、一位年长女性。',
      '网友说，年长的女性是那位闺蜜的母亲，大家都叫她“星河妈”。',
      '年轻女子的脖子上干干净净，没有纹身。',
    ].join('\n'),
    compare: {
      when: s => s.evidence.includes('sakura_polaroid'),
      flag: 'clue_photo',
      prompt: '调出你给她拍过、没被她删掉的那张樱花节照片。哪些地方对得上？',
      left: '合照里的年轻女子：侧着脸，长发，戴着一对珍珠耳环。',
      right: '你拍的樱花节照片：她把脸转开了，只露出侧脸。短发，没戴耳环。',
      features: ['侧脸的轮廓', '发型', '鼻梁的弧度', '耳环', '下巴的线条'],
      match: ['侧脸的轮廓', '鼻梁的弧度', '下巴的线条'],
      fx: { flags: { clue_photo: true }, evidence: 'luna_photo' },
      done: '你已经比对过了。侧脸、鼻梁、下巴，越看越像。',
    },
    then: lunaThen,
  },
  {
    id: 'luna_chat',
    keys: lunaKeys,
    title: '鹿鸣朋友公开的聊天截图',
    source: '社交平台 · 2023年8月（网友存档）',
    snippet: '“晴晴和K分手了，想出去玩几天……”',
    text: [
      '截图一（2023年5月27日），备注“星河妈”的账号发给鹿鸣：“晴晴和K分手了，想出去玩几天，你陪陪她好不好？机票酒店我们来安排。”',
      '截图二（5月28日），同一个账号：“司机会在7号门口举着牌子等你们，安全一定有保证。”',
      '截图三（5月29日），署名“晴晴”的账号：“我已经到圣罗莎港啦，在酒店洗澡等你～唉呀宝宝你就陪我去转一圈吧。”',
    ].join('\n'),
    fx: s => ({ evidence: 'k_chat', flags: { clue_k: s.evidence.includes('tattoo_arm'), saw_mother_msg: true } }),
    then: lunaThen,
  },
  {
    id: 'luna_v1',
    keys: lunaKeys,
    title: '鹿鸣朋友的长帖：她的闺蜜当时吞吞吐吐',
    source: '社交平台 · 2023年6月（网友存档）',
    snippet: '鹿鸣失联第三天，我们联系上了那个闺蜜……',
    text: '鹿鸣失联第三天，我们联系上了那个闺蜜。她吞吞吐吐，一会儿说自己没去，一会儿说还在路上，最后说她什么都不知道，然后就不回消息了。',
    fx: { version: ['luna', '2023年6月 · 对鹿鸣的朋友', '吞吞吐吐：一会儿说没去，一会儿说在路上，最后说什么都不知道。'] },
  },
  {
    id: 'luna_v2',
    keys: lunaKeys,
    title: '“闺蜜”小号发声明：我没去成，家里临时有事',
    source: '社交平台 · 2023年8月（已删除，网友存档）',
    snippet: '我和鹿鸣确实约好一起去，但出发前我家里临时有事……',
    text: [
      '“我和鹿鸣确实约好一起去，但出发前我家里临时有事，没去成。我也一直在等她的消息。”',
      '“她在伦敦认识了一个叫坤哥的人，后来的事我不清楚。请大家不要再骚扰我的家人。”',
    ].join('\n'),
    fx: { version: ['luna', '2023年8月 · 小号澄清', '约好了一起去，但“家里临时有事”没去成；提到一个叫坤哥的人。'] },
  },
  {
    id: 'news_tianlong',
    keys: [['湖蓝'], ['豪车', '醉驾'], ['天龙人']],
    title: '湖蓝色定制豪车凌晨醉驾撞护栏　车主身份成谜',
    source: '国内新闻转载 · 2025年8月',
    snippet: '一辆湖蓝色定制豪车凌晨撞上护栏，驾驶人被查出醉驾……',
    text: '一辆湖蓝色定制豪车凌晨撞上高架护栏，驾驶人被查出醉驾。网友称车主为“天龙人”，警方通报中只写了“李某（女，26岁）”。\n（报道里没有任何人的全名，也没有提到任何人的母亲。）',
    fx: s => (s.claims.tianlong ? { doubtClaim: 'tianlong', evidence: 'pattern_news' } : {}),
  },
  {
    id: 'news_coin',
    keys: [['数字币'], ['百亿', '没收'], ['虚拟币', '没收']],
    title: '百亿数字币被依法没收　涉案人已被羁押',
    source: '国内新闻转载 · 2025年10月',
    snippet: '涉案数字币价值逾百亿元……',
    text: '涉案数字币价值逾百亿元，已被依法没收。涉案人已被羁押，其家属情况未予公布。\n（又是一条没有名字的新闻。）',
    fx: s => (s.claims.coin_wife ? { doubtClaim: 'coin_wife', evidence: 'pattern_news' } : {}),
  },
  {
    id: 'nanyu_jobs',
    keys: [['南屿', '招聘'], ['南屿', '高薪'], ['南屿', '工作'], ['海外', '高薪']],
    title: '“包机票包住宿，月入数万”：警惕南屿高薪招聘',
    source: '湾区华文报 · 2025年6月',
    snippet: '多名年轻人应聘“海外高薪工作”后失联……',
    text: '多名年轻人应聘“南屿高薪工作”后失联或被困。招聘方的说辞高度相似：包机票、包住宿、“工作很轻松”、“你是外国公民，不用怕”、“司机会在门口举牌接你”。\n警方提醒：说不清具体做什么的高薪工作，就是陷阱。',
    fx: { stats: { clarity: 2 } },
  },
];

// 法院公开卷宗：案号 -> { title, pages: [{ heading, paras: [{ text, key?, label?, fx? }] }], onComplete }
// 带 key 的是关键段落，玩家要自己找出来钉到线索板；其余是程序性内容。
export const COURT_CASES = {};
