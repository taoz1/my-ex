# 第四个版本：AI NPC 都市开放世界 RPG（网页 2D）

以纪实故事《我的前任是逃犯》为基础改编的 2D 网页 RPG。你是湾城华人圈的“和事佬”陈默，一场租车纠纷让你认识了自称富家千金的晴晴。

当前可玩范围：**序章 + 第一幕「饵」**。

## 运行

需要 Node.js 22.9 或更高版本，零依赖，不用 `npm install`。

```sh
cp .env.example .env     # 在 .env 中填写 DEEPSEEK_API_KEY（可选）
npm run dev              # 打开 http://localhost:3000
```

- 没有配置 DeepSeek 时，游戏照常可玩，AI 闲聊改用本地预设回应。
- API Key 只在服务端读取，不会发给浏览器。

| 命令 | 作用 |
|---|---|
| `npm run dev` | 启动开发服务器（端口 3000，可用 `PORT` 改） |
| `npm test` | 运行全部测试（剧情脚本、自动通关、地图可达性、API） |
| `npm run check` | 语法检查 + 测试 |
| `npm run build` | 打包成单文件 Worker：`dist/server/index.js` |

## 操作

`WASD`/方向键 移动 · `E`/空格 互动、继续对话 · 数字键 选选项 · `P` 手机 · `Esc` 结束闲聊

## 目录结构

```
public/                 前端（原生 ES 模块 + Canvas 2D）
  js/engine/            纯逻辑，可在 Node 中测试
    catalog.js          说话人、证据、主张、认知锚点、版本档案话题
    quests.js           主线任务
    maps.js             地图（碰撞方块、互动点、开车目的地）
    story.js            NPC 站位、互动规则、全部剧情脚本
    script.js           剧情脚本解释器
    state.js            游戏状态、效果结算、存档
    world.js            移动与碰撞
  js/main.js            游戏循环、输入、对话 / 手机 / 开车、存档
  js/render.js          地图与人物渲染（有素材画素材，没有画占位图）
  js/panels.js          侧栏：任务、线索板、版本档案
  js/local-replies.js   未配置 AI 时的本地回应
backend/
  api.mjs               /api/status、/api/dialogue（DeepSeek，服务端调用）
  npc-cards.mjs         AI NPC 角色卡与场景目标（只在服务端）
assets/                 美术素材（见 docs/art/文生图素材清单_第一批.md）
docs/story/             叙事设计文档
tests/                  node:test 测试
```

## 美术素材

按 `docs/art/文生图素材清单_第一批.md` 生成图片，放进 `assets/` 对应文件夹即可，文件名不要改。代码会自动加载：有图就画图，没图就用色块占位。

地图图片尺寸为 1536×1024，与地图世界坐标一致。换上地图图片后，可能需要按画面微调 `public/js/engine/maps.js` 里的碰撞方块和互动点坐标。

## 写剧情

剧情脚本在 `public/js/engine/story.js` 的 `SCRIPTS` 里，步骤格式见 `public/js/engine/script.js` 顶部注释。改完运行 `npm test`：测试会检查所有跳转是否有效，并自动从序章打到第一幕结束。

## 调试

地址加 `?debug`（如 `http://localhost:3000/?debug`），浏览器控制台里可以用 `__game`：`__game.state` 查看状态，`__game.driveTo('mall')` 直接开车，`__game.teleport(x, y)` 瞬移。

## 叙事设计文档

| 文档 | 内容 |
|---|---|
| [01 调研：开放世界RPG叙事设计框架](docs/story/01_调研_开放世界RPG叙事设计框架.md) | 叙事分层、支线原则、选择结构、三线索原则、storylet、AI NPC 案例 |
| [02 原作拆解与改编原则](docs/story/02_原作拆解与改编原则.md) | 主题、时间线、素材→玩法、虚构化原则、人名对照表 |
| [03 改编总纲](docs/story/03_改编总纲_世界观与结构.md) | 体验支柱、地图、真相层、五幕结构、结局 |
| [04 角色圣经](docs/story/04_角色圣经_AI_NPC.md) | AI NPC 角色卡 |
| [05 主线剧情](docs/story/05_主线剧情.md) | 主线任务与结局 |
| [06 支线剧情](docs/story/06_支线剧情.md) | 22 条支线 |
| [07 AI NPC 叙事系统设计](docs/story/07_AI_NPC叙事系统设计.md) | 知识分层、谎言账本、三角印证等系统 |
