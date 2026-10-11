# 01 调研：开放世界 RPG 的故事设计 / 策划框架

> 目的：整理开放世界 RPG 和 AI NPC 游戏中**经过验证的叙事框架**，并说明每个框架对本项目（基于《我的前任是逃犯》改编的 AI NPC 开放世界 RPG）有什么用。
> 每一节最后的「→ 本项目怎么用」是调研结论，后续文档（03–07）都以此为依据。

---

## 1. 叙事分层：嵌入式叙事 vs 涌现式叙事

**来源**：Henry Jenkins《Game Design as Narrative Architecture》（2004）提出空间叙事的四种形态：
- **唤起式（Evoked）**：借用玩家已有的认知（类型片、新闻）。
- **演出式（Enacted）**：玩家亲自走过剧情节点。
- **嵌入式（Embedded）**：故事写在环境和物件里，等玩家去发现（账单、卷宗、照片）。
- **涌现式（Emergent）**：规则加角色自行生成故事（模拟类游戏）。

业界常见的开放世界内容分层：

| 层 | 典型内容 | 作者控制力 | 例子 |
|---|---|---|---|
| L1 主线 | 固定节拍、关键抉择、结局 | 高 | 《巫师3》血腥男爵 |
| L2 支线 | 手写的独立故事，常与主线互相影响 | 高-中 | 《荒野大镖客2》陌生人任务 |
| L3 系统任务 | 模板加随机参数 | 中-低 | 《上古卷轴5》Radiant 任务 |
| L4 环境叙事 | 物件、文档、场景布置 | 高（静态） | 《艾尔登法环》物品描述 |
| L5 涌现叙事 | 系统与 NPC 互动自然产生 | 低 | 《环世界》《矮人要塞》 |

**→ 本项目怎么用**：原作素材天然分布在各层。
- L1：主线节拍（租车纠纷 → 同居 → 冻卡 → 卷宗 → 假报案 → 摊牌）。
- L4：电费账单、卷宗、手写信、聊天截图、纹身。原作中最关键的信息几乎都来自**物件**，适合做成嵌入式叙事。
- L3 和 L5 交给 AI NPC：华人圈的"和事佬委托"、流言传播、谎言版本漂移。AI NPC 最擅长、也最该放在这两层。

---

## 2. 《巫师3》式支线设计原则

CD Projekt RED 的支线被普遍视为行业标杆。其设计经验（GDC 分享和多方访谈）可归纳为：
1. **没有纯跑腿任务**：任何"去拿个东西"的任务都要藏一个转折。
2. **灰色抉择**：两个选项各有代价，没有"正确答案"（血腥男爵是施暴者，也是悔恨的父亲）。
3. **延迟后果**：抉择的结果在几小时后才显现，防止玩家"读档刷最优解"。
4. **支线回流主线**：支线角色在主线关键时刻出现（帮你、或者因你受害）。
5. **小人物的大故事**：支线主角是普通人，讲的是人性，不是世界危机。

**→ 本项目怎么用**：原作就是一部"小人物被卷进大案"的故事，很符合《巫师3》式支线。
- 每条支线都要有转折，例如"帮晴晴买二手工具"实为她做假账。
- "把她弄到菲律宾去"这类抉择采用**延迟后果**：玩家当下的选择要到第4幕才显现代价。
- 原作中的配角（保姆、阿娟、王丽、房客）各自都能撑起一条支线，详见 06。

---

## 3. 选择结构模式（Sam Kabo Ashwell, *Standard Patterns in Choice-Based Games*, 2015）

Ashwell 归纳的常用结构：
- **时间洞穴（Time Cave）**：完全分叉，成本爆炸。
- **长廊（Gauntlet）**：线性推进，偶有死路。
- **分支与瓶颈（Branch and Bottleneck）**：分叉后汇合到固定节点，靠状态变量记住差异。
- **任务式（Quest）**：模块化的地点和事件，次序自由。
- **开放地图（Open Map）**：可自由往返的区域。
- **排序帽（Sorting Hat）**：前期选择决定后期走哪条大线。
- **浮动模块（Floating Modules）**：满足条件即可触发的独立片段。
- **循环成长（Loop and Grow）**：重复的日常循环，每轮解锁新内容。

