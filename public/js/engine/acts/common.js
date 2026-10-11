// 各幕剧情文件共用的写法。步骤格式见 ../script.js 顶部注释。
import { QUEST_ORDER } from '../quests.js';

export const say = (s, t, e) => ({ s, t, e });
export const N = t => say('narrator', t);
export const has = flag => s => !!s.flags[flag];
export const not = flag => s => !s.flags[flag];

// 任务先后：quest 在 [from, to] 区间内（含两端）
const at = id => QUEST_ORDER.indexOf(id);
export const during = (from, to = from) => s => at(s.quest) >= at(from) && at(s.quest) <= at(to);
export const after = id => s => at(s.quest) >= at(id);
export const before = id => s => at(s.quest) < at(id);
