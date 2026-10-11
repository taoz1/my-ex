// 静态数据目录：说话人、证据、主张、认知锚点、版本档案话题。
// 只放数据，不放逻辑，方便编剧直接修改。

export const SPEAKERS = {
  chen: { name: '陈默', role: '你', color: '#d7aa3e', portrait: 'chen_mo' },
  qingqing: { name: '晴晴', role: '许晴 · Vivian', color: '#c98fa5', portrait: 'qingqing' },
  laokuang: { name: '老邝', role: '租车行老板', color: '#b46b4b', portrait: 'laokuang' },
  fangjie: { name: '芳姐', role: '住家保姆', color: '#8aa36b', portrait: 'fangjie' },
  chen_mother: { name: '妈妈', role: '陈默的母亲', color: '#9c8fb8', portrait: 'chen_mother' },
  qinyue: { name: '秦岳', role: '电话那头 · K', color: '#6b7a8f', portrait: 'qin_yue' },
  passerby: { name: '路人', role: '华埠街坊', color: '#7d8c99', portrait: null },
  narrator: { name: '', role: '旁白', color: '#9ba4ae', portrait: null },
  v_mother: { name: '妈妈的声音', role: '内心', color: '#b39ddb', portrait: null, voice: true },
  v_desire: { name: '欲望', role: '内心', color: '#e57373', portrait: null, voice: true },
  v_mediator: { name: '和事佬', role: '内心', color: '#81c784', portrait: null, voice: true },
  v_detective: { name: '老侦探', role: '内心', color: '#64b5f6', portrait: null, voice: true },
};

// 证据 / 物件。img 对应 assets/items/ 下的文件名（不含扩展名）。
export const EVIDENCE = {
  deposit_receipt: { name: '押金收据', img: 'deposit_receipt', desc: '老邝手写的租车押金收据：月租1500美元，押金1500美元。' },
  designer_sunglasses: { name: '她的墨镜', img: 'designer_sunglasses', desc: '晴晴第一次见面时戴的大号名牌墨镜。' },
  sakura_polaroid: { name: '樱花节合影', img: 'sakura_polaroid', desc: '樱花树下的合影。拍照时她把脸转开了，只露出侧脸。' },
  tattoo_arm: { name: '纹身', img: 'tattoo_arm', desc: '大腿和上臂各有一个男性头像，身上十几处英文。其中一句：“K is my lord, and I’m the slave”。颈部和手背有洗过的疤痕。' },
  case_file_page: { name: '卷宗第26条', img: 'case_file_page', desc: '“26. I have seen an Interpol Red Notice associated with this passport... charged with Illegally Absorbing Deposits from the Public...”她只给你看了这一段。' },
  cash_envelope: { name: '换汇的现金', img: 'cash_envelope', desc: '人民币转进朋友的国内账户，朋友在这边把美元现金当面交给她。' },
};

// 主张：某人说过的话。status: unverified（未核实）/ doubtful（存疑）/ overturned（已推翻）
export const CLAIMS = {
  casino_job: { who: 'qingqing', topic: 'qin_business', text: 'K 在南屿有合法赌场，月薪五万美元请人去打理。“你是美国公民，不用怕，那边很安全。”' },
  heiress: { who: 'qingqing', topic: 'family', text: '父亲是连锁五星酒店集团董事长，母亲在国内经营连锁医美中心。' },
  first_benz: { who: 'qingqing', topic: 'family', text: '父母给她买的第一辆车是奔驰；去英国留学只为历练自己。' },
  vip_member: { who: 'qingqing', topic: 'family', text: '她是香奈儿、迪奥的顶级会员，店员要“清场，专门为我一个人服务”。' },
  not_married: { who: 'qingqing', topic: 'qin_identity', text: '牢里的老秦不是丈夫，是男朋友，两人从未领证。' },
  financial_crime: { who: 'qingqing', topic: 'qin_identity', text: '老秦犯的是金融罪，因为涉嫌“非法集资”被捕。' },
  innocent_present: { who: 'qingqing', topic: 'qin_identity', text: '抓老秦时她也在场，但警察没带走她，“这足以证明我是清白的”。' },
  tattoo_forced: { who: 'qingqing', topic: 'tattoo', text: '纹身都是老秦在英国软禁她时逼她纹的。他身边有四个保镖、两个助理。' },
  tattoo_paid: { who: 'qingqing', topic: 'tattoo', text: '每纹一处纹身，老秦就给她一千万人民币作为补偿。' },
  cash_500k: { who: 'qingqing', topic: 'qin_assets', text: '她生日派对上，老秦让保镖提着五十万欧元现金砸在她面前。' },
  rolls_dragon: { who: 'qingqing', topic: 'qin_assets', text: '老秦在英国有辆定制劳斯莱斯，除了星空顶，启动时车顶还有一条龙划过去。' },
  blackout_tape: { who: 'qingqing', topic: 'qin_assets', text: '她睡觉怕光，老秦的助理每天提前去酒店，用黑胶带封死所有门缝窗缝。' },
  jet_ballast: { who: 'qingqing', topic: 'qin_assets', text: '他们坐大型私人飞机去瑞士度假，临时找几个留学生给飞机配重。' },
  coin_tip: { who: 'qingqing', topic: 'qin_assets', text: '她和老秦在英国的私人饭局上，提前得知了“总统币要发行”的内部消息。' },
  red_notice: { who: 'qingqing', topic: 'qin_identity', text: '卷宗第26条：老秦因“非法吸收公众存款”被红通。“他只是个经济犯。”' },
  accountant: { who: 'qingqing', topic: 'money', text: '国内转人民币的是她的“会计”。' },
};

// 认知锚点：玩家在第一幕被植入的认知，会在后面被推翻。
export const ANCHORS = {
  victim: { title: '她是被胁迫的受害者', text: '“我恨死这个男人了！这些都是他逼我纹的！”', effect: '调查类判断受干扰' },
  econ_only: { title: '他只是个经济犯', text: '卷宗第26条只写了非法吸收公众存款。', effect: '不会把他们和暴力犯罪联系起来' },
};

// 版本档案：同一话题，不同听众 / 不同时间的不同说法。
export const VERSION_TOPICS = {
  heiress: { title: '千金故事', hint: '她对每个新认识的人都要讲一遍。' },
  tattoo: { title: '纹身的来历', hint: '同一身纹身，她给过不止一种解释。' },
  chen_identity: { title: '“陈默是谁”', hint: '她怎么向别人介绍你。' },
};
