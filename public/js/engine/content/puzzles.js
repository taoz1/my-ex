// 小游戏数据：资金线拼合（第四幕，赵慧的名单）。
// 把每一笔钱判给最后拿到现金的人，算出“约85%进了她的手里”（docs/story/03 的 C08）。

export const PUZZLES = {
  money_flow: {
    title: '赵慧的名单：钱最后到了谁手里',
    prompt: '赵慧转出的每一笔人民币，都有人在湾城当面交了美元现金出去。看看每一笔现金是谁取走的。',
    options: ['晴晴', '秦岳指定的人'],
    rows: [
      { label: '2024年11月 · 20万 → 湖北一个账户（晴晴的第一任房东）。房东说，现金交给了“一个戴大墨镜的年轻女孩”。', amount: 20, answer: '晴晴' },
      { label: '2024年12月 · 35万 → 山东一个账户。收款人说，现金是在一家奶茶店当面给的，“她让我叫她 Vivian”。', amount: 35, answer: '晴晴' },
      { label: '2025年1月 · 30万 → 东北一个账户。收款人只记得“开奔驰来的，嫌我数钱慢”。', amount: 30, answer: '晴晴' },
      { label: '2025年2–4月 · 45万 → 老钟、麦可、小莫等人的账户。现金都是你在场时当面交给她的。', amount: 45, answer: '晴晴' },
      { label: '2025年5月 · 23万 → 一个从没听说过的账户。取现的人自称“秦总的朋友”，没留名字。', amount: 23, answer: '秦岳指定的人' },
    ],
    flag: 'money_flow_done',
    fx: { evidence: 'money_flow', flags: { money_flow_done: true } },
    then: 'a4_zhaohui_after',
  },
};

// picks：行号 -> 选项
export function checkPuzzle(id, picks) {
  const p = PUZZLES[id];
  if (p.rows.some((_, i) => !picks[i])) return { ok: false, text: '还有几笔没拼上。' };
  const wrong = p.rows.filter((row, i) => picks[i] !== row.answer).length;
  if (wrong) return { ok: false, text: `有 ${wrong} 笔对不上。再看看，现金最后是谁当面取走的。` };
  const total = p.rows.reduce((n, r) => n + r.amount, 0);
  const hers = p.rows.filter(r => r.answer === '晴晴').reduce((n, r) => n + r.amount, 0);
  return { ok: true, text: `一共 ${total} 万。其中 ${hers} 万，约 ${Math.round((hers / total) * 100)}%，进了她的手里。` };
}
