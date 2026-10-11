import test from 'node:test';
import assert from 'node:assert/strict';
import { handleApi, validateUnderstand, validateSpeak, validateSpeakResult, buildSpeakPrompt, numbersIn } from '../backend/api.mjs';
import { LIVES } from '../backend/npc-lives.mjs';
import { CHARACTERS } from '../backend/npc-cards.mjs';
import { resolveFile } from '../server.mjs';

const post = (path, body) => new Request(`http://localhost${path}`, {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
});
const reply = content => Response.json({ choices: [{ finish_reason: 'stop', message: { content } }] });
const env = { DEEPSEEK_API_KEY: 'k' };
const noCall = () => { throw Error('must not call'); };

const chat = { npc: 'qingqing', scene: 'a1_daily', message: '今天想去哪儿？', memories: [], context: [] };
const speak = { ...chat, intent: { act: 'answer' } };
const deal = { npc: 'qingqing', scene: 'p1_mediation', message: '老邝说可以退你1200', memories: [], context: ['晴晴：又怎么了？'] };

test('speak: the key stays server-side and the prompt carries the character card and the decided intent', async () => {
  const res = await handleApi(post('/api/speak', { ...speak, intent: { act: 'warm', mood: 'sweet' } }), { DEEPSEEK_API_KEY: 'test-key' }, async (url, opts) => {
    assert.equal(url, 'https://api.deepseek.com/chat/completions');
    assert.equal(opts.headers.Authorization, 'Bearer test-key');
    const body = JSON.parse(opts.body);
    assert.equal(body.model, 'deepseek-flash');
    assert.match(body.messages[0].content, /晴晴/);
    assert.match(body.messages[0].content, /禁区/);
    assert.match(body.messages[0].content, /态度软下来/);
    return reply('{"reply":"去喝下午茶吧，我订好位子了。","emotion":"angry"}');
  });
  assert.equal(res.status, 200);
  const text = await res.text();
  assert.ok(!text.includes('test-key'));
  // 游戏定了情绪，就用游戏的
  assert.deepEqual(JSON.parse(text), { reply: '去喝下午茶吧，我订好位子了。', emotion: 'sweet', model: 'deepseek-flash' });
});

test('understand: classifies into a known act, a listed topic and an amount', async () => {
  const res = await handleApi(post('/api/understand', { ...deal, topics: ['她真正在意什么'] }), env, async (url, opts) => {
    const body = JSON.parse(opts.body);
    assert.equal(body.temperature, 0.2);
    assert.match(body.messages[0].content, /propose/);
    assert.match(body.messages[0].content, /她真正在意什么/);
    assert.match(body.messages[0].content, /1500−X/);
    return reply('{"analysis":"转述老邝退1200","act":"propose","topic":"别的话题","amount":1200}');
  });
  assert.deepEqual(await res.json(), { act: 'propose', topic: null, amount: 1200, model: 'deepseek-flash' });
});

test('understand: an unknown act is retried, then refused', async () => {
  let calls = 0;
  const bad = await handleApi(post('/api/understand', deal), env, async () => { calls++; return reply('{"act":"dance"}'); });
  assert.equal(bad.status, 502);
  assert.equal(calls, 2);
  calls = 0;
  const ok = await handleApi(post('/api/understand', deal), env, async () => reply(++calls === 1 ? 'oops' : '{"act":"chat"}'));
  assert.equal((await ok.json()).act, 'chat');
});

test('in a bargaining scene the NPC may not invent numbers', () => {
  const t = validateSpeak({ ...deal, intent: { act: 'refuse' } });
  assert.throws(() => validateSpeakResult({ reply: '两千？哪来的两千？' }, t), /Invented number/);
  assert.equal(validateSpeakResult({ reply: '一千二？他什么时候这么大方了。' }, t).reply, '一千二？他什么时候这么大方了。');
  assert.ok(validateSpeakResult({ reply: '一千五交出去，扣三百我认了。' }, t), '1500 − 1200 = 300 is fine');
  assert.deepEqual(numbersIn('退1,200，一千五，七百五，两千，一万二，一下子'), [1200, 1500, 750, 2000, 12000]);
});

test('invalid state and a missing key never call the provider', async () => {
  assert.equal((await handleApi(post('/api/speak', speak), {}, noCall)).status, 503);
  assert.equal((await handleApi(post('/api/speak', { ...speak, npc: 'unknown' }), env, noCall)).status, 400);
  assert.equal((await handleApi(post('/api/speak', { ...speak, npc: 'laokuang' }), env, noCall)).status, 400, 'NPC not in scene');
  assert.equal((await handleApi(post('/api/speak', { ...speak, intent: { act: 'bribe' } }), env, noCall)).status, 400);
  assert.equal((await handleApi(post('/api/dialogue', speak), env, noCall)).status, 404);
  assert.throws(() => validateUnderstand({ ...chat, message: '' }));
  assert.throws(() => validateUnderstand({ ...chat, memories: Array(7).fill('x') }));
  assert.throws(() => validateUnderstand({ ...chat, topics: Array(13).fill('x') }));
});

