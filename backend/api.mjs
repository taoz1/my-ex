// 服务端 API：/api/status、/api/understand、/api/speak。
// NPC 对话分三步（见 npc-cards.mjs 的 ACTS / INTENTS）：理解和说话在这里调 AI，决定在浏览器的游戏逻辑里。
// DeepSeek API Key 只在服务端读取，不会发给浏览器。
import { WORLD, CHARACTERS, SCENES, ACTS, INTENTS } from './npc-cards.mjs';

export const DEFAULT_MODEL = 'deepseek-flash';
const ENDPOINT = 'https://api.deepseek.com/chat/completions';
const MODELS_ENDPOINT = 'https://api.deepseek.com/models';
const NO_KEY = '服务端没有配置 DEEPSEEK_API_KEY（见 README「提供 API Key」）。';
const NETWORK = '连不上 DeepSeek 服务器（网络或代理问题）。';

function providerError(status) {
  const messages = { 401: 'DeepSeek API Key 无效。', 402: 'DeepSeek 账户余额不足。', 429: 'DeepSeek 请求过于频繁，请稍后再试。' };
  return messages[status] || `DeepSeek 返回错误（HTTP ${status}）。`;
}

// 真正连一次 DeepSeek：校验 Key，并确认模型名存在。
export async function checkConnection(env, fetcher = fetch) {
  const model = env.DEEPSEEK_MODEL || DEFAULT_MODEL;
  if (!env.DEEPSEEK_API_KEY) return { connected: false, error: NO_KEY };
  try {
    const res = await fetcher(MODELS_ENDPOINT, { headers: { Authorization: `Bearer ${env.DEEPSEEK_API_KEY}` }, signal: AbortSignal.timeout(15000) });
    if (!res.ok) return { connected: false, error: providerError(res.status) };
    const ids = ((await res.json()).data || []).map(m => m.id).filter(id => typeof id === 'string');
    if (ids.length && !ids.includes(model)) {
      return { connected: false, error: `模型 ${model} 不可用。可用模型：${ids.join('、')}。请在 .env 里用 DEEPSEEK_MODEL 指定。` };
    }
    return { connected: true };
  } catch {
    return { connected: false, error: NETWORK };
  }
}
const MAX_BODY = 12000;
const MAX_MESSAGE = 160;
const MAX_REPLY = 280;
const MAX_MEMORIES = 6;
const MAX_CONTEXT = 8;
const MAX_TOPICS = 12;
const ATTEMPTS = 2;   // AI 的回应不合格（格式、数字、禁词）时重试的次数

// 第一幕里任何 NPC 都不该说出的词：原型地名、暴力犯罪细节。
export const BLOCKED_TERMS = ['菲律宾', '马尼拉', '绑架', '撕票', '杀人', '尸体', '谋杀'];

const json = (value, status = 200) => Response.json(value, { status, headers: { 'Cache-Control': 'no-store' } });

function cleanText(value, max) {
  if (typeof value !== 'string' || !value.trim() || value.length > max) throw Error('Invalid text');
  return value.trim();
}

function cleanList(value, maxItems, maxLength) {
  if (!Array.isArray(value) || value.length > maxItems) throw Error('Invalid list');
  return value.map(v => cleanText(v, maxLength));
}

// 两个接口共用的部分：哪个 NPC、哪个场景、玩家说了什么、最近的上下文。
function validateTurn(input) {
  if (!input || typeof input !== 'object') throw Error('Invalid body');
  const scene = SCENES[input.scene];
  if (!scene) throw Error('Invalid scene');
  if (!CHARACTERS[input.npc] || !scene.npcs.includes(input.npc)) throw Error('Invalid NPC');
  return {
    npc: input.npc,
    scene: input.scene,
    message: cleanText(input.message, MAX_MESSAGE),
    memories: cleanList(input.memories ?? [], MAX_MEMORIES, 600),
    context: cleanList(input.context ?? [], MAX_CONTEXT, 300),
  };
}

// ── 数字检查 ───────────────────────────────────────────────
// 找出一段话里 ≥100 的数（阿拉伯数字和“一千五”“七百五”这类中文数字）。
const CN_DIGITS = { 零: 0, 一: 1, 二: 2, 两: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9 };
const CN_UNITS = { 十: 10, 百: 100, 千: 1000 };

function parseChinese(text) {
  let total = 0, section = 0, num = 0, lastUnit = 1;
  for (const ch of text) {
    if (ch === '零') { lastUnit = 10; continue; }
    if (ch in CN_DIGITS) { num = CN_DIGITS[ch]; continue; }
    if (ch === '万') { total += (section + num) * 10000; section = 0; num = 0; lastUnit = 10000; continue; }
    section += (num || 1) * CN_UNITS[ch];
    lastUnit = CN_UNITS[ch];
    num = 0;
  }
  // “一千五”的“五”是五百：末尾的单个数字跟着上一个单位降一级
  return total + section + (lastUnit >= 100 ? num * lastUnit / 10 : num);
}

