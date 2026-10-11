// 地图定义。所有地图统一 1536×1024 世界坐标，与 assets/maps/*.png 尺寸一致。
// blocks：不可通行的方块（也是没有美术图时的占位绘制）。
// spots：可互动的点（门、车、床、物件）。
// 美术图到位后，只需要按图微调 blocks 和 spots 的坐标。

export const WORLD_W = 1536;
export const WORLD_H = 1024;

const wall = (x, y, w, h) => ({ x, y, w, h, c: '#2b2f36' });
const frame = [wall(0, 0, WORLD_W, 32), wall(0, WORLD_H - 32, WORLD_W, 32), wall(0, 0, 32, WORLD_H), wall(WORLD_W - 32, 0, 32, WORLD_H)];

export const MAPS = {
  chinatown_street: {
    name: '华埠',
    outdoor: true,
    floor: '#5a5f66',
    spawn: { x: 590, y: 400 },
    zones: [
      { x: 32, y: 330, w: 1472, h: 90, c: '#8a8578' },   // 北侧人行道
      { x: 32, y: 640, w: 1472, h: 90, c: '#8a8578' },   // 南侧人行道
      { x: 60, y: 740, w: 520, h: 250, c: '#4b4f55' },   // 停车场
    ],
    blocks: [
      ...frame,
      { x: 80, y: 60, w: 300, h: 260, c: '#7a3b2e', label: '粤式茶餐厅' },
      { x: 440, y: 60, w: 300, h: 260, c: '#3e5a6e', label: '老邝租车行' },
      { x: 800, y: 60, w: 260, h: 260, c: '#5b3e6e', label: '梅姨风水' },
      { x: 1120, y: 60, w: 360, h: 260, c: '#3e6e5a', label: '阿珍护肤直销' },
      { x: 700, y: 760, w: 320, h: 230, c: '#8a6a3e', label: '唐记面包' },
      { x: 1100, y: 760, w: 380, h: 230, c: '#4e4e6e', label: '华人超市' },
      { x: 110, y: 790, w: 120, h: 70, c: '#6d7a86', label: '旧轿车' },
    ],
    spots: [
      { id: 'door_rental', kind: 'door', x: 590, y: 340, label: '进入租车行' },
      { id: 'car', kind: 'car', x: 420, y: 830, label: '开车' },
      { id: 'door_meiyi', kind: 'object', x: 930, y: 340, label: '看看风水铺' },
    ],
  },

  rental_shop: {
    name: '老邝租车行',
    floor: '#6b5f52',
    spawn: { x: 768, y: 900 },
    blocks: [
      ...frame,
      { x: 32, y: 32, w: 1472, h: 120, c: '#4a4038', label: '挂满车钥匙的墙' },
      { x: 180, y: 360, w: 360, h: 110, c: '#5c3a2a', label: '旧皮沙发' },
      { x: 240, y: 520, w: 240, h: 90, c: '#7a5a3a', label: '茶几 · 功夫茶具' },
      { x: 960, y: 300, w: 380, h: 140, c: '#3a3f46', label: '办公桌 · 旧电脑' },
      { x: 1360, y: 200, w: 100, h: 100, c: '#b8c4cc', label: '饮水机' },
      { x: 1100, y: 640, w: 80, h: 80, c: '#d4a73a', label: '招财猫' },
    ],
    spots: [
      { id: 'door_street', kind: 'door', x: 768, y: 960, label: '回到街上' },
      { id: 'receipt_desk', kind: 'object', x: 1150, y: 470, label: '看看桌上的收据' },
    ],
  },

  qingqing_house: {
    name: '晴晴家',
    floor: '#7a6f62',
    spawn: { x: 768, y: 900 },
    zones: [
      { x: 32, y: 32, w: 480, h: 380, c: '#5e4e5a' },   // 主卧
      { x: 528, y: 32, w: 400, h: 380, c: '#5a5f52' },  // 保姆房
      { x: 944, y: 32, w: 560, h: 380, c: '#52585e' },  // 客房
    ],
    blocks: [
      ...frame,
      wall(32, 412, 496, 24), wall(512, 32, 16, 380), wall(528, 412, 260, 24), wall(928, 32, 16, 380),
      wall(868, 412, 160, 24), wall(1108, 412, 396, 24),
      { x: 80, y: 80, w: 260, h: 180, c: '#2a2026', label: '主卧 · 遮光帘' },
      { x: 580, y: 80, w: 160, h: 220, c: '#3e4436', label: '保姆的床' },
      { x: 1180, y: 80, w: 220, h: 200, c: '#3a4652', label: '客房的床' },
      { x: 300, y: 560, w: 420, h: 120, c: '#c8b89a', label: '米色沙发' },
      { x: 1100, y: 560, w: 360, h: 140, c: '#9aa3a8', label: '厨房' },
      { x: 60, y: 820, w: 160, h: 120, c: '#5e4a3a', label: '购物袋' },
      { x: 1440, y: 460, w: 40, h: 40, c: '#e05555', label: '' },
    ],
    spots: [
      { id: 'door_out', kind: 'car', x: 768, y: 960, label: '出门开车' },
      { id: 'master_door', kind: 'object', x: 470, y: 440, label: '主卧的门' },
      { id: 'guest_bed', kind: 'object', x: 1290, y: 300, label: '客房的床' },
      { id: 'camera', kind: 'object', x: 1440, y: 520, label: '客厅角落的摄像头' },
    ],
  },

  mall: {
    name: '西岭购物中心',
    floor: '#cfc8bb',
    spawn: { x: 768, y: 900 },
    blocks: [
      ...frame,
      { x: 80, y: 60, w: 300, h: 220, c: '#2e2e3a', label: '奢侈品店' },
      { x: 440, y: 60, w: 300, h: 220, c: '#3a2e2e', label: '珠宝店' },
      { x: 800, y: 60, w: 300, h: 220, c: '#2e3a34', label: '包袋店' },
      { x: 1160, y: 60, w: 300, h: 220, c: '#3a342e', label: '咖啡角' },
      { x: 660, y: 440, w: 220, h: 160, c: '#7fb3c4', label: '喷泉' },
      { x: 120, y: 620, w: 200, h: 60, c: '#8a7a64', label: '长椅' },
      { x: 1200, y: 640, w: 200, h: 60, c: '#8a7a64', label: '长椅' },
    ],
    spots: [{ id: 'door_out', kind: 'car', x: 768, y: 960, label: '去停车场' }],
  },

  japantown: {
    name: '邻市日本城',
    outdoor: true,
    floor: '#a8a088',
    spawn: { x: 768, y: 900 },
    blocks: [
      ...frame,
      { x: 680, y: 60, w: 180, h: 260, c: '#7a4a3a', label: '五重塔' },
      ...[[160, 200], [360, 160], [1040, 160], [1260, 220], [200, 560], [1280, 560], [500, 640], [1020, 640]]
        .map(([x, y]) => ({ x, y, w: 110, h: 110, c: '#e8a7bf', label: '樱花树' })),
      { x: 80, y: 820, w: 260, h: 120, c: '#a8553a', label: '小吃摊' },
      { x: 1200, y: 820, w: 260, h: 120, c: '#a8553a', label: '灯笼摊' },
    ],
    spots: [],
  },

  parents_home: {
    name: '父母家',
    floor: '#8a7560',
    spawn: { x: 768, y: 900 },
    blocks: [
      ...frame,
      { x: 600, y: 360, w: 340, h: 220, c: '#6a4a32', label: '一桌家常菜' },
      { x: 120, y: 120, w: 340, h: 120, c: '#4a5a6a', label: '旧沙发 · 电视' },
      { x: 1100, y: 100, w: 340, h: 160, c: '#9aa3a8', label: '小厨房' },
      { x: 1200, y: 700, w: 240, h: 200, c: '#5a7a4a', label: '阳台盆栽' },
      { x: 80, y: 500, w: 40, h: 260, c: '#8a6a4a', label: '' },
    ],
    spots: [
      { id: 'door_out', kind: 'car', x: 768, y: 960, label: '出门开车' },
      { id: 'photos', kind: 'object', x: 100, y: 480, label: '墙上的全家福' },
    ],
  },

  golf_range: {
    name: '高尔夫练习场',
    outdoor: true,
    floor: '#5f8a4a',
    spawn: { x: 768, y: 900 },
    blocks: [
      ...frame,
      ...[0, 1, 2, 3, 4, 5].map(i => ({ x: 120 + i * 220, y: 520, w: 180, h: 70, c: '#7a6a52', label: `${i + 1}号打位` })),
      { x: 560, y: 80, w: 420, h: 60, c: '#e8e2d5', label: '100 码' },
      { x: 1180, y: 760, w: 300, h: 200, c: '#6a5a4a', label: '会所咖啡' },
    ],
    spots: [{ id: 'door_out', kind: 'car', x: 768, y: 960, label: '回停车场' }],
  },

  afternoon_tea: {
    name: '海景酒店 · 下午茶',
    floor: '#b89c84',
    spawn: { x: 768, y: 900 },
    blocks: [
      ...frame,
      { x: 32, y: 32, w: 1472, h: 100, c: '#7fb3c4', label: '落地窗 · 海景' },
      ...[[200, 300], [560, 300], [920, 300], [1280, 300], [380, 600], [1100, 600]]
        .map(([x, y]) => ({ x: x - 70, y: y - 50, w: 140, h: 100, c: '#e8dcc8', label: '三层点心架' })),
      { x: 640, y: 560, w: 240, h: 120, c: '#1e1e22', label: '三角钢琴' },
    ],
    spots: [{ id: 'door_out', kind: 'car', x: 768, y: 960, label: '离开' }],
  },
};

// 开车可去的目的地（顺序即菜单顺序）。
export const DESTINATIONS = ['chinatown_street', 'qingqing_house', 'mall', 'parents_home', 'golf_range', 'afternoon_tea'];

// 开车到达时的落点。
export const ARRIVALS = {
  chinatown_street: { x: 420, y: 760 },
  qingqing_house: { x: 768, y: 880 },
  mall: { x: 768, y: 880 },
  parents_home: { x: 768, y: 880 },
  golf_range: { x: 768, y: 880 },
  afternoon_tea: { x: 768, y: 880 },
};
