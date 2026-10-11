import test from 'node:test';
import assert from 'node:assert/strict';
import { createState, serialize, deserialize, applyFx } from '../public/js/engine/state.js';
import { SCRIPTS, CHOICE_SCENES } from '../public/js/engine/story.js';
import { SCENES, ACTS, INTENTS, CHARACTERS } from '../backend/npc-cards.mjs';
import { runScript, startScript, nextStep, choose, matchOption } from '../public/js/engine/script.js';
import { MINDS, react, trust } from '../public/js/engine/minds.js';
import { AI_NPCS } from '../public/js/engine/catalog.js';
import { CONTACTS, contactScene, search, comparePhotos, findCase, caseComplete } from '../public/js/engine/phone.js';
import { startHeist, doAction, restore, flaws, endHeist, tick as heistTick, HEIST_MINUTES } from '../public/js/engine/heist.js';
import { CASE_NO } from '../public/js/engine/content/heist_content.js';
import { PUZZLES, checkPuzzle } from '../public/js/engine/content/puzzles.js';
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

test('every script runs to the end on a fresh state with every open first-level choice', () => {
  const fresh = () => {
    const state = createState();
    Object.assign(state.flags, { p1_talked_k: true, p1_talked_q: true });
    state.minds.qingqing = { trust: 1 };
    state.stats.clarity = 50;
    return state;
  };
  for (const id of Object.keys(SCRIPTS)) {
    // 先走到第一个选项，看看此刻哪些选项是开着的
    const run = startScript(id);
    let step;
    const probe = fresh();
    do step = nextStep(probe, run); while (step.type === 'line' || step.type === 'open');
    const open = step.type === 'choice' ? step.options.map(o => o.index) : [null];
    for (const i of open) {
      const out = runScript(fresh(), id, i === null ? [] : [i]);
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
        for (const m of [c.on].flat()) {
          if (m === '*') continue;
          assert.ok(m.act || m.topic, `${id}: option “${c.t}” matches nothing`);
          if (m.act) assert.ok(ACTS[m.act], `${id}: unknown act ${m.act}`);
        }
      }
    }
  }
});