export function numbersIn(text) {
  const found = [];
  for (const m of text.matchAll(/\d[\d,]*/g)) found.push(Number(m[0].replace(/,/g, '')));
  for (const m of text.matchAll(/[零一二两三四五六七八九十百千万]+/g)) if (/[十百千万]/.test(m[0])) found.push(parseChinese(m[0]));
  return found.filter(n => n >= 100);
}

// 有 numbers 的场景（讨价还价）：NPC 只能说游戏给的数、场景里的数、玩家说过的数，以及它们和总额的差。
export function allowedNumbers(turn) {
  const scene = SCENES[turn.scene];
  const base = new Set([...scene.numbers, ...numbersIn([turn.message, ...turn.context, ...turn.memories].join('\n'))]);
  if (turn.intent.amount) base.add(turn.intent.amount);
  for (const n of [...base]) base.add(scene.numbers[0] - n);
  return base;
}

// ── 第一步：理解 ───────────────────────────────────────────
// 理解这一步不需要扮演谁：npc 可以为空（比如对警官说话、自己拿主意）
export function validateUnderstand(input) {
  const withNpc = input?.npc ? input : { ...input, npc: null };
  if (withNpc.npc === null) {
    if (!SCENES[withNpc.scene]) throw Error('Invalid scene');
    return {
      npc: null,
      scene: withNpc.scene,
      message: cleanText(withNpc.message, MAX_MESSAGE),
      memories: [],
      context: cleanList(withNpc.context ?? [], MAX_CONTEXT, 300),
      topics: cleanList(withNpc.topics ?? [], MAX_TOPICS, 60),
    };
  }
  return { ...validateTurn(withNpc), topics: cleanList(withNpc.topics ?? [], MAX_TOPICS, 60) };
}

export function buildUnderstandPrompt(turn) {
  const scene = SCENES[turn.scene];
  const system = [
    WORLD,
    `当前场景：${scene.goal}`,
    `你的任务：只做分类，不扮演角色。判断玩家（陈默）${turn.npc ? `对${CHARACTERS[turn.npc].name}` : ''}说的这句话属于哪一种行为（act）：\n${Object.entries(ACTS).map(([k, v]) => `- ${k}：${v}`).join('\n')}`,
    turn.topics.length ? `如果玩家是在问或谈下面某个话题，topic 照抄那个话题，否则为 null：\n${turn.topics.map(t => `- ${t}`).join('\n')}` : 'topic 一律为 null。',
    scene.amount ? `如果玩家说出了数额，amount 填数字，口径是：${scene.amount}。没有数额时为 null。` : 'amount 一律为 null。',
    '先在 analysis 里用一句话写清玩家的意思（有数额就写出数额）。只输出JSON：{"analysis":"一句话","act":"上面的某个键","topic":"照抄的话题或null","amount":数字或null}。',
  ].join('\n\n');
  const user = JSON.stringify({ recentLines: turn.context, playerSays: turn.message });
  return [{ role: 'system', content: system }, { role: 'user', content: user }];
}

export function validateUnderstandResult(data, turn) {
  if (!Object.hasOwn(ACTS, data?.act)) throw Error('Unknown act');
  const topic = typeof data.topic === 'string' ? turn.topics.find(t => t === data.topic.trim()) ?? null : null;
  const amount = SCENES[turn.scene].amount && Number.isFinite(data.amount) && data.amount >= 0 ? Math.round(data.amount) : null;
  return { act: data.act, topic, amount };
}

// ── 第三步：说话 ───────────────────────────────────────────
export function validateSpeak(input) {
  const turn = validateTurn(input);
  const intent = input.intent;
  if (!intent || !Object.hasOwn(INTENTS, intent.act)) throw Error('Invalid intent');
  const amount = Number.isFinite(intent.amount) ? Math.round(intent.amount) : null;
  const mood = CHARACTERS[turn.npc].emotions.includes(intent.mood) ? intent.mood : null;
  const stances = SCENES[turn.scene].stances?.[turn.npc];
  if (intent.stance != null && !stances?.[intent.stance]) throw Error('Invalid stance');
  return { ...turn, intent: { act: intent.act, amount, mood, stance: intent.stance ?? null } };
}

