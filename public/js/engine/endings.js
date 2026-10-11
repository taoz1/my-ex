// 结局判定与结局幻灯片。依据 docs/story/05_主线剧情.md「结局详述」。纯逻辑，可在 Node 里测试。
// 鹿鸣的下落在所有结局里都一样：至今下落不明。

// 三案证据链（换汇、鹿鸣、构陷）的完整度
export function evidenceScore(s) {
  const has = id => (s.evidence.includes(id) ? 1 : 0);
  const exchange = 2 * has('money_flow') + has('transfer_timeline') + has('zhaohui_list');
  const luna = has('luna_photo') + has('k_chat') + (s.flags.recorded_dinner ? 2 : 0) + ((s.versions.luna?.length || 0) >= 3 ? 1 : 0);
  const setup = has('inference_setup') + (s.flags.defense_passed ? 1 : 0) + has('door_footage') + has('xiaowu_statement') + has('coco_testimony') + (s.flags.fang_testify ? 2 : 0);
  return { exchange, luna, setup, total: exchange + luna + setup };
}

export const EVIDENCE_THRESHOLD = 9;

export function computeEnding(s) {
  const f = s.flags;
  if (f.xiaowen_lured) return 'E5';
  if (f.married && (f.hit_her || !f.defense_passed)) {
    // 救赎辩护：拉扯循环的记录和 Coco 的证词都在，转为 E1 的变体
    return s.pressure.length >= 3 && s.evidence.includes('coco_testimony') ? 'E4R' : 'E4';
  }
  if (f.father_delivered && f.f_not_exposed && s.stats.clarity >= 70 && s.stats.attachment >= 30 && s.stats.attachment <= 60) return 'E6';
  if (f.published && evidenceScore(s).total >= EVIDENCE_THRESHOLD) return f.published === 'shenman' ? 'E2S' : 'E2';
  if (!f.eric_clear && evidenceScore(s).total < EVIDENCE_THRESHOLD) return 'E3';
  return 'E1';
}

export const ENDINGS = {
  E1: { title: 'E1 和事佬', text: '你留着聊天记录和录音，继续过自己的生活。朋友的账户一年多以后仍未解冻。八月，那桩旧案又上了热搜，鹿鸣的母亲在采访里说：“至今没有音讯。”你把录音存进一个文件夹，最终没有寄出去。你学会了一件事：有些人永远在演，看穿了，就走远一点。' },
  E2: { title: 'E2 档案', text: '你把整理好的材料交给了“青苔档案”。纪实长文发出来的那天，很多人第一次知道了鹿鸣的名字。晴晴又一次消失了。鹿鸣的家人第一次公开发声。' },
  E2S: { title: 'E2 档案 · 第五个版本', text: '你把材料交给了沈曼。一年后，一部剧上线了，片头写着“人名均为化名”。你在片尾字幕里看见了自己的故事——它被讲成了第五个版本。' },
  E3: { title: 'E3 下一个陈默', text: '冯逸的银行卡被冻了。后来，你听说他在朋友面前替她解释：“她只是被前任骗了。”你在他身上，看见了一年前的自己。' },
  E4: { title: 'E4 VAWA 陷阱', text: '她以家暴受害者的身份提交了申请。你面临刑事指控。律师问你：“你手里还有什么？”你翻遍了手机，找不到能说清那几年的东西。' },
  E4R: { title: 'E4 VAWA 陷阱 · 救赎辩护', text: '她以家暴受害者的身份提交了申请。可你留下了那段日子的记录：她一遍遍翻旧账、一次次刺激你；还有 Coco 的证词。你的律师把它们摊在桌上。你没有被定罪，只是再也回不到从前那个“凡事都好商量”的人。' },
  E5: { title: 'E5 共谋', text: '你的名字出现在一份新的卷宗里。最后一次见面，Harlow 探员对你说了同一句话：“这里是美国，不是南屿。”只是这一次，语气完全不同。' },
  E6: { title: 'E6 回家', text: '她在机场给你发了最后一条消息：“雨过就会天晴。”画面停在值机柜台前。你不知道她有没有登机。' },
};

// 结局幻灯片：每个人后来怎么样了
export function endingSlides(s) {
  const f = s.flags;
  const slides = [];
  slides.push(['芳姐', f.fang_testify ? '她作了证：“那段时间家里从来没有过一百万的珠宝。”律师说，她可以去申请证人的身份保护。' : f.fang_lost ? '她被辞退后失联了。听说她回了老家。' : '晴晴没再提保姆的事。芳姐换了一户人家做事。']);
  slides.push(['小吴', f.xiaowu_statement ? '他鼓起勇气写下了书面陈述。' : f.xiaowu_forced ? '他搬走了，只留下一张字条。' : '他一直不敢作证。“对不起，陈哥。”']);
  slides.push(['老钟、麦可、小莫', `${f.paid_xiaomo ? '小莫拿到谅解书，卡解冻了。' : '小莫的卡还冻着。'}老钟和麦可的账户，一年多以后仍未解冻。${f.helped_laozhong ? '老钟还是会请你去他店里喝茶。' : '老钟很久没给你打电话了。'}`]);
  slides.push(['小雯', f.xiaowen_lured ? '她收到了一条来自南屿的邀约。' : f.xiaowen_warned ? '她安全，也感激你那句提醒。' : f.xiaowen_failed || f.d_deleted ? '她警觉地删掉了你。' : '她还在国内，偶尔给你发个表情包。']);
  slides.push(['赵慧、周志强', f.gave_address ? '周志强出狱后去找了她。新闻里出现了一条模糊的社会新闻。' : '材料被退回了：“不属于本国管辖。”']);
  slides.push(['阿珍、老邝', s.stats.cred >= 30 ? '华埠的人说，老陈是被人骗了，人是好人。' : '华埠的人说起你，总是压低声音。']);
  slides.push(['冯逸', f.eric_clear ? '他清醒了。他留下了那些截图。' : f.eric_half ? '他半信半疑，开始自己留证据。' : '他成了下一个你。']);
  slides.push(['鹿鸣', '至今下落不明。']);
  return slides;
}
