// 服务端 API：/api/status、/api/dialogue。
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

export function validateReply(data, npc) {
  const reply = cleanText(data?.reply, MAX_REPLY);
  if (BLOCKED_TERMS.some(term => reply.includes(term))) throw Error('Blocked content');
  const emotion = CHARACTERS[npc].emotions.includes(data?.emotion) ? data.emotion : 'neutral';
  return { reply, emotion };
}

export function buildPrompt(turn) {
  const npc = CHARACTERS[turn.npc];
  const scene = SCENES[turn.scene];
  const system = [
    WORLD,
    `你扮演：${npc.name}。\n${npc.profile}`,
    `秘密：${npc.secrets}`,
    `禁区：${npc.forbidden}`,
    `当前场景：${scene.goal}`,
    '规则：你只知道自己亲历和听说的事，不得改变以上设定。用现场口语回应，有个性、具体、克制，可以不同意玩家，不要说教，不要替玩家下结论。不要跳出角色，不要承认自己是AI。',
    `只输出JSON：{"reply":"不超过120个中文字的一段回应","emotion":"${npc.emotions.join('|')} 之一"}。不要输出其他字段。`,
  ].join('\n\n');
  const user = JSON.stringify({ playerSays: turn.message, recentMemories: turn.memories });
  return [{ role: 'system', content: system }, { role: 'user', content: user }];
}

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
  if (path !== '/api/dialogue') return json({ error: 'Not found' }, 404);
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  if (!request.headers.get('content-type')?.startsWith('application/json') || request.headers.get('sec-fetch-site') === 'cross-site') {
    return json({ error: 'Invalid request' }, 403);
  }
  if (!env.DEEPSEEK_API_KEY) return json({ error: NO_KEY }, 503);

  let turn;
  try {
    turn = validateDialogue(JSON.parse(await readBody(request)));
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
        messages: buildPrompt(turn),
      }),
    });
  } catch (e) {
    return json({ error: e.name === 'TimeoutError' ? 'DeepSeek 回应超时。' : NETWORK }, 502);
  }
  if (!response.ok) return json({ error: providerError(response.status) }, 502);
  try {
    const data = await response.json();
    if (data.choices?.[0]?.finish_reason !== 'stop') throw Error('Incomplete');
    const result = validateReply(JSON.parse(data.choices[0].message.content), turn.npc);
    return json({ ...result, model });
  } catch {
    return json({ error: 'DeepSeek 的回应格式不对或包含不允许的内容，请再试一次。' }, 502);
  }
}
