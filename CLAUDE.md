# 项目说明（给 Claude 的交接文档）

## 项目
《第四个版本》：基于纪实故事《我的前任是逃犯》改编的 AI NPC 都市开放世界 RPG，网页 2D。叙事设计见 `docs/story/01`–`07`，运行与目录结构见 `README.md`。

## 已确定的决定（用户确认过，不要擅自改）
- 技术栈：沿用 https://github.com/taoz1/the-last-shift 的架构。零依赖原生 ES 模块 + Canvas 2D + Node 内置 http 服务器 + `node:test`。代码要写成可读的多文件格式，不要压缩。
- AI 模型：DeepSeek，只在服务端调用（`backend/api.mjs`），Key 放 `.env` 的 `DEEPSEEK_API_KEY`。没配 Key 时用 `public/js/local-replies.js` 的本地回应。
- 里程碑：第一版是「序章 + 第一幕」，已完成。下一步是第二幕「裂」（剧情见 `docs/story/05_主线剧情.md`）。
- 分支：每次直接推 `main`。
- 美术：用户用文生图生成，按 `docs/art/文生图素材清单_第一批.md` 的文件名放进 `assets/`。默认画风是 16-bit 像素风、俯视 3/4 视角。
- 所有人名、地名虚构化（对照表见 `docs/story/02_原作拆解与改编原则.md`），游戏里不出现原作人名和真实地名。失踪者的下落在任何结局都不揭晓。

## 工作方式
- 有不确定的地方先问用户，不要自己武断决定。
- 改剧情或引擎后运行 `npm run check`（语法检查 + 测试，测试里有一条从序章打到第一幕结束的自动通关）。
- 浏览器调试：地址加 `?debug`，控制台用 `__game.state`、`__game.driveTo(id)`、`__game.teleport(x, y)`。

## 待用户决定的问题
1. DeepSeek 默认模型名：目前是照搬参考项目的 `deepseek-flash`，可用 `DEEPSEEK_MODEL` 覆盖。
2. 部署方式：`npm run build` 会把图片以 base64 内嵌进单文件 Worker，素材多时包很大。
3. 第二幕开工时机：先放素材试玩调整，还是直接开写。

## 素材到位后要做的事
- 地图图片（1536×1024）换上后，按画面调整 `public/js/engine/maps.js` 的碰撞方块（blocks）、互动点（spots）和 `public/js/engine/story.js` 里 NPC 的站位坐标，然后跑 `npm test`（地图可达性测试会检查每个人物和互动点都走得到）。
- 检查行走图的 4 个朝向顺序（下、左、右、上）和头像的透明背景；如果用了品红色 #FF00FF 代替透明，需要在加载时抠色（目前还没实现）。
