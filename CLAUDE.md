# 项目说明（给 Claude 的交接文档）

## 项目
《第四个版本》：基于纪实故事《我的前任是逃犯》改编的 AI NPC 都市开放世界 RPG，网页 2D。叙事设计见 `docs/story/01`–`07`，运行与目录结构见 `README.md`。

## 已确定的决定（用户确认过，不要擅自改）
- 技术栈：沿用 https://github.com/taoz1/the-last-shift 的架构。零依赖原生 ES 模块 + Canvas 2D + Node 内置 http 服务器 + `node:test`。代码要写成可读的多文件格式，不要压缩。
- AI 模型：DeepSeek，只在服务端调用（`backend/api.mjs`），Key 放 `.env` 的 `DEEPSEEK_API_KEY`。AI 没接通时**不要**用假的本地回应：剧情照常，NPC 自由对话显示“AI 未连接”和具体原因（用户要求）。`/api/status` 会真正连一次 DeepSeek 校验 Key 和模型名。
- 里程碑：第一版是「序章 + 第一幕」，已完成。下一步是第二幕「裂」（剧情见 `docs/story/05_主线剧情.md`）。
- 分支：每次直接推 `main`。
- 对话完全开放：剧情里不列选项，玩家直接打字。
- AI NPC 统一用“理解 → 决定 → 说话”三步（用户确认的方案，参考 Façade、He et al. 2018 谈判对话、Meta CICERO）：
  1. 理解 `/api/understand`：AI 只把玩家的话归类成一种行为 act（支持、质疑、施压、提方案、要走……，定义在 `backend/npc-cards.mjs` 的 `ACTS`），附带话题和数额。
  2. 决定（浏览器里的游戏逻辑，不靠 AI）：剧情关键处按选项的 `on` 匹配（`script.js` 的 `matchOption`，`'*'` 兜底，`once` 只走一次）；对不上时按 `engine/minds.js` 的性格规则定意图，并改 NPC 的信任值 `state.minds`。
  3. 说话 `/api/speak`：AI 按决定好的意图（`INTENTS`）和此刻立场（场景的 `stances`，由 `story.js` 的 `STANCES` 选）用角色口吻说出来。讨价还价场景（有 `numbers`）里 NPC 说出没人提过的数字会被拒绝并重试。
  新写的剧情选项都要写 `on`；新场景在 `CHOICE_SCENES` 配场景。AI 没接通时，有分支的选项点走不下去（会显示原因）。
- 侧栏只保留任务说明和手机。属性、笔记、线索、版本档案仍在存档里记录（第一幕结束的总结会用），只是不显示。
- 室内地图的人物按 `maps.js` 里的 `scale` 放大（租车行、晴晴家、父母家、下午茶 1.5，商场 1.25）。路灯这类竖着的物件只挡底座。
- 开场不交代：进门不播旁白，让玩家自己找 NPC 聊。NPC 想主动找玩家时，在 `story.js` 的 `PLACEMENTS` 里给它加 `approach: { when, script, delay }`，它会在进图 delay 秒后走到玩家跟前开口（`world.js` 的 `updateApproach`）。序章的老邝就是这样。
- 头像是透明底半身像，直接站在对话框底边上，不加底色和边框；图片没下载完时先不显示。
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

## 美术素材现状
- 第一批 37 张素材已入库，碰撞方块、互动点、NPC 站位已按地图图片对齐（`public/js/engine/maps.js`、`story.js` 的 PLACEMENTS）。
- 新增或替换地图图片后：在浏览器 `?debug` 下运行 `__game.showBlocks()` 查看方块叠加，调好后跑 `npm test`（地图可达性测试会检查每个人物和互动点都走得到，并检查每张地图都有图片）。
