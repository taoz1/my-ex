// 序章 + 第一幕剧情：NPC 站位、互动规则、剧情脚本。
// 文本依据 docs/story/05_主线剧情.md，人名地名已虚构化。

const say = (s, t, e) => ({ s, t, e });
const N = t => say('narrator', t);
const has = flag => s => !!s.flags[flag];
const act1Ready = s => s.stories.length >= 3 && !!s.flags.exchange_decided;

// ── NPC 站位 ────────────────────────────────────────────────
const PLACEMENTS = {
  chinatown_street: [
    { id: 'uncle', label: '街坊阿伯', x: 230, y: 395, color: '#8c7d6b' },
    { id: 'waiter', label: '茶餐厅伙计', x: 420, y: 395, color: '#a36b52', when: s => s.quest !== 'P0' },
  ],
  rental_shop: [
    // 序章：玩家进门后，老邝主动走过来诉苦
    { id: 'laokuang', label: '老邝', x: 650, y: 380, approach: { when: s => s.quest === 'P0', script: 'p0_arrive', delay: 0.6 } },
    { id: 'qingqing', label: '那个女人', x: 950, y: 365, when: s => s.quest === 'P0' || s.quest === 'P1' },
  ],
  qingqing_house: [
    { id: 'qingqing', label: '晴晴', x: 580, y: 720, when: s => ['A1_03', 'A1_05', 'A1_06', 'A1_08', 'A1_09', 'END1'].includes(s.quest) },
    { id: 'fangjie', label: '芳姐', x: 860, y: 700, when: s => s.quest !== 'A1_02' },
  ],
  mall: [
    { id: 'qingqing', label: '晴晴', x: 1080, y: 560, when: s => s.quest === 'A1_02' || (s.quest === 'A1_08' && !s.stories.includes('mall')) },
  ],
  japantown: [
    { id: 'qingqing', label: '晴晴', x: 760, y: 690, when: s => s.quest === 'A1_03B' },
  ],
  parents_home: [
    { id: 'chen_mother', label: '妈妈', x: 470, y: 450 },
    { id: 'qingqing', label: '晴晴', x: 905, y: 470, when: s => s.quest === 'A1_07' },
  ],
  golf_range: [
    { id: 'qingqing', label: '晴晴', x: 560, y: 420, when: s => s.quest === 'A1_08' && !s.stories.includes('golf') },
  ],
  afternoon_tea: [
    { id: 'qingqing', label: '晴晴', x: 540, y: 400, when: s => s.quest === 'A1_08' && !s.stories.includes('tea') },
  ],
};

// state.npcPos 里是本次进图后走动过的 NPC 的位置（离开地图时清空）
export function npcsOnMap(state) {
  return (PLACEMENTS[state.map] || [])
    .filter(n => !n.when || n.when(state))
    .map(n => (state.npcPos?.[n.id] ? { ...n, ...state.npcPos[n.id] } : n));
}

// 当前地图上要主动找玩家搭话的 NPC（PLACEMENTS 里带 approach 且条件满足）
export function approachingNpc(state) {
  return npcsOnMap(state).find(n => n.approach && n.approach.when(state)) || null;
}

// 序章调解：玩家说出的任何退款数额，都落进这四档之一（押金1500：老邝至少要扣500，她至少要拿回1000）
const offers = when => [
  { t: '提出方案：押金1500全退给她。', when, fx: { flags: { p1_offer: 'full' } }, goto: 'propose' },
  { t: '提出方案：退她1000以上、不到1500（比如1200），老邝扣不到500。', when, fx: { flags: { p1_offer: 'more' } }, goto: 'propose' },
  { t: '提出方案：老邝扣500，退她1000。', when, fx: { flags: { p1_offer: 'fair' } }, goto: 'propose' },
  { t: '提出方案：退她不到1000（比如750、500），老邝扣500以上。', when, fx: { flags: { p1_offer: 'less' } }, goto: 'propose' },
];

