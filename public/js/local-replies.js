// 没配置 DeepSeek 时的本地回应：按关键词挑一句，否则轮换。
const REPLIES = {
  qingqing: {
    keys: [
      [/工作|赌场|南屿|五万/, ['具体的老秦会安排的呀，你急什么。', '那边的事复杂，等老秦出来就好了。'], 'neutral'],
      [/结婚|娶|嫁/, ['你要是真心待我，我们什么时候结都行。', '你说话算话哦。'], 'sweet'],
      [/钱|多少|有钱/, ['钱的事你别管。老秦说快了，快了。', '呸呸呸，你别乌鸦嘴。'], 'cold'],
      [/纹身|K|老秦|男朋友/, ['别提他了，我现在眼里只有你。', '我跟他在一起受了那么多苦，这些罪不能白遭。'], 'wronged'],
      [/英国|伦敦|家里|爸|妈/, ['我爸在国内做五星酒店，我来这边就是体验生活。', '以后有机会，我带你去伦敦见识一下真正的世面。'], 'neutral'],
      [/骗|真的假的|不信|怀疑/, ['你什么意思？你是不是不相信我？', '真正喜欢我的人，都会站在我这一边。'], 'angry'],
    ],
    fallback: ['嗯哼，然后呢？', '你这个人真有意思。', '今天陪我去喝个下午茶吧。'],
    emotion: 'sweet',
  },
  laokuang: {
    keys: [
      [/警察|报警/, ['别提警察！我一句英文都不会。'], 'panic'],
      [/押金|钱|退/, ['规矩就是规矩，钱的事我不能吃亏。'], 'neutral'],
      [/她|晴晴|女人|来头/, ['听说她男人是个红通犯，来头不小。以后多照应，总没坏处。'], 'neutral'],
    ],
    fallback: ['老陈，喝杯茶再走。', '最近生意一般，车子空着也是空着。'],
    emotion: 'neutral',
  },
  fangjie: {
    keys: [
      [/晴晴|她/, ['晴晴好厉害的呀，听说家里是开五星酒店的。', '她讲的那些啊，我都听过好几遍啦。'], 'neutral'],
      [/秦|男朋友|电话/, ['这个……陈先生，你别问我，我什么都不知道。'], 'neutral'],
      [/你|家|多久/, ['我在这边做保姆好多年了，换了好几家。'], 'neutral'],
    ],
    fallback: ['陈先生，要不要喝点汤？', '哎呀，我去厨房看看火。'],
    emotion: 'neutral',
  },
  chen_mother: {
    keys: [
      [/她|晴晴|女孩/, ['妈不是说她不好。只是你别太急。', '一个人说的话，你得自己去看。'], 'neutral'],
      [/身体|爸/, ['都好，都好。你自己多照顾自己。'], 'neutral'],
    ],
    fallback: ['默默，吃饭了没有？', '你从小就心软，妈知道。'],
    emotion: 'neutral',
  },
};

export function localReply(npc, message, turn = 0) {
  const book = REPLIES[npc];
  if (!book) return { reply: '……', emotion: 'neutral' };
  for (const [pattern, lines, emotion] of book.keys) {
    if (pattern.test(message)) return { reply: lines[turn % lines.length], emotion };
  }
  return { reply: book.fallback[turn % book.fallback.length], emotion: book.emotion };
}
