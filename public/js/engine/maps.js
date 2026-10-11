// 地图定义。所有地图统一 1536×1024 世界坐标，与 assets/maps/*.png 尺寸一致。
// blocks：不可通行的方块（照地图图片里的墙、建筑、家具标出；没有图片时也用来画占位图）。
// spots：可互动的点（门、车、床、物件）。
// art：地图图片文件名（assets/maps/{art}.png），不写则与地图 id 相同。
// scale：人物行走图的放大倍数。室内图的家具画得比街景大，人物要跟着放大，不写则为 1。
// placeholder：还没有美术图，用 blocks 画占位图。美术到位后删掉这一行，并按画面调整 blocks / spots。
// 调整坐标时：地址加 ?debug，在控制台运行 __game.showBlocks()，会把方块和互动点叠在地图上。

export const WORLD_W = 1536;
export const WORLD_H = 1024;

// 墙 / 建筑（深色）和家具（棕色）只影响占位图的颜色
const wall = (x, y, w, h, label = '') => ({ x, y, w, h, c: '#2b2f36', label });
const thing = (x, y, w, h, label = '') => ({ x, y, w, h, c: '#6b5440', label });
// 室内外墙：左右两面墙，底边留出中间的门洞（顶墙各图自己画）
const room = () => [wall(0, 0, 60, 1024), wall(1476, 0, 60, 1024), wall(0, 964, 700, 60), wall(836, 964, 700, 60)];

