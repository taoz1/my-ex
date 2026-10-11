// 第三幕 冻（2025年7月–11月）：MQ-15 第一张卡 → MQ-20 拉黑。
// 依据 docs/story/05_主线剧情.md。大部分戏在手机里（消息、搜索、朋友的来电）。
// 失踪者的下落在任何结局都不揭晓（docs/story/03 的 C13）。
import { say, N, has, during } from './common.js';

export const PLACEMENTS = {
  qingqing_house_b: [
    { id: 'qingqing', label: '晴晴', x: 640, y: 560, when: during('A3_19B') },
    { id: 'fangjie', label: '芳姐', x: 1000, y: 540, when: during('A3_15', 'A3_20') },
  ],
};

export function interact(state, { id }) {
  const q = state.quest;
  if (!during('A3_15', 'A3_20')(state)) return null;
  switch (id) {
    case 'qingqing': return { script: q === 'A3_19B' ? 'a3_19_meet' : 'a3_cold' };
    case 'fangjie': return { script: 'fang_a3' };
    case 'home_desk': return { phoneApp: 'search' };
    default: return null;
  }
}

export const CHOICE_SCENES = {
  a3_16_explain: 'a3_qingqing',
  a3_laozhong: 'a3_frozen',
  a3_michael: 'a3_frozen',
  a3_xiaomo: 'a3_frozen',
  a3_17_news: 'a3_qingqing',
  a3_xiaowen_invite: 'xiaowen_chat',
  a3_19_meet: { scene: 'a3_qingqing', npc: 'qingqing' },
  a3_20_block: 'a3_qingqing',
};

export const STANCES = {};

// 三个朋友的电话都打过了，她的下一个说法就来了
const friendsDone = s => s.flags.laozhong_called && s.flags.michael_called && s.flags.xiaomo_called;
const NEXT_EXPLAIN = { if: friendsDone, goto: 'next' };
const friendTail = [
  NEXT_EXPLAIN,
  { end: true },
  { label: 'next' },
  { fx: { phone: { pending: 'a3_16_explain2', from: 'qingqing' } } },
];

