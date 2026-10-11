// 第五幕 反噬（2026年1月–4月）：MQ-24 一百万美元的珠宝 → MQ-28 上门。
// 依据 docs/story/05_主线剧情.md；支线 SQ-10（冯逸）、SQ-11（Coco）、SQ-14（门铃）、SQ-20（小吴）的主干也在这里。
// 警局笔录的题目在 ../content/defense.js。执法人员不透露在办案件细节（docs/story/04 第17节）。
import { say, N, has, during } from './common.js';

export const PLACEMENTS = {
  chinatown_street: [
    { id: 'coco', label: 'Coco', x: 980, y: 400, when: s => during('A5_26', 'A5_28B')(s) && s.phone.contacts.includes('coco') },
  ],
  club_gym: [
    { id: 'eric', label: '冯逸', x: 760, y: 470, when: s => during('A5_26', 'A5_28B')(s) && s.flags.eric_called && !s.flags.eric_met },
  ],
  chen_home: [
    { id: 'xiaowu', label: '小吴', x: 990, y: 510, when: during('A5_24', 'A5_28B') },
    { id: 'tony', label: 'Tony', x: 660, y: 700, when: during('A5_28B') },
  ],
};

export function interact(state, { id }) {
  const q = state.quest;
  if (!during('A5_24', 'A5_28B')(state)) return null;
  switch (id) {
    case 'interview': return q === 'A5_24B' ? { script: 'a5_24_interview' } : null;
    case 'counter':
      if (q === 'A5_28B') return { script: 'a5_28_report' };
      return null;
    case 'coco': return { script: state.flags.coco_told ? 'coco_after' : 'a5_26_coco' };
    case 'eric': return { script: 'a5_eric_meet' };
    case 'fed_door': return q === 'A5_27' ? { script: 'a5_27_harlow' } : { toast: '没有预约，进不去。' };
    case 'home_door': return state.flags.doorbell_cam ? { toast: '门铃摄像头的小灯亮着。' } : { script: 'a5_doorbell' };
    case 'xiaowu': return { script: q === 'A5_28' ? 'a5_28_home' : q === 'A5_28B' ? 'a5_28_xiaowu' : 'xiaowu_daily' };
    case 'tony': return { script: 'a5_28_tony' };
    case 'home_desk': return { phoneApp: 'evidence' };
    default: return null;
  }
}

// 值为字符串：场景名，接话的人是最近说过话的 AI 角色。
// 值为 { scene, npc }：指定接话的人；npc 为 null 表示这里没有 AI 角色接话（警官、你自己的决定）。
export const CHOICE_SCENES = {
  a5_24_after: { scene: 'inner', npc: null },
  a5_25_threat: 'a5_threat',
  a5_26_coco: 'coco_shop',
  a5_26_crisis: 'a3_qingqing',
  a5_eric_meet: 'a5_eric',
  a5_eric_twist: 'a5_eric',
  a5_28_xiaowu: 'a5_xiaowu',
  a5_doorbell: { scene: 'inner', npc: null },
};

export const STANCES = {};

// 第五幕开始时，从前面几幕“自动存下来”的东西变成了证据（原作：前期行为在后期意外地成了证据）
const ARCHIVE = { do: s => {
  const add = id => { if (!s.evidence.includes(id)) s.evidence.push(id); };
  add('our_chats');
  if (s.flags.a4_called) add('call_log');
  if (s.transfers.length) add('transfer_records');
  if (s.flags.got_bag) add('your_things');
} };

// 冯逸：给他能自己核实的东西，攒够两样他就动摇
const ericShaken = s => ['eric_v_file', 'eric_v_inmate', 'eric_v_police'].filter(f => s.flags[f]).length >= 2;