// ── 互动规则 ────────────────────────────────────────────────
// 返回 { script } / { menu: 'travel' } / { travel, script? } / { toast }
export function interaction(state, target) {
  const q = state.quest;
  const m = state.map;
  switch (target.id) {
    case 'door_rental':
      return { travel: { map: 'rental_shop' } };
    case 'door_street':
      return { travel: { map: 'chinatown_street', x: 683, y: 400 } };
    case 'car':
    case 'door_out':
      if (q === 'P0' || q === 'P1') return { toast: '先把老邝的事处理完。' };
      return { menu: 'travel' };
    case 'receipt_desk': return { script: 'receipt' };
    case 'door_meiyi': return { script: 'meiyi_closed' };
    case 'master_door': return { script: 'master_locked' };
    case 'camera': return { script: 'camera_look' };
    case 'photos': return { script: 'family_photos' };
    case 'guest_bed': return { script: q === 'A1_06' ? 'a1_06_tattoo' : 'bed_idle' };
    case 'uncle': return { script: 'passerby_uncle' };
    case 'waiter': return { script: 'passerby_waiter' };
    case 'laokuang': return { script: q === 'P1' ? 'p1_kuang' : q === 'P0' ? 'p0_arrive' : 'kuang_after' };
    case 'fangjie': return { script: 'fang_talk' };
    case 'chen_mother': return { script: q === 'A1_07' ? 'a1_07_dinner' : 'mother_later' };
    case 'qingqing':
      if (m === 'rental_shop') return { script: q === 'P0' ? 'p0_qing' : 'p1_qing' };
      if (m === 'japantown') return { script: 'a1_03_sakura' };
      if (m === 'parents_home') return { script: 'qing_dinner' };
      if (m === 'golf_range') return { script: 'a1_08_golf' };
      if (m === 'afternoon_tea') return { script: 'a1_08_tea' };
      if (m === 'mall') return { script: q === 'A1_02' ? 'a1_02_mall' : 'a1_08_mall2' };
      if (m === 'qingqing_house') {
        if (q === 'A1_03') return { script: 'a1_03_eve' };
        if (q === 'A1_05') return { script: 'a1_05_business' };
        if (q === 'A1_09') return { script: 'a1_09_page' };
        if (q === 'A1_08' && state.stories.length >= 1 && !state.flags.exchange_decided) return { script: 'a1_08_exchange' };
      }
      return { script: 'qing_daily' };
    default:
      return { toast: '这里没什么特别的。' };
  }
}

// 剧情选项处玩家自由输入时，交给 AI 判断走向所用的场景（见 backend/npc-cards.mjs 的 SCENES）
export const CHOICE_SCENES = {
  p1_kuang: 'p1_mediation',
  p1_qing: 'p1_mediation',
  p1_propose: 'p1_mediation',
  kuang_after: 'kuang_daily',
  a1_01_job: 'a1_job_wechat',
  a1_04_movein: 'a1_job_wechat',
  a1_02_mall: 'a1_daily',
  a1_03_sakura: 'a1_daily',
  a1_06_tattoo: 'a1_daily',
  a1_08_golf: 'a1_daily',
  a1_08_exchange: 'a1_daily',
  a1_09_page: 'a1_daily',
  a1_07_dinner: 'a1_parents',
  fang_talk: 'a1_cohabit',
};

