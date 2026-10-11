// 12月4日她出门的三个小时里能调查的东西。键名是 qingqing_house_b 地图上的互动点 id。
// cost：耗费的游戏分钟。disturb: false 表示不会留下痕迹（默认会）。
// restore：放回原样的方式。order = 按原来的顺序放回；page = 停回原来的页面；close = 关上就行。
// 原来的样子只在第一次打开时告诉玩家（intro），放回去的时候要靠记忆。

export const CASE_NO = '2:24-cr-00417';

export const HEIST_OBJECTS = {
  b_boxes: {
    title: '保姆房的纸箱',
    intro: '你说“找不到了”的那些东西，都在这几个纸箱里：几件衣服、剃须刀，还有你那个旧包。',
    actions: [
      { id: 'bag', label: '把你的东西装进包里', cost: 5, disturb: false, text: '你把衣服和日用品塞进旧包里。等一下，你得拎着它从客厅走出去。', fx: { flags: { got_bag: true } } },
    ],
    restore: { type: 'close' },
  },

  b_camera: {
    title: '客厅的摄像头',
    intro: '客厅角落装着一个摄像头，红灯一闪一闪。它对着沙发和大门。',
    actions: [
      { id: 'look', label: '看清楚它拍得到哪里', cost: 2, disturb: false, text: '拍得到客厅和大门，拍不到主卧和保姆房。你拎包出门的那一下，躲不开。', fx: { flags: { camera_seen: true } } },
    ],
    restore: { type: 'close' },
  },

  b_suitcase: {
    title: '主卧的行李箱',
    intro: '箱子没有上锁。你打开它：最上面是一叠护照复印件，中间是厚厚的英文卷宗，最下面是一叠照片。',
    actions: [
      { id: 'flip', label: '翻翻卷宗的前几页', cost: 10, text: '起诉书、律师名单、开庭日期……大多是程序性的内容。有几页上，“kidnapping”和“murder”这两个词被人用笔圈了出来。' },
      { id: 'art4', label: '仔细读第4条', cost: 15, text: '“4. ……2024年6月末，两名受害者被诱骗至南屿圣罗莎港后遭绑架。家属支付约41万美元等值的虚拟货币赎金后，二人遇害。其中一名受害者为美国公民……”', fx: { flags: { read_art4: true } } },
      { id: 'caseno', label: '记下封面的案号', cost: 5, text: `封面右上角：Case No. ${CASE_NO}。你把它记了下来。`, fx: { jot: { id: `case:${CASE_NO}`, text: `案号 ${CASE_NO}（秦岳的卷宗）` } } },
      { id: 'photos', label: '看看那叠照片', cost: 10, text: '酒店、游艇、几个陌生男人。有一张里，秦岳搂着一个年纪和他相仿的女人，不是她。' },
      { id: 'passports', label: '看看护照复印件', cost: 10, text: '几本不同国家的护照，照片都是秦岳，名字各不相同。' },
    ],
    restore: { type: 'order', items: ['照片', '英文卷宗', '护照复印件'], answer: ['护照复印件', '英文卷宗', '照片'], prompt: '按原来的顺序放回去（从上到下）', cost: 5 },
  },

  b_phone: {
    title: '床头柜上的手机',
    intro: '她没带走手机。密码你早就知道。屏幕亮起来，停在微信的聊天列表。',
    actions: [
      { id: 'laogong', label: '看看备注“老公”的人', cost: 10, text: '备注“老公”的联系人，头像是一个三十多岁的男人，在健身房的镜子前自拍。最近一条：“宝贝，明天会所见。”', fx: { flags: { saw_eric: true }, jot: { id: 'eric', text: '她手机里的“老公”：健身房自拍的男人' } } },
      { id: 'father', label: '翻到和“爸”的聊天', cost: 15, text: '“我现在很后悔，当初对你寄予太高的期望……实在不行你就回来。”她回：“雨过就会天晴。我还是比很多人优秀的。”', fx: { flags: { saw_father: true } } },
      { id: 'fathernum', label: '记下“爸”的号码', cost: 5, requires: 'father', text: '一个国内的手机号。你抄在手机备忘录里。', fx: { jot: { id: 'father', text: '她父亲的电话' }, contact: 'father' } },
      { id: 'derrick', label: '看看 WhatsApp', cost: 10, text: '一段对话：她用一个新号码自称“Derrick”，加了一个叫 Rico 的人。对方只回了一句：“Where’s boss?” 然后就没有了。', fx: { flags: { saw_derrick: true }, jot: { id: 'rico', text: 'Rico 的 WhatsApp' }, contact: 'rico' } },
      { id: 'contacts', label: '抄下通讯录里的几个号码', cost: 10, text: 'Coco（美甲）、Maya（诊所）、Linda 郭、桂姨（以前的保姆）……你都抄了下来。', fx: { contact: 'coco', jot: [{ id: 'coco', text: 'Coco（美甲）的电话' }, { id: 'maya', text: 'Maya（诊所）的电话' }, { id: 'guiyi', text: '桂姨（以前的保姆）的电话' }] } },
    ],
    restore: { type: 'page', items: ['锁屏', 'WhatsApp', '微信聊天列表', '相册'], answer: '微信聊天列表', prompt: '手机原来停在哪个页面？', cost: 3 },
  },

  b_vanity: {
    title: '梳妆台的抽屉',
    intro: '抽屉半开着，东西塞得乱七八糟。',
    actions: [
      { id: 'receipts', label: '翻翻收据', cost: 5, text: '一叠医美收据。其中一张来自一家激光诊所：“纹身清除（颈部、手背）”，2024年11月，技师 Maya。', fx: { flags: { saw_tattoo_receipt: true } } },
      { id: 'cards', label: '看看那叠会员卡', cost: 5, text: '高尔夫、会所、美容院的会员卡，名字各不相同：Vivian Xu、Jiaqing、还有几张写着秦岳的英文名。' },
    ],
    restore: { type: 'close', cost: 2 },
  },
};
