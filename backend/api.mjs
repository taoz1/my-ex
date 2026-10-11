// 服务端 API：/api/status、/api/dialogue、/api/choose。
// DeepSeek API Key 只在服务端读取，不会发给浏览器。
import { WORLD, CHARACTERS, SCENES } from './npc-cards.mjs';

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
const MAX_OPTIONS = 6;

// 第一幕里任何 NPC 都不该说出的词：原型地名、暴力犯罪细节。
export const BLOCKED_TERMS = ['菲律宾', '马尼拉', '绑架', '撕票', '杀人', '尸体', '谋杀'];

const json = (value, status = 200) => Response.json(value, { status, headers: { 'Cache-Control': 'no-store' } });

function cleanText(value, max) {
  if (typeof value !== 'string' || !value.trim() || value.length > max) throw Error('Invalid text');
  return value.trim();
}

export function validateDialogue(input) {
  if (!input || typeof input !== 'object') throw Error('Invalid body');
  const scene = SCENES[input.scene];
  if (!scene) throw Error('Invalid scene');
  if (!CHARACTERS[input.npc] || !scene.npcs.includes(input.npc)) throw Error('Invalid NPC');
  const message = cleanText(input.message, MAX_MESSAGE);
  if (!Array.isArray(input.memories) || input.memories.length > MAX_MEMORIES) throw Error('Invalid memories');
  const memories = input.memories.map(m => cleanText(m, 600));
  return { npc: input.npc, scene: input.scene, message, memories };
}

// 剧情关键处：玩家自由输入，交给 AI 判断对应哪个剧情走向。
export function validateChoice(input) {
  const turn = validateDialogue(input);
  if (!Array.isArray(input.options) || !input.options.length || input.options.length > MAX_OPTIONS) throw Error('Invalid options');
  if (!Array.isArray(input.context) || input.context.length > MAX_CONTEXT) throw Error('Invalid context');
  return { ...turn, options: input.options.map(o => cleanText(o, 80)), context: input.context.map(c => cleanText(c, 300)) };
}

// AI 选中了某个走向时只返回编号；都不对应时由角色回应一句，剧情停在原处。
export function validateChoiceResult(data, turn) {
  if (Number.isInteger(data?.choice) && data.choice >= 0 && data.choice < turn.options.length) return { choice: data.choice };
  return { choice: null, ...validateReply(data, turn.npc) };
}

export function validateReply(data, npc) {
  const reply = cleanText(data?.reply, MAX_REPLY);
  if (BLOCKED_TERMS.some(term => reply.includes(term))) throw Error('Blocked content');
  const emotion = CHARACTERS[npc].emotions.includes(data?.emotion) ? data.emotion : 'neutral';
  return { reply, emotion };
}

function characterCard(turn) {
  const npc = CHARACTERS[turn.npc];
  return [
    WORLD,
    `你扮演：${npc.name}。\n${npc.profile}`,
    `秘密：${npc.secrets}`,
    `禁区：${npc.forbidden}`,
    `当前场景：${SCENES[turn.scene].goal}`,
    '规则：你只知道自己亲历和听说的事，不得改变以上设定。用现场口语回应，有个性、具体、克制，可以不同意玩家，不要说教，不要替玩家下结论。不要跳出角色，不要承认自己是AI。',
  ];
}

export function buildPrompt(turn) {
  const emotions = CHARACTERS[turn.npc].emotions.join('|');
  const system = [
    ...characterCard(turn),
    `只输出JSON：{"reply":"不超过120个中文字的一段回应","emotion":"${emotions} 之一"}。不要输出其他字段。`,
  ].join('\n\n');
  const user = JSON.stringify({ playerSays: turn.message, recentMemories: turn.memories });
  return [{ role: 'system', content: system }, { role: 'user', content: user }];
}

export function buildChoicePrompt(turn) {
  const emotions = CHARACTERS[turn.npc].emotions.join('|');
  const system = [
    ...characterCard(turn),
    `现在是剧情的关键处，玩家（陈默）自由说了一句话。剧情预设了几种走向（storyOptions，编号从0开始），每条是陈默可能说的话或做的事。
先判断玩家这句话的意思是否对应其中某一条：意思相同或非常接近就算对应，措辞可以完全不同；数字、立场、态度要对得上。
如果对应，choice 填编号，reply 填空字符串。
如果不对应任何一条（闲聊、问别的事、提出不同的数字或方案、含糊其辞），choice 填 null，并以你的角色身份自然回应他，顺势把话题引回眼前需要他表态的事，但不要替他做选择，也不要把选项念出来。`,
    `只输出JSON：{"choice":编号或null,"reply":"choice为null时不超过120个中文字的回应，否则为空字符串","emotion":"${emotions} 之一"}。不要输出其他字段。`,
  ].join('\n\n');
  const user = JSON.stringify({ recentLines: turn.context, storyOptions: turn.options, playerSays: turn.message, recentMemories: turn.memories });
  return [{ role: 'system', content: system }, { role: 'user', content: user }];
}

const ROUTES = {
  '/api/dialogue': { validate: validateDialogue, prompt: buildPrompt, result: (data, turn) => validateReply(data, turn.npc) },
  '/api/choose': { validate: validateChoice, prompt: buildChoicePrompt, result: validateChoiceResult },
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

  let response;
  try {
    response = await fetcher(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${env.DEEPSEEK_API_KEY}` },
      signal: AbortSignal.timeout(40000),
      body: JSON.stringify({
        model,
        thinking: { type: 'disabled' },
        max_tokens: 320,
        response_format: { type: 'json_object' },
        messages: route.prompt(turn),
      }),
    });
  } catch (e) {
    return json({ error: e.name === 'TimeoutError' ? 'DeepSeek 回应超时。' : NETWORK }, 502);
  }
  if (!response.ok) return json({ error: providerError(response.status) }, 502);
  try {
    const data = await response.json();
    if (data.choices?.[0]?.finish_reason !== 'stop') throw Error('Incomplete');
    const result = route.result(JSON.parse(data.choices[0].message.content), turn);
    return json({ ...result, model });
  } catch {
    return json({ error: 'DeepSeek 的回应格式不对或包含不允许的内容，请再试一次。' }, 502);
  }
}
