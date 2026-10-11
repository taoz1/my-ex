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
  uncle: { name: '街坊阿伯', role: '华埠的老街坊', color: '#8c7d6b', portrait: null },
  waiter: { name: '茶餐厅伙计', role: '华埠茶餐厅', color: '#a36b52', portrait: null },
  // 第二幕
  xiaowen: { name: '小雯', role: '国内的老朋友', color: '#d39b6a', portrait: 'xiaowen' },
  akang: { name: '阿康', role: '共同好友', color: '#6a9bd3', portrait: 'akang' },
  shenman: { name: '沈曼', role: '编剧 · 新房东', color: '#a78bc9', portrait: 'shenman' },
  azhen: { name: '阿珍', role: '护肤品直销', color: '#d36a8f', portrait: 'azhen' },
  linda: { name: 'Linda 郭', role: '豪宅经纪人', color: '#8fb3a0', portrait: 'linda' },
  laohe: { name: '老何', role: '二手工具的买家', color: '#8c8471', portrait: null },
  // 第三幕
  laozhong: { name: '老钟', role: '帮她换过汇的朋友', color: '#b07a4f', portrait: 'laozhong' },
  michael: { name: '麦可', role: '帮她换过汇的朋友', color: '#5f8fa8', portrait: 'michael' },
  xiaomo: { name: '小莫', role: '帮她换过汇的朋友', color: '#8fa85f', portrait: 'xiaomo' },
  // 第四幕
  zhaohui: { name: '赵慧', role: '国内 · 捞人骗局的受害者', color: '#a86f5f', portrait: 'zhaohui' },
  tongxue: { name: '老同学', role: '她初中的同学', color: '#7f8fa8', portrait: null },
  father: { name: '许建国', role: '电话那头 · 她的父亲', color: '#8a8070', portrait: null },
  rico: { name: 'Rico', role: 'WhatsApp', color: '#556070', portrait: null },
  coco: { name: 'Coco', role: '美甲师 · 她的“闺蜜”', color: '#d38fb3', portrait: 'coco' },
  // 第五幕
  police: { name: '湾城警察分局', role: '来电', color: '#5d7fa3', portrait: null },
  ramirez: { name: 'Ramirez 警官', role: '湾城警察分局', color: '#5d7fa3', portrait: 'ramirez' },
  kim: { name: 'Kim 警官', role: '湾城警察分局', color: '#7d9fb3', portrait: 'kim' },
  eric: { name: '冯逸', role: '她手机里的“老公”', color: '#a3825d', portrait: 'eric' },
  harlow: { name: 'Harlow 探员', role: '联邦调查局', color: '#4d6a80', portrait: 'harlow' },
  xiaowu: { name: '小吴', role: '你的房客', color: '#8a9a6a', portrait: 'xiaowu' },
  tony: { name: 'Tony Russo', role: '邻居', color: '#9a7a6a', portrait: null },
  unknown: { name: '陌生号码', role: '来电', color: '#777', portrait: null },
  // 终幕与尾声
  zhouzhiqiang: { name: '周志强', role: '电话那头 · 赵慧的丈夫', color: '#8a6a5a', portrait: null },
  qingtai: { name: '青苔档案', role: '纪实写作的博主', color: '#5a8a6a', portrait: null },
  narrator: { name: '', role: '旁白', color: '#9ba4ae', portrait: null },
  v_mother: { name: '妈妈的声音', role: '内心', color: '#b39ddb', portrait: null, voice: true },
  v_desire: { name: '欲望', role: '内心', color: '#e57373', portrait: null, voice: true },
  v_mediator: { name: '和事佬', role: '内心', color: '#81c784', portrait: null, voice: true },
  v_detective: { name: '老侦探', role: '内心', color: '#64b5f6', portrait: null, voice: true },
};

// 由 AI 扮演、能自由对话的角色（backend/npc-cards.mjs 里有角色卡）
export const AI_NPCS = ['qingqing', 'laokuang', 'fangjie', 'chen_mother', 'akang', 'xiaowen', 'shenman', 'azhen', 'linda', 'laozhong', 'michael', 'xiaomo', 'zhaohui', 'tongxue', 'coco', 'eric', 'xiaowu', 'uncle', 'waiter'];