export function buildSpeakPrompt(turn) {
  const npc = CHARACTERS[turn.npc];
  const { intent } = turn;
  const system = [
    WORLD,
    `你扮演：${npc.name}。\n${npc.profile}`,
    `秘密：${npc.secrets}`,
    `禁区：${npc.forbidden}`,
    `当前场景：${SCENES[turn.scene].goal}`,
    ...(intent.stance ? [SCENES[turn.scene].stances[turn.npc][intent.stance]] : []),
    `游戏已经决定了你这一句要做什么：${INTENTS[intent.act]}${intent.amount ? `涉及的数额是 ${intent.amount}。` : ''}${intent.mood ? `情绪：${intent.mood}。` : ''}照这个意思说，不要改变决定，不要自己加让步或新条件。`,
    '规则：你只知道自己亲历和听说的事，不得改变以上设定。用现场口语回应，有个性、具体、克制，不要说教，不要替玩家下结论。不要跳出角色，不要承认自己是AI。',
    '看清玩家刚说的那句话：数字、人名、条件照原样理解，不要凭空冒出没人提过的数字，算账要对。不要重复你在最近几句里说过的话和口头禅，接住这句话往下说。',
    `只输出JSON：{"reply":"不超过120个中文字的一段回应","emotion":"${npc.emotions.join('|')} 之一"}。不要输出其他字段。`,
  ].join('\n\n');
  const user = JSON.stringify({ recentLines: turn.context, playerSays: turn.message, recentMemories: turn.memories });
  return [{ role: 'system', content: system }, { role: 'user', content: user }];
}

export function validateSpeakResult(data, turn) {
  const reply = cleanText(data?.reply, MAX_REPLY);
  if (BLOCKED_TERMS.some(term => reply.includes(term))) throw Error('Blocked content');
  if (SCENES[turn.scene].numbers) {
    const allowed = allowedNumbers(turn);
    if (numbersIn(reply).some(n => !allowed.has(n))) throw Error('Invented number');
  }
  const npc = CHARACTERS[turn.npc];
  const emotion = turn.intent.mood || (npc.emotions.includes(data?.emotion) ? data.emotion : 'neutral');
  return { reply, emotion };
}

const ROUTES = {
  // 分类要稳定：温度低
  '/api/understand': { validate: validateUnderstand, prompt: buildUnderstandPrompt, result: validateUnderstandResult, params: { max_tokens: 300, temperature: 0.2 } },
  '/api/speak': { validate: validateSpeak, prompt: buildSpeakPrompt, result: validateSpeakResult, params: { max_tokens: 320 } },
};

async function readBody(request) {
  if (Number(request.headers.get('content-length')) > MAX_BODY) throw Error('Too large');
  const reader = request.body?.getReader();
  if (!reader) throw Error('Missing body');
  const decoder = new TextDecoder();
  let size = 0;
  let body = '';
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > MAX_BODY) { await reader.cancel(); throw Error('Too large'); }
    body += decoder.decode(value, { stream: true });
  }
  return body + decoder.decode();
}

async function callModel(env, fetcher, model, route, turn) {
  const response = await fetcher(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${env.DEEPSEEK_API_KEY}` },
    signal: AbortSignal.timeout(40000),
    body: JSON.stringify({
      model,
      thinking: { type: 'disabled' },
      ...route.params,
      response_format: { type: 'json_object' },
      messages: route.prompt(turn),
    }),
  });
  if (!response.ok) return { error: providerError(response.status) };
  try {
    const data = await response.json();
    if (data.choices?.[0]?.finish_reason !== 'stop') throw Error('Incomplete');
    return { result: route.result(JSON.parse(data.choices[0].message.content), turn) };
  } catch {
    return { retry: true };
  }
}

export async function handleApi(request, env, fetcher = fetch) {
  const path = new URL(request.url).pathname;
  const model = env.DEEPSEEK_MODEL || DEFAULT_MODEL;
  if (path === '/api/status' && request.method === 'GET') {
    const status = await checkConnection(env, fetcher);
    return json({ configured: !!env.DEEPSEEK_API_KEY, model, ...status });
  }
  const route = ROUTES[path];
  if (!route) return json({ error: 'Not found' }, 404);
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  if (!request.headers.get('content-type')?.startsWith('application/json') || request.headers.get('sec-fetch-site') === 'cross-site') {
    return json({ error: 'Invalid request' }, 403);
  }
  if (!env.DEEPSEEK_API_KEY) return json({ error: NO_KEY }, 503);

  let turn;
  try {
    turn = route.validate(JSON.parse(await readBody(request)));
  } catch {
    return json({ error: 'Invalid dialogue state' }, 400);
  }

  for (let attempt = 0; attempt < ATTEMPTS; attempt++) {
    let outcome;
    try {
      outcome = await callModel(env, fetcher, model, route, turn);
    } catch (e) {
      return json({ error: e.name === 'TimeoutError' ? 'DeepSeek 回应超时。' : NETWORK }, 502);
    }
    if (outcome.error) return json({ error: outcome.error }, 502);
    if (outcome.result) return json({ ...outcome.result, model });
  }
  return json({ error: 'DeepSeek 的回应格式不对或包含不允许的内容，请再试一次。' }, 502);
}