export const SCRIPTS = {
  // MQ-24 一百万美元的珠宝 ───────────────
  a5_24_police: [
    say('police', '陈先生吗？这里是湾城警察分局。去年12月4日，你是不是去过许嘉晴的住所？'),
    say('police', '请你明天来局里做个笔录。'),
    { fx: { quest: 'A5_24B', unlock: 'police_station', phone: { pending: null } } },
  ],

  a5_24_interview: [
    N('询问室。两位警官：Ramirez 和 Kim。'),
    say('ramirez', s => (s.flags.lie_judged
      ? '许嘉晴女士报案：去年12月4日，她的司机非法进入她的住所，偷走了价值一百万美元的珠宝。房子里有你的指纹，客厅的监控拍到你拎着一个包离开。'
      : '许嘉晴女士报案：去年12月4日，她的司机非法进入她的住所，偷走了价值一百万美元的珠宝。客厅的监控拍到你拎着一个包离开。')),
    { fx: { claim: 'jewelry', version: ['chen_identity', '对警察', '“我的司机。”'] } },
    say('v_detective', '12月4日。她叫你去的。她出门了三个小时。你拎着包从客厅走了出去。'),
    say('v_detective', '你手里有什么，都拿出来。'),
    ARCHIVE,
    { open: 'defense' },
  ],

  a5_24_after: [
    { if: has('defense_passed'), goto: 'good' },
    say('kim', '我们会继续调查。在此之前，请你不要联系许女士。'),
    N('你走出警局，腿是软的。'),
    { goto: 'next' },
    { label: 'good' },
    N('Ramirez 看完转账记录，笑了笑。'),
    say('ramirez', '我们会请许女士提供珠宝的购买记录。如果这个报案是虚构的，你可以通过法院追究。'),
    { choice: [
      { t: '我要追究。', on: [{ act: 'agree' }, { act: 'pressure' }, { topic: '追究她虚假报案' }], fx: { flags: { pursue_report: true }, stats: { clarity: 5 } }, goto: 'next' },
      { t: '……应该只是误会吧。', on: [{ act: 'refuse' }, { act: 'support' }, { topic: '算了，只是误会' }], fx: { flags: { let_go: true }, stats: { doubt: 3 } }, goto: 'soft' },
    ] },
    { label: 'soft' },
    say('v_mediator', '各让一步吧。何必闹僵。'),
    say('v_mother', '默默……'),
    { label: 'next' },
    { fx: { quest: 'A5_25', phone: { pending: 'a5_25_threat', from: 'unknown' }, note: '1月，她报警说你偷了一百万美元的珠宝。你在警局做了笔录。' } },
  ],

  // MQ-25 陌生号码 ───────────────────────
  a5_25_threat: [
    say('eric', '你就是陈默？你竟然敢偷晴晴的珠宝？'),
    say('eric', '我告诉你，我在这里势力很大。你死定了！'),
    { fx: { version: ['chen_identity', '对冯逸', '“疯子、渣男，骗了我几百万。”'] } },
    say('v_detective', '健身房镜子前自拍的那个人？她手机里的“老公”。'),
    { choice: [
      { t: '你算老几？有本事你过来！', on: [{ act: 'pressure' }, { act: 'challenge' }], fx: { flags: { eric_hostile: true } }, goto: 'fight' },
      { t: '你到底知不知道她身上发生过什么事情？', on: { topic: '问他知不知道她身上发生过什么' }, fx: { flags: { eric_warned: true } }, goto: 'warn' },
      { t: '你去查查联邦法院的公开卷宗，再来跟我说话。', on: [{ topic: '给他能自己去核实的信息' }, { act: 'propose' }], fx: { flags: { eric_warned: true, eric_called: true } }, goto: 'calm' },
    ] },
    { label: 'fight' },
    N('你们隔着电话对骂了十分钟。他挂了。'),
    { fx: { flags: { eric_called: true } } },
    { goto: 'end' },
    { label: 'warn' },
    say('eric', '……什么意思？你少在这里装神弄鬼。'),
    N('他挂了电话。可你听得出来，他停顿了一下。'),
    { fx: { flags: { eric_called: true } } },
    { goto: 'end' },
    { label: 'calm' },
    say('eric', '卷宗？什么卷宗？……你等着。'),
    { label: 'end' },
    say('v_detective', '他常去的会所健身房。你知道在哪儿。'),
    { fx: { quest: 'A5_26', unlock: 'club_gym', note: '一个叫冯逸的人打来电话威胁你。他是她手机里的“老公”。' } },
    { if: s => !s.phone.contacts.includes('coco'), goto: 'anon' },
    { end: true },
    { label: 'anon' },
    { fx: { phone: { pending: 'a5_26_anon', from: 'unknown' } } },
  ],

  // MQ-26 幸好你没有跟她结婚 ─────────────
  // SQ-11：Coco 的房东要涨租，你帮她谈；帮过她，她才肯说
  a5_26_coco: [
    say('coco', '哟，这不是晴晴那个……“被她养的男人”吗？', 'neutral'),
    say('coco', '我没空跟你聊她。房东要给我涨三成房租，我烦都烦死了。'),
    say('v_mediator', '这个你在行。'),
    { choice: [
      { t: '我帮你跟房东谈谈。', on: [{ act: 'agree' }, { act: 'support' }, { act: 'propose' }, { topic: '帮她跟房东谈房租' }], goto: 'help' },
      { t: '我就问几句晴晴的事。', on: [{ act: 'ask' }, { act: 'challenge' }, { act: 'pressure' }], goto: 'cold' },
    ] },
    { label: 'cold' },
    say('coco', '那你请回吧。'),
    { end: true },
    { label: 'help' },
    N('你给房东打了个电话。你说她在这条街上开了七年店，从没拖过一天房租；涨三成，她只能搬走，铺子空着谁也没好处。'),
    { check: 'cred', min: 25, goto: 'deal' },
    N('房东说考虑考虑。最后只肯少涨一点。'),
    say('coco', '……行吧，好歹你帮我说话了。'),
    { goto: 'tell' },
    { label: 'deal' },
    N('房东松口了：只涨一成。'),
    say('coco', '可以啊你！难怪华埠的人都找你当和事佬。'),
    { fx: { stats: { cred: 5 } } },
    { label: 'tell' },
    say('coco', '晴晴的事……我跟你说了，你别说是我说的。'),
    say('coco', '幸好你当初没有跟她结婚。'),
    say('coco', '她跟我说过，结婚以后，就故意惹你、逼你动手。只要你动了手，她就能以家暴受害者的身份，自己去申请身份。'),
    { fx: { evidence: 'coco_testimony', flags: { coco_told: true, vawa_known: true } } },
    { call: 'a5_26_truth' },
  ],

  // 没有 Coco 的号码：降级为一条匿名留言
  a5_26_anon: [
    say('unknown', '我是晴晴身边的一个朋友。你不认识我。'),
    say('unknown', '有件事你应该知道：她说过，结婚以后就故意激怒对方，逼对方动手，再以家暴受害者的身份去申请身份。'),
    say('unknown', '幸好你当初没有跟她结婚。别回这个号码。'),
    { fx: { flags: { vawa_known: true, vawa_anon: true }, phone: { pending: null } } },
    { call: 'a5_26_truth' },
  ],

  a5_26_truth: [
    say('v_detective', '有一条为家暴受害者设立的、可以独立申请身份的路径。'),
    { if: has('vawa_clue1'), goto: 'firm' },
    { goto: 'pull' },
    { label: 'firm' },
    say('v_detective', '“投行”大楼十二层，那家移民律所。她下来时手里的文件夹。'),
    { label: 'pull' },
    { if: s => s.pressure.length >= 3, goto: 'loop' },
    { goto: 'married' },
    { label: 'loop' },
    N(s => `你回头翻那段日子：赌场的三个晚上、工具的事、阿珍那通电话……${s.pressure.length} 次，她把一件事翻来覆去地吵，逼你低头或者发火。`),
    say('v_detective', '她一直在刺激你。'),
    { label: 'married' },
    { if: has('married'), goto: 'crisis' },
    { goto: 'setup' },
    { label: 'crisis' },
    { call: 'a5_26_crisis' },
    { label: 'setup' },
    N('12月4日叫你去搬家、借故出门三个小时、你的指纹、客厅的监控、你拎着包出门……'),
    say('v_detective', '会不会从一开始，就是一个局？'),
    { fx: { evidence: 'inference_setup', quest: 'A5_27', unlock: 'financial_district', note: '她跟身边的人说过：结婚后逼对方动手，再以家暴受害者的身份申请身份。' } },
  ],

  // 已婚：危机关卡（E4 的入口）
  a5_26_crisis: [
    N('那天晚上，她出现在你家门口。'),
    say('qingqing', '你去警局说我什么了？你说啊！', 'angry'),
    say('qingqing', '你打我啊！你有本事就打我啊！', 'angry'),
    say('v_detective', '她在等你动手。'),
    { choice: [
      { t: '（扬起手）', on: [{ topic: '动手打她' }], fx: { flags: { hit_her: true } }, goto: 'hit' },
      { t: '（退后一步，拿出手机开始录像）', on: '*', fx: { flags: { crisis_held: true }, stats: { clarity: 5 } }, goto: 'held' },
    ] },
    { label: 'hit' },
    N('你的手落了下去。她捂着脸，笑了一下，转身就走。'),
    say('v_mother', '默默——'),
    { end: true },
    { label: 'held' },
    N('你退后一步，举起手机。她看着镜头，愣了几秒，转身走了。'),
  ],

  coco_after: [
    say('coco', '还有事？我可什么都没跟你说过啊。'),
    { chat: { npc: 'coco', scene: 'coco_shop' } },
  ],

  // SQ-10 下一个陈默：在会所找冯逸谈
  a5_eric_meet: [
    N('会所的健身房。他在跑步机上看见你，脸一下子沉了。'),
    say('eric', '偷珠宝的司机，还敢来找我？'),
    { label: 'menu' },
    { choice: [
      { t: '联邦法院的公开卷宗，案号我给你，你自己去查。', on: [{ topic: '让他自己去查法院卷宗' }], when: s => s.flags.read_file && !s.flags.eric_v_file, fx: { flags: { eric_v_file: true } }, goto: 'file' },
      { t: '联邦监狱的网站上能查到秦岳，你自己查。', on: [{ topic: '让他查联邦监狱的在押记录' }], when: s => !s.flags.eric_v_inmate, fx: { flags: { eric_v_inmate: true } }, goto: 'inmate' },
      { t: '你可以去问问警察，珠宝的案子他们怎么看。', on: [{ topic: '让他去问警察对珠宝案的态度' }], when: s => s.flags.defense_passed && !s.flags.eric_v_police, fx: { flags: { eric_v_police: true } }, goto: 'police' },
      { t: '她就是个骗子！', on: [{ topic: '骂她是骗子' }], fx: { flags: { eric_backfire: true } }, goto: 'backfire' },
      { t: '我先走了。', on: { act: 'leave' }, goto: 'bye' },
    ] },
    { label: 'file' },
    say('eric', '……卷宗。行，我看看你能编出什么来。'),
    { goto: 'check' },
    { label: 'inmate' },
    say('eric', '她说她前男友早就判完了……我查查。'),
    { goto: 'check' },
    { label: 'police' },
    say('eric', '警察那边……她说警察站在她那边。'),
    { goto: 'check' },
    { label: 'backfire' },
    say('eric', '你看，她说得一点没错，你就是个疯子。', 'neutral'),
    { fx: { flags: { eric_met: true } } },
    { end: true },
    { label: 'check' },
    { if: ericShaken, goto: 'shaken' },
    { goto: 'menu' },
    { label: 'shaken' },
    say('eric', '……我会自己去查。别再来找我。'),
    N('他下了跑步机，头也没回。'),
    { fx: { flags: { eric_met: true, eric_shaken: true }, phone: { pending: 'a5_eric_twist', from: 'eric' } } },
    { end: true },
    { label: 'bye' },
  ],

  a5_eric_twist: [
    say('eric', '我查了。……可她说你会这么说。她说你疯了，说你会拿那些东西来骗我。'),
    say('v_detective', '她提前给他打了预防针。你需要一样她没法预先解释的东西。'),
    { choice: [
      { t: '（把“星河妈”发给鹿鸣的那条邀约截图发给他）', on: [{ topic: '给他看那张邀约截图' }, { act: 'propose' }], when: s => s.evidence.includes('k_chat'), fx: { flags: { eric_clear: true } }, goto: 'clear' },
      { t: '你自己判断吧。', on: '*', fx: { flags: { eric_half: true } }, goto: 'half' },
    ] },
    { label: 'clear' },
    N('很久之后，他回了一句：“她妈妈也被软禁了吗？”'),
    say('eric', '……我会留着这些。'),
    { end: true },
    { label: 'half' },
    say('eric', '……我会留个心眼。'),
  ],

  // SQ-14 邻居守望：门铃摄像头
  a5_doorbell: [
    N('门口光秃秃的，连个门铃摄像头都没有。'),
    say('v_detective', '她已经报过一次假警了。下一次，她会不会直接找上门？'),
    { choice: [
      { t: '（装一个门铃摄像头，再拉邻居们建个群）', on: [{ act: 'agree' }, { act: 'propose' }, { topic: '装门铃摄像头' }], fx: { flags: { doorbell_cam: true } }, goto: 'yes' },
      { t: '（算了）', on: '*', goto: 'no' },
    ] },
    { label: 'yes' },
    N('你装好了摄像头。邻居 Tony 拍拍你的肩：“他们再敢过来，我们立刻通知你。”'),
    { label: 'no' },
  ],

  xiaowu_daily: [
    say('xiaowu', '陈哥……最近是不是出什么事了？'),
    { chat: { npc: 'xiaowu', scene: 'a5_xiaowu' } },
  ],

  // MQ-27 这里是美国 ─────────────────────
  a5_27_harlow: [
    N('你打了卷宗上那位探员的电话。回电没有来电显示，约在联邦大楼见面。'),
    say('harlow', '我是 Harlow。你说你有关于 QIN 的信息？'),
    say('harlow', '他现在在监狱里，没有办法再伤害你。这里是美国，不是南屿。'),
    { if: has('rico_contacted'), goto: 'rico' },
    { goto: 'luna' },
    { label: 'rico' },
    say('harlow', '还有：你联系过一个叫 Rico 的人。不要再做这种事。'),
    N('她在本子上写了一行字。'),
    { label: 'luna' },
    say('chen', '我想说的是……一起网红失踪案，那个博主——'),
    say('harlow', '鹿鸣？'),
    N('你还没说名字，她就先说了出来。'),
    say('harlow', '那不是我们的管辖。'),
    say('chen', '那许嘉晴就可以一直在美国自由活动吗？'),
    say('harlow', '没有证据证明她在美国违法，我们不能采取行动。'),
    say('v_detective', '没有人会来“抓住”她。……那你要把真相交给谁？保护谁？'),
    { fx: { flags: { met_harlow: true }, quest: 'A5_28', note: '探员说：“这里是美国，不是南屿。”“没有证据证明她在美国违法，我们不能采取行动。”' } },
  ],

  // MQ-28 上门 ───────────────────────────
  a5_28_home: [
    N('四月初。你外出回家，房客小吴一脸煞白地等在客厅。'),
    say('xiaowu', '陈哥，今天有个女的上门找你，好凶，还说要报警。'),
    say('xiaowu', '她带着一个男的，在门外喊：“陈默诈骗了我几百万美金！”我……我开车跑了。'),
    { fx: { claim: 'chen_scam', quest: 'A5_28B' } },
    { if: has('doorbell_cam'), goto: 'cam' },
    { end: true },
    { label: 'cam' },
    N('门铃摄像头录下了全程。'),
    { fx: { evidence: 'door_footage' } },
  ],

  // SQ-20 小吴不敢说
  a5_28_xiaowu: [
    say('xiaowu', '陈哥，你别让我作证……我没身份，警察一来，我就完了。'),
    { choice: [
      { t: '你必须去作证！', on: [{ act: 'pressure' }, { act: 'challenge' }], fx: { flags: { xiaowu_forced: true } }, goto: 'forced' },
      { t: '没事，我不勉强你。', on: [{ act: 'support' }, { act: 'refuse' }, { topic: '不勉强他' }], fx: { flags: { xiaowu_spared: true } }, goto: 'spared' },
      { t: '我陪你去找律师问问，作证是不是有保护。翻译我来找。', on: [{ topic: '陪他找律师问证人保护' }, { act: 'propose' }], fx: { flags: { xiaowu_statement: true }, evidence: 'xiaowu_statement' }, goto: 'help' },
    ] },
    { label: 'forced' },
    N('第二天，小吴搬走了，只留下一张字条。'),
    { goto: 'done' },
    { label: 'spared' },
    say('xiaowu', '……对不起，陈哥。'),
    { goto: 'done' },
    { label: 'help' },
    N('移民律师说，作证不等于自首；有些情况下，证人也能得到保护。具体的，要看个案。'),
    say('xiaowu', '……好。那我写下来。我只写我看到的。'),
    { label: 'done' },
    { fx: { flags: { xiaowu_done: true } } },
    { call: 'a5_28_check' },
  ],

  a5_28_tony: [
    say('tony', 'Hey, Chen. 那个女的喊得整条街都听见了。'),
    say('tony', '她冲着你家门喊，可眼睛一直看着她旁边那个男的。像是喊给他听的。'),
    say('tony', '他们再敢过来，我们立刻通知你，帮你报警！'),
    { fx: { flags: { tony_told: true } } },
    { call: 'a5_28_check' },
  ],

  a5_28_report: [
    N('报案柜台。'),
    say('kim', '那天下午确实有人报警，我们去了两辆车。具体内容不能透露。'),
    { fx: { flags: { police_asked: true } } },
    { call: 'a5_28_check' },
  ],

  a5_28_check: [
    { if: s => s.flags.xiaowu_done && (s.flags.tony_told || s.flags.police_asked), goto: 'insight' },
    { end: true },
    { label: 'insight' },
    { check: 'clarity', min: 50, goto: 'see' },
    say('v_detective', '她为什么要带一个男人来，冲着空房子喊？'),
    { goto: 'end' },
    { label: 'see' },
    say('v_detective', '她喊的话，是喊给身边那个男人听的：“你看，我没骗你，真的有陈默这个人。”'),
    say('v_detective', '对着新观众，再演一遍。'),
    { fx: { evidence: 'pattern_audience' } },
    { label: 'end' },
    { fx: { quest: 'F_29', actBreak: 5, phone: { pending: 'f_29_invite', from: 'qingqing' }, unblock: 'qingqing', unlock: 'seaside_restaurant', note: '第五幕结束。她带着冯逸上门大闹：“陈默诈骗了我几百万美金！”' } },
  ],
};
