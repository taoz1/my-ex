// 第二幕 裂（2025年4月–7月）：MQ-09 玩一玩 → MQ-14 电费账单。
// 依据 docs/story/05_主线剧情.md。步骤格式见 ../script.js 顶部注释；人名地名已虚构化。
import { say, N, has, during, after } from './common.js';

// ── NPC 站位 ────────────────────────────────────────────────
export const PLACEMENTS = {
  qingqing_house: [
    { id: 'qingqing', label: '晴晴', x: 580, y: 720, when: during('A2_09') },
  ],
  casino_suite: [
    { id: 'qingqing', label: '晴晴', x: 520, y: 520, when: during('A2_10') },
  ],
  qingqing_house_b: [
    { id: 'qingqing', label: '晴晴', x: 640, y: 560, when: s => during('A2_11', 'A2_14B')(s) && !(s.quest === 'A2_14' && s.flags.a2_sent_away) },
    { id: 'fangjie', label: '芳姐', x: 1000, y: 540, when: during('A2_11', 'A2_14B') },
    { id: 'shenman', label: '沈曼', x: 400, y: 820, when: during('A2_11') },
  ],
  financial_district: [
    { id: 'qingqing', label: '晴晴', x: 300, y: 520, when: s => s.quest === 'A2_12' && !s.flags.a2_upstairs },
  ],
  mansion_hills: [
    { id: 'qingqing', label: '晴晴', x: 900, y: 420, when: during('A2_13') },
    { id: 'linda', label: 'Linda 郭', x: 600, y: 760, when: during('A2_13') },
  ],
  chinatown_street: [
    { id: 'azhen', label: '阿珍', x: 1390, y: 400, when: after('A2_14') },
  ],
};

// ── 互动规则：返回 null 表示这一幕不管，交给前面的幕 ────────
export function interact(state, { id }) {
  const q = state.quest;
  const m = state.map;
  const inAct = during('A2_09', 'A2_14B')(state);
  switch (id) {
    case 'qingqing':
      if (!inAct) return null;
      if (q === 'A2_09' && m === 'qingqing_house') return { script: 'a2_09_phone' };
      if (q === 'A2_10') return { script: 'a2_10_casino' };
      if (q === 'A2_11') return { script: 'a2_11_move' };
      if (q === 'A2_12') return { script: 'a2_12_drop' };
      if (q === 'A2_13') return { script: state.flags.a2_house_talk ? 'a2_daily' : 'a2_13_viewing' };
      if (q === 'A2_14') return { script: 'a2_14_away' };
      if (q === 'A2_14B') return { script: 'a2_14_blowup' };
      return { script: 'a2_daily' };
    case 'fangjie':
      return during('A2_11', 'A2_14B')(state) ? { script: 'fang_b' } : null;
    case 'shenman': return { script: 'shenman_keys' };
    case 'linda': return { script: 'linda_talk' };
    case 'azhen': return { script: 'azhen_talk' };
    case 'tower_door':
      if (q !== 'A2_12') return null;
      return { script: state.flags.a2_upstairs ? 'a2_12_back' : 'a2_12_drop' };
    case 'tower_sign':
      return q === 'A2_12' ? { script: 'a2_12_sign' } : null;
    case 'tools':
      if (q !== 'A2_13') return null;
      return { script: state.flags.a2_tools_due && !state.flags.a2_tools_done ? 'a2_13_tools' : 'tools_idle' };
    case 'suite_sofa': return q === 'A2_10' ? { script: 'a2_10_sofa' } : null;
    case 'b_bills':
      if (q === 'A2_14' || q === 'A2_14B') return { script: 'bills_look' };
      return inAct ? { script: 'letter_read' } : null;
    case 'door_out':
    case 'car':
      if (q === 'A2_10') return { toast: '这三天还没熬完。' };
      if (q === 'A2_12' && state.flags.a2_upstairs) return { toast: '她还在楼上。在门口等她。' };
      return null;
    default:
      return null;
  }
}

