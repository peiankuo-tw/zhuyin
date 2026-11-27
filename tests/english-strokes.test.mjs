import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';

const scriptCode = fs.readFileSync(path.resolve(process.cwd(), 'english/strokes-db.js'), 'utf8');
const sandbox = { globalThis: {} };
sandbox.window = sandbox;
vm.runInNewContext(scriptCode, sandbox);

const db = sandbox.EnglishStrokesDB;
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

test('EnglishStrokesDB exposes all 26 uppercase and 26 lowercase letters', () => {
  assert.ok(db, 'EnglishStrokesDB must exist');
  for (const ch of ALPHABET) {
    assert.ok(Array.isArray(db.UPPER_STROKES[ch]) && db.UPPER_STROKES[ch].length >= 1, `missing uppercase ${ch}`);
    const lo = ch.toLowerCase();
    assert.ok(Array.isArray(db.LOWER_STROKES[lo]) && db.LOWER_STROKES[lo].length >= 1, `missing lowercase ${lo}`);
  }
});

test('All stroke coordinates stay within valid four-line bounds (0..100)', () => {
  for (const ch of ALPHABET) {
    for (const [label, list] of [[ch, db.UPPER_STROKES[ch]], [ch.toLowerCase(), db.LOWER_STROKES[ch.toLowerCase()]]]) {
      for (const st of list) {
        assert.ok(Array.isArray(st.points) && st.points.length >= 2, `${label} stroke must have >= 2 points`);
        for (const [x, y] of st.points) {
          assert.ok(x >= 5 && x <= 95, `${label} x=${x} out of range`);
          assert.ok(y >= 15 && y <= 92, `${label} y=${y} out of range`);
        }
      }
    }
  }
});

test('Lowercase i and j have isDot=true on their second stroke', () => {
  assert.equal(db.LOWER_STROKES.i[1].isDot, true);
  assert.equal(db.LOWER_STROKES.j[1].isDot, true);
});

test('getCanvasStrokes combines upper and lower strokes in both mode without overlap', () => {
  const both = db.getCanvasStrokes('A', 'both', 520, 390);
  const upperOnly = db.getCanvasStrokes('A', 'upper', 520, 390);
  const lowerOnly = db.getCanvasStrokes('A', 'lower', 520, 390);
  assert.equal(both.length, upperOnly.length + lowerOnly.length);

  const maxUpperX = Math.max(...both.filter((s) => s.group === 'upper').flatMap((s) => s.points.map((p) => p.x)));
  const minLowerX = Math.min(...both.filter((s) => s.group === 'lower').flatMap((s) => s.points.map((p) => p.x)));
  assert.ok(maxUpperX < minLowerX, `Upper (${maxUpperX}) should stay strictly left of Lower (${minLowerX})`);
});
