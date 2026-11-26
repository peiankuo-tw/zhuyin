import test from 'node:test';
import assert from 'node:assert/strict';
import {
  filterChineseChars,
  parseZhuyin,
  trimCacheMap
} from '../hanzi/stroke-service.js';

test('filterChineseChars removes punctuation, digits, English, spaces and deduplicates by default', () => {
  const input = '第一課：拍拍手！123 abc 拍、手，一起玩。';
  assert.deepEqual(filterChineseChars(input, true), ['第', '一', '課', '拍', '手', '起', '玩']);
});

test('filterChineseChars preserves duplicates when deduplicate=false', () => {
  const input = '爸爸 媽媽！';
  assert.deepEqual(filterChineseChars(input, false), ['爸', '爸', '媽', '媽']);
});

test('parseZhuyin handles first tone (no mark)', () => {
  assert.deepEqual(parseZhuyin('ㄊㄧㄢ'), {
    symbols: ['ㄊ', 'ㄧ', 'ㄢ'],
    tone: '',
    isNeutral: false
  });
});

test('parseZhuyin handles second, third, fourth tones', () => {
  assert.deepEqual(parseZhuyin('ㄒㄩㄝˊ'), {
    symbols: ['ㄒ', 'ㄩ', 'ㄝ'],
    tone: 'ˊ',
    isNeutral: false
  });
  assert.deepEqual(parseZhuyin('ㄨㄛˇ'), {
    symbols: ['ㄨ', 'ㄛ'],
    tone: 'ˇ',
    isNeutral: false
  });
  assert.deepEqual(parseZhuyin('ㄌㄜˋ'), {
    symbols: ['ㄌ', 'ㄜ'],
    tone: 'ˋ',
    isNeutral: false
  });
});

test('parseZhuyin handles neutral tone (˙) placed at start or end', () => {
  assert.deepEqual(parseZhuyin('˙ㄉㄜ'), {
    symbols: ['ㄉ', 'ㄜ'],
    tone: '˙',
    isNeutral: true
  });
  assert.deepEqual(parseZhuyin('ㄉㄜ˙'), {
    symbols: ['ㄉ', 'ㄜ'],
    tone: '˙',
    isNeutral: true
  });
});

test('parseZhuyin strips Moedict reading prefixes like （讀音） or （又音）', () => {
  assert.deepEqual(parseZhuyin('（讀音）ㄒㄩㄝˊ'), {
    symbols: ['ㄒ', 'ㄩ', 'ㄝ'],
    tone: 'ˊ',
    isNeutral: false
  });
});

test('trimCacheMap evicts oldest entries when exceeding maxEntries', () => {
  const obj = { a: 1, b: 2, c: 3, d: 4 };
  const trimmed = trimCacheMap(obj, 2);
  assert.deepEqual(Object.keys(trimmed), ['c', 'd']);
});