export const MAPS = {
  chinatown_street: {
    name: '华埠',
    outdoor: true,
    floor: '#5a5f66',
    spawn: { x: 683, y: 400 },
    zones: [
      { x: 0, y: 345, w: 1536, h: 95, c: '#8a8578' },    // 北侧人行道
      { x: 280, y: 640, w: 1256, h: 145, c: '#8a8578' }, // 南侧人行道
    ],
    blocks: [
      wall(0, 0, 85, 350),
      wall(85, 0, 445, 350, '粤式茶餐厅'),
      wall(530, 0, 20, 350),
      wall(550, 0, 255, 350, '老邝租车行'),
      wall(805, 0, 265, 350, '停车场'),
      wall(1070, 0, 180, 350, '梅姨风水'),
      wall(1250, 0, 286, 350, '阿珍护肤直销'),
      thing(145, 425, 140, 75, '你的车'),
      thing(85, 560, 25, 30),                 // 灯柱（只挡底座，灯杆在画面里竖着越过马路）
      thing(768, 640, 24, 35),                // 路口灯柱底座
      thing(295, 445, 75, 60),                // 树池
      thing(925, 445, 75, 60),
      thing(1120, 445, 80, 60),
      thing(1400, 445, 80, 60),
      thing(1215, 430, 135, 75, '白色SUV'),
      thing(1475, 505, 61, 85),
      thing(36, 385, 20, 25),                 // 北侧人行道：灯柱底座、垃圾桶、消防栓
      thing(526, 395, 28, 38),
      thing(566, 405, 22, 28),
      thing(831, 405, 20, 27),
      thing(1050, 395, 46, 38),
      thing(1246, 362, 25, 60),
      thing(1505, 415, 22, 27),
      wall(0, 595, 310, 340, '唐记面包'),
      thing(110, 925, 120, 50),               // 长椅
      thing(310, 675, 45, 155),               // 面包店门口的盆栽
      thing(405, 690, 65, 60),
      thing(522, 725, 24, 35),                // 南侧路口灯柱底座
      thing(815, 655, 32, 62),                // 报刊箱
      thing(465, 800, 65, 95),
      thing(1000, 680, 65, 50),
      thing(1165, 610, 185, 110, '巴士站'),
      thing(1120, 650, 35, 55),               // 邮筒
      thing(1352, 660, 32, 55),               // 垃圾桶
      thing(1420, 740, 22, 30),               // 灯柱底座
      thing(1085, 735, 70, 50),               // 超市围栏前的灌木
      thing(1392, 730, 50, 55),
      wall(840, 785, 696, 239, '华人超市'),
      wall(1440, 610, 96, 175),
    ],
    spots: [
      { id: 'door_rental', kind: 'door', x: 683, y: 362, label: '进入租车行' },
      { id: 'car', kind: 'car', x: 215, y: 528, label: '开车' },
      { id: 'door_meiyi', kind: 'object', x: 1160, y: 362, label: '看看风水铺' },
    ],
  },

  rental_shop: {
    name: '老邝租车行',
    scale: 1.5,
    floor: '#6b5f52',
    spawn: { x: 775, y: 520 },
    blocks: [
      wall(0, 0, 1536, 255, '挂满车钥匙的墙'),
      wall(0, 255, 140, 300),
      thing(140, 245, 95, 145, '复印机'),
      thing(50, 385, 240, 230, '扶手椅'),
      thing(280, 280, 320, 155, '办公桌 · 旧电脑'),
      thing(365, 430, 85, 50),                // 椅子
      thing(975, 195, 305, 150, '旧皮沙发'),
      thing(1020, 330, 215, 100, '功夫茶具'),
      thing(1275, 180, 70, 125, '招财猫'),
      thing(1350, 255, 90, 205),
      thing(1405, 385, 40, 110),
      wall(1410, 255, 126, 769),
      wall(0, 555, 655, 165, '玻璃墙'),
      wall(895, 555, 641, 165, '玻璃墙'),
      thing(130, 725, 255, 270, '旧轿车'),
      thing(1155, 725, 260, 270, '旧轿车'),
    ],
    spots: [
      { id: 'door_street', kind: 'door', x: 775, y: 600, label: '回到街上' },
      { id: 'receipt_desk', kind: 'object', x: 520, y: 465, label: '看看桌上的收据' },
    ],
  },

  qingqing_house: {
    name: '晴晴家',
    scale: 1.5,
    art: 'qingqing_house_a',
    floor: '#7a6f62',
    spawn: { x: 1400, y: 470 },
    blocks: [
      wall(0, 0, 665, 465, '主卧（关着门）'),
      wall(640, 0, 305, 355, '保姆房'),
      wall(940, 0, 300, 100),
      thing(940, 90, 55, 105),                // 客房衣柜
      thing(990, 110, 95, 160, '客房的床'),
      thing(1150, 120, 85, 65),
      wall(1000, 300, 240, 55),
      wall(1235, 0, 301, 300, '浴室'),
      wall(640, 455, 50, 80),
      wall(745, 455, 510, 75),
      thing(940, 480, 315, 130, '厨房台面'),
      thing(780, 490, 70, 95),                // 盆栽
      thing(1310, 380, 50, 50),
      thing(1450, 385, 40, 70),
      wall(1500, 0, 36, 1024),
      wall(1250, 545, 286, 479),
      wall(1185, 690, 165, 334),
      thing(890, 590, 280, 220, '岛台'),
      thing(620, 630, 210, 205, '餐桌'),
      thing(50, 490, 85, 200, '电视'),
      thing(220, 475, 275, 110, '米色沙发'),
      thing(420, 480, 75, 245),
      thing(275, 600, 100, 75),
      thing(175, 655, 95, 95),
      thing(500, 520, 60, 170),
      thing(50, 650, 80, 110),
      wall(0, 455, 50, 569),
      wall(0, 770, 580, 254),
      wall(560, 835, 700, 189),
    ],
    spots: [
      { id: 'door_out', kind: 'car', x: 1400, y: 430, label: '出门开车' },
      { id: 'master_door', kind: 'object', x: 680, y: 400, label: '主卧的门' },
      { id: 'guest_bed', kind: 'object', x: 1120, y: 245, label: '客房的床' },
      { id: 'camera', kind: 'object', x: 170, y: 485, label: '客厅角落的摄像头' },
    ],
  },

  mall: {
    name: '西岭购物中心',
    scale: 1.25,
    floor: '#cfc8bb',
    spawn: { x: 785, y: 740 },
    blocks: [
      wall(0, 0, 1140, 170, '奢侈品店'),
      wall(1140, 0, 396, 330, '咖啡角'),
      wall(1300, 330, 236, 120),
      wall(0, 245, 500, 480, '扶梯'),
      thing(595, 290, 400, 385, '喷泉'),
      thing(1190, 425, 320, 275, '休息区'),
      wall(0, 765, 560, 259, '包袋店'),
      thing(580, 920, 60, 90),
      wall(630, 825, 310, 199, '服装店'),
      wall(995, 710, 541, 314),
    ],
    spots: [{ id: 'door_out', kind: 'car', x: 785, y: 800, label: '去停车场' }],
  },

  japantown: {
    name: '邻市日本城',
    art: 'japantown_sakura',
    outdoor: true,
    floor: '#a8a088',
    spawn: { x: 768, y: 880 },
    blocks: [
      wall(0, 0, 520, 1024, '五重塔 · 小吃摊'),
      wall(520, 760, 110, 264),
      wall(520, 0, 1016, 260, '石阶 · 舞台'),
      thing(590, 260, 165, 140, '樱花树'),
      thing(800, 270, 110, 150),
      thing(900, 280, 190, 180, '樱花树'),
      thing(630, 440, 235, 200, '樱花树 · 长椅'),
      thing(595, 550, 35, 85),
      thing(870, 550, 35, 85),
      thing(975, 385, 230, 170, '小吃摊'),
      thing(1260, 300, 220, 165, '灯笼摊'),
      thing(1330, 455, 206, 135),
      thing(1460, 500, 76, 240),
      wall(1000, 590, 536, 434, '池塘'),
      thing(620, 750, 30, 210),
      thing(850, 750, 30, 210),
      thing(870, 700, 130, 324),
      thing(985, 640, 30, 60),
      thing(680, 820, 25, 130, '鸟居'),
      thing(795, 820, 25, 130),
    ],
    spots: [],
  },

  parents_home: {
    name: '父母家',
    scale: 1.5,
    art: 'chen_parents_home',
    floor: '#8a7560',
    spawn: { x: 595, y: 900 },
    blocks: [
      wall(0, 0, 1536, 235),
      wall(0, 0, 395, 580, '厨房'),
      thing(570, 200, 245, 105),
      thing(760, 180, 100, 110),
      thing(890, 200, 40, 115),
      thing(930, 195, 300, 165, '沙发'),
      thing(1170, 200, 95, 65),
      thing(360, 230, 50, 430),
      thing(570, 315, 280, 295, '一桌家常菜'),
      thing(995, 380, 170, 120),
      thing(1145, 465, 120, 135),
      thing(1240, 500, 60, 100),
      thing(1270, 230, 130, 370, '电视'),
      wall(1280, 0, 256, 1024, '阳台'),
      wall(0, 580, 515, 444, '玄关'),
      wall(670, 650, 610, 374, '卧室'),
      wall(1000, 620, 280, 30),
    ],
    spots: [
      { id: 'door_out', kind: 'car', x: 595, y: 975, label: '出门开车' },
      { id: 'photos', kind: 'object', x: 880, y: 345, label: '墙上的全家福' },
    ],
  },

  golf_range: {
    name: '高尔夫练习场',
    outdoor: true,
    floor: '#5f8a4a',
    spawn: { x: 660, y: 700 },
    blocks: [
      wall(0, 0, 1536, 395, '球场'),
      wall(0, 395, 150, 629),
      wall(1395, 395, 141, 405),
      thing(150, 470, 250, 60),
      thing(420, 475, 45, 50),
      thing(495, 470, 270, 60),
      thing(830, 465, 565, 65),
      thing(110, 480, 160, 155, '凉亭'),
      thing(340, 530, 425, 100, '花园'),
      wall(815, 495, 621, 310, '会所咖啡'),
      thing(345, 640, 45, 110),
      thing(560, 640, 55, 110),
      thing(720, 640, 50, 110),
      thing(130, 710, 135, 110),
      thing(235, 820, 60, 100),
      thing(580, 820, 50, 100),
      thing(680, 795, 60, 130),
      thing(980, 820, 60, 130),
      wall(1300, 800, 236, 224),
      wall(0, 800, 130, 224),
    ],
    spots: [{ id: 'door_out', kind: 'car', x: 450, y: 760, label: '回到车上' }],
  },

  afternoon_tea: {
    name: '海景酒店 · 下午茶',
    scale: 1.5,
    floor: '#b89c84',
    spawn: { x: 768, y: 940 },
    blocks: [
      wall(0, 0, 1536, 230, '落地窗 · 海景'),
      thing(455, 180, 265, 115),
      thing(820, 180, 250, 115),
      thing(0, 230, 450, 290, '三角钢琴'),
      wall(0, 515, 330, 509, '楼梯'),
      thing(225, 580, 100, 130),
      thing(1240, 240, 296, 345, '甜点台'),
      thing(1090, 345, 90, 130),
      thing(1110, 460, 120, 125),
      thing(610, 330, 310, 135, '三层点心架'),
      thing(570, 470, 365, 165, '沙发'),
      thing(605, 625, 315, 105),
      wall(1260, 590, 276, 434),
      thing(1195, 600, 75, 135),
      thing(345, 770, 295, 150, '三层点心架'),
      thing(905, 775, 275, 150, '三层点心架'),
    ],
    spots: [{ id: 'door_out', kind: 'car', x: 768, y: 1000, label: '离开' }],
  },

  // ── 第二幕起的新地点（暂用占位图，见 docs/art/文生图素材清单_第二批.md）──────────
  casino_suite: {
    name: '沙漠赌场 · 套房',
    placeholder: true,
    scale: 1.5,
    floor: '#6a4e5e',
    spawn: { x: 768, y: 840 },
    zones: [{ x: 120, y: 120, w: 1296, h: 780, c: '#7a5d6c' }],
    blocks: [
      wall(0, 0, 1536, 120, '落地窗 · 沙漠夜景'),
      ...room(),
      thing(200, 180, 420, 260, '大床'),
      thing(900, 200, 380, 140, '沙发'),
      thing(980, 380, 220, 90, '茶几'),
      thing(200, 620, 260, 160, '吧台'),
      wall(1100, 600, 316, 300, '浴室'),
      thing(640, 140, 140, 50, '空调出风口'),
    ],
    spots: [
      { id: 'suite_sofa', kind: 'object', x: 1090, y: 360, label: '你今晚睡的沙发' },
      { id: 'door_out', kind: 'car', x: 768, y: 930, label: '离开套房' },
    ],
  },

  qingqing_house_b: {
    name: '晴晴的新家（橡树谷）',
    placeholder: true,
    scale: 1.5,
    floor: '#7d7364',
    spawn: { x: 768, y: 880 },
    zones: [
      { x: 60, y: 90, w: 600, h: 340, c: '#86786a' },    // 主卧
      { x: 690, y: 90, w: 410, h: 340, c: '#73695d' },   // 保姆房
      { x: 1130, y: 90, w: 346, h: 340, c: '#6f7466' },  // 书房
    ],
    blocks: [
      wall(0, 0, 1536, 90),
      ...room(),
      wall(660, 90, 30, 340), wall(1100, 90, 30, 340),
      wall(60, 430, 250, 30), wall(400, 430, 500, 30), wall(990, 430, 250, 30), wall(1330, 430, 146, 30),
      thing(100, 130, 300, 180, '主卧的床'),
      thing(410, 150, 50, 50),                // 床头柜
      thing(480, 110, 160, 90, '衣柜'),
      thing(720, 130, 200, 120, '保姆床'),
      thing(950, 120, 120, 150, '纸箱'),
      thing(1160, 120, 280, 100, '书桌'),
      thing(80, 560, 60, 220, '电视'),
      thing(200, 600, 360, 120, '沙发'),
      thing(800, 620, 300, 150, '餐桌'),
      thing(1200, 500, 250, 200, '厨房'),
    ],
    spots: [
      { id: 'door_out', kind: 'car', x: 768, y: 930, label: '出门开车' },
      { id: 'b_camera', kind: 'object', x: 120, y: 500, label: '客厅的摄像头' },
      { id: 'b_bills', kind: 'object', x: 1300, y: 260, label: '书桌上的账单' },
      { id: 'b_boxes', kind: 'object', x: 1000, y: 330, label: '保姆房的纸箱' },
      { id: 'b_suitcase', kind: 'object', x: 560, y: 330, label: '主卧的行李箱' },
      { id: 'b_phone', kind: 'object', x: 440, y: 260, label: '床头柜' },
      { id: 'b_vanity', kind: 'object', x: 250, y: 360, label: '梳妆台的抽屉' },
    ],
  },

  financial_district: {
    name: '金融区',
    placeholder: true,
    outdoor: true,
    floor: '#55606b',
    spawn: { x: 200, y: 640 },
    zones: [{ x: 0, y: 420, w: 1536, h: 140, c: '#8a8f96' }],
    blocks: [
      wall(0, 0, 600, 420, '“投行”大楼'),
      wall(640, 0, 420, 420, '联邦大楼'),
      wall(1100, 0, 436, 420, '法院'),
      thing(600, 300, 40, 120),
      thing(1060, 300, 40, 120),
      thing(560, 470, 20, 30), thing(1080, 470, 20, 30),   // 灯柱底座
      thing(100, 560, 200, 70, '你的车'),
      thing(900, 860, 300, 70, '长椅'),
    ],
    spots: [
      { id: 'car', kind: 'car', x: 200, y: 660, label: '开车' },
      { id: 'tower_door', kind: 'door', x: 300, y: 445, label: '“投行”大楼' },
      { id: 'tower_sign', kind: 'object', x: 500, y: 445, label: '大堂的楼层指示牌' },
      { id: 'fed_door', kind: 'door', x: 850, y: 445, label: '联邦大楼' },
      { id: 'court_door', kind: 'door', x: 1300, y: 445, label: '法院' },
    ],
  },

  mansion_hills: {
    name: '山景高地 · 豪宅',
    placeholder: true,
    scale: 1.5,
    floor: '#cbbfa8',
    spawn: { x: 768, y: 860 },
    blocks: [
      wall(0, 0, 1536, 110, '落地窗 · 山景'),
      ...room(),
      thing(1100, 110, 300, 300, '旋转楼梯'),
      thing(160, 180, 120, 240, '壁炉'),
      thing(400, 520, 420, 140, '真皮沙发'),
      thing(1000, 560, 300, 150, '大理石岛台'),
      thing(520, 160, 260, 100, '水晶吊灯下的长桌'),
    ],
    spots: [
      { id: 'door_out', kind: 'car', x: 768, y: 930, label: '离开' },
      { id: 'tools', kind: 'object', x: 1350, y: 800, label: '角落里的二手工具' },
    ],
  },

  chen_home: {
    name: '你的住处',
    placeholder: true,
    scale: 1.5,
    floor: '#7a7468',
    spawn: { x: 768, y: 860 },
    zones: [
      { x: 60, y: 90, w: 560, h: 340, c: '#857c6c' },    // 你的房间
      { x: 916, y: 90, w: 560, h: 340, c: '#6d6a60' },   // 小吴的房间
    ],
    blocks: [
      wall(0, 0, 1536, 90),
      ...room(),
      wall(620, 90, 296, 340, '浴室'),
      wall(60, 430, 220, 30), wall(370, 430, 250, 30), wall(916, 430, 300, 30), wall(1306, 430, 170, 30),
      thing(100, 130, 260, 160, '你的床'),
      thing(420, 120, 180, 80, '书桌'),
      thing(1200, 130, 240, 150, '小吴的床'),
      thing(120, 620, 380, 120, '旧沙发'),
      thing(1000, 600, 320, 160, '餐桌'),
    ],
    spots: [
      { id: 'door_out', kind: 'car', x: 768, y: 930, label: '出门开车' },
      { id: 'home_desk', kind: 'object', x: 510, y: 250, label: '你的书桌' },
      { id: 'home_door', kind: 'object', x: 900, y: 930, label: '门口的门铃' },
    ],
  },

  police_station: {
    name: '湾城警察分局',
    placeholder: true,
    scale: 1.5,
    floor: '#8a8f8c',
    spawn: { x: 768, y: 860 },
    zones: [{ x: 900, y: 90, w: 576, h: 380, c: '#777c7a' }],
    blocks: [
      wall(0, 0, 1536, 90, '布告栏'),
      ...room(),
      wall(870, 90, 30, 380), wall(900, 470, 300, 30), wall(1290, 470, 186, 30),
      thing(200, 200, 520, 110, '报案柜台'),
      thing(1050, 200, 260, 120, '询问室的桌子'),
      thing(140, 600, 360, 80, '等候长椅'),
    ],
    spots: [
      { id: 'door_out', kind: 'car', x: 768, y: 930, label: '离开警局' },
      { id: 'counter', kind: 'object', x: 460, y: 345, label: '报案柜台' },
      { id: 'interview', kind: 'object', x: 1245, y: 520, label: '询问室' },
    ],
  },

  seaside_restaurant: {
    name: '海滨大道 · 餐馆',
    placeholder: true,
    scale: 1.5,
    floor: '#9a7f66',
    spawn: { x: 768, y: 860 },
    blocks: [
      wall(0, 0, 1536, 110, '窗外是海'),
      ...room(),
      thing(200, 220, 220, 140, '餐桌'),
      thing(660, 300, 220, 140, '靠窗的餐桌'),
      thing(1100, 220, 220, 140, '餐桌'),
      thing(1150, 620, 280, 120, '吧台'),
    ],
    spots: [{ id: 'door_out', kind: 'car', x: 768, y: 930, label: '离开' }],
  },

  club_gym: {
    name: '会所 · 健身房',
    placeholder: true,
    scale: 1.5,
    floor: '#5d6670',
    spawn: { x: 768, y: 860 },
    blocks: [
      wall(0, 0, 1536, 110, '镜墙'),
      ...room(),
      thing(160, 200, 400, 120, '跑步机'),
      thing(900, 200, 460, 120, '器械区'),
      thing(300, 560, 300, 140, '休息区'),
      thing(1050, 600, 300, 120, '果汁吧'),
    ],
    spots: [{ id: 'door_out', kind: 'car', x: 768, y: 930, label: '离开' }],
  },
};

// 开车可去的目的地（顺序即菜单顺序）。
export const DESTINATIONS = [
  'chinatown_street', 'qingqing_house', 'mall', 'parents_home', 'golf_range', 'afternoon_tea',
  'casino_suite', 'qingqing_house_b', 'mansion_hills', 'financial_district', 'chen_home',
  'police_station', 'club_gym', 'seaside_restaurant',
];

// 开车到达时的落点。
export const ARRIVALS = {
  chinatown_street: { x: 300, y: 545 },
  qingqing_house: { x: 1400, y: 470 },
  mall: { x: 785, y: 740 },
  parents_home: { x: 595, y: 900 },
  golf_range: { x: 660, y: 700 },
  afternoon_tea: { x: 768, y: 940 },
  casino_suite: { x: 768, y: 840 },
  qingqing_house_b: { x: 768, y: 880 },
  mansion_hills: { x: 768, y: 860 },
  financial_district: { x: 200, y: 640 },
  chen_home: { x: 768, y: 860 },
  police_station: { x: 768, y: 860 },
  club_gym: { x: 768, y: 860 },
  seaside_restaurant: { x: 768, y: 860 },
};