// ── 剧情脚本 ────────────────────────────────────────────────
export const SCRIPTS = {
  // 序章 ───────────────────────────────
  // 老邝看见陈默进门，自己凑过来（见 PLACEMENTS 的 approach）
  p0_arrive: [
    say('laokuang', '老陈！你可算来了。她要报警！我这车都挂在我个人名下，你知道的……', 'panic'),
    say('laokuang', '她租我那辆奔驰，月租1500，租一年。开了半个月，嫌车旧、档次低，要退车。提前毁约，押金1500我肯定不退啊！'),
    { fx: { quest: 'P1', note: '老邝租车押金纠纷：月租1500，押金1500，她开了半个月要退车。老邝要全扣，她要全退，还威胁报警。' } },
  ],

  p0_qing: [
    say('qingqing', '看什么看？老邝叫来的？', 'cold'),
  ],

  receipt: [
    N('桌上压着一张手写收据：月租1500美元，押金1500美元，租期一年。签名一栏，她签的是英文名 Vivian。'),
    { fx: { evidence: 'deposit_receipt' } },
  ],

  p1_kuang: [
    say('laokuang', '老陈，你说句公道话。规矩就是规矩。'),
    { label: 'menu' },
    { choice: [
      { t: '老邝，你心里最低能接受扣多少？', goto: 'bottom' },
      { t: '她说要报警，你怕不怕？', goto: 'police' },
      ...offers(s => s.flags.p1_talked_q),
      { t: '我先去问问她。', goto: 'bye' },
    ] },
    { label: 'bottom' },
    say('laokuang', '至少扣500。车给她开了半个月，清洗、保养、空着找下家，哪样不要钱？少于500，我白折腾。'),
    say('v_mediator', '他的底线：至少留下500。'),
    { fx: { flags: { k_bottom: true, p1_talked_k: true } } },
    { goto: 'menu' },
    { label: 'police' },
    say('laokuang', '怕啊！我一句英文都不会，警察来了我说什么？……但钱的事，我不能吃亏。', 'panic'),
    say('v_detective', '他嘴硬，其实比谁都想赶紧了事。'),
    { fx: { flags: { p1_talked_k: true } } },
    { goto: 'menu' },
    { label: 'propose' },
    { call: 'p1_propose' },
    { label: 'bye' },
    { fx: { flags: { p1_talked_k: true } } },
    { end: true },
  ],

  p1_qing: [
    { if: has('p1_met_q'), goto: 'again' },
    N('她戴着一副名牌墨镜，脸上带着怒气。'),
    say('v_detective', '她的气场和你在华人圈里见过的女人都不一样。举手投足，都带着一股刻意端出来的架子。'),
    say('qingqing', '你就是他找来的人？你找谁来都没用。不退钱，我就报警。', 'cold'),
    { fx: { flags: { p1_met_q: true } } },
    { goto: 'menu' },
    { label: 'again' },
    say('qingqing', '又怎么了？', 'cold'),
    { label: 'menu' },
    { choice: [
      { t: '你真正在意的是什么？', goto: 'care' },
      { t: '车是旧了点，但提前退车，扣一点押金也是行规。', goto: 'rule' },
      { t: '能不能把墨镜摘下来说话？', goto: 'glasses', when: s => !s.flags.p1_glasses },
      ...offers(s => s.flags.p1_talked_k),
      { t: '我先去跟老邝聊聊。', goto: 'bye' },
    ] },
    { label: 'care' },
    say('qingqing', '不是钱的事。他看我一个女人，觉得好欺负。我来美国这么久，什么样的人没见过？', 'wronged'),
    say('qingqing', '全扣？做梦。至少把一千还给我——这是面子问题。'),
    say('v_mediator', '她的底线：至少拿回1000，而且不能显得是她输了。'),
    { fx: { flags: { q_bottom: true, p1_talked_q: true } } },
    { goto: 'menu' },
    { label: 'rule' },
    say('qingqing', '行规？他那是挂在个人名下的车，算正规生意吗？要不要我报警让人查查？', 'angry'),
    say('v_detective', '她一眼就找到了对方的软肋。'),
    { fx: { flags: { p1_talked_q: true } } },
    { goto: 'menu' },
    { label: 'glasses' },
    N('她把墨镜推到头顶，打量了你一眼。'),
    say('qingqing', '你这人倒是挺有礼貌。'),
    { fx: { flags: { p1_glasses: true, p1_talked_q: true }, stats: { attachment: 2 }, evidence: 'designer_sunglasses' } },
    { goto: 'menu' },
    { label: 'propose' },
    { call: 'p1_propose' },
    { label: 'bye' },
    { fx: { flags: { p1_talked_q: true } } },
    { end: true },
  ],

  // 玩家报出的方案由 offers() 里的选项记在 flags.p1_offer 上
  p1_propose: [
    N('你把两人叫到茶几边。押金一共1500美元。'),
    { if: s => s.flags.p1_offer === 'fair', goto: 'ok' },
    { if: s => s.flags.p1_offer === 'less', goto: 'qing_no' },
    { if: s => s.flags.p1_offer === 'more', goto: 'kuang_more' },
    { label: 'kuang_no' },
    say('laokuang', '全退？那我不是白干了？老陈你到底帮谁的！', 'panic'),
    { fx: { stats: { cred: -5 } } },
    N('谈崩了。再想想。'),
    { end: true },
    { label: 'kuang_more' },
    say('qingqing', '这还差不多。', 'cold'),
    say('laokuang', '我什么时候答应退这么多了？扣不到五百，这车我白给她开了半个月？老陈你到底帮谁的！', 'panic'),
    { fx: { stats: { cred: -5 } } },
    N('谈崩了。再想想。'),
    { end: true },
    { label: 'qing_no' },
    say('qingqing', '就退这么点？我现在就报警。', 'angry'),
    say('laokuang', '别别别……', 'panic'),
    { fx: { stats: { cred: -5 } } },
    N('谈崩了。再想想。'),
    { end: true },
    { label: 'ok' },
    say('laokuang', '行吧……扣500，就当交个朋友。'),
    say('qingqing', '哼。看在你的面子上。'),
    { if: s => s.flags.k_bottom && s.flags.q_bottom, goto: 'clean' },
    { fx: { stats: { cred: 5 } } },
    { goto: 'wechat' },
    { label: 'clean' },
    say('v_mediator', '两边的底线你都摸清了，方案正好卡在中间。'),
    { fx: { stats: { cred: 10, clarity: 3 } } },
    { label: 'wechat' },
    N('老邝数出十张百元大钞。临走前，她主动走到你面前。'),
    say('qingqing', '我来美国这么久，见过不少人，就觉得你这个人比较有礼貌，还有点素质。这样吧，咱俩加个微信，交个朋友。', 'sweet'),
    { choice: [
      { t: '好啊。', fx: { stats: { attachment: 5 } } },
      { t: '（犹豫了一下）好吧。', fx: { stats: { clarity: 2 } } },
    ] },
    { fx: {
      flags: { prologue_done: true },
      quest: 'A1_01',
      phone: { pending: 'a1_01_job' },
      note: '你加上了她的微信。老邝说，她是老温在牢里认识的“狱友老婆”，那个狱友“来头不小”。',
    } },
    { end: true },
  ],

  kuang_after: [
    say('laokuang', '老陈，那天多亏你。'),
    { if: s => s.quest === 'A1_01' || s.quest === 'A1_02', goto: 'gossip' },
    { chat: { npc: 'laokuang', scene: 'kuang_daily' } },
    { label: 'gossip' },
    say('laokuang', '那女的叫晴晴，是老温在牢里认识的哥们的老婆。听说那人是个红通犯，来头不小。'),
    { choice: [
      { t: '在美国你就别想这些有的没的，红通到这边被抓的人不少，哪还有什么能耐。' },
      { t: '红通犯？犯的什么事？' },
    ] },
    say('laokuang', '谁知道呢。反正她有钱，以后多照应照应，总没坏处。'),
    { chat: { npc: 'laokuang', scene: 'kuang_daily' } },
  ],

  // 第一幕 ─────────────────────────────
  a1_01_job: [
    say('qingqing', '在吗？'),
    say('qingqing', '你知道菠菜是什么吗？'),
    { choice: [{ t: '什么意思？' }, { t: '不知道。' }] },
    say('qingqing', '就是博彩。'),
    say('qingqing', '我男朋友以前做博彩生意，在南屿有个赌场，想找人过去帮忙打理，月薪五万美元。'),
    say('qingqing', '我一个女人，不方便出面，镇不住底下的人。你就装作是我男友的小弟或者代理人，过去交接业务就行。你是美国公民，不用怕，那边很安全。'),
    { fx: { claim: 'casino_job' } },
    say('qingqing', '对了，牢里那个不是我老公，是男朋友，我们没领证。他是因为“非法集资”进去的。FBI抓他的时候我也在场，警察都没带走我，说明我是清白的。'),
    { fx: { claim: ['not_married', 'financial_crime', 'innocent_present'] } },
    { choice: [
      { t: '五万美元？具体要交接什么？', goto: 'ask' },
      { t: '听起来不错，我考虑一下。', goto: 'think' },
      { t: '南屿的赌场……合法吗？', goto: 'legal' },
    ] },
    { label: 'ask' },
    say('qingqing', '就是……管管人，看看账。具体的到时候老秦会安排。'),
    say('v_detective', '她没有回答你的问题。'),
    { fx: { stats: { clarity: 3 } } },
    { goto: 'later' },
    { label: 'think' },
    say('v_desire', '五万美元一个月。何况，她长得不错。'),
    { fx: { stats: { attachment: 3 } } },
    { goto: 'later' },
    { label: 'legal' },
    say('qingqing', '当地合法的呀，你放心。'),
    { label: 'later' },
    N('——半个月后。'),
    say('qingqing', '我想出去买点东西，但对这儿不熟，有什么好去处？', 'sweet'),
    { choice: [{ t: '西岭购物中心不错，东西全。' }] },
    say('qingqing', '这么远，我怎么过去呀？不如你开车送我，我请你吃饭。', 'sweet'),
    { fx: { quest: 'A1_02', unlock: 'mall', phone: { pending: null }, note: '她说牢里的“老秦”是男朋友，犯的是“非法集资”。她提到南屿有份月薪五万美元的赌场工作，却说不清具体做什么。' } },
    { chat: { npc: 'qingqing', scene: 'a1_job_wechat' } },
  ],

  a1_02_mall: [
    N('一路上，她讲起自己的“千金人生”。'),
    say('qingqing', '我爸是连锁五星酒店集团的董事长，我妈在国内做几家连锁医美。我第一辆车是奔驰，我爸妈买的。去英国读书嘛，就是想历练一下自己，体验生活。'),
    { fx: { claim: ['heiress', 'first_benz'], version: ['heiress', '对陈默（第一次）', '酒店集团董事长父亲、连锁医美母亲、第一辆奔驰；去英国留学是为了“历练”。'] } },
    N('她用现金买下一只包，又挑了几样东西。一趟下来，近五千美元。'),
    N('她的手机响了。她接起来，并不避着你。'),
    say('qinyue', '老婆，你在干什么？'),
    say('qingqing', '正在买东西呢……', 'sweet'),
    { choice: [
      { t: '（装作没听见）' },
      { t: '（看了她一眼）', fx: { stats: { clarity: 2 } } },
    ] },
    say('v_detective', '电话那头叫她“老婆”。'),
    N('返程路上，她半开玩笑地开口。'),
    say('qingqing', '我看你人不错，不如我跟你结婚吧。', 'sweet'),
    { choice: [
      { t: '结婚可以，除非你能让我每个月赚到五万美元。', fx: { stats: { attachment: 3 } } },
      { t: '别开玩笑了。', fx: { stats: { clarity: 2 } } },
      { t: '好啊。', fx: { stats: { attachment: 8 } }, goto: 'yes' },
    ] },
    { goto: 'next' },
    { label: 'yes' },
    say('v_desire', '她笑得真好看。'),
    { label: 'next' },
    N('三月中旬，她发来消息：想去邻市日本城看樱花节，要大清早出发。“你前一晚直接住我家吧。”'),
    { fx: { quest: 'A1_03', unlock: 'qingqing_house', note: '她在商场一趟花掉近五千美元现金。狱中的男朋友打来电话，叫她“老婆”。' } },
  ],

  a1_03_eve: [
    N('她住在一栋租来的独立屋里，三间卧室：主卧她住，一间是住家保姆芳姐的，还有一间客房。'),
    say('fangjie', '陈先生来啦？晴晴说你是她的朋友。'),
    { fx: { version: ['chen_identity', '对芳姐', '“朋友”。'] } },
    say('qingqing', '我买了烧烤，今晚就在家吃。', 'sweet'),
    N('那天夜里十一点，她走进了客房。她关了灯，一直刻意遮挡着身体。'),
    N('——第二天清晨。'),
    say('qingqing', '唉，以前浪太久了，这一次算受到教训了。找了个大哥以为可以当靠山，没想到进去了。我现在只想在美国好好过日子。'),
    say('v_desire', '她是认真的。'),
    { fx: { quest: 'A1_03B', flags: { first_night: true }, stats: { attachment: 5 }, travel: { map: 'japantown', x: 768, y: 880 } } },
  ],

  a1_03_sakura: [
    N('樱花开得正好。'),
    say('qingqing', '帮我拍张照！……哎，侧脸，侧脸好看。', 'sweet'),
    { fx: { evidence: 'sakura_polaroid' } },
    { check: 'clarity', min: 20, goto: 'notice' },
    { goto: 'talk' },
    { label: 'notice' },
    say('v_detective', '她把脸转开了。从认识到现在，她好像从没让你拍过正脸。'),
    { fx: { flags: { noticed_face: true } } },
    { label: 'talk' },
    say('qingqing', '我们俩什么时候结婚啊？', 'sweet'),
    { choice: [
      { t: '你答应我的事（南屿那份工作）都还没做到哦。', fx: { stats: { attachment: 2 } } },
      { t: '认真的？我们才认识一个月。', fx: { stats: { clarity: 4, attachment: -2 } } },
      { t: '那就结吧。', fx: { stats: { attachment: 10 }, flags: { said_yes_marry: true } } },
    ] },
    say('qingqing', '你要是能真心待我……', 'lookdown'),
    N('看完樱花，你开车回到自己的住处。'),
    { fx: { quest: 'A1_04', phone: { pending: 'a1_04_movein' }, travel: { map: 'chinatown_street', x: 300, y: 545 } } },
  ],

  a1_04_movein: [
    say('qingqing', '到家了吗？', 'sweet'),
    say('qingqing', '我不喜欢异地恋。', 'sweet'),
    { choice: [{ t: '我们车程也就四五十分钟，这算哪门子异地？' }] },
    say('qingqing', '我发现自己离不开你了，怎么办？你搬过来跟我住吧。', 'sweet'),
    { choice: [
      { t: '好，我收拾一下东西。', fx: { flags: { moved_in: true }, stats: { attachment: 8 }, version: ['chen_identity', '对外人', '“我的专职司机。”'] } },
      { t: '先不急，我常过去就是了。', fx: { stats: { clarity: 3, attachment: -3 } } },
    ] },
    { fx: { quest: 'A1_05', phone: { pending: null } } },
    { if: has('moved_in'), goto: 'moved' },
    N('你没有搬过去，但几乎每天都往她那儿跑。'),
    { end: true },
    { label: 'moved' },
    N('没过几天，你收拾好个人物品，正式搬进她的独立屋。对外，她介绍你是她的专职司机。'),
    { end: true },
  ],

  a1_05_business: [
    say('chen', '南屿那份工作，到底怎么样了？'),
    say('qingqing', '你急什么。我现在就问。'),
    N('她当着你的面接起监狱打来的电话，开了免提。'),
    say('qingqing', '我外面认识一个人，对南屿那个生意感兴趣，你看怎么安排？'),
    say('qinyue', '这个生意很重要。你得多考察考察这个人，晚点再说。'),
    { check: 'clarity', min: 25, goto: 'duet' },
    say('v_desire', '考察？那就好好表现。'),
    { goto: 'after' },
    { label: 'duet' },
    say('v_detective', '他们一问一答，停顿都对得上，像排练过。“那个生意”——她连赌场两个字都没提。'),
    { fx: { doubtClaim: 'casino_job', stats: { clarity: 3 } } },
    { label: 'after' },
    N('夜深了。'),
    { fx: { quest: 'A1_06' } },
  ],

  a1_06_tattoo: [
    N(s => s.flags.moved_in ? '同居后的第三次亲密。这一次，她没有遮掩。' : '那晚你又留宿在她家。这一次，她没有遮掩。'),
    N('两条大腿正面和上臂外侧，各纹着一个巨大的男性头像，一共四个。手臂上、腰上、腋窝处、脚踝上，到处是长串的英文，十几、二十处。'),
    N('其中一句：“K is my lord, and I’m the slave”。'),
    { fx: { evidence: 'tattoo_arm' } },
    say('v_detective', '脖子和手背上，有洗过纹身的疤痕。'),
    say('qingqing', '我恨死这个男人了！这些都是他逼我纹的！在英国的时候，他把我软禁起来……', 'wronged'),
    { fx: { claim: 'tattoo_forced', version: ['tattoo', '对陈默（第一次）', '被老秦在英国软禁时逼着纹的。'] } },
    { choice: [
      { t: '英国是法治国家，你为什么不报警？', goto: 'police' },
      { t: '（抱住她）都过去了。', fx: { stats: { attachment: 5 } }, goto: 'hug' },
      { t: '（沉默）', goto: 'silent' },
    ] },
    { label: 'police' },
    say('qingqing', '他身边有四个保镖、两个助理。我去学校上课，都有两个保镖跟着。我哪有机会？', 'wronged'),
    say('v_detective', '去上大学，保镖也能跟进学校？'),
    { fx: { stats: { clarity: 2 } } },
    { goto: 'anchor' },
    { label: 'hug' },
    say('v_desire', '一个男人如果真在乎一个女人，绝不会在她身上留下这种印记。'),
    { goto: 'anchor' },
    { label: 'silent' },
    say('qingqing', '你是不是嫌弃我？', 'lookdown'),
    { choice: [{ t: '不会。' }] },
    { label: 'anchor' },
    N('正常女孩不会自愿接受这样的纹身——你在心里下了结论。'),
    { fx: { anchor: 'victim', stats: { doubt: 5 } } },
    N('正是这个想法，后来干扰了你的很多判断。'),
    say('qingqing', '对了，我想见见你爸妈。', 'sweet'),
    { fx: { quest: 'A1_07', unlock: 'parents_home', note: '她身上有大面积纹身：“K is my lord, and I’m the slave”。她说是被老秦逼的。' } },
  ],

  qing_dinner: [
    say('qingqing', '阿姨做的菜太好吃了！', 'sweet'),
    N('她嘴很甜，把一桌亲戚哄得直笑。你妈妈看了你一眼。'),
  ],

  a1_07_dinner: [
    N('爸妈和亲戚们做了一大桌菜，热情地招呼她。饭后，妈妈把你叫到阳台上。'),
    say('chen_mother', '默默，这个女孩子看上去很复杂。你要多了解一下，不要这么急。'),
    { choice: [
      { t: '妈，我会注意的。', fx: { stats: { clarity: 8, attachment: -3 }, flags: { listened_mother: true } }, goto: 'listen' },
      { t: '人家才25岁，经历再复杂能有多复杂？最多谈错几段恋爱，多大的事儿？', fx: { stats: { attachment: 3, doubt: 3 } }, goto: 'brush' },
    ] },
    { label: 'listen' },
    say('chen_mother', '嗯。你从小就心软，什么事都想着两边说和。可有的事，是说和不了的。'),
    { goto: 'voice' },
    { label: 'brush' },
    say('chen_mother', '唉。你自己的事，你自己拿主意。'),
    { label: 'voice' },
    say('v_mother', '这个女孩子看上去很复杂。'),
    N('从那以后，妈妈的这句话时不时会在你耳边响起。'),
    N('同居的日子开始了。她起得很晚，吃过早午餐，就去看房、打高尔夫、做医美，下午茶非喝不可。'),
    { fx: { flags: { voice_mother: true }, quest: 'A1_08', unlock: ['golf_range', 'afternoon_tea'] } },
  ],

  mother_later: [
    say('chen_mother', '默默，最近怎么样？'),
    { chat: { npc: 'chen_mother', scene: 'a1_parents' } },
  ],

  a1_08_golf: [
    N('二十美元一桶球的练习场。她一个人打，你坐在旁边。'),
    { check: 'clarity', min: 30, goto: 'swing' },
    { goto: 'talk' },
    { label: 'swing' },
    say('v_detective', '看她的姿势和力道，就知道刚学不久。她是跟了那个男人之后，才接触到这个“圈子”的。'),
    { fx: { doubtClaim: 'heiress', stats: { clarity: 2 } } },
    { label: 'talk' },
    N('会所前台问她是不是新会员。她摘下墨镜，又讲了一遍家世。'),
    { fx: { version: ['heiress', '对会所前台', '“我爸在国内做五星酒店，我来美国就是体验生活。”'] } },
    say('qingqing', '我过生日那年，在伦敦跟同学开派对。老秦让保镖提着两大袋现金，整整五十万欧元，直接砸在我面前。'),
    { fx: { claim: 'cash_500k' } },
    say('qingqing', '还有啊，我这身纹身，每纹一处，他就给我一千万人民币。'),
    { fx: { claim: 'tattoo_paid', version: ['tattoo', '对陈默（第二次）', '每纹一处，老秦给一千万人民币补偿。'] } },
    { if: s => !!s.claims.tattoo_forced, goto: 'contra' },
    { goto: 'end' },
    { label: 'contra' },
    say('v_detective', '等等。上次她说，这些纹身是被逼着纹的。'),
    { fx: { stats: { clarity: 3 } } },
    { label: 'end' },
    { choice: [
      { t: '那你不是很有钱？', goto: 'rich' },
      { t: '（不说话）', goto: 'done' },
    ] },
    { label: 'rich' },
    say('qingqing', '那当然。我以前可是被大哥捧在手心的女人。你能和我在一起，是三生修来的福气。', 'sweet'),
    { label: 'done' },
    { fx: { story: 'golf', stats: { attachment: 1 } } },
    { call: 'a1_08_wrap' },
  ],

  a1_08_tea: [
    N('海景酒店的下午茶。你说在美国没人喝下午茶，她还真找到了好几家。'),
    say('qingqing', '老秦在英国有辆定制的劳斯莱斯。一般劳斯莱斯不就是星空顶嘛？他那辆，每次启动的时候，车顶还有一条龙划过去。'),
    { fx: { claim: 'rolls_dragon' } },
    say('qingqing', '我睡觉怕光。他的助理每天提前去酒店，用黑胶带把门缝窗缝全封死，一丝光都透不进来。'),
    { fx: { claim: 'blackout_tape' } },
    N('邻桌两位太太听得入神。她转过身，又讲起父亲的五星酒店、母亲的医美中心——比对你讲的那次还流畅。'),
    { fx: { version: ['heiress', '对邻桌太太', '“我们家当年……”五星酒店、医美中心，一字一句，像背熟的台词。'] } },
    say('v_detective', '那不是吹牛，是表演。对着每一个新观众，反复排练。'),
    { fx: { story: 'tea' } },
    { call: 'a1_08_wrap' },
  ],

  a1_08_mall2: [
    N('每隔半个月，她就要来一次商场，每次花掉四五千美元。'),
    say('qingqing', '我在英国是香奈儿、迪奥的顶级会员。每次去店里，店员都要清场，专门为我一个人服务。'),
    { fx: { claim: 'vip_member' } },
    say('qingqing', '有一年我们坐大型私人飞机去瑞士度假，为了给飞机配重，临时找了几个留学生。便宜了那几个留学生。'),
    { fx: { claim: 'jet_ballast' } },
    say('qingqing', '那个总统发币之前一年，我和老秦在英国一个私人饭局上，就提前知道了内部消息。'),
    { fx: { claim: 'coin_tip' } },
    { check: 'clarity', min: 40, goto: 'sharp' },
    say('v_mediator', '你笑着点头。何必拆穿呢。'),
    { goto: 'done' },
    { label: 'sharp' },
    say('v_detective', '如果他真这么有钱，她为什么每个月都在算房租和保姆工资？'),
    { fx: { stats: { clarity: 2 } } },
    { label: 'done' },
    { fx: { story: 'mall' } },
    { call: 'a1_08_wrap' },
  ],

  // 第一幕日常的收尾：判断是否进入第26条
  a1_08_wrap: [
    { if: act1Ready, goto: 'ready' },
    { if: s => !s.flags.exchange_decided, goto: 'hint' },
    { end: true },
    { label: 'hint' },
    N('回家的路上，她一直在看手机里的汇率。'),
    { end: true },
    { label: 'ready' },
    N('她说，回家后有样东西要给你看。'),
    { fx: { quest: 'A1_09' } },
  ],

  a1_08_exchange: [
    say('qingqing', '我在这边的美元不够花了，想把国内的人民币换一点过来。你有没有朋友在国内有银行账户？我让国内的会计把人民币转给他们，他们在这边给我美元现金。'),
    { fx: { claim: 'accountant' } },
    { choice: [
      { t: '我自己早没有国内账户了，不过可以问问老钟和麦可。', goto: 'help' },
      { t: '私下换汇不太合规，你还是找银行吧。', goto: 'refuse' },
    ] },
    { label: 'help' },
    N('从三月到五月，朋友们陆续帮她换过几次钱：人民币转进朋友的国内账户，朋友在这边把美元现金当面交给她。很多次你就在现场。'),
    { fx: { flags: { exchange_helped: true, exchange_decided: true }, evidence: 'cash_envelope', stats: { attachment: 3 } } },
    say('v_mediator', '朋友之间帮个忙而已。'),
    { goto: 'wrap' },
    { label: 'refuse' },
    say('qingqing', '行吧，我找别人。', 'cold'),
    { fx: { flags: { exchange_refused: true, exchange_decided: true }, stats: { clarity: 4, attachment: -4 } } },
    say('v_detective', '她后来果然找到了别人。你不知道是谁。'),
    { label: 'wrap' },
    { call: 'a1_08_wrap' },
  ],

  qing_daily: [
    say('qingqing', s => s.quest === 'A1_08' ? '今天去哪儿？高尔夫，还是下午茶？' : '怎么啦？', 'sweet'),
    { chat: { npc: 'qingqing', scene: 'a1_daily' } },
  ],

  a1_09_page: [
    say('qingqing', '你不是老问老秦到底犯了什么事吗？'),
    N('她从一个行李箱里抽出一沓厚厚的英文文件，翻到其中一页，只让你看了一段。'),
    N('“26. I have seen an Interpol Red Notice associated with this passport. According to the Interpol Red Notice, QIN has been charged with Article 176 (Illegally Absorbing Deposits from the Public)…”'),
    { fx: { evidence: 'case_file_page', claim: 'red_notice' } },
    say('qingqing', '看到了吧？他就是个经济犯。罪名跟那些诈骗大佬一样——那他肯定也有很多很多钱。'),
    say('qingqing', '他涉案金额那么大，回国会判得很重。所以他现在需要我想办法，让他尽可能留在美国受审。'),
    { choice: [
      { t: '后面几页能给我看看吗？', goto: 'more' },
      { t: '原来是这样。', goto: 'ok' },
    ] },
    { label: 'more' },
    say('qingqing', '你看那么多干嘛？', 'cold'),
    N('她把文件塞回了行李箱。'),
    say('v_detective', '那个行李箱。记住它。'),
    { fx: { flags: { noticed_suitcase: true }, stats: { clarity: 3 } } },
    { label: 'ok' },
    { fx: { anchor: 'econ_only' } },
    N('你以为自己认识的，是一个男朋友因为金融犯罪入狱、独自在美国生活、等着男朋友给她钱的年轻女人。'),
    N('四月底，你们原本计划去赌场玩几天。出发前一天，她拿起了你的手机……'),
    { fx: { quest: 'END1', end: true, note: '第一幕结束。她给你看了卷宗第26条：老秦被红通，罪名是“非法吸收公众存款”。' } },
  ],

  // 杂项 ───────────────────────────────
  fang_talk: [
    say('fangjie', '陈先生，喝茶吗？'),
    { choice: [
      { t: '芳姐，晴晴家里是做什么的？', goto: 'family' },
      { t: '不用了，谢谢。', goto: 'bye' },
    ] },
    { label: 'family' },
    say('fangjie', '听说她爸是开五星酒店的！她跟每个新认识的人都要讲一遍，我都听过好几遍啦。'),
    { fx: { version: ['heiress', '对芳姐（芳姐转述）', '“听过听过。”同一套家世，她对保姆也讲过好几遍。'] } },
    { end: true },
    { label: 'bye' },
    { end: true },
  ],

  meiyi_closed: [
    N('风水铺的门帘半掩着，里面香火缭绕。梅姨今天不在。'),
  ],
  master_locked: [
    N('主卧的门关着。她睡觉怕光，窗帘终日拉得严严实实。'),
  ],
  camera_look: [
    N('客厅角落装着一个摄像头，红灯一闪一闪。'),
    say('v_detective', '记住它的位置。'),
  ],
  family_photos: [
    N('墙上挂着全家福。照片里的你还很年轻，那时候生意正好。'),
  ],
  bed_idle: [
    N('现在还不想睡。'),
  ],
  passerby_uncle: [
    say('passerby', '后生仔，又来帮人睇数啊？你这个人啊，就是好讲话。'),
  ],
  passerby_waiter: [
    say('passerby', '老邝那边又吵起来了？这条街上，什么事都传得快。'),
  ],
};
