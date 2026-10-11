import test from 'node:test';
import assert from 'node:assert/strict';
import { createState, serialize, deserialize } from '../public/js/engine/state.js';
import { SCRIPTS, CHOICE_SCENES } from '../public/js/engine/story.js';
import { SCENES, ACTS, INTENTS, CHARACTERS } from '../backend/npc-cards.mjs';
import { runScript, startScript, nextStep, choose, matchOption } from '../public/js/engine/script.js';
import { MINDS, react, trust } from '../public/js/engine/minds.js';
import { QUESTS } from '../public/js/engine/quests.js';
import { interact, drive } from './helpers.mjs';
import { updateApproach } from '../public/js/engine/world.js';

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
      state.minds.qingqing = { trust: 1 };
      const out = runScript(state, id, firstChoice ? [i] : []);
      assert.ok(['end', 'chat'].includes(out.last.type), `${id} ended with ${out.last.type}`);
    }
  }
});

test('every story choice can be reached by free text', () => {
  for (const [id, steps] of Object.entries(SCRIPTS)) {
    for (const step of steps.filter(s => s.choice)) {
      const free = step.choice.every(c => !c.fx && !c.goto && !c.on);
      if (free) continue;
      assert.ok(SCENES[CHOICE_SCENES[id]], `${id}: no scene in CHOICE_SCENES`);
      for (const c of step.choice) {
        assert.ok(c.on, `${id}: option “${c.t}” has no on`);
        for (const m of [c.on].flat()) if (m !== '*') assert.ok(ACTS[m.act], `${id}: unknown act ${m.act}`);
      }
    }
  }
});

test('NPC reaction rules only use acts and intents the server knows', () => {
  for (const [npc, rules] of Object.entries(MINDS)) {
    assert.ok(CHARACTERS[npc], `${npc} has no character card`);
    for (const [act, rule] of Object.entries(rules)) {
      assert.ok(ACTS[act], `${npc}: unknown act ${act}`);
      assert.ok(INTENTS[rule.intent], `${npc}: unknown intent ${rule.intent}`);
      if (rule.mood) assert.ok(CHARACTERS[npc].emotions.includes(rule.mood), `${npc}: unknown mood ${rule.mood}`);
    }
  }
  for (const act of Object.keys(ACTS)) assert.ok(INTENTS[react(createState(), 'fangjie', { act }).act], `default for ${act}`);
});

// 模拟“理解”这一步的结果，检查“决定”这一步
function decide(state, scriptId, said, picks = []) {
  const run = startScript(scriptId);
  for (;;) {
    const step = nextStep(state, run);
    if (step.type === 'choice') {
      if (picks.length) { choose(state, run, picks.shift()); continue; }
      return { run, index: matchOption(state, run, said) };
    }
    if (step.type !== 'line') throw Error(`no choice in ${scriptId}`);
  }
}

test('deposit talk: amounts land in the right range and her bottom line needs trust', () => {
  const state = createState();
  Object.assign(state, { map: 'rental_shop', quest: 'P1' });
  const option = (said) => SCRIPTS.p1_qing.find(s => s.choice).choice[decide(state, 'p1_qing', said).index];
  assert.equal(option({ act: 'propose', amount: 1200 }).fx.flags.p1_offer, 'more');
  assert.equal(option({ act: 'propose', amount: 1000 }).fx.flags.p1_offer, 'fair');
  assert.equal(option({ act: 'propose', amount: 750 }).fx.flags.p1_offer, 'less');
  assert.equal(option({ act: 'propose', amount: 1500 }).fx.flags.p1_offer, 'full');
  assert.equal(option({ act: 'leave' }).goto, 'bye');               // 还不信任你：走就走
  assert.equal(option({ act: 'support' }), undefined);              // 第一次站她这边：没有剧情，交给性格规则
  assert.equal(react(state, 'qingqing', { act: 'support' }, { atChoice: true }).act, 'warm');
  assert.equal(trust(state, 'qingqing'), 1);
  assert.equal(option({ act: 'support' }).goto, 'care');            // 信任够了：她松口
  assert.equal(option({ act: 'leave' }).goto, 'stay');              // 这时候说要走，她会留你
  assert.equal(react(state, 'qingqing', { act: 'pressure' }).act, 'refuse');
  assert.equal(trust(state, 'qingqing'), 0);
});

test('wildcard options only catch what nothing else matches', () => {
  const state = createState();
  const tattoo = said => decide(state, 'a1_06_tattoo', said).index;
  assert.equal(tattoo({ act: 'support' }), 1);
  assert.equal(tattoo({ act: 'challenge' }), 0);
  assert.equal(tattoo({ act: 'chat' }), 2);
});

// 玩家站着不动，老邝自己走过来开口
function arriveAndGetApproached(state) {
  for (let t = 0; t < 20; t += 0.05) {
    const script = updateApproach(state, 0.05);
    if (script) { runScript(state, script); return; }
  }
  assert.fail('老邝没有走到玩家跟前');
}

test('talking to her before Kuang arrives does not skip the prologue', () => {
  const state = createState();
  interact(state, 'door_rental');
  interact(state, 'qingqing');
  assert.equal(state.quest, 'P0');
  arriveAndGetApproached(state);
  assert.equal(state.quest, 'P1');
  assert.ok(state.npcPos.laokuang, 'Kuang walked over');
});

function playPrologue(state) {
  interact(state, 'door_rental');
  assert.equal(state.quest, 'P0');               // 进门不再自动开场
  arriveAndGetApproached(state);
  assert.equal(state.quest, 'P1');
  interact(state, 'laokuang', [0, 6]);          // 问底线，离开
  interact(state, 'qingqing', [0, 8]);          // 问在意什么，离开
  assert.ok(state.flags.k_bottom && state.flags.q_bottom);
  interact(state, 'laokuang', [4, 0]);          // 扣500退1000 → 加微信：好啊
  assert.equal(state.quest, 'A1_01');
  assert.equal(state.phone.pending, 'a1_01_job');
}

test('a failed proposal keeps the prologue open', () => {
  const state = createState();
  interact(state, 'door_rental');
  arriveAndGetApproached(state);
  interact(state, 'laokuang', [6]);
  interact(state, 'qingqing', [8]);
  interact(state, 'laokuang', [2]);             // 全退 → 老邝拒绝
  assert.equal(state.quest, 'P1');
  assert.equal(state.stats.cred, 15);
  const more = interact(state, 'qingqing', [4]); // 退她1200 → 她同意，老邝拒绝
  assert.ok(more.lines.some(l => l.speaker === 'laokuang' && l.text.includes('扣不到五百')));
  interact(state, 'qingqing', [6]);             // 退不到1000 → 她拒绝
  assert.equal(state.quest, 'P1');
  assert.equal(state.stats.cred, 5);
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