**→ 本项目怎么用**：
- **主线 = 分支与瓶颈**：原作时间线（2025.2 → 2026.4）是天然的瓶颈序列。现实事件（冻卡、卷宗日、假报案）一定会发生，玩家的选择改变的是**你知道多少、你站在哪边、你付出什么代价**。
- **同居期 = 循环成长**：原作"起床—早午餐—看房—高尔夫—下午茶"的日常，正好用作每日循环；每轮循环通过 AI 对话透露新的破绽。
- **支线 = 浮动模块 + 任务式**：按条件触发（详见第 5 节 storylet）。

---

## 4. 调查类游戏：三线索原则与节点式剧本

**来源**：Justin Alexander（The Alexandrian）
- **三线索原则（Three Clue Rule）**：玩家必须得出的每个结论，至少放置三条线索。玩家会漏掉第一条，会误解第二条，所以需要第三条。
- **节点式剧本设计（Node-Based Scenario Design）**：不按线性剧情写，而是把人物、地点、事件写成节点，节点之间由线索互相指向；玩家从任意节点切入都能走通。

**相关游戏参考**：
- 《奥伯拉丁的回归》《她的故事》：非线性拼图式推理，玩家自己确认答案。
- 《黑色洛城》：审讯中"相信 / 怀疑 / 指控谎言"三选一，指控必须出示证据。
- 《极乐迪斯科》：技能化身内心声音，参与对话。
- 《Shadows of Doubt》：程序生成城市里的侦探游戏，用**软木线索板**（cork board）自由钉证据、拉红线；开发者刻意采用拟物化 UI，让证据窗口像档案袋。

**→ 本项目怎么用**：**原作主角的方法论本身就是三线索原则。** 第15章他说：

> "我只看三样东西：我自己能够查到什么；不同人的说法能不能互相印证；以及有没有实际材料能够支持他们说的话。"

这句话直接定为本作的**核心调查机制**（详见 07 的「三角印证」系统）：
- 每个关键结论（"王丽不是会计""晶晶就是那个闺蜜""珠宝报案是构陷"）都设计 ≥3 条独立线索，分布在不同 NPC 和物件上。
- 主线采用节点式：玩家可以先查到鹿鸣案、后发现冻卡，也可以反过来。

---

## 5. Storylet / 基于品质的叙事（QBN）与基于显著性的叙事

**来源**：Failbetter Games（《Fallen London》）提出"基于品质的叙事"（Quality-Based Narrative）；Emily Short 在《Beyond Branching》（2016）、《Storylets: You Want Them》（2019）中系统化。Max Kreminski 的 *Sketching a Map of the Storylets Design Space*（ICIDS 2018）对此做了综述。

- **Storylet** = 一段内容 + 触发前提 + 对世界状态的影响。它简单、原子化、稳健、可重组。
- **品质（Quality）**：数值化的状态（物品数量、技能、关系进度）。
- **显著性（Salience）**：在所有满足条件的内容中，挑选"最贴切"的一条（Valve 在《求生之路》《军团要塞2》中用模糊匹配挑选台词，即 Elan Ruskin 在 GDC 2012 分享的 dynamic dialog）。

**→ 本项目怎么用**：AI NPC 开放世界最大的风险是"自由聊天但没有剧情"。解法是：
- **剧情骨架用 storylet 写死**：每个节拍是一个 storylet，有前提（日期、证据、关系值），有效果（解锁事实、改变关系）。
- **LLM 负责台词表面，storylet 负责剧情结构**：LLM 不能决定"什么时候冻卡"，只能决定"晴晴解释冻卡时怎么说"。
- 显著性选择：同一时刻满足条件的多个 storylet，由导演系统挑选最符合当前张力曲线的一个。

---

## 6. 戏剧导演 / AI 导演

- **《Façade》（Mateas & Stern, 2005）**：戏剧管理器按亚里士多德张力曲线调度"节拍"，玩家自由打字，系统保证戏剧性。这是 AI NPC 叙事最直接的前辈。
- **《求生之路》AI Director**：根据玩家紧张度动态调节节奏。
- **《环世界》叙事者（Cassandra / Randy）**：不同叙事者人格决定事件节奏。

**→ 本项目怎么用**：设一个**剧情导演（Director）**，职责是：
1. 监控张力曲线（关系拉扯期 → 冷却期 → 惊吓期），避免连续高压或长期无事。
2. 在"硬节拍"日期前铺垫（例如冻卡前一周让晴晴多提一次"换汇"）。
3. 玩家长期偏离主线时，用 NPC 主动来电、流言、上门把玩家拉回来。**原作中晴晴本人就是最强的"拉回机制"**：她会不停打电话、发消息、撒娇、施压。

---

## 7. 记忆型敌人与关系系统