test('replies are length-checked, filtered for blocked topics, and emotions are whitelisted', () => {
  const t = validateSpeak(speak);
  assert.throws(() => validateSpeakResult({ reply: 'x'.repeat(281) }, t));
  assert.throws(() => validateSpeakResult({ reply: '他在菲律宾有生意。' }, t));
  assert.deepEqual(validateSpeakResult({ reply: '好呀', emotion: 'furious' }, t), { reply: '好呀', emotion: 'neutral' });
});

test('blocked or malformed provider output becomes a redacted 502', async () => {
  assert.equal((await handleApi(post('/api/speak', speak), env, async () => reply('{"reply":"那边死过人，绑架的事别问。"}'))).status, 502);
  assert.equal((await handleApi(post('/api/speak', speak), env, async () => reply('not json'))).status, 502);
  const down = await handleApi(post('/api/speak', speak), env, async () => { throw new TypeError('fetch failed'); });
  assert.match((await down.json()).error, /连不上 DeepSeek/);
  const r = await handleApi(post('/api/speak', speak), env, async () => new Response('secret', { status: 401 }));
  assert.equal(r.status, 502);
  assert.ok(!(await r.text()).includes('secret'));
});

test('every character has a life and some untold stories; stories are not repeated', async () => {
  for (const id of Object.keys(CHARACTERS)) {
    const l = LIVES[id];
    assert.ok(l?.life && l.anecdotes.length >= 2, `${id} needs a life and at least two stories`);
    assert.equal(new Set(l.anecdotes.map(a => a.id)).size, l.anecdotes.length, `${id}: duplicate story id`);
  }
  const ask = told => validateSpeak({ npc: 'laokuang', scene: 'kuang_daily', message: '你年轻时候干嘛的？', intent: { act: 'anecdote' }, told });
  const first = ask([]);
  assert.equal(first.stories.length, LIVES.laokuang.anecdotes.length);
  assert.match(buildSpeakPrompt(first)[0].content, /你可以讲的事/);
  assert.match(buildSpeakPrompt(first)[0].content, /你的日常/);
  assert.ok(!ask([LIVES.laokuang.anecdotes[0].id]).stories.some(a => a.id === LIVES.laokuang.anecdotes[0].id), 'told stories are not offered again');
  const all = ask(LIVES.laokuang.anecdotes.map(a => a.id));
  assert.equal(all.stories, undefined);
  assert.equal(all.intent.act, 'answer', 'out of stories: just chat');
  const koi = LIVES.laokuang.anecdotes[1].id;
  const res = await handleApi(post('/api/speak', { npc: 'laokuang', scene: 'kuang_daily', message: '你那缸鱼养多久了', intent: { act: 'anecdote' }, told: [] }), env,
    async () => reply(`{"reply":"那缸鱼啊……","emotion":"neutral","story":"${koi}"}`));
  assert.equal((await res.json()).anecdote, koi);
  const none = validateSpeakResult({ reply: '就随便聊聊。', story: 'made-up' }, first);
  assert.equal(none.anecdote, undefined, 'an unknown story id is ignored');
});

test('prompt only includes the requested character', () => {
  const [system] = buildSpeakPrompt(validateSpeak(speak));
  assert.ok(!system.content.includes('老邝，50多岁'));
});

const status = (env, fetcher) => handleApi(new Request('http://localhost/api/status'), env, fetcher).then(r => r.json());
const models = ids => async (url, opts) => {
  assert.equal(url, 'https://api.deepseek.com/models');
  assert.equal(opts.headers.Authorization, 'Bearer k');
  return Response.json({ object: 'list', data: ids.map(id => ({ id })) });
};

test('status reports a missing key without calling the provider', async () => {
  const s = await status({ DEEPSEEK_MODEL: 'other' }, () => { throw Error('must not call'); });
  assert.equal(s.connected, false);
  assert.equal(s.model, 'other');
  assert.match(s.error, /DEEPSEEK_API_KEY/);
});

test('status really connects: valid key and model', async () => {
  const s = await status({ DEEPSEEK_API_KEY: 'k' }, models(['deepseek-flash', 'deepseek-chat']));
  assert.deepEqual(s, { configured: true, model: 'deepseek-flash', connected: true });
});

test('status explains a wrong model name, a bad key, and network failure', async () => {
  const wrong = await status({ DEEPSEEK_API_KEY: 'k' }, models(['deepseek-chat']));
  assert.equal(wrong.connected, false);
  assert.match(wrong.error, /deepseek-flash 不可用.*deepseek-chat/);
  const bad = await status({ DEEPSEEK_API_KEY: 'k' }, async () => new Response('secret', { status: 401 }));
  assert.equal(bad.error, 'DeepSeek API Key 无效。');
  const down = await status({ DEEPSEEK_API_KEY: 'k' }, async () => { throw new TypeError('fetch failed'); });
  assert.match(down.error, /连不上 DeepSeek/);
});


test('static file resolution refuses path traversal', () => {
  assert.ok(resolveFile('/').file.endsWith('index.html'));
  assert.ok(resolveFile('/assets/maps/mall.png').file.includes('assets'));
  assert.equal(resolveFile('/../package.json'), null);
  assert.equal(resolveFile('/assets/../server.mjs'), null);
  assert.equal(resolveFile('/%2e%2e/server.mjs'), null);
  assert.equal(resolveFile('/js/engine/story.exe'), null);
});