// 剧情关键处的 AI 场景
export const CHOICE_SCENES = {
  a2_09_phone: 'a2_quarrel',
  a2_09_lure: { scene: 'a2_quarrel', npc: 'qingqing' },
  a2_10_casino: 'a2_casino',
  a2_10_step: 'a2_daily',
  a2_11_move: 'a2_newhouse',
  a2_12_back: 'a2_daily',
  a2_13_tools: 'a2_viewing',
  a2_14_away: 'a2_daily',
};

export const STANCES = {};

// 吵完之后出发去赌场
const TRIP = { fx: { quest: 'A2_10', travel: { map: 'casino_suite', x: 768, y: 840 }, note: '她翻了你的手机，说：“那你把她弄到南屿去，我就原谅你！”' } };

// 拉扯循环的一轮：认错 → 自我怀疑；设界 → 清醒。都记进 state.pressure（第五幕 VAWA 线索会回看这些记录）。
const pull = next => ({ choice: [
  { t: '对不起，是我不好。', on: [{ act: 'support' }, { act: 'agree' }], fx: { stats: { doubt: 3 }, pull: 'apologize' }, goto: next },
  { t: '这件事已经说清楚了，我不想再吵。', on: [{ act: 'refuse' }, { act: 'challenge' }, { act: 'pressure' }, { act: 'leave' }], fx: { stats: { clarity: 3 }, pull: 'boundary' }, goto: next },
  { t: '（不说话）', on: '*', fx: { pull: 'silent' }, goto: next },
] });

