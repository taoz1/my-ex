// 服务端 API：/api/status、/api/dialogue。
// DeepSeek API Key 只在服务端读取，不会发给浏览器。
import { WORLD, CHARACTERS, SCENES } from './npc-cards.mjs';

export const DEFAULT_MODEL = 'deepseek-flash';
const ENDPOINT = 'https://api.deepseek.com/chat/completions';
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
    return json({ configured: !!env.DEEPSEEK_API_KEY, model });
  }
  if (path !== '/api/dialogue') return json({ error: 'Not found' }, 404);
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  if (!request.headers.get('content-type')?.startsWith('application/json') || request.headers.get('sec-fetch-site') === 'cross-site') {
    return json({ error: 'Invalid request' }, 403);
  }
  if (!env.DEEPSEEK_API_KEY) return json({ error: 'DeepSeek 尚未配置，当前使用本地剧情对话。' }, 503);

  let turn;
  try {
    turn = validateDialogue(JSON.parse(await readBody(request)));
  } catch {
    return json({ error: 'Invalid dialogue state' }, 400);
  }

  try {
    const response = await fetcher(ENDPOINT, {
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
    if (!response.ok) {
      const messages = { 401: 'DeepSeek API Key 无效。', 402: 'DeepSeek 账户余额不足。', 429: 'DeepSeek 请求过于频繁，请稍后再试。' };
      return json({ error: messages[response.status] || 'DeepSeek 暂时无法回应。' }, 502);
    }
    const data = await response.json();
    if (data.choices?.[0]?.finish_reason !== 'stop') throw Error('Incomplete');
    const result = validateReply(JSON.parse(data.choices[0].message.content), turn.npc);
    return json({ ...result, model });
  } catch {
    return json({ error: 'NPC 没有及时形成有效回应，请再试一次。' }, 502);
  }
}
