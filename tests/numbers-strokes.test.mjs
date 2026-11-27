import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';

const scriptCode = fs.readFileSync(path.resolve(process.cwd(), 'numbers/strokes-db.js'), 'utf8');
const sandbox = { globalThis: {} };
sandbox.window = sandbox;
vm.runInNewContext(scriptCode, sandbox);

const db = sandbox.NumbersDB;

test('NumbersDB exposes digits 0-9 and numbers list 0-12', () => {
  assert.ok(db, 'NumbersDB must exist');
  for (let d = 0; d <= 9; d++) {
    const strokes = db.DIGIT_STROKES[String(d)];
    assert.ok(Array.isArray(strokes) && strokes.length >= 1, `missing digit ${d}`);
  }
  assert.equal(db.NUMBERS_LIST.length, 13);
  assert.equal(db.NUMBERS_LIST[0].num, 0);
  assert.equal(db.NUMBERS_LIST[12].num, 12);
});

test('getNumberCanvasStrokes generates non-overlapping two-digit strokes for 10, 11, 12', () => {
  for (const n of [10, 11, 12]) {
    const strokes = db.getNumberCanvasStrokes(n, 480, 360);
    assert.ok(strokes.length >= 2, `number ${n} should have >= 2 strokes`);
    const firstMaxX = Math.max(...strokes[0].points.map((p) => p.x));
    const secondMinX = Math.min(...strokes[1].points.map((p) => p.x));
    assert.ok(firstMaxX < secondMinX, `for ${n}, left digit maxX (${firstMaxX}) must be left of right digit minX (${secondMinX})`);
  }
});

test('ROUTINE_BY_HOUR covers all 24 hours with valid sky gradients', () => {
  for (let h = 0; h < 24; h++) {
    const r = db.getRoutineForHour(h);
    assert.ok(r && r.title && r.emoji && Array.isArray(r.sky) && r.sky.length === 2, `invalid routine for hour ${h}`);
  }
});
