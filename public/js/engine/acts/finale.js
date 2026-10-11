// 终幕 第四个版本（2026年4月）与尾声 遣返（2026年7–8月）：MQ-29、MQ-30、结局。
// 依据 docs/story/05_主线剧情.md；芳姐的证词（SQ-04）和周志强（SQ-06 尾声）也在这里。
// 结局判定在 ../endings.js。鹿鸣的下落在任何结局里都不揭晓。
import { say, N, has, during } from './common.js';

export const PLACEMENTS = {
  seaside_restaurant: [
    { id: 'qingqing', label: '晴晴', x: 770, y: 400, when: s => s.quest === 'F_29B' },
  ],
};

export function interact(state, { id }) {
  const q = state.quest;
  if (!during('F_29', 'END')(state)) return null;
  if (id === 'qingqing' && q === 'F_29B') return { script: 'f_29_dinner' };
  if (id === 'counter' && q === 'F_30' && !state.phone.pending) return { script: 'f_30_withdraw' };
  if (id === 'home_desk') return { phoneApp: 'evidence' };
  return null;
}

export const CHOICE_SCENES = {
  f_29_dinner: 'f_dinner',
  f_fang_call: 'f_fang',
  f_30_withdraw: { scene: 'inner', npc: null },
  epi_news: { scene: 'inner', npc: null },
};

export const STANCES = {};

// 前半段的三个问题都问过了
const asked3 = s => s.flags.f_q_door && s.flags.f_q_jewelry && s.flags.f_q_qin;

