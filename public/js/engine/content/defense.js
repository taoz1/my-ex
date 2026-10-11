// 第五幕 MQ-24：警局笔录（辩护）。两位警官依次提问，玩家从证据里出示材料，或者说一句话。
// 警官是中立的规则执行者：只看证据，不看情绪。情绪化地指控她会扣分。
// good：能反驳这一条指控的证据或陈述；when：这一问什么时候会被问到。

export const OFFICERS = { ramirez: 'Ramirez 警官', kim: 'Kim 警官' };

export const STATEMENTS = {
  stmt_prove: '我从来没见过什么珠宝。她得先证明这些珠宝存在。',
  stmt_lived: '那段时间我经常住在那里，指纹当然会有。',
  stmt_angry: '她是个骗子！她跟南屿的绑架案有关！',
  stmt_soft: '……是不是有什么误会？我可以去跟她谈谈。',
};

export const EMOTIONAL = ['stmt_angry'];

export const QUESTIONS = [
  {
    id: 'driver',
    who: 'ramirez',
    ask: s => `许小姐说，你是她雇的司机。${s.flags.admitted ? '她还说你翻过她的东西。' : ''}`,
    good: ['our_chats', 'wanwan_chat'],
    yes: '……她在聊天里叫你“老公”，说“离不开你”。（他把手机推给 Kim 看）这不太像司机。',
    no: '这不能说明你们是什么关系。',
  },
  {
    id: 'entry',
    who: 'kim',
    ask: () => '12月4日，你进了她的住所。她说你没有得到允许。',
    good: ['call_log', 'lease_b', 'utility_bill'],
    yes: '那天是她打电话叫你去的……租约和账单上，承租人是你。',
    no: '这不能说明你是被允许进去的。',
  },
  {
    id: 'prints',
    who: 'ramirez',
    when: s => s.flags.lie_judged,
    ask: () => '房子里到处是你的指纹。',
    good: ['stmt_lived', 'lease_b'],
    yes: '……你是承租人，在那里住过。指纹说明不了什么。',
    no: '那你解释一下指纹。',
  },
  {
    id: 'jewelry',
    who: 'ramirez',
    ask: () => '她说丢了价值一百万美元的珠宝。',
    good: ['stmt_prove'],
    yes: '（他在本子上写了一笔）我们会请她提供购买记录和照片。',
    no: '我们问的是珠宝。',
  },
  {
    id: 'motive',
    who: 'kim',
    ask: () => '你为什么要偷她的东西？',
    good: ['transfer_records'],
    yes: '（Kim 翻着转账记录，笑了一下）她有一百万美元的珠宝，还找你借一百美元？',
    no: '这回答不了我的问题。',
  },
  {
    id: 'bag',
    who: 'ramirez',
    ask: () => '客厅的监控拍到你拎着一个包离开。包里是什么？',
    good: ['your_things'],
    yes: '衣服、剃须刀……是她说“找不到了”的你的东西。',
    no: '那包里到底是什么？',
  },
];

// 这一次笔录会问到的问题
export function questionsFor(state) {
  return QUESTIONS.filter(q => !q.when || q.when(state));
}

// 回答一题：answer 是证据 id 或陈述 id。返回 { delta, text }
export function answer(question, id) {
  if (EMOTIONAL.includes(id)) return { delta: -1, text: '我们只关心事实。' };
  if (question.good.includes(id)) return { delta: 1, text: question.yes };
  return { delta: 0, text: question.no };
}

// 满分是问题数；达到这个比例，警官就看出来报案站不住
export const PASS_RATIO = 0.6;