export const SCRIPTS = {
  // MQ-15 第一张卡 ───────────────────────
  a3_15_call: [
    say('laozhong', '老陈！我的卡被冻了！国内的账户，支付宝也用不了了！'),
    { if: has('exchange_helped'), goto: 'helped' },
    say('laozhong', '我就是帮朋友的朋友换了点美元，谁知道……'),
    say('v_detective', '你没让朋友帮她换汇。她找了别人，可绕了一圈，还是绕到了老钟头上。'),
    { goto: 'police' },
    { label: 'helped' },
    say('laozhong', '就是帮你那个女朋友换的那几笔！房贷的钱还在里面！'),
    { fx: { stats: { doubt: 3 } } },
    { label: 'police' },
    say('laozhong', '办案的警察打电话问我：你认不认识赵慧？你认不认识许嘉晴？'),
    say('chen', '许嘉晴？'),
    say('laozhong', '对，许嘉晴。我说不认识。我就认识你那个晴晴！'),
    say('v_detective', '许嘉晴。她的证件名？记下来。'),
    { fx: { jot: { id: 'name:许嘉晴', text: '许嘉晴（警察问老钟认不认识这个人）' }, contact: ['laozhong', 'michael', 'xiaomo'], flags: { knows_real_name: true } } },
    { choice: [{ t: '我去问问她。' }] },
    { fx: { quest: 'A3_16', phone: { pending: 'a3_16_explain', from: 'qingqing' }, note: '7月10日，老钟的卡被冻。办案警察问他认不认识“赵慧”和“许嘉晴”。' } },
  ],

  // MQ-16 二十八天 ───────────────────────
  a3_16_explain: [
    say('qingqing', '什么冻卡？哦，那个啊，就是资金审查，正常的。'),
    { fx: { claim: 'audit', doubtClaim: 'accountant', version: ['money', '对陈默（7月）', '冻卡“只是资金审查，正常的”。'] } },
    { choice: [{ t: '老钟房贷的钱还在里面。' }] },
    say('qingqing', '急什么，28天以后就全部解封了。', 'cold'),
    { fx: { claim: 'unfreeze_28' } },
    N('过了几天，麦可的卡也被冻了。然后是小莫。其中一张解冻了两三天，又被冻上。'),
    say('qingqing', '你看，我比他们惨多了。', 'wronged'),
    N('她发来一张截图：她名下三千万人民币被冻结。'),
    { fx: { evidence: 'fake_screenshot', claim: 'frozen_30m' } },
    { check: 'clarity', min: 35, goto: 'fake' },
    say('v_desire', '她也很难。'),
    { goto: 'ask' },
    { label: 'fake' },
    say('v_detective', '字体的边缘不对，数字的间距也不对。这是P过的。'),
    { fx: { doubtClaim: 'frozen_30m', stats: { clarity: 2 } } },
    { label: 'ask' },
    { choice: [
      { t: '把老钟和麦可的钱退给他们。', on: [{ topic: '把钱退给朋友们' }, { act: 'pressure' }], fx: { flags: { pushed_refund: true } }, goto: 'refund' },
      { t: '（先不说什么）', on: '*', goto: 'end' },
    ] },
    { label: 'refund' },
    say('qingqing', '我的钱也冻着！你让我拿什么退？你是不是也跟他们一样，觉得是我骗了他们？', 'angry'),
    { fx: { pull: 'darvo' } },
    { label: 'end' },
    { fx: { flags: { a3_explained: true }, phone: { pending: null }, note: '她说冻卡是“资金审查”，“28天就解封”，还发来一张三千万被冻的截图。老钟、麦可、小莫在等你回电话。' } },
  ],

  // 老钟：这次你是被调解的那一方
  a3_laozhong: [
    say('laozhong', '老陈，你给我个准话：我的钱什么时候能出来？'),
    say('laozhong', '房贷下个月就要扣了！你那个女朋友呢？她怎么不接我电话？'),
    say('v_mediator', '这次被调解的人是你。'),
    { choice: [
      { t: '对不起，老钟。我帮你给银行写个情况说明。', on: [{ act: 'support' }, { act: 'agree' }, { topic: '帮老钟写材料' }], fx: { flags: { helped_laozhong: true }, stats: { cred: 3 } }, goto: 'help' },
      { t: '她说28天就解封，再等等。', on: [{ act: 'chat' }, { topic: '28天解封' }], fx: { stats: { cred: -3, doubt: 2 } }, goto: 'wait' },
    ] },
    { label: 'help' },
    say('laozhong', '……行。你写。写清楚是她让换的。'),
    { goto: 'done' },
    { label: 'wait' },
    say('laozhong', '28天？她说你就信？老陈你是不是被她灌了迷魂汤！'),
    { label: 'done' },
    { fx: { flags: { laozhong_called: true } } },
    ...friendTail,
  ],

  // 麦可：讲证据
  a3_michael: [
    say('michael', '老陈，我把每一笔都整理出来了：哪天转的人民币，哪天给的美元现金，多少钱。'),
    { fx: { evidence: 'transfer_timeline' } },
    say('michael', '我只要一样东西：她把钱退给我。你能不能让她退？'),
    say('michael', '还有，国内办案的警察，我托朋友加到了微信。你愿不愿意跟他把情况说清楚？'),
    { choice: [
      { t: '我去跟警察说清楚。', on: [{ act: 'agree' }, { topic: '跟国内的警察说明情况' }], fx: { flags: { told_police: true }, stats: { clarity: 3 } }, goto: 'police' },
      { t: '我先逼她退钱。', on: [{ topic: '逼她退钱' }, { act: 'pressure' }, { act: 'refuse' }], goto: 'push' },
    ] },
    { label: 'police' },
    N('你加了那位警察的微信，把你知道的都写了下去：换汇是她让朋友帮忙的，钱是当面交的现金。'),
    N('对方回了一句“收到”。之后就再也没有回复。'),
    { goto: 'done' },
    { label: 'push' },
    say('michael', '好。我等你的消息。'),
    { label: 'done' },
    { fx: { flags: { michael_called: true } } },
    ...friendTail,
  ],

  // 小莫：五百美元的谅解书
  a3_xiaomo: [
    say('xiaomo', '陈哥……我只收了三千多块人民币，就一次。现在卡也被冻了。我会不会坐牢啊？'),
    say('xiaomo', '警察说，如果把钱退给报案的人，拿到谅解书，就能先解冻。可我手里没钱了。'),
    say('v_detective', '三千多人民币，五百美元左右。'),
    { choice: [
      { t: '我出这五百美元，你去拿谅解书。', on: [{ act: 'agree' }, { act: 'support' }, { topic: '替小莫出五百美元' }], fx: { flags: { paid_xiaomo: true }, stats: { cred: 5 } }, goto: 'pay' },
      { t: '我让她把钱退给你。', on: [{ act: 'refuse' }, { topic: '让她退钱' }, { act: 'chat' }], goto: 'wait' },
    ] },
    { label: 'pay' },
    N('你转了五百美元。几周后，小莫拿到了谅解书，卡解冻了。'),
    say('xiaomo', '陈哥，谢谢你。这钱我以后一定还你。'),
    { goto: 'done' },
    { label: 'wait' },
    say('xiaomo', '……好，那我再等等。'),
    { label: 'done' },
    { fx: { flags: { xiaomo_called: true } } },
    ...friendTail,
  ],

  a3_16_explain2: [
    say('qingqing', '……好吧，赵慧不是我的会计。'),
    { fx: { overturnClaim: 'accountant' } },
    say('qingqing', '她老公在牢里，跟老秦是狱友。老秦帮他们联系律师，她给的是律师费和保释金。'),
    { fx: { claim: 'zhaohui_client', overturnClaim: ['audit', 'unfreeze_28'], version: ['money', '对陈默（8月）', '赵慧是“捞人”的委托人，钱是律师费和保释金。'] } },
    say('qingqing', '现在她不想认账了，故意去举报我！', 'angry'),
    { fx: { claim: 'reported_me' } },
    say('v_detective', '会计、审查、二十八天、律师费。同一笔钱，第四个说法了。'),
    { if: has('d_pretended'), goto: 'friend' },
    { goto: 'dividend' },
    { label: 'friend' },
    say('qingqing', '对了，你那个朋友什么时候过去？你答应过我的。', 'cold'),
    say('v_mother', '……她没有忘。'),
    { label: 'dividend' },
    N('八月底。'),
    say('qingqing', '年底新加坡公司会给我一百万美元分红，到时候你们的损失我都补偿！', 'sweet'),
    say('qingqing', '不过分红的钱有个规矩，只能买奢侈品。'),
    { fx: { claim: 'dividend' } },
    say('v_detective', '只能买奢侈品的分红。'),
    { fx: { quest: 'A3_17', phone: { pending: 'a3_17_news', from: 'qingqing' }, note: '她承认赵慧不是会计，又说是“捞人”的律师费，赵慧“故意举报”她。年底会有一百万美元“分红”。' } },
  ],

  // MQ-17 天龙人 ─────────────────────────
  a3_17_news: [
    N('她转发来一条新闻：湖蓝色定制豪车凌晨醉驾。'),
    say('qingqing', '这个天龙人就是阿蓉的女儿！', 'sweet'),
    { fx: { claim: 'tianlong' } },
    N('十月，她又转发了一条：百亿数字币被没收。'),
    say('qingqing', '这人的老婆我认识，以前一起喝过下午茶。'),
    { fx: { claim: 'coin_wife' } },
    say('v_detective', '她把新闻拉进自己的故事里。一次是巧合，两次……'),
    { choice: [
      { t: '新闻里又没写名字，你怎么知道是谁？', on: [{ act: 'challenge' }, { act: 'ask', topic: '她怎么知道新闻里的人是谁' }], fx: { stats: { clarity: 4 }, evidence: 'pattern_news' }, goto: 'call' },
      { t: '是吗，这么巧。', on: '*', goto: 'along' },
    ] },
    { label: 'call' },
    say('qingqing', '我就是知道！你什么都不懂。', 'angry'),
    say('v_detective', '新闻贴金。记住这个模式。'),
    { goto: 'end' },
    { label: 'along' },
    say('v_mediator', '何必拆穿呢。'),
    { label: 'end' },
    { if: s => s.flags.d_pretended && !s.flags.xiaowen_resolved, goto: 'xiaowen' },
    { fx: { quest: 'A3_18', phone: { pending: null }, note: '九月。警察问老钟的那个名字，你一直没去搜。' } },
    { end: true },
    { label: 'xiaowen' },
    { fx: { phone: { pending: 'a3_xiaowen_invite', from: 'xiaowen' } } },
  ],

  // SQ-03 救援版：假装答应之后，小雯收到了“晴晴妈妈”的邀约
  a3_xiaowen_invite: [
    say('xiaowen', '老陈，有个人加我微信，说是晴晴的妈妈。'),
    say('xiaowen', '她说“晴晴心情不好，想出去玩几天，你有空能陪她吗？”还说机票酒店她们包。'),
    say('v_mother', '……“弄到南屿去”。'),
    { choice: [
      { t: '别去！把她删了，什么都别回。', on: [{ act: 'refuse' }, { act: 'challenge' }, { act: 'pressure' }, { topic: '警告小雯别去' }], fx: { flags: { xiaowen_warned: true, xiaowen_resolved: true }, stats: { clarity: 5 } }, goto: 'warned' },
      { t: '去玩玩也好啊。', on: { act: 'agree' }, fx: { flags: { xiaowen_failed: true, xiaowen_resolved: true }, stats: { cred: -10 } }, goto: 'fail' },
    ] },
    { label: 'warned' },
    say('xiaowen', '……好，我听你的。你也小心点。'),
    { goto: 'end' },
    { label: 'fail' },
    N('小雯没有去，她本来就警觉。过了两天，她把你删了。'),
    say('v_mother', '默默，你连一句提醒都没有给她。'),
    { fx: { uncontact: 'xiaowen' } },
    { label: 'end' },
    { fx: { quest: 'A3_18', phone: { pending: null }, note: '九月。警察问老钟的那个名字，你一直没去搜。' } },
  ],

  // MQ-18 搜索：三条线索凑齐时，从手机的搜索结果进入这里
  a3_18_realize: [
    N('名字一字不差。侧脸、鼻梁、下巴越看越像。“晴晴和K分手了”。'),
    say('v_detective', 'K。她身上那句：K is my lord, and I’m the slave。'),
    N('那一瞬间，你有一种汗毛都竖起来的感觉。'),
    say('v_detective', '她从不发正脸照片。你相册里她的正脸照，后来一张张都不见了。'),
    say('v_mother', '这个女孩子看上去很复杂。'),
    { fx: { flags: { luna_realized: true }, stats: { clarity: 10, attachment: -5 }, quest: 'A3_19', note: '九月，你搜了“许嘉晴”。两年前在南屿失联的博主鹿鸣，约她出去的闺蜜就叫许嘉晴。' } },
  ],

  // MQ-19 语音聊（你主动点开她的对话框）
  a3_19_voice: [
    N('你给她发了一条消息：“我知道了你的一些事情，但我不会到处说。”'),
    N('过了很久，她回：“语音聊。”'),
    say('qingqing', '那些消息，是老秦拿我的手机发的。', 'wronged'),
    say('qingqing', '那段时间他把我软禁了，手机也收走了。我跟老秦当时都在英国，都没去南屿。'),
    say('qingqing', '接机的是一个叫 Rico 的人，我也是后来才知道的。'),
    say('qingqing', '我问过老秦，他说：“你管她干嘛？她日子过得比你舒服多了。”'),
    { fx: { claim: 'luna_v3', version: ['luna', '2025年9月 · 对陈默（语音）', '是秦岳拿她手机发的消息，她被软禁；她和秦岳都在英国，没去南屿；接机的是一个叫 Rico 的人。'] } },
    { if: has('saw_mother_msg'), goto: 'mother' },
    { goto: 'end' },
    { label: 'mother' },
    say('v_detective', '第一条邀约是“星河妈”发的。秦岳也拿走了她妈妈的手机吗？'),
    { label: 'end' },
    say('qingqing', '见面再说吧。'),
    { fx: { quest: 'A3_19B' } },
  ],

  a3_19_meet: [
    N('她开了门，眼睛是肿的。'),
    say('qingqing', '你还想问什么？', 'cold'),
    { choice: [{ t: '那条“在酒店洗澡等你”的消息……' }] },
    say('qingqing', '你是不是吃饱了撑的？', 'angry'),
    say('qingqing', '我过得比她惨多了，为什么没有人关心我？', 'wronged'),
    say('qingqing', '我还是不是你女朋友？你不是说永远站在我这一边吗？', 'wronged'),
    { fx: { pull: 'darvo', stats: { doubt: 3 } } },
    { choice: [
      { t: '我相信你。', on: [{ act: 'support' }, { act: 'agree' }], goto: 'believe' },
      { t: '第一条邀约是你妈妈发的。秦岳也软禁了你妈吗？', on: [{ act: 'challenge' }, { act: 'pressure' }], fx: { flags: { g_confront: true, block_early: true }, stats: { clarity: 8, attachment: -5 } }, goto: 'confront' },
    ] },
    { label: 'believe' },
    say('qingqing', '……我就知道你会站在我这边。', 'sweet'),
    say('v_detective', '回去之后，要不要把她今天说的每一句都记下来？'),
    { choice: [
      { t: '（回家，把每一句都写下来）', on: [{ act: 'agree' }, { topic: '把她说的话记下来' }], fx: { flags: { g_record: true }, stats: { clarity: 5 } }, goto: 'end' },
      { t: '（算了）', on: '*', fx: { flags: { g_believe: true }, stats: { attachment: 3 } }, goto: 'end' },
    ] },
    { label: 'confront' },
    say('qingqing', '你给我滚！', 'angry'),
    N('门在你身后摔上了。'),
    { label: 'end' },
    { fx: { quest: 'A3_20', phone: { pending: 'a3_20_block', from: 'qingqing' }, note: '她说那些消息是秦岳拿她手机发的，她被软禁了，没去南屿。' } },
  ],

  // MQ-20 拉黑 ───────────────────────────
  a3_20_block: [
    N('从九月底开始，她一个接一个地拉黑你：两个微信、两个号码、两个 WhatsApp、两个电报。最后只剩下一个号码，和一个微信。'),
    say('qingqing', '我是为了保护你。', 'cold'),
    say('qingqing', '那边的人手上死过不少人。你离我越远越好，知道得越少越好。', 'cold'),
    N('可她还会来找你。只要转账，不要见面。'),
    say('qingqing', '这个月房租差一点，你先借我两百，下个月还你。'),
    { choice: [
      { t: '（转账200美元）', on: [{ act: 'agree' }, { act: 'support' }], fx: { transfer: 200 }, goto: 't2' },
      { t: '我这个月也紧。', on: [{ act: 'refuse' }, { act: 'challenge' }, { act: 'chat' }], goto: 't2' },
    ] },
    { label: 't2' },
    N('十月。'),
    say('qingqing', '芳姐的工资还差一百，你先帮我垫一下。'),
    { choice: [
      { t: '（转账100美元）', on: [{ act: 'agree' }, { act: 'support' }], fx: { transfer: 100 }, goto: 't3' },
      { t: '你不是有一百万的分红吗？', on: [{ act: 'refuse' }, { act: 'challenge' }, { act: 'chat' }], goto: 't3' },
    ] },
    { label: 't3' },
    N('十一月。'),
    say('qingqing', '能不能再转我三百？不用见面，转账就行。'),
    { choice: [
      { t: '（转账300美元）', on: [{ act: 'agree' }, { act: 'support' }], fx: { transfer: 300 }, goto: 'meiyi' },
      { t: '不转了。', on: [{ act: 'refuse' }, { act: 'challenge' }, { act: 'chat' }], goto: 'meiyi' },
    ] },
    { label: 'meiyi' },
    say('qingqing', '我找梅姨算过了，这个阶段家里不能有男人。你那些东西我收起来了……现在也找不到了。'),
    { fx: { claim: 'meiyi_gua' } },
    say('v_detective', '你的东西“找不到了”。'),
    { fx: { quest: 'A4_21', actBreak: 3, phone: { pending: 'a4_21_call', from: 'qingqing' }, note: '第三幕结束。她拉黑了你大部分的账号，只在要钱的时候出现。' } },
  ],

  a3_cold: [
    say('qingqing', '不是说了最近别来吗？', 'cold'),
    { chat: { npc: 'qingqing', scene: 'a3_qingqing' } },
  ],

  fang_a3: [
    say('fangjie', '陈先生……晴晴最近脾气不好，你别往心里去。'),
    { chat: { npc: 'fangjie', scene: 'a2_newhouse' } },
  ],
};