// ── 剧情脚本 ────────────────────────────────────────────────
export const SCRIPTS = {
  // MQ-09 玩一玩 ─────────────────────────
  a2_09_phone: [
    N('四月底。你们说好第二天一早出发，去沙漠里的赌场度假村玩几天。'),
    N('你洗完澡出来，她坐在床边，手里拿着你的手机。'),
    say('qingqing', '“反正就是玩一玩。”——陈默，这是什么意思？', 'angry'),
    { fx: { evidence: 'wanwan_chat', contact: ['akang', 'xiaowen'] } },
    say('v_detective', '你和小雯的聊天。她开玩笑说你“老牛吃嫩草”，你随口回了一句。'),
    say('qingqing', '玩一玩？我在你眼里就是玩一玩？', 'angry'),
    { choice: [{ t: '那是跟朋友开玩笑。' }] },
    say('qingqing', '朋友？什么朋友？……你这个朋友有多少身家？', 'cold'),
    { choice: [{ t: '你问这个干什么？' }] },
    say('qingqing', '我问你，她有多少钱？', 'cold'),
    N('你说了个大概。一千万左右。她盯着你看了几秒。'),
    say('qingqing', '那你把她弄到南屿去，我就原谅你！', 'angry'),
    say('v_mother', '……她刚才说什么？'),
    { label: 'menu' },
    { choice: [
      { t: '这种事我不会干。', on: [{ act: 'refuse' }, { act: 'challenge' }, { act: 'leave' }], goto: 'refuse' },
      { t: '行，我把她删了，你别生气了。', on: [{ topic: '删掉小雯的微信' }, { act: 'propose' }], goto: 'delete' },
      { t: '好好好，我想想办法。', on: { act: 'agree' }, goto: 'agree' },
    ] },
    { label: 'refuse' },
    say('chen', '这种事我不会干。'),
    say('qingqing', '那你走！现在就走！', 'angry'),
    N('你拿上外套出了门。那天晚上，你没有回去。'),
    { fx: { flags: { d_refused: true }, stats: { clarity: 5, attachment: -3 } } },
    N('凌晨一点，她打来电话，哭着说她只是太在乎你。“明天的行程都订好了，你不去，我一个人怎么办？”'),
    say('v_mediator', '各让一步吧。何必闹僵。'),
    N('第二天一早，你还是开车去接了她。'),
    { goto: 'trip' },
    { label: 'delete' },
    N('你当着她的面删掉了小雯。后来你托阿康去跟小雯解释了一下，小雯倒没怎么生气。'),
    say('qingqing', '这还差不多。', 'cold'),
    { fx: { flags: { d_deleted: true }, uncontact: 'xiaowen', stats: { doubt: 3 } } },
    { goto: 'trip' },
    // 嘴上答应了。是真去约，还是只是敷衍，要看你接下来做什么（a2_09_lure）
    { label: 'agree' },
    say('qingqing', '这可是你说的。', 'cold'),
    say('v_mother', '你答应了什么？'),
    { fx: { stats: { doubt: 3, attachment: 2 } } },
    { call: 'a2_09_lure' },
    { label: 'trip' },
    TRIP,
  ],

  // 抉择 D：嘴上答应之后。真把邀约发出去（两次回头的机会）是共谋；删掉草稿就是“假装答应”
  a2_09_lure: [
    N('第二天在路上，你打开了和小雯的对话框，打了一行字：“最近有空吗？有个朋友想约你出国玩几天。”'),
    say('akang', '（微信）你跟晴晴怎么样了？昨晚小雯还问我你最近在忙什么。'),
    say('v_detective', '你要把一个朋友，介绍给一个说“弄到南屿去”的人。'),
    { choice: [
      { t: '（把消息发出去）', on: [{ act: 'agree' }, { act: 'propose' }, { topic: '发出邀约' }], goto: 'second' },
      { t: '（删掉这行字）', on: '*', goto: 'stop' },
    ] },
    { label: 'second' },
    N('消息发出去了。小雯回：“谁啊？去哪儿？”'),
    say('v_mother', '默默，你知道“弄到南屿去”是什么意思吗？你知道吗？'),
    { choice: [
      { t: '（告诉她地方：南屿）', on: [{ act: 'agree' }, { act: 'propose' }, { topic: '告诉小雯去南屿' }], goto: 'lured' },
      { t: '（撤回消息）“发错了，没事。”', on: '*', goto: 'stop' },
    ] },
    { label: 'lured' },
    N('你把地点发了过去。小雯说：“南屿？那么远。我考虑一下。”'),
    { fx: { flags: { xiaowen_lured: true }, stats: { attachment: 5, doubt: 5 } } },
    say('v_mother', '……'),
    { goto: 'trip' },
    { label: 'stop' },
    N('你删掉了那行字。手心全是汗。'),
    N('就当是一句气话吧。你跟自己这么说。'),
    { fx: { flags: { d_pretended: true }, stats: { clarity: 3 } } },
    { label: 'trip' },
    TRIP,
  ],

  // MQ-10 赌场三日 ───────────────────────
  a2_10_casino: [
    N('沙漠赌场度假村。套房很大，她让你睡沙发。'),
    say('qingqing', '你睡沙发。我睡觉不喜欢旁边有人。', 'cold'),
    N('半夜两点，她把你叫醒，用英文跟你聊天。聊着聊着，又说起了“玩一玩”。'),
    say('qingqing', 'You said I am just for fun. Do you know how that made me feel?', 'angry'),
    pull('day2'),
    { label: 'day2' },
    N('第二天在赌场大厅。她输了几把，回房间的电梯里突然开口。'),
    say('qingqing', '你刚才看那个发牌的女的，看了三秒。我数了。', 'cold'),
    pull('night2'),
    { label: 'night2' },
    N('第二晚。空调出风口正对着沙发，你冻得睡不着。三点，她又醒了。'),
    say('qingqing', '上个月我给你打电话你没接，你到底在干什么？你说清楚。', 'angry'),
    pull('cold'),
    { label: 'cold' },
    N('第三天早上，你发烧了。'),
    say('chen', '你送我去机场吧，我想先回去。'),
    N('跟着来的芳姐在车上打圆场。'),
    say('fangjie', '老陈你还病着，好事做到底，明天一起开车回去嘛。'),
    N('回程路上，监狱打来电话。她故意说得很大声。'),
    say('qingqing', '我受不了这个保姆的车技了！你赶紧给我安排一个司机！', 'angry'),
    say('qinyue', '行，司机给你安排。车也换一辆。你喜欢什么颜色？'),
    N('两个人当着你的面，讨论起了车型和颜色。'),
    { fx: { claim: 'driver_coming' } },
    N('到了她家门口。'),
    say('qingqing', '明天我就有司机了，不需要你了。你走吧！', 'cold'),
    say('v_mediator', '算了。让她冷静几天。'),
    { fx: {
      quest: 'A2_10B',
      flags: { a2_casino_done: true },
      phone: { pending: 'a2_10_step', from: 'qingqing' },
      unlock: 'chen_home',
      travel: { map: 'chen_home' },
      note: '赌场三天，她一遍遍翻旧账。回来后她说要有司机了，让你走。',
    } },
  ],

  a2_10_sofa: [
    N('沙发很软，空调出风口正对着它。'),
    say('v_detective', '房间这么大，偏偏让你睡这里。'),
  ],

  // 给台阶 / 收线
  a2_10_step: [
    say('qingqing', '在吗？'),
    say('qingqing', '我这边缺个东西，充电器坏了。你能帮我买一个送过来吗？'),
    say('v_mediator', '她在递台阶。'),
    { choice: [
      { t: '好，我给你送过去。', on: [{ act: 'agree' }, { act: 'support' }], fx: { stats: { attachment: 2, doubt: 2 } }, goto: 'go' },
      { t: '你的司机呢？', on: [{ act: 'challenge' }, { act: 'ask', topic: '她的新司机和新车' }], fx: { stats: { clarity: 2 } }, goto: 'driver' },
      { t: '（不回）', on: '*', goto: 'ignore' },
    ] },
    { label: 'ignore' },
    N('你没有回。第二天她又发来一条语音，声音软软的：“你就这么狠心呀？”'),
    { goto: 'go' },
    { label: 'driver' },
    say('qingqing', '老秦说条件没谈拢。……你来不来嘛。', 'sweet'),
    { fx: { doubtClaim: 'driver_coming' } },
    { label: 'go' },
    N('你还是去了。她开门的时候笑得像什么都没发生过。'),
    say('qingqing', '我要搬家了。新房子在橡树谷，离这儿五分钟。你帮我弄一下。', 'sweet'),
    { fx: { quest: 'A2_11', unlock: 'qingqing_house_b', phone: { pending: null }, note: '几天后她递了台阶：“缺个东西，你能帮我买了送过来吗？”' } },
  ],

  // MQ-11 搬家 · 你的名字 ────────────────
  a2_11_move: [
    N('新房子在橡树谷，离原来的地方开车五分钟。'),
    say('qingqing', '租约你来签，水电也开你的户。我没有社安号，办这些麻烦死了。', 'sweet'),
    N('房东沈曼是个编剧。她看了看你的驾照，又看了看晴晴，没说什么。'),
    { fx: { evidence: 'lease_b', flags: { lease_my_name: true } } },
    say('qingqing', '对了，等一下保姆要是问起来，你就说这个房子是我买的。', 'cold'),
    { fx: { claim: 'house_bought', version: ['house', '对芳姐', '“这房子是我买的，一百多万，先过渡一下。”'] } },
    { choice: [
      { t: '行，我知道了。', on: { act: 'agree' }, fx: { flags: { lied_for_her: true }, stats: { doubt: 2 } }, goto: 'lie' },
      { t: '我不帮你撒这种谎。', on: [{ act: 'refuse' }, { act: 'challenge' }], fx: { flags: { refused_lie: true }, stats: { clarity: 3 }, trust: { qingqing: -1 } }, goto: 'truth' },
    ] },
    { label: 'lie' },
    N('芳姐问起来的时候，你说：“嗯，她买的。”'),
    say('fangjie', '哇，晴晴好厉害呀！'),
    say('v_detective', '你也成了她故事里的一件道具。'),
    { goto: 'done' },
    { label: 'truth' },
    N('芳姐问起来的时候，你说房子是租的，租约上是你的名字。'),
    say('fangjie', '啊？……哦哦，租的也好，租的也好。'),
    say('qingqing', '你什么意思？！在保姆面前拆我的台？', 'angry'),
    N('那天晚上，她一句话都没跟你说。'),
    { label: 'done' },
    N('几天后，她说要去金融区一家投行面试。'),
    { fx: { quest: 'A2_12', unlock: 'financial_district', note: '新房的租约和水电都在你的名下。她对芳姐说房子是她买的。' } },
  ],

  shenman_keys: [
    say('shenman', '钥匙给你们。……租约签你的名字，住的是她。这个桥段我见过。'),
    { fx: { contact: 'shenman' } },
    { chat: { npc: 'shenman', scene: 'a2_newhouse' } },
  ],

  fang_b: [
    say('fangjie', '陈先生来啦？新房子不错吧。'),
    { chat: { npc: 'fangjie', scene: 'a2_newhouse' } },
  ],

  // SQ-13 种子：随手扔在书桌上的信
  letter_read: [
    N('书桌上压着一封手写信，信封上是联邦拘留中心的地址。'),
    N('“……我被关了禁闭，一切都好。你不要再和我母亲吵架了，她年纪大了，什么都不懂。钱的事快了，快了。不要放弃我。”'),
    { fx: { evidence: 'qin_letter' } },
    say('v_detective', '“大哥”的字，写得很用力。'),
  ],

  bills_look: [
    N('电费账单还在书桌上。户名：陈默。'),
    { fx: { evidence: 'utility_bill' } },
  ],

  // MQ-12 投行面试 ───────────────────────
  a2_12_drop: [
    N('金融区。她下车前补了补口红。'),
    say('qingqing', '你在楼下等我，大概半个小时。', 'sweet'),
    N('她走进了那栋玻璃大楼。'),
    { fx: { flags: { a2_upstairs: true } } },
    say('v_detective', '半个小时。四处看看。'),
  ],

  a2_12_sign: [
    N('大堂的楼层指示牌：十二层，三家投资公司。同一层，还有一家移民律师事务所。'),
    { fx: { flags: { saw_lawfirm_sign: true }, jot: { id: 'lawfirm', text: '“投行”大楼12层：一家移民律所' } } },
    say('v_detective', '投行和移民律所在同一层。记下来。'),
  ],

  a2_12_back: [
    N('大半个小时后，她下来了。'),
    { if: s => s.flags.saw_lawfirm_sign || s.stats.clarity >= 35, goto: 'folder' },
    { goto: 'talk' },
    { label: 'folder' },
    say('v_detective', '她手里的文件夹上印着一个标志。就是指示牌上那家移民律所。'),
    { fx: { evidence: 'lawfirm_folder', flags: { vawa_clue1: true } } },
    { label: 'talk' },
    say('qingqing', '面试很成功！他们很喜欢我。', 'sweet'),
    say('qingqing', '但是没有身份不能上班。你跟我结婚，我就能来上班了。', 'sweet'),
    { fx: { claim: 'interview_ok' } },
    { choice: [
      { t: '好，我们结婚。', on: { act: 'agree' }, fx: { flags: { married: true }, stats: { attachment: 8 } }, goto: 'marry' },
      { t: '结婚不是为了上班。再等等吧。', on: [{ act: 'refuse' }, { act: 'challenge' }], fx: { stats: { clarity: 3 }, trust: { qingqing: -1 } }, goto: 'later' },
    ] },
    { label: 'marry' },
    N('两周后，你们去法院登了记。没有婚礼。她说等老秦的钱到了，再办一场大的。'),
    say('v_mother', '默默，你要多了解一下，不要这么急。'),
    { goto: 'end' },
    { label: 'later' },
    say('qingqing', '你就是不想对我负责。', 'cold'),
    say('v_mediator', '她只是想要个身份。……可是她为什么这么急？'),
    { label: 'end' },
    { fx: { quest: 'A2_13', unlock: 'mansion_hills', flags: { a2_upstairs: false }, note: '她说投行面试很成功，但“没有身份不能上班”。' } },
  ],

  // MQ-13 看房的女人 ─────────────────────
  a2_13_viewing: [
    N('山景高地的豪宅开放日。她进门先看大门朝向。'),
    say('qingqing', '大门对着楼梯，漏财。这个吊灯压在餐桌正上方，主人家吃饭都不安心。'),
    N('经纪人们都认识她。一个年轻经纪人小声跟同事说：“又是许小姐。”'),
    say('qingqing', '我爸在国内做五星酒店，每家店选址都请大师看风水，我从小耳濡目染。'),
    { fx: { version: ['heiress', '对豪宅经纪人', '五星酒店选址都请大师看风水，“我从小耳濡目染”。'], flags: { a2_house_talk: true } } },
    say('v_detective', '同一个故事，换了个开头。'),
    { if: has('a2_tools_done'), goto: 'wrap' },
    N('她看了一眼手机，脸色一沉。'),
    say('qingqing', '那个姓何的又在烦我。你去角落那边，帮我看看那箱工具。', 'cold'),
    { fx: { flags: { a2_tools_due: true } } },
    { end: true },
    { label: 'wrap' },
    { call: 'a2_13_wrap' },
  ],

  a2_13_tools: [
    N('一箱二手电动工具。她五十美元从网上买来，转手卖给“合伙人”老何，报的进价是三百。'),
    say('laohe', '（视频电话）许小姐，你看看这个截图，卖家明明写的五十块。三百？你当我傻？'),
    say('qingqing', '这不是我经手的！是他，他去买的！', 'angry'),
    N('她把手机转过来，对着你。'),
    say('qingqing', '你跟老何说，是你买的，你记错了价。', 'cold'),
    { choice: [
      { t: '（接过手机）是我记错了，对不起老何。', on: [{ act: 'agree' }, { act: 'support' }], fx: { flags: { took_blame: true }, stats: { doubt: 4, attachment: 2 } }, goto: 'blame' },
      { t: '这是你买的，我不背这个锅。', on: [{ act: 'refuse' }, { act: 'challenge' }], fx: { flags: { refused_blame: true }, stats: { clarity: 4 }, trust: { qingqing: -1 }, pull: 'boundary' }, goto: 'no' },
    ] },
    { label: 'blame' },
    say('laohe', '……行吧，陈先生，下次记清楚点。'),
    say('v_detective', '五十块的东西报三百。这种小钱她也要骗。'),
    { goto: 'wrap' },
    { label: 'no' },
    say('qingqing', '你到底是不是我男朋友？关键时刻一点用都没有！', 'angry'),
    N('老何挂了电话。'),
    { label: 'wrap' },
    { fx: { flags: { a2_tools_done: true } } },
    { if: has('a2_house_talk'), goto: 'fin' },
    { end: true },
    { label: 'fin' },
    { call: 'a2_13_wrap' },
  ],

  a2_13_wrap: [
    N('看了两个月的房，她一套都没买。'),
    { fx: { quest: 'A2_14', note: '整个山景高地的经纪人都认识“许小姐”。她五十美元买的工具，报给合伙人三百。' } },
  ],

  tools_idle: [
    N('一箱二手电动工具，标签还没撕。'),
  ],

  linda_talk: [
    say('linda', '陈先生是吧？许小姐的……司机？'),
    { fx: { version: ['chen_identity', '对经纪人', '“我的司机。”'] } },
    { chat: { npc: 'linda', scene: 'a2_viewing' } },
  ],

  // MQ-14 电费账单 ───────────────────────
  a2_14_away: [
    say('qingqing', '下午阿珍要来，你出去转转，晚点再回来。', 'cold'),
    say('chen', '我为什么要出去？'),
    say('qingqing', '她以为我一个人住。你在这儿，我怎么跟她讲我的美容院？', 'cold'),
    { fx: { claim: 'three_salons', version: ['money', '对阿珍', '合伙开了三家美容院，八月新店开张。'], flags: { a2_sent_away: true } } },
    N('出门的时候，你瞥了一眼书桌。电费账单摊在最上面，户名是你。'),
    say('v_detective', '账单。她没收起来。'),
    { fx: { evidence: 'utility_bill' } },
    N('第二天，她又来找你。'),
    say('qingqing', '阿珍非要拉我办会员，我说我男朋友也想办。你去帮我撑个场面，就当演戏。', 'sweet'),
    { choice: [
      { t: '用驾照登记？我想个别的办法吧。', on: [{ topic: '不用真名登记' }, { act: 'refuse' }, { act: 'challenge' }], when: s => s.stats.clarity >= 40, fx: { flags: { delayed_leak: true }, stats: { clarity: 2 } }, goto: 'dodge' },
      { t: '我不去。', on: [{ act: 'refuse' }, { act: 'challenge' }], goto: 'insist' },
      { t: '行，我去登记。', on: [{ act: 'agree' }, { act: 'support' }], goto: 'license' },
    ] },
    { label: 'insist' },
    say('qingqing', '你连这点小事都不肯帮我？', 'wronged'),
    N('你还是去了。'),
    { label: 'license' },
    N('阿珍的店里，你掏出驾照。阿珍一边录入一边念：“陈——默。”她抬头看了你一眼，又看了看晴晴。'),
    say('azhen', '陈默……这名字好熟。'),
    say('v_detective', '电费账单上的名字。她在晴晴家见过。'),
    { fx: { evidence: 'member_form', flags: { real_name_leak: true }, contact: 'azhen', quest: 'A2_14B', note: '你在阿珍那里用驾照登记了会员。电费账单上也是你的名字。' } },
    { end: true },
    { label: 'dodge' },
    N('你说驾照忘带了，只留了个英文名。阿珍有点失望，没多问。'),
    say('v_detective', '名字没留下。……能瞒多久？'),
    { fx: { contact: 'azhen', quest: 'A2_14B', note: '你没有用真名在阿珍那里登记。可电费账单还摊在她家的书桌上。' } },
  ],

  azhen_talk: [
    say('azhen', '陈先生！进来坐，试试我们新到的精华。'),
    { chat: { npc: 'azhen', scene: 'azhen_shop' } },
  ],

  a2_14_blowup: [
    N('七月初。你刚进门，她的手机就响了。监狱的号码。她开了免提，示意你别出声。'),
    { if: has('delayed_leak'), goto: 'fang' },
    say('qinyue', '阿珍跟老温说，你家里住着一个男的，叫陈默。'),
    { goto: 'rage' },
    { label: 'fang' },
    say('qinyue', '你让保姆接电话。'),
    say('fangjie', '（结结巴巴）老、老板……陈先生，陈先生就是来帮忙的，他偶尔住……'),
    say('v_detective', '芳姐说漏嘴了。'),
    { label: 'rage' },
    say('qinyue', '你当我是傻子？！从今天起，我不会再给你一分钱！'),
    say('qingqing', '你听谁胡说？阿珍那种人的话你也信？是不是老温挑拨？你在里面被人当枪使了你知不知道！', 'angry'),
    say('qingqing', '我对你怎么样你心里没数吗？你信别人不信我？', 'wronged'),
    say('v_detective', '否认。攻击。把自己变成受害者。一模一样的顺序。'),
    { fx: { flags: { saw_darvo: true }, stats: { clarity: 5 }, pull: 'darvo' } },
    N('电话挂了。她坐了很久，然后转向你。'),
    say('qingqing', '最近风声紧，你还是先回去待一下，等风头过了再来吧。', 'cold'),
    { choice: [{ t: '……好。' }] },
    say('qingqing', '本来老秦说这些钱全部给我的，就是因为你太笨，在阿珍面前把咱俩的关系暴露了。', 'cold'),
    say('qingqing', '我的经济损失还没让你赔呢。', 'cold'),
    { fx: { claim: 'money_cut' } },
    { if: has('moved_in'), goto: 'moveout' },
    N('你回了自己的住处。'),
    { goto: 'end' },
    { label: 'moveout' },
    N('你收拾了一个行李箱，搬回自己的住处。有些东西来不及带走，她说“先放着”。'),
    { label: 'end' },
    { fx: { quest: 'A3_15', actBreak: 2, travel: { map: 'chen_home' }, phone: { pending: 'a3_15_call', from: 'laozhong' }, note: '第二幕结束。秦岳从阿珍那里知道了你的存在。她说：“都是你害的。”' } },
  ],

  a2_daily: [
    say('qingqing', '又怎么了？', 'cold'),
    { chat: { npc: 'qingqing', scene: 'a2_daily' } },
  ],
};
