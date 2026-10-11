// 第四幕 卷宗（2025年12月）：MQ-21 12月4日 → MQ-23 重新认识她。
// 依据 docs/story/05_主线剧情.md。潜入关卡的规则在 ../heist.js，物件在 ../content/heist_content.js，
// 卷宗正文在 ../content/phone_content.js，资金线小游戏在 ../content/puzzles.js。
import { say, N, has, during } from './common.js';
import { HEIST_OBJECTS } from '../heist.js';

export const PLACEMENTS = {
  qingqing_house_b: [
    { id: 'qingqing', label: '晴晴', x: 640, y: 560, when: s => s.quest === 'A4_21' && s.flags.a4_called && !s.flags.heist_started },
  ],
};

export function interact(state, { id }) {
  if (!during('A4_21', 'A4_23')(state)) return null;
  const heistOn = !!state.heist?.active;
  if (heistOn) {
    if (HEIST_OBJECTS[id]) return { inspect: id };
    if (id === 'door_out') return { heistEnd: true };
    return null;
  }
  if (id === 'qingqing' && state.quest === 'A4_21') return { script: 'a4_21_arrive' };
  if (HEIST_OBJECTS[id] && state.map === 'qingqing_house_b') return { toast: '这里没什么要看的了。' };
  if (id === 'home_desk') return { phoneApp: state.quest === 'A4_21B' ? 'court' : 'search' };
  return null;
}

export const CHOICE_SCENES = {
  a4_22_call: 'a4_probe',
  a4_zhaohui: 'a4_zhaohui',
  a4_father: { scene: 'inner', npc: null },
  a4_rico: { scene: 'inner', npc: null },
};

export const STANCES = {};

// 诈问：每一句答得太长，都算“过度解释”（state.lastSaid 由对话界面记下玩家刚说的话）
const overexplain = s => {
  if ((s.lastSaid?.length || 0) > 30) s.flags.overexplained = (s.flags.overexplained || 0) + 1;
};

// 她的判断：放回原样的破绽、反问“怎么了”、过度解释、和事实对不上的否认，各算一分
export function suspicion(s) {
  return (s.flags.restore_flaws || 0)
    + (s.flags.asked_why ? 1 : 0)
    + (s.flags.overexplained || 0)
    + (s.flags.denied_suitcase && s.flags.opened_suitcase ? 1 : 0)
    + (s.flags.denied_phone && s.flags.read_phone ? 1 : 0);
}