test('every AI-voiced character has a character card, and every scene lists real characters', () => {
  for (const npc of AI_NPCS) assert.ok(CHARACTERS[npc], `${npc} has no character card`);
  for (const [id, scene] of Object.entries(SCENES)) for (const npc of scene.npcs) assert.ok(AI_NPCS.includes(npc), `${id}: ${npc} is not an AI NPC`);
  for (const [id, c] of Object.entries(CONTACTS)) {
    if (!c.npc) { assert.ok(c.script, `contact ${id} has neither a character nor a script`); continue; }
    assert.ok(SCENES[contactScene(createState(), id)]?.npcs.includes(c.npc), `contact ${id}`);
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

// 序章 + 第一幕，其余各幕的通关测试接着往下打
function playActOne() {
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
  assert.equal(state.quest, 'A2_09');
  assert.equal(state.actBreak, 1);
  assert.ok(state.anchors.econ_only);
  assert.equal(state.versions.heiress.length, 3);
  assert.equal(state.versions.tattoo.length, 2);
  return state;
}

test('full playthrough: prologue to the end of act one', () => {
  playActOne();
});

function playActTwo(state) {
  interact(state, 'qingqing', [0, 0, 0]);             // 玩一玩：拒绝并离开
  assert.ok(state.flags.d_refused);
  assert.equal(state.map, 'casino_suite');
  interact(state, 'qingqing', [1, 1, 1]);             // 赌场三日：三次都设界
  assert.equal(state.pressure.filter(p => p.kind === 'boundary').length, 3);
  assert.equal(state.quest, 'A2_10B');
  assert.equal(state.map, 'chen_home');
  runScript(state, state.phone.pending, [1]);         // 台阶：问司机
  assert.equal(state.quest, 'A2_11');

  drive(state, 'qingqing_house_b');
  interact(state, 'qingqing', [1]);                   // 不帮她对芳姐撒谎
  assert.ok(state.flags.refused_lie && state.flags.lease_my_name);
  assert.equal(state.quest, 'A2_12');

  drive(state, 'financial_district');
  interact(state, 'tower_door');
  interact(state, 'tower_sign');
  interact(state, 'tower_door', [1]);                 // 先不结婚
  assert.ok(state.evidence.includes('lawfirm_folder'));
  assert.ok(!state.flags.married);
  assert.equal(state.quest, 'A2_13');

  drive(state, 'mansion_hills');
  interact(state, 'qingqing');
  interact(state, 'tools', [1]);                      // 不背锅
  assert.equal(state.quest, 'A2_14');

  drive(state, 'qingqing_house_b');
  interact(state, 'qingqing', [2]);                   // 去阿珍那里登记
  assert.ok(state.flags.real_name_leak);
  assert.equal(state.quest, 'A2_14B');
  interact(state, 'qingqing', [0]);
  assert.equal(state.quest, 'A3_15');
  assert.equal(state.actBreak, 2);
  assert.ok(state.flags.saw_darvo);
  return state;
}

test('full playthrough: act two', () => {
  playActTwo(playActOne());
});

// 模拟在手机上读一条搜索结果（以及照片比对）
function readResult(state, query, id) {
  const r = search(state, query).find(x => x.id === id);
  assert.ok(r, `searching “${query}” should find ${id}`);
  state.searched.push(r.id);
  if (r.fx) applyFx(state, typeof r.fx === 'function' ? r.fx(state) : r.fx);
  if (r.compare) {
    assert.ok(!comparePhotos(r, ['发型']).ok, 'hair is not a feature');
    assert.ok(comparePhotos(r, r.compare.match).ok);
    applyFx(state, r.compare.fx);
  }
  return r.then?.(state);
}

function playActThree(state) {
  runScript(state, state.phone.pending, [0]);         // 老钟来电
  assert.equal(state.quest, 'A3_16');
  assert.ok(state.notebook.some(n => n.text.includes('许嘉晴')));
  assert.equal(search(state, '许嘉晴')[0].id, 'xjq_other', 'before September the bare name finds nothing useful');
  runScript(state, state.phone.pending, [0, 0]);      // 资金审查 → 28天 → 逼她退钱
  for (const id of ['laozhong', 'michael', 'xiaomo']) runScript(state, CONTACTS[id].script(state), [0]);
  assert.ok(state.flags.paid_xiaomo && state.flags.told_police);
  assert.equal(state.phone.pending, 'a3_16_explain2');
  runScript(state, state.phone.pending);
  assert.equal(state.claims.accountant.status, 'overturned');
  assert.equal(state.quest, 'A3_17');
  runScript(state, state.phone.pending, [0]);          // 拆穿新闻贴金
  assert.ok(state.evidence.includes('pattern_news'));
  assert.equal(state.quest, 'A3_18');

  assert.equal(readResult(state, '许嘉晴', 'luna_main'), null);
  assert.equal(readResult(state, '许嘉晴', 'luna_chat'), null);
  readResult(state, '鹿鸣', 'luna_v2');
  const next = readResult(state, '许嘉晴', 'luna_photo');
  assert.equal(next, 'a3_18_realize');
  runScript(state, next);
  assert.equal(state.quest, 'A3_19');

  runScript(state, CONTACTS.qingqing.script(state));   // 语音聊：版本三
  assert.equal(state.versions.luna.length, 2);
  drive(state, 'qingqing_house_b');
  interact(state, 'qingqing', [0, 0, 0]);              // 相信她，回家都记下来
  assert.ok(state.flags.g_record);
  runScript(state, state.phone.pending, [0, 0, 0]);    // 三次都转账
  assert.equal(state.transfers.reduce((n, t) => n + t.amount, 0), 600);
  assert.equal(state.quest, 'A4_21');
  assert.equal(state.actBreak, 3);
  return state;
}

test('full playthrough: act three', () => {
  playActThree(playActTwo(playActOne()));
});

function playActFour(state) {
  runScript(state, state.phone.pending);                // 她来电：帮我搬家
  drive(state, 'qingqing_house_b');
  const arrive = interact(state, 'qingqing');
  assert.deepEqual(arrive.opened, ['heist']);
  startHeist(state);
  assert.equal(state.heist.minutes, HEIST_MINUTES);

  doAction(state, 'b_boxes', 'bag');
  doAction(state, 'b_camera', 'look');
  doAction(state, 'b_suitcase', 'caseno');
  doAction(state, 'b_suitcase', 'art4');
  assert.ok(restore(state, 'b_suitcase', ['护照复印件', '英文卷宗', '照片']));
  doAction(state, 'b_phone', 'father');
  doAction(state, 'b_phone', 'fathernum');
  doAction(state, 'b_phone', 'contacts');
  assert.ok(!restore(state, 'b_phone', '相册'), 'the phone was on the chat list, not the album');
  assert.equal(flaws(state), 1);
  assert.equal(state.heist.minutes, 180 - 5 - 2 - 5 - 15 - 5 - 15 - 5 - 10 - 3);
  heistTick(state, 60);
  assert.ok(state.heist.minutes < 115);
  endHeist(state);
  runScript(state, 'a4_21_return');
  assert.equal(state.quest, 'A4_21B');
  assert.ok(state.flags.opened_suitcase && state.flags.read_phone && state.flags.bag_on_camera);

  // 在法院案件系统里读完卷宗，钉齐关键段落
  const kase = findCase(state, CASE_NO.toUpperCase().replace(':', ' : '));
  assert.ok(kase && state.notebook.some(n => n.id === `case:${CASE_NO}`));
  state.pinned[CASE_NO] = kase.pages.flatMap(p => p.paras).filter(p => p.key).map(p => p.key);
  assert.ok(caseComplete(state, CASE_NO));
  applyFx(state, kase.onComplete);
  runScript(state, kase.then);
  assert.ok(state.anchors.victim.overturned && state.anchors.econ_only.overturned);
  assert.equal(state.quest, 'A4_22');

  // 诈问：两次都否认 + 手机没放回原样 → 她判断你在撒谎
  state.lastSaid = { length: 6 };
  runScript(state, state.phone.pending, [2, 2]);
  assert.equal(state.flags.lie_judged, true);
  assert.equal(state.quest, 'A4_23');

  runScript(state, state.phone.pending);                // 麦可给了赵慧的微信
  const zh = runScript(state, CONTACTS.zhaohui.script(state), [0]);
  assert.deepEqual(zh.opened, ['money_flow']);
  const p = PUZZLES.money_flow;
  assert.ok(!checkPuzzle('money_flow', {}).ok);
  const out = checkPuzzle('money_flow', Object.fromEntries(p.rows.map((r, i) => [i, r.answer])));
  assert.match(out.text, /85%/);
  applyFx(state, p.fx);
  runScript(state, p.then);
  assert.equal(state.quest, 'A4_23');

  readResult(state, '许嘉晴 深圳', 'classmate_post');
  runScript(state, CONTACTS.tongxue.script(state));
  assert.equal(state.quest, 'A5_24');
  assert.equal(state.actBreak, 4);

  runScript(state, CONTACTS.father.script(state), [0, 1]);   // 打给她父亲：说她在美国过得不好
  assert.ok(state.flags.father_message);
  return state;
}

test('full playthrough: act four', () => {
  playActFour(playActThree(playActTwo(playActOne())));
});

test('the probe call: a clean answer after a clean search is believed', () => {
  const state = createState();
  state.flags.restore_flaws = 0;
  state.lastSaid = { length: 4 };
  runScript(state, 'a4_22_call', [3, 3]);
  assert.equal(state.flags.lie_judged, false);
  const admit = createState();
  runScript(admit, 'a4_22_call', [1]);
  assert.ok(admit.flags.admitted && admit.phone.blocked.includes('qingqing'));
});

test('a high-clarity player can find the Luna case early with name + keyword', () => {
  const state = createState();
  state.quest = 'A3_16';
  assert.equal(search(state, '许嘉晴 网红').length, 0, 'not before the name is known');
  state.flags.knows_real_name = true;
  assert.ok(search(state, '许嘉晴 网红').some(r => r.id === 'luna_main'));
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