- **《中土世界：暗影魔多》复仇女神系统（Nemesis）**：敌人记得你如何对待它，并带着伤疤、怨恨回来。
- **《辐射：新维加斯》阵营声望**：每个阵营分"名声 / 恶名"两条轴，可以同时被一个阵营又爱又恨。

**→ 本项目怎么用**：
- 晴晴是一个**"复仇女神式"的社交对手**：她记得你看过她的手机，会诈你、报假警、上门闹、换版本稳住你。
- 华人圈声望采用**双轴**：「可信度」（你说的话别人信不信）与「麻烦度」（别人是否怕被你牵连）。原作中晶晶在外面把阿林塑造成"被她养的男人"，即是对玩家可信度的攻击。

---

## 8. 生成式智能体与已落地的 AI NPC 游戏

### 8.1 学术：Generative Agents（Park et al., 2023, Stanford / Google）
"斯坦福小镇"的 25 个智能体架构包含三部分：
- **记忆流（Memory Stream）**：用自然语言记录所有经历，按"新近度 × 重要性 × 相关性"检索。
- **反思（Reflection）**：定期把记忆归纳成更高层的认识（"晴晴总是在被拆穿时反问"）。
- **计划（Planning）**：按日程行动，并根据事件调整。

实验中出现了信息自发传播（派对邀请在小镇里扩散）的涌现现象。

**→ 用法**：NPC 的记忆和流言传播直接采用这套结构；"反思"用于让 NPC 对玩家形成**会变化的看法**。

### 8.2 工业界案例

| 作品 / 原型 | 要点 | 对本项目的启示 |
|---|---|---|
| **Ubisoft NEO NPC**（GDC 2024 原型，联合 Inworld 与 Nvidia Audio2Face） | 角色人格由**编剧**撰写；有护栏系统，能区分"玩家刁难 NPC"与"玩家辱骂 NPC"；官方明确表示 NPC 没有自由意志，只是在故事中扮演角色 | 编剧主导、护栏优先、NPC 服务于剧情 |
| **《逆水寒》手游**（网易，2023 起） | 宣传"智能 NPC"可自由对话、有记忆、NPC 之间会传播消息；后来接入多家国产大模型 | 证明了国内玩家对 AI NPC 的兴趣；"NPC 互传消息"可以作为流言系统的参考 |
| **《燕云十六声》**（网易，2025） | 部分次要 NPC 支持 LLM 自由聊天，配合好感度和"话术"目标提示；但有玩家反映重新登录后记忆丢失 | 给自由聊天**明确目标**（让 NPC 说出某事 / 改变态度）才好玩；记忆持久化是硬需求 |
| **Whispers from the Star**（Anuttacon，2025.8 上 Steam） | 以语音和文本跟一个 AI 角色实时对话，玩家的话决定她的命运；口碑好，但对重度 AI 化有争议 | 单一深度角色加真实情感，可以撑起整部作品；本项目的晴晴是同等量级的核心角色 |

**行业共识（综合多方评测）**：AI NPC 的常见失败是"穿帮、出戏、没人味、记不住"。宣传中的"灵魂、像真人"与实际体验落差很大。成功关键在于：**明确的对话目标 + 编剧写死的人格与边界 + 持久记忆 + 让 AI 的不确定性成为玩法本身。**

---

## 9. 人物塑造框架

- **Want vs Need**：角色想要的（外在目标）和真正需要的（内在课题）不同。
- **角色相信的谎言（The Lie the Character Believes, K.M. Weiland）**：角色弧线的核心是一个错误信念。
- **《极乐迪斯科》内心声音**：把人格碎片做成对话参与者。

**→ 本项目怎么用**：每个核心 NPC 的角色卡都必须写清 Want / Need / 信念谎言（见 04）。例如：
- 晴晴 Want：钱、身份、上流人设。Need：停止逃跑。信念谎言："真正喜欢我的人，都会站在我这一边，不管我是对还是错。"
- 主角 Want：安稳、被需要。Need：学会不当"和事佬"。信念谎言："凡事都好商量。"

主角的内心声音取自原作：**妈妈的声音**（"这个女孩子看上去很复杂"）、**欲望**（"色字头上一把刀"）、**和事佬本能**、**前侦探的直觉**。

---

## 10. 道德抉择与"不可靠叙述者"

- 《巫师》系列：没有明确善恶的选择，后果延迟。
- 《生化奇兵》"Would you kindly"：揭示玩家一直在被操控。
- 不可靠叙述者：玩家获得的信息本身就是被操控过的。