export const SCRIPTS = {
  // MQ-21 12月4日 ────────────────────────
  a4_21_call: [
    { if: has('block_early'), goto: 'hard' },
    say('qingqing', '你能不能过来帮我搬个家？'),
    say('qingqing', '你自己过来看，我人还在这，没有跑。'),
    say('v_detective', '“我人还在这，没有跑。”她为什么要这么说？'),
    { goto: 'end' },
    { label: 'hard' },
    N('十二月初。你给她留言：你的东西还在她那儿，你要去拿回来。'),
    N('出乎意料，她回了：“下午来吧。”'),
    say('v_detective', '这么痛快？'),
    { label: 'end' },
    { fx: { phone: { pending: null }, flags: { a4_called: true } } },
  ],

  a4_21_arrive: [
    N('她瘦得厉害，眼窝陷了下去，精神很不好。'),
    say('qingqing', '你的东西在保姆房，自己去拿。'),
    N('你在保姆房很快就找到了那些“找不到了”的东西。'),
    N('她的手机响了。她接起来，嗯了几声。'),
    { if: has('block_early'), goto: 'short' },
    say('qingqing', '我出去办点事，大概三个小时。你帮我把客厅那几箱打包好，等我回来一起搬。'),
    { goto: 'go' },
    { label: 'short' },
    say('qingqing', '我出去一下，两个小时。你拿了东西就……算了，等我回来再说。', 'cold'),
    { label: 'go' },
    N('门关上了。她的手机，还躺在主卧的床头柜上。'),
    say('v_detective', '名字、日期、地址。先记下来。动过的东西，要放回原样。'),
    { fx: { flags: { heist_started: true } } },
    { open: 'heist' },
  ],

  // 她回来了（时间到了，或者你自己去门口等她）
  a4_21_return: [
    { if: s => (s.heist?.minutes ?? 1) <= 0, goto: 'late' },
    N('你走到门口，等她回来。'),
    { goto: 'back' },
    { label: 'late' },
    N('门锁响了。她回来了。'),
    { label: 'back' },
    say('qingqing', '东西都拿了？那帮我把这几箱搬上车。'),
    N('你装作什么都没发生，帮她把箱子搬上车。然后拎着你自己的包，从客厅走了出去。'),
    { if: has('camera_seen'), goto: 'cam' },
    say('v_detective', '走出客厅的时候，角落里好像有一盏小红灯闪了一下。'),
    { goto: 'flags' },
    { label: 'cam' },
    say('v_detective', '客厅的摄像头，红灯一闪一闪。它拍到了你拎着包出门。'),
    { label: 'flags' },
    { do: s => {
      s.flags.bag_on_camera = true;
      s.flags.opened_suitcase = !!s.heist?.disturbed.b_suitcase;
      s.flags.read_phone = !!s.heist?.disturbed.b_phone;
    } },
    { if: s => s.notebook.some(n => n.id.startsWith('case:')), goto: 'case' },
    { fx: { quest: 'A4_21B', note: '12月4日，她出门了几个小时。你没来得及记下卷宗的案号。' } },
    { end: true },
    { label: 'case' },
    { fx: { quest: 'A4_21B', note: '12月4日，她出门了几个小时。你记下了秦岳卷宗的案号。' } },
  ],

  // 读完卷宗、钉齐关键段落之后
  a4_21_collapse: [
    N('你把卷宗一页一页读完。'),
    N('2024年2月，三个人同一天从南方边境入境。5月，他和一位陈女士结婚，8月申请绿卡。10月被捕，她在场。'),
    N('多套身份。一个中文身份，关联着南屿的一起绑架案：约41万美元的虚拟币赎金，两个人没有回来。'),
    N('卷宗里有她的名字：入境、同住、被捕时在场。'),
    say('v_detective', '卷宗里没有证明她参与的证据。……也没有证明她没有。'),
    N('“她是被胁迫的受害者。”“他只是个经济犯。”'),
    { fx: { overturn: ['victim', 'econ_only'], overturnClaim: ['financial_crime', 'red_notice'], stats: { clarity: 10, attachment: -10, doubt: -5 } } },
    N('你想起她给你看的那一页：第26条。她只给你看了那一段。'),
    { fx: { quest: 'A4_22', phone: { pending: 'a4_22_call', from: 'qingqing' }, note: '你读完了秦岳的卷宗：南屿的绑架案，两个人没有回来。卷宗里有她的名字。' } },
  ],

  // MQ-22 你有没有打开过我的行李箱？ ──────
  a4_22_call: [
    N('12月5日。她打来电话。'),
    say('qingqing', '我那个行李箱，好像被你磕坏了？', 'cold'),
    { choice: [
      { t: '怎么了？', on: { act: 'ask' }, fx: { flags: { asked_why: true } }, goto: 'q2' },
      { t: '我打开过。', on: { topic: '承认打开过她的行李箱' }, goto: 'admit' },
      { t: '没有啊，我没碰过。', on: { topic: '否认动过她的行李箱' }, fx: { flags: { denied_suitcase: true } }, goto: 'q2' },
      { t: '（随口应付）', on: '*', goto: 'q2' },
    ] },
    { label: 'q2' },
    { do: overexplain },
    say('qingqing', '……你是不是动过我的手机？', 'cold'),
    { choice: [
      { t: '怎么了？', on: { act: 'ask' }, fx: { flags: { asked_why: true } }, goto: 'judge' },
      { t: '我看过。', on: { topic: '承认看过她的手机' }, goto: 'admit' },
      { t: '没有。', on: { topic: '否认动过她的手机' }, fx: { flags: { denied_phone: true } }, goto: 'judge' },
      { t: '（随口应付）', on: '*', goto: 'judge' },
    ] },
    { label: 'judge' },
    { do: overexplain },
    { if: s => suspicion(s) >= 2, goto: 'lie' },
    say('qingqing', '那就好。我就是问问。'),
    { fx: { flags: { lie_judged: false } } },
    { goto: 'end' },
    { label: 'lie' },
    say('qingqing', '……行。我知道了。', 'cold'),
    N('她挂了电话。你不知道她是从哪一句里听出来的。'),
    { fx: { flags: { lie_judged: true } } },
    { goto: 'end' },
    { label: 'admit' },
    say('qingqing', '那你就当没看过。', 'cold'),
    N('她挂了电话。几分钟后，你发现最后那个微信也被拉黑了。'),
    { fx: { flags: { admitted: true }, block: 'qingqing' } },
    { label: 'end' },
    { fx: { quest: 'A4_23', phone: { pending: 'a4_23_michael', from: 'michael' }, note: '12月5日，她打电话来问行李箱和手机。' } },
  ],

  // MQ-23 重新认识她 ─────────────────────
  a4_23_michael: [
    say('michael', '老陈，国内那边有人把赵慧的微信给我了。她说她也在找晴晴。'),
    say('michael', '你要不要跟她聊聊？她手里可能有名单。'),
    { fx: { contact: 'zhaohui', phone: { pending: null } } },
    say('v_detective', '还有她的过去。她说的家世，她的同学会怎么说？搜一搜“许嘉晴”和她说过的地方。'),
  ],

  a4_zhaohui: [
    say('zhaohui', '你是谁？你跟许嘉晴是什么关系？'),
    say('zhaohui', '我凭什么相信你不是她派来的？'),
    { choice: [
      { t: '秦岳根本不是什么经济犯。他的卷宗里有南屿的绑架案。', on: { topic: '告诉她秦岳的真实罪名' }, when: has('read_file'), goto: 'trust' },
      { t: '你知道鹿鸣吗？两年前在南屿失联的博主。约她出去的人，就是许嘉晴。', on: { topic: '告诉她鹿鸣案' }, when: has('luna_realized'), goto: 'trust' },
      { t: '我先挂了。', on: { act: 'leave' }, goto: 'bye' },
    ] },
    { label: 'trust' },
    say('zhaohui', '……绑架？他跟我说他是做金融的，说能帮我老公把案子“运作”下来……'),
    say('zhaohui', '晴晴太狠了！我卖了房子，借了高利贷，最后账户里只剩三千多块钱，她都编个理由要走了。'),
    say('zhaohui', '名单给你。每一笔钱转到了谁的账户，我都记着。秦岳在三方通话里还跟我保证过：“这笔钱不用担心，我会负责赔偿。”'),
    { fx: { flags: { zhaohui_trust: true }, evidence: 'zhaohui_list' } },
    { open: 'money_flow' },
    { end: true },
    { label: 'bye' },
  ],

  // 资金线拼完之后（小游戏 then）
  a4_zhaohui_after: [
    say('v_detective', '约85%。“会计”“审查”“二十八天”“律师费”，说的都是这一笔钱。'),
    N('她在五六月退过几笔小钱，让人以为这只是“经济纠纷”。'),
    say('v_detective', '退小钱，是在拖时间。'),
    { fx: { flags: { zhaohui_done: true } } },
    { call: 'a4_23_check' },
  ],

  a4_classmate: [
    say('tongxue', '许嘉晴？你是她什么人？……算了，我跟她也好多年没联系了。'),
    say('tongxue', '她家？她爸在我们县城开了个小宾馆，经济型的那种。爸妈很早就离了，她跟着她爸，她爸什么都依着她。'),
    say('tongxue', '初中开始就爱面子，买不起的东西也要买。后来去深圳一个私立学校读了一年高中，回来整个人都变了。'),
    { fx: { version: ['heiress', '老同学说的', '父亲在县城开经济型宾馆，父母早年离异；在深圳读过一年私立高中。'], overturnClaim: ['heiress', 'first_benz'] } },
    say('tongxue', '2020年她去了英国。前两年还到处跟同学借钱，后来突然就开始晒奢侈品了。'),
    say('tongxue', '前阵子听人说，她在外面讲她养了个男的，“被我养着的司机”。……不会就是你吧？'),
    { fx: { version: ['chen_identity', '对外人（老同学转述）', '“被我养着的司机。”'], flags: { classmate_done: true }, stats: { clarity: 5 } } },
    say('v_detective', '一个人设，撑着另一个人设。'),
    { call: 'a4_23_check' },
  ],

  a4_23_check: [
    { if: s => s.flags.classmate_done && s.flags.zhaohui_done, goto: 'reflect' },
    { end: true },
    { label: 'reflect' },
    N('你把这几个月的事，从头到尾又捋了一遍。'),
    say('v_detective', '她一直在等一笔永远不会来的钱。'),
    N('其实不只是她。你自己又何尝不是。'),
    { fx: { quest: 'A5_24', actBreak: 4, phone: { pending: 'a5_24_police', from: 'police' }, note: '第四幕结束。县城的小宾馆、深圳的一年、英国的借钱、赵慧的钱。你重新认识了她。' } },
  ],

  // SQ-17 父亲的号码（隐藏线）
  a4_father: [
    N('你盯着那个号码看了很久。'),
    say('v_mother', '默默，你要想清楚。'),
    say('v_detective', '你打这个电话，是为了谁？'),
    { choice: [
      { t: '（拨出去）', on: [{ act: 'agree' }, { act: 'propose' }, { act: 'chat' }, { act: 'ask' }], goto: 'call' },
      { t: '（算了）', on: [{ act: 'refuse' }, { act: 'leave' }], goto: 'no' },
    ] },
    { label: 'no' },
    { end: true },
    { label: 'call' },
    say('father', '喂？哪位？'),
    say('chen', '您好，我是……晴晴在这边的朋友。'),
    say('father', '晴晴？她在英国读书，还好吧？'),
    { choice: [
      { t: '她挺好的。', on: [{ topic: '只说她挺好的' }, { act: 'support' }], fx: { flags: { father_call: 'nothing' } }, goto: 'nothing' },
      { t: '她在美国，过得不太好。', on: { topic: '说她在美国、过得不好' }, fx: { flags: { father_call: 'some', father_message: true } }, goto: 'some' },
      { t: '（把知道的都告诉他）', on: { topic: '把知道的全部告诉他' }, fx: { flags: { father_call: 'all' } }, goto: 'all' },
    ] },
    { label: 'nothing' },
    say('father', '那就好，那就好。她不爱跟家里说话……麻烦你多照顾她。'),
    { goto: 'end' },
    { label: 'some' },
    say('father', '……美国？她跟我说在英国……'),
    say('father', '你要是见到她，帮我带句话：实在不行，就回来。家里有饭吃。'),
    { goto: 'end' },
    { label: 'all' },
    N('电话那头沉默了很久，然后挂断了。之后再打，再也没有人接。'),
    { fx: { block: 'father' } },
    { label: 'end' },
    { fx: { flags: { father_called: true } } },
  ],

  a4_father_after: [
    { if: has('father_message'), goto: 'msg' },
    N('你没有再打这个电话。'),
    { end: true },
    { label: 'msg' },
    N('“实在不行，就回来。家里有饭吃。”你一直记着这句话。'),
  ],

  // SQ-16 Where's boss?（高风险）
  a4_rico: [
    { if: has('rico_contacted'), goto: 'gone' },
    N('Rico 的头像是一片海。'),
    say('v_mother', '别。'),
    say('v_detective', '“你离我越远越好，知道得越少越好。”'),
    { choice: [
      { t: '（发一条消息）', on: [{ act: 'agree' }, { act: 'propose' }, { act: 'ask' }, { act: 'chat' }, { act: 'challenge' }, { act: 'pressure' }], goto: 'send' },
      { t: '（删掉这个号码）', on: [{ act: 'refuse' }, { act: 'leave' }], goto: 'drop' },
    ] },
    { label: 'send' },
    N('你打了一行字，发了出去。'),
    N('对方回了一句：“Where’s boss?”'),
    N('然后，把你拉黑了。'),
    { fx: { flags: { rico_contacted: true }, block: 'rico', stats: { doubt: 5 } } },
    N('接下来的一个星期，你家楼下总停着一辆没见过的车。'),
    { end: true },
    { label: 'drop' },
    { fx: { uncontact: 'rico' } },
    N('你删掉了这个号码。'),
    { end: true },
    { label: 'gone' },
    N('对方已经把你拉黑了。'),
  ],
};
