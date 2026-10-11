import test from 'node:test';
import assert from 'node:assert/strict';
import { createState, serialize, deserialize } from '../public/js/engine/state.js';
import { SCRIPTS, CHOICE_SCENES } from '../public/js/engine/story.js';
import { SCENES } from '../backend/npc-cards.mjs';
import { runScript } from '../public/js/engine/script.js';
import { QUESTS } from '../public/js/engine/quests.js';
import { interact, drive } from './helpers.mjs';

test('every goto/call/label in every script resolves', () => {
  for (const [id, steps] of Object.entries(SCRIPTS)) {
    const labels = new Set(steps.filter(s => s.label).map(s => s.label));
    for (const s of steps) {
      if (s.goto) assert.ok(labels.has(s.goto), `${id}: missing label ${s.goto}`);
      if (s.call) assert.ok(SCRIPTS[s.call], `${id}: missing script ${s.call}`);
      for (const c of s.choice || []) if (c.goto) assert.ok(labels.has(c.goto), `${id}: missing label ${c.goto}`);
    }
  }
});

test('every script runs to the end on a fresh state with every first-level choice', () => {
  for (const id of Object.keys(SCRIPTS)) {
    const firstChoice = SCRIPTS[id].find(s => s.choice);
    const count = firstChoice ? firstChoice.choice.length : 1;
    for (let i = 0; i < count; i++) {
      const state = createState();
      Object.assign(state.flags, { p1_talked_k: true, p1_talked_q: true });
      const out = runScript(state, id, firstChoice ? [i] : []);
      assert.ok(['end', 'chat'].includes(out.last.type), `${id} ended with ${out.last.type}`);
    }
  }
});

test('every script with story choices has an AI scene for free-text input', () => {
  for (const [id, steps] of Object.entries(SCRIPTS)) {
    const options = steps.filter(s => s.choice);
    if (!options.length) continue;
    assert.ok(SCENES[CHOICE_SCENES[id]], `${id}: no scene in CHOICE_SCENES`);
    for (const s of options) assert.ok(s.choice.length <= 6, `${id}: too many options for the AI`);
  }
});

function playPrologue(state) {
  interact(state, 'door_rental');
  assert.equal(state.quest, 'P1');
  interact(state, 'laokuang', [0, 3]);          // 问底线，离开
  interact(state, 'qingqing', [0, 4]);          // 问在意什么，离开
  assert.ok(state.flags.k_bottom && state.flags.q_bottom);
  interact(state, 'laokuang', [2, 1, 0]);       // 我有方案 → 扣500退1000 → 好啊
  assert.equal(state.quest, 'A1_01');
  assert.equal(state.phone.pending, 'a1_01_job');
}

test('a failed proposal keeps the prologue open', () => {
  const state = createState();
  interact(state, 'door_rental');
  interact(state, 'laokuang', [3]);
  interact(state, 'qingqing', [4]);
  interact(state, 'laokuang', [2, 0]);          // 全退 → 老邝拒绝
  assert.equal(state.quest, 'P1');
  assert.equal(state.stats.cred, 15);
});

test('full playthrough: prologue to the end of act one', () => {
  const state = createState();
  playPrologue(state);
  assert.equal(state.stats.cred, 30);

  runScript(state, state.phone.pending, [0, 0, 0]);  // 菠菜：追问工作内容
  assert.equal(state.quest, 'A1_02');
  assert.ok(state.claims.casino_job);

  drive(state, 'mall');
  interact(state, 'qingqing', [1, 0]);
  assert.equal(state.quest, 'A1_03');

  drive(state, 'qingqing_house');
  interact(state, 'qingqing');
  assert.equal(state.map, 'japantown');
  interact(state, 'qingqing', [0]);
  assert.equal(state.quest, 'A1_04');
  assert.ok(state.evidence.includes('sakura_polaroid'));

  runScript(state, state.phone.pending, [0, 0]);     // 搬过去
  assert.ok(state.flags.moved_in);
  assert.equal(state.quest, 'A1_05');

  drive(state, 'qingqing_house');
  interact(state, 'qingqing');
  assert.equal(state.quest, 'A1_06');
  interact(state, 'guest_bed', [0]);
  assert.equal(state.quest, 'A1_07');
  assert.ok(state.anchors.victim);

  drive(state, 'parents_home');
  interact(state, 'chen_mother', [0]);
  assert.equal(state.quest, 'A1_08');
  assert.ok(state.flags.listened_mother);

  drive(state, 'golf_range');
  interact(state, 'qingqing', [0]);
  drive(state, 'qingqing_house');
  interact(state, 'qingqing', [0]);                  // 换汇：帮忙
  assert.ok(state.flags.exchange_helped);
  drive(state, 'afternoon_tea');
  interact(state, 'qingqing');
  assert.equal(state.quest, 'A1_08');
  drive(state, 'mall');
  interact(state, 'qingqing');
  assert.equal(state.quest, 'A1_09');

  drive(state, 'qingqing_house');
  interact(state, 'qingqing', [0]);
  assert.equal(state.quest, 'END1');
  assert.ok(state.ended);
  assert.ok(state.anchors.econ_only);
  assert.equal(state.versions.heiress.length, 3);
  assert.equal(state.versions.tattoo.length, 2);
});

test('save round-trips and rejects broken saves', () => {
  const state = createState();
  playPrologue(state);
  const loaded = deserialize(serialize(state));
  assert.deepEqual(loaded, state);
  assert.throws(() => deserialize('{"version":1,"quest":"NOPE","map":"mall"}'));
  assert.throws(() => deserialize('not json'));
});

test('every quest has a title, act, date and copy', () => {
  for (const q of Object.values(QUESTS)) assert.ok(q.title && q.act && q.date && q.copy);
});
