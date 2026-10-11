import test from 'node:test';
import assert from 'node:assert/strict';
import { handleApi, validateDialogue, validateReply, buildPrompt } from '../backend/api.mjs';
import { resolveFile } from '../server.mjs';

const turn = { npc: 'qingqing', scene: 'a1_daily', message: '今天想去哪儿？', memories: [] };
const request = (body = turn) => new Request('http://localhost/api/dialogue', {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
});
const reply = content => Response.json({ choices: [{ finish_reason: 'stop', message: { content } }] });

test('DeepSeek key stays server-side and the prompt carries the character card', async () => {
  const res = await handleApi(request(), { DEEPSEEK_API_KEY: 'test-key' }, async (url, opts) => {
    assert.equal(url, 'https://api.deepseek.com/chat/completions');
    assert.equal(opts.headers.Authorization, 'Bearer test-key');
    const body = JSON.parse(opts.body);
    assert.equal(body.model, 'deepseek-flash');
    assert.match(body.messages[0].content, /晴晴/);
    assert.match(body.messages[0].content, /禁区/);
    return reply('{"reply":"去喝下午茶吧，我订好位子了。","emotion":"sweet"}');
  });
  assert.equal(res.status, 200);
  const text = await res.text();
  assert.ok(!text.includes('test-key'));
  assert.deepEqual(JSON.parse(text), { reply: '去喝下午茶吧，我订好位子了。', emotion: 'sweet', model: 'deepseek-flash' });
});

test('model name can be overridden by env', async () => {
  const res = await handleApi(new Request('http://localhost/api/status'), { DEEPSEEK_MODEL: 'other' });
  assert.deepEqual(await res.json(), { configured: false, model: 'other' });
});

test('invalid state and a missing key never call the provider', async () => {
  const noCall = () => { throw Error('must not call'); };
  assert.equal((await handleApi(request(), {}, noCall)).status, 503);
  assert.equal((await handleApi(request({ ...turn, npc: 'unknown' }), { DEEPSEEK_API_KEY: 'x' }, noCall)).status, 400);
  assert.equal((await handleApi(request({ ...turn, npc: 'laokuang' }), { DEEPSEEK_API_KEY: 'x' }, noCall)).status, 400, 'NPC not in scene');
  assert.throws(() => validateDialogue({ ...turn, message: '' }));
  assert.throws(() => validateDialogue({ ...turn, memories: Array(7).fill('x') }));
});

test('replies are length-checked, filtered for blocked topics, and emotions are whitelisted', () => {
  assert.throws(() => validateReply({ reply: 'x'.repeat(281) }, 'qingqing'));
  assert.throws(() => validateReply({ reply: '他在菲律宾有生意。' }, 'qingqing'));
  assert.deepEqual(validateReply({ reply: '好呀', emotion: 'furious' }, 'qingqing'), { reply: '好呀', emotion: 'neutral' });
});

test('blocked or malformed provider output becomes a redacted 502', async () => {
  const env = { DEEPSEEK_API_KEY: 'x' };
  assert.equal((await handleApi(request(), env, async () => reply('{"reply":"那边死过人，绑架的事别问。"}'))).status, 502);
  assert.equal((await handleApi(request(), env, async () => reply('not json'))).status, 502);
  const r = await handleApi(request(), env, async () => new Response('secret', { status: 401 }));
  assert.equal(r.status, 502);
  assert.ok(!(await r.text()).includes('secret'));
});

test('prompt only includes the requested character', () => {
  const [system] = buildPrompt(validateDialogue(turn));
  assert.ok(!system.content.includes('老邝，50多岁'));
});

test('static file resolution refuses path traversal', () => {
  assert.ok(resolveFile('/').file.endsWith('index.html'));
  assert.ok(resolveFile('/assets/maps/mall.png').file.includes('assets'));
  assert.equal(resolveFile('/../package.json'), null);
  assert.equal(resolveFile('/assets/../server.mjs'), null);
  assert.equal(resolveFile('/%2e%2e/server.mjs'), null);
  assert.equal(resolveFile('/js/engine/story.exe'), null);
});