**→ 本项目怎么用**：原作最大的叙事张力在于**主角自己也是被操控的不可靠叙述者**。他相信纹身是胁迫，"正是这种想法，后续干扰了我的很多判断"。游戏应让玩家**亲身经历被操控**：前期晴晴的每个故事都讲得合情合理，线索板上的事实会在后期被推翻（标记为"已被推翻的认知"），形成"回头看全是破绽"的体验。

---

## 11. 结论：本项目的叙事设计框架（综合）

```
┌──────────────────────────────────────────────────────────────┐
│ 剧情导演 Director（张力曲线、硬节拍日历、拉回机制）          │
├──────────────────────────────────────────────────────────────┤
│ L1 主线：分支与瓶颈（5 幕 + 序章 + 多结局）                   │
│ L2 支线：浮动模块 storylet（≥20 条，均回流主线）             │
│ L3 系统任务：和事佬委托 / 司机接单（AI 生成参数化纠纷）       │
│ L4 嵌入叙事：账单、卷宗、手写信、聊天截图、纹身               │
│ L5 涌现叙事：流言网络、谎言版本漂移、NPC 记忆与反思          │
├──────────────────────────────────────────────────────────────┤
│ 真相层 Canon（GM 唯一真相，LLM 不可改）                       │
│ 信念层 Belief（每个 NPC 相信什么、相信几分）                  │
│ 说辞层 Version（每个 NPC 对不同听众讲的版本）                 │
└──────────────────────────────────────────────────────────────┘
核心玩法动词：倾听 · 追问 · 出示 · 诈 · 共情 · 沉默 · 调解 · 印证
核心机制：三角印证（自己查到的 × 他人互证 × 实物证据）
```

---

## 参考资料

- Henry Jenkins, *Game Design as Narrative Architecture* (2004)
- Sam Kabo Ashwell, [Standard Patterns in Choice-Based Games](https://heterogenoustasks.wordpress.com/2015/01/26/standard-patterns-in-choice-based-games/) (2015)
- Justin Alexander, [The Three Clue Rule](https://thealexandrian.net/wordpress/1118/roleplaying-games/three-clue-rule)；[Node-Based Scenario Design](https://thealexandrian.net/wordpress/7949/roleplaying-games/node-based-scenario-design-part-1-the-problem-with-plotted-scenarios)
- Emily Short, [Beyond Branching: Quality-Based and Salience-Based Narrative Structures](https://emshort.blog/2016/04/12/beyond-branching-quality-based-and-salience-based-narrative-structures/) (2016)；[Storylets: You Want Them](https://emshort.blog/tag/quality-based-narrative/) (2019)
- Yarn Spinner 文档：[Storylets and Saliency: A Primer](https://docs.yarnspinner.dev/write-yarn-scripts/advanced-scripting/storylets-and-saliency-a-primer)
- Max Kreminski et al., *Sketching a Map of the Storylets Design Space* (ICIDS 2018)
- Elan Ruskin, *AI-driven Dynamic Dialog through Fuzzy Pattern Matching* (GDC 2012)
- Michael Mateas & Andrew Stern, *Façade* (2005)
- Joon Sung Park et al., [Generative Agents: Interactive Simulacra of Human Behavior](https://arxiv.org/abs/2304.03442) (2023)
- Ubisoft, [How Ubisoft's New Generative AI Prototype Changes the Narrative for NPCs](https://news.ubisoft.com/en-us/article/5qXdxhshJBXoanFZApdG3L/how-ubisofts-new-generative-ai-prototype-changes-the-narrative-for-npcs) (2024)；[HotHardware 报道](https://amp.hothardware.com/news/ubisoft-unveils-a-generative-ai-prototype-for-npcs)
- ColePowered, [Shadows of Doubt DevBlog #4: Case Folders & Cork Boards](https://colepowered.com/?p=33958)
- Whispers from the Star：[Notebookcheck 报道](https://www.notebookcheck.net/Steam-launch-New-interactive-fiction-game-debuts-to-Very-Positive-reviews-may-divide-gamers-over-heavy-AI-integration.1087821.0.html)；[萌娘百科](https://zh.moegirl.org.cn/Whispers_from_the_Star)
- 网易 AI NPC：[IT之家（逆水寒）](https://www.ithome.com/0/704/290.htm)；[爱范儿（燕云十六声 AI NPC 体验）](https://www.ifanr.com/1612530)；[机核](https://www.gcores.com/articles/218370)