// 证据 / 物件。img 对应 assets/items/ 下的文件名（不含扩展名）。
export const EVIDENCE = {
  deposit_receipt: { name: '押金收据', img: 'deposit_receipt', desc: '老邝手写的租车押金收据：月租1500美元，押金1500美元。' },
  designer_sunglasses: { name: '她的墨镜', img: 'designer_sunglasses', desc: '晴晴第一次见面时戴的大号名牌墨镜。' },
  sakura_polaroid: { name: '樱花节合影', img: 'sakura_polaroid', desc: '樱花树下的合影。拍照时她把脸转开了，只露出侧脸。' },
  tattoo_arm: { name: '纹身', img: 'tattoo_arm', desc: '大腿和上臂各有一个男性头像，身上十几处英文。其中一句：“K is my lord, and I’m the slave”。颈部和手背有洗过的疤痕。' },
  case_file_page: { name: '卷宗第26条', img: 'case_file_page', desc: '“26. I have seen an Interpol Red Notice associated with this passport... charged with Illegally Absorbing Deposits from the Public...”她只给你看了这一段。' },
  wanwan_chat: { name: '“玩一玩”', img: 'phone_chat', desc: '你和小雯的微信：“反正就是玩一玩。”她翻你手机时看到的就是这一句。' },
  qin_letter: { name: '狱中的手写信', img: 'qin_letter', desc: '秦岳关禁闭时写的信。劝她别再和他母亲吵架，末尾写着：“不要放弃我。”' },
  lease_b: { name: '新房的租约', img: 'lease', desc: '橡树谷新房的租约，房东沈曼。承租人一栏签的是你的名字：陈默。' },
  lawfirm_folder: { name: '律所的文件夹', img: 'lawfirm_folder', desc: '她从“投行”大楼下来时手里的文件夹，上面印着一家移民律所的标志。同一层楼的指示牌上也有这家律所。' },
  utility_bill: { name: '电费账单', img: 'utility_bill', desc: '新房的电费账单，户名：陈默。阿珍来的那天，它就摊在书桌上。' },
  member_form: { name: '直销会员登记', img: 'member_form', desc: '为了帮她“演戏”，你在阿珍那里登记了会员。' },
  fake_screenshot: { name: '“三千万被冻”截图', img: 'fake_screenshot', desc: '她发来的截图：她名下三千万人民币被冻结。字体边缘不太对。' },
  transfer_timeline: { name: '收款时间表', img: 'transfer_timeline', desc: '麦可整理的：每一笔人民币转进朋友账户的时间、金额，和当面交给她的美元现金。' },
  pattern_news: { name: '模式卡：新闻贴金', img: 'pattern_card', desc: '她总把新闻里的人说成自己认识的人。新闻里从来没有名字。' },
  luna_photo: { name: '三人合照', img: 'luna_photo', desc: '2023年5月：鹿鸣、一个侧着脸的年轻女子、一位年长女性。年轻女子的脖子上没有纹身。和你拍的樱花节照片放在一起，侧脸、鼻梁、下巴越看越像。' },
  k_chat: { name: '聊天截图', img: 'phone_chat', desc: '鹿鸣的朋友公开的截图。“星河妈”：“晴晴和K分手了，想出去玩几天。”署名“晴晴”的账号：“我已经到圣罗莎港啦，在酒店洗澡等你～”' },
  court_file: { name: '秦岳的卷宗', img: 'court_file', desc: '联邦法院公开卷宗。多套身份；2024年2月同日入境；5月结婚、8月申请绿卡、10月被捕；中文身份关联南屿绑架案。她的名字只出现在入境、同住、被捕时在场。' },
  zhaohui_list: { name: '赵慧的名单', img: 'zhaohui_list', desc: '赵慧每一笔转账的收款人：湖北、山东、东北……还有你的朋友们。' },
  money_flow: { name: '资金线', img: 'money_flow', desc: '赵慧“捞人”的钱，约85%进了她的手里；其余在2025年5月被“秦总的朋友”取走。' },
  our_chats: { name: '你们的聊天记录', img: 'phone_chat', desc: '从第一幕起自动存下来的微信：她叫你“老公”，说“我发现自己离不开你了”，让你搬过去住。' },
  call_log: { name: '12月4日的通话记录', img: 'call_log', desc: '12月4日下午，她打来电话：“你能不能过来帮我搬个家？”' },
  transfer_records: { name: '转账记录', img: 'transfer_records', desc: '九到十一月，她找你“借”的那几笔小钱：一百、两百、三百美元。' },
  your_things: { name: '你的包', img: 'your_bag', desc: '12月4日你拎走的包：几件衣服、剃须刀。都是她说“找不到了”的你的东西。' },
  inference_setup: { name: '推论卡：一个局？', img: 'pattern_card', desc: '12月4日叫你去搬家、借故出门三个小时、指纹、监控、你拎包出门……会不会从一开始就是一个局？（无法确认）' },
  coco_testimony: { name: 'Coco 的话', img: 'coco_note', desc: '“幸好你当初没有跟她结婚。”她跟 Coco 说过：结婚以后故意激怒对方、逼他动手，再以家暴受害者的身份去申请身份。' },
  door_footage: { name: '门铃录像', img: 'door_footage', desc: '四月初的录像：她带着一个男人在你家门口喊：“陈默诈骗了我几百万美金！”' },
  xiaowu_statement: { name: '小吴的书面陈述', img: 'statement', desc: '小吴写下了那天看到的事。' },
  pattern_audience: { name: '模式卡：表演给新观众', img: 'pattern_card', desc: '她在你家门口喊的话，是喊给身边那个男人听的：“你看我没骗你，真的有陈默这个人。”' },
  dinner_recording: { name: '晚餐的录音', img: 'recording', desc: '最后一次见面，她讲的“全部的真相”。你在口袋里录下了全程。' },
  fang_statement: { name: '芳姐的证词', img: 'statement', desc: '“那段时间家里从来没有过一百万的珠宝。”“她跟秦岳哭诉，说那个司机冲到她家，偷走了她很贵的首饰。”' },
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
  // 第二幕
  driver_coming: { who: 'qingqing', topic: 'qin_assets', text: '老秦答应给她安排司机和一辆新车，两人当着你的面讨论车型和颜色。' },
  house_bought: { who: 'qingqing', topic: 'family', text: '（对芳姐）“这房子是我买的，一百多万，先过渡一下。”' },
  interview_ok: { who: 'qingqing', topic: 'money', text: '投行面试很成功，“只是没有身份不能上班。你跟我结婚，我就能来上班了。”' },
  three_salons: { who: 'qingqing', topic: 'money', text: '（对阿珍）她合伙开了三家美容院，八月还有新店开张。' },
  // 第三幕
  audit: { who: 'qingqing', topic: 'money', text: '朋友的卡被冻“只是资金审查，正常的”。' },
  unfreeze_28: { who: 'qingqing', topic: 'money', text: '“28天以后就全部解封了。”' },
  frozen_30m: { who: 'qingqing', topic: 'money', text: '她名下有三千万人民币也被冻结了（她发来了截图）。' },
  zhaohui_client: { who: 'qingqing', topic: 'money', text: '赵慧不是会计，是“捞人”的委托人：老秦帮她狱中的丈夫联系律师，钱是律师费和保释金。' },
  reported_me: { who: 'qingqing', topic: 'money', text: '赵慧“不想认账，故意举报我”。' },
  dividend: { who: 'qingqing', topic: 'qin_assets', text: '年底新加坡公司会给她一百万美元分红，到时候大家的损失她都补偿。“分红的钱只能买奢侈品。”' },
  tianlong: { who: 'qingqing', topic: 'qin_assets', text: '新闻里湖蓝色定制豪车醉驾的“天龙人”，就是阿蓉的女儿。' },
  coin_wife: { who: 'qingqing', topic: 'qin_assets', text: '百亿数字币被没收的那个人，他老婆她认识，一起喝过下午茶。' },
  luna_v3: { who: 'qingqing', topic: 'luna', text: '那些消息是老秦拿她的手机发的；她被软禁了，她和老秦都在英国，没去南屿；接机的是一个叫 Rico 的人。' },
  meiyi_gua: { who: 'qingqing', topic: 'money', text: '梅姨算过：这个阶段家里不能有男人。你的东西“找不到了”。' },
  // 第五幕
  jewelry: { who: 'qingqing', topic: 'money', text: '（报警）她的司机12月4日非法进入住所，偷走了价值一百万美元的珠宝。' },
  chen_scam: { who: 'qingqing', topic: 'money', text: '（在你家门口）“陈默诈骗了我几百万美金！”' },
  // 终幕
  luna_v4: { who: 'qingqing', topic: 'luna', text: '鹿鸣是“外围”；在伦敦介绍了“坤哥”；派对的香槟被下了药；秦岳知道后说“那我就要搞她”，抢走她的手机、软禁她，邀约都是秦岳发的；鹿鸣“没死，被暹湾一个军方大佬看上了”。' },
  fang_blame: { who: 'qingqing', topic: 'money', text: '“误会啦……我现在怀疑是保姆偷的。”' },
  money_cut: { who: 'qingqing', topic: 'money', text: '“本来老秦说这些钱全部给我的，就是因为你太笨，在阿珍面前把咱俩的关系暴露了。”' },
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
  house: { title: '她住的房子', hint: '租的？买的？要看她在跟谁说。' },
  money: { title: '钱从哪来', hint: '会计、生意、老秦……' },
  luna: { title: '鹿鸣的事', hint: '一个失联的博主。她讲过不止一个版本。' },
};