export const SCRIPTS = {
  // MQ-29 最后的晚餐 ─────────────────────
  f_29_invite: [
    say('qingqing', '是我。从以前的群里找到你的。', 'neutral'),
    say('qingqing', '出来吃个饭吧，海滨大道那家。有些事，我想当面跟你说清楚。'),
    say('v_detective', '她换了住处、换了所有的号码，现在又自己找上门来。'),
    { fx: { quest: 'F_29B', phone: { pending: null } } },
  ],

  f_29_dinner: [
    N('她坐 Uber 来的。她已经不租车了。'),
    say('v_detective', '要不要在口袋里按下录音键？'),
    { choice: [
      { t: '（按下录音键）', on: [{ act: 'agree' }, { topic: '偷偷录音' }], fx: { flags: { recorded_dinner: true }, evidence: 'dinner_recording' }, goto: 'start' },
      { t: '（不录）', on: '*', goto: 'start' },
    ] },
    { label: 'start' },
    say('qingqing', '点菜吧。你想问什么就问。', 'neutral'),
    { label: 'menu' },
    { if: asked3, goto: 'v4' },
    { choice: [
      { t: '你那天为什么带人上我家？', once: true, on: { topic: '她为什么带人上门大闹' }, goto: 'door' },
      { t: '1月为什么报警说我偷珠宝？', once: true, on: { topic: '她为什么报警说他偷珠宝' }, goto: 'jewelry' },
      { t: '你那个男朋友现在怎么样了？', once: true, on: { topic: '秦岳现在怎么样了' }, goto: 'qin' },
    ] },
    { label: 'door' },
    say('qingqing', '我想跟你好好聊聊嘛。我怎么可能说过那种话？是他们听错了。'),
    { fx: { flags: { f_q_door: true } } },
    { goto: 'menu' },
    { label: 'jewelry' },
    say('qingqing', '误会啦……我现在怀疑是保姆偷的。'),
    { fx: { flags: { f_q_jewelry: true, fang_accused: true }, claim: 'fang_blame' } },
    say('v_detective', '芳姐。她把芳姐推了出去。'),
    { goto: 'menu' },
    { label: 'qin' },
    say('qingqing', '死刑呗。', 'cold'),
    say('qingqing', '我知道你已经看过全部案卷了。', 'cold'),
    { fx: { flags: { f_q_qin: true } } },
    { goto: 'menu' },

    // 后半段：版本四
    { label: 'v4' },
    say('qingqing', '你真的这么想知道鹿鸣的事吗？好，我告诉你全部的真相。'),
    N('她低头看着桌面，时不时抬起眼睛看你一下。'),
    say('qingqing', '鹿鸣是做“外围”的，年龄也是假的。在伦敦，是她把一个叫“坤哥”的人介绍给我的。'),
    say('qingqing', '有一次派对，香槟里被人下了药。我酒精过敏，只喝了半杯。坤哥想对我动手，我跑了。我没告诉任何人。'),
    say('qingqing', '半个月后老秦知道了。他气疯了，说：“那我就要搞她。”他说我不该去那个派对，抢走了我的手机，把我关起来。那些约她的消息，都是他发的。'),
    say('qingqing', '鹿鸣没死。她被暹湾一个军方的大佬看上了，现在在给人家生孩子。你想想，她家里人怎么一点声音都没有？'),
    { fx: { claim: 'luna_v4', version: ['luna', '2026年4月 · 对陈默（晚餐）', '鹿鸣是“外围”，在伦敦介绍了坤哥；派对被下药；秦岳报复，抢走她手机、软禁她，邀约都是秦岳发的；鹿鸣“没死，被暹湾的军方大佬看上了”。'] } },
    { if: s => (s.versions.luna?.length || 0) >= 4, goto: 'fourth' },
    { goto: 'decide' },
    { label: 'fourth' },
    N('2023年对鹿鸣的朋友，吞吞吐吐。2023年的小号澄清，“家里临时有事”。2025年9月，“被秦岳软禁”。今天，复仇和“被包养”。'),
    say('v_detective', '同一件事。第四个版本。'),
    { fx: { flags: { all_versions: true } } },
    { label: 'decide' },
    say('v_detective', '要当场拆穿她吗？'),
    { choice: [
      { t: '第一条邀约，是你妈妈发的。秦岳也软禁了你妈、拿走了她的手机吗？', on: { topic: '第一条邀约是她妈妈发的' }, when: has('saw_mother_msg'), goto: 'expose' },
      { t: '“我已经到圣罗莎港啦，在酒店洗澡等你”——这是你说的。', on: { topic: '她说过已经到了圣罗莎港' }, when: s => s.evidence.includes('k_chat'), goto: 'expose' },
      { t: '“唉呀宝宝你就陪我去转一圈吧”，这像一个中年男人说的话吗？', on: { topic: '那些消息的口吻不像中年男人' }, when: s => s.evidence.includes('k_chat'), goto: 'expose' },
      { t: '你当年发声明说，是家里临时有事没去成。', on: { topic: '她当年说家里临时有事' }, when: s => (s.versions.luna || []).some(v => v.audience.includes('小号')), goto: 'expose' },
      { t: '秦岳要报复，为什么报复鹿鸣，不报复坤哥？', on: { topic: '为什么报复鹿鸣而不是坤哥' }, goto: 'expose' },
      { t: '你爸让我带句话：实在不行，就回来。家里有饭吃。', on: { topic: '转达她父亲的话' }, when: has('father_message'), fx: { flags: { father_delivered: true } }, goto: 'father' },
      { t: '你的过去，我大概知道是怎么回事了。', on: [{ act: 'agree' }, { act: 'support' }, { topic: '不拆穿她' }], goto: 'spare' },
    ] },
    { label: 'expose' },
    say('qingqing', '你是不是吃饱了撑的？我过得比她惨多了，为什么没有人关心我？', 'angry'),
    say('qingqing', '我还以为你会站在我这边。', 'cold'),
    N('她站起来，拿起包走了。桌上的菜一口没动。'),
    { fx: { flags: { f_exposed: true }, stats: { clarity: 30 }, pull: 'darvo' } },
    { goto: 'after' },
    { label: 'father' },
    N('她停住了。'),
    N('那是你认识她以来，她第一次没有在表演的停顿。'),
    say('qingqing', '……雨过就会天晴。', 'lookdown'),
    { label: 'spare' },
    say('chen', '你的过去，我大概知道是怎么回事了。如果你凭自己的本事留下来，我也不会主动介入你的生活。'),
    say('qingqing', '……谢谢你。', 'sweet'),
    say('qingqing', '过阵子，你陪我去警局把那个案子撤了吧。'),
    { fx: { flags: { f_not_exposed: true } } },
    { label: 'after' },
    { if: has('fang_accused'), goto: 'fang' },
    { goto: 'next' },
    { label: 'fang' },
    { fx: { phone: { pending: 'f_fang_call', from: 'fangjie' } } },
    { label: 'next' },
    { if: has('f_exposed'), goto: 'epi' },
    { fx: { quest: 'F_30', note: '最后一次见面，她讲了鹿鸣的“第四个版本”。你没有拆穿她。' } },
    { end: true },
    { label: 'epi' },
    { fx: { quest: 'EPI', note: '最后一次见面，她讲了鹿鸣的“第四个版本”。你当场拆穿了她，她走了。' } },
    { if: s => !s.phone.pending, goto: 'news' },
    { end: true },
    { label: 'news' },
    { fx: { phone: { pending: 'epi_news', from: 'zhouzhiqiang' } } },
  ],

  // SQ-04 紧急阶段：芳姐被推出来当替罪羊
  f_fang_call: [
    say('fangjie', '陈先生……晴晴说她的首饰是我偷的。我、我已经被她辞了……'),
    say('fangjie', '我没有身份，警察要是来找我，我就完了。我不敢去，我真的不敢去……'),
    { label: 'menu' },
    { choice: [
      { t: '我陪你去。律师我来找，翻译我来做。作证不等于自首。', on: { topic: '具体承诺：陪她去、找律师、做翻译' }, goto: 'testify' },
      { t: '那你自己小心。', on: [{ act: 'leave' }, { act: 'refuse' }], goto: 'lost' },
    ] },
    { label: 'testify' },
    N('你陪她去见了移民律师。律师说，作证不等于自首；具体能得到什么保护，要看个案。'),
    say('fangjie', '……好。我说。那段时间家里从来没有过一百万的珠宝。'),
    say('fangjie', '还有，我听见她跟秦岳哭诉，说“那个司机冲到我家来，偷走了我很贵的首饰”。'),
    { fx: { flags: { fang_testify: true }, evidence: 'fang_statement' } },
    { goto: 'end' },
    { label: 'lost' },
    N('那之后，芳姐的电话就打不通了。'),
    { fx: { flags: { fang_lost: true } } },
    { label: 'end' },
    { fx: { phone: { pending: null } } },
    { if: s => s.quest === 'EPI', goto: 'news' },
    { end: true },
    { label: 'news' },
    { fx: { phone: { pending: 'epi_news', from: 'zhouzhiqiang' } } },
  ],

  // MQ-30 撤案 ───────────────────────────
  f_30_withdraw: [
    N('去警局的路上，她一直在看手机。快到的时候，她的语气变了。'),
    say('qingqing', '撤案可以。但珠宝确实丢了，只是不确定是谁拿的。', 'cold'),
    say('v_detective', '她给自己留了余地。'),
    { choice: [
      { t: '（签字，息事宁人）', on: [{ act: 'agree' }, { topic: '签字算了' }], fx: { flags: { f30: 'sign' }, stats: { doubt: 3 } }, goto: 'end' },
      { t: '你先把对芳姐的指控撤回来。', on: [{ topic: '要她撤回对芳姐的指控' }, { act: 'pressure' }], fx: { flags: { f30: 'fang' } }, goto: 'fang' },
      { t: '（把整理好的反诉材料递给警官）', on: [{ topic: '当场提交反诉材料' }, { act: 'challenge' }], fx: { flags: { f30: 'counter' }, stats: { clarity: 5 } }, goto: 'counter' },
    ] },
    { label: 'fang' },
    say('qingqing', '……行。保姆的事，我不追究了。', 'cold'),
    { goto: 'end' },
    { label: 'counter' },
    N('警官翻了翻你的材料，又看了看她。她的脸色一下子白了。'),
    say('ramirez', '许女士，关于虚假报案，我们需要你再做一次笔录。'),
    { label: 'end' },
    N('从警局出来，她上了一辆 Uber，没有回头。'),
    { fx: { quest: 'EPI', phone: { pending: 'epi_news', from: 'zhouzhiqiang' }, note: '你陪她去了警局。她说珠宝“确实丢了，只是不确定是谁拿的”。' } },
  ],

  // 尾声 遣返 ────────────────────────────
  epi_news: [
    N('七月。新闻：一名在押的外籍男子已被遣返回国。'),
    N('你在联邦监狱的查询网站上输入那个名字。查无此人。'),
    { fx: { flags: { qin_deported: true } } },
    say('zhouzhiqiang', '你是陈默？我是周志强，赵慧的老公。我出来了。'),
    say('zhouzhiqiang', '你还能不能找到许嘉晴？等我找到她，我非弄她不可！'),
    say('zhouzhiqiang', '我手里有材料，你帮我交给警察。'),
    N('你替他把材料交了上去。得到的答复是：不属于本国管辖。'),
    say('zhouzhiqiang', '那她现在住哪儿？你告诉我。'),
    { choice: [
      { t: '我不知道。', on: [{ act: 'refuse' }, { act: 'chat' }, { topic: '不告诉他她的住址' }], goto: 'no' },
      { t: '（告诉他）', on: [{ act: 'agree' }, { topic: '告诉他她的住址' }], fx: { flags: { gave_address: true } }, goto: 'no' },
    ] },
    { label: 'no' },
    N('八月，那桩旧案又上了热搜。鹿鸣的母亲在采访里说：“至今没有音讯。”'),
    say('v_detective', '你手里的这些东西，要交给谁？'),
    { choice: [
      { t: '（交给“青苔档案”，写成纪实）', on: { topic: '交给青苔档案发表' }, fx: { flags: { published: 'qingtai' } }, goto: 'end' },
      { t: '（交给沈曼，写成剧本）', on: { topic: '交给沈曼写成剧本' }, fx: { flags: { published: 'shenman' } }, goto: 'end' },
      { t: '（留着，谁也不给）', on: '*', fx: { flags: { published: false } }, goto: 'end' },
    ] },
    { label: 'end' },
    { fx: { quest: 'END', end: true, phone: { pending: null } } },
  ],
};
