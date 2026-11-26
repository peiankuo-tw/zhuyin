/**
 * 台灣教育部標準筆順 (c9s/zh-stroke-data) 與萌典注音/部首查詢服務
 * 無 DOM 依賴，可在瀏覽器與 Node 測試環境共用。
 */

const MOEDICT_CACHE_KEY = 'hanzi_moedict_cache_v1';
const MOEDICT_CACHE_LIMIT = 500;
const STROKE_CDN_BASE = 'https://cdn.jsdelivr.net/gh/c9s/zh-stroke-data@master/json';
const MOEDICT_API_BASE = 'https://www.moedict.tw/uni';

const strokeMemoryCache = new Map();
const metaMemoryCache = new Map();
let localMetaCache = null;

/**
 * 過濾字串，僅保留繁體/基本區中文字元 (U+4E00 ~ U+9FFF)
 * @param {string} text
 * @param {boolean} deduplicate
 * @returns {string[]}
 */
export function filterChineseChars(text, deduplicate = true) {
  if (typeof text !== 'string' || !text) return [];
  const matches = text.match(/[\u4E00-\u9FFF]/g) || [];
  if (!deduplicate) return matches;
  const seen = new Set();
  const result = [];
  for (const ch of matches) {
    if (!seen.has(ch)) {
      seen.add(ch);
      result.push(ch);
    }
  }
  return result;
}

/**
 * 將萌典回傳的注音字串拆解為台灣直式注音排版結構
 * 例：「（讀音）ㄒㄩㄝˊ」 -> { symbols: ['ㄒ','ㄩ','ㄝ'], tone: 'ˊ', isNeutral: false }
 * 例：「˙ㄉㄜ」 -> { symbols: ['ㄉ','ㄜ'], tone: '˙', isNeutral: true }
 * @param {string} rawBopomofo
 * @returns {{ symbols: string[], tone: string, isNeutral: boolean }}
 */
export function parseZhuyin(rawBopomofo) {
  if (typeof rawBopomofo !== 'string' || !rawBopomofo.trim()) {
    return { symbols: [], tone: '', isNeutral: false };
  }

  // 移除萌典偶爾附帶的（讀音）、（語音）、（又音）、(變) 等標記與空白
  const cleaned = rawBopomofo
    .replace(/[（(][^）)]*[）)]/g, '')
    .replace(/\s+/g, '')
    .trim();

  const symbols = [];
  let tone = '';
  let isNeutral = false;

  for (const ch of cleaned) {
    if (ch === '˙') {
      tone = '˙';
      isNeutral = true;
    } else if (ch === 'ˊ' || ch === 'ˇ' || ch === 'ˋ') {
      tone = ch;
    } else if (/[\u3105-\u3129]/.test(ch)) {
      symbols.push(ch);
    }
  }

  return { symbols, tone, isNeutral };
}

/**
 * 限制快取物件鍵數，超過上限時依序淘汰最舊項目
 * @param {Record<string, any>} cacheObj
 * @param {number} maxEntries
 * @returns {Record<string, any>}
 */
export function trimCacheMap(cacheObj, maxEntries = MOEDICT_CACHE_LIMIT) {
  const keys = Object.keys(cacheObj);
  if (keys.length <= maxEntries) return cacheObj;
  const keepKeys = keys.slice(keys.length - maxEntries);
  const next = {};
  for (const k of keepKeys) {
    next[k] = cacheObj[k];
  }
  return next;
}

function getLocalStorageSafe() {
  try {
    if (typeof globalThis !== 'undefined' && globalThis.localStorage) {
      return globalThis.localStorage;
    }
  } catch {
    // 瀏覽器隱私模式或沙盒環境可能禁止存取 localStorage
  }
  return null;
}

function loadLocalMetaCache() {
  if (localMetaCache !== null) return localMetaCache;
  const ls = getLocalStorageSafe();
  if (!ls) {
    localMetaCache = {};
    return localMetaCache;
  }
  try {
    const raw = ls.getItem(MOEDICT_CACHE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    localMetaCache = parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    localMetaCache = {};
  }
  return localMetaCache;
}

function saveLocalMetaEntry(char, meta) {
  const cache = loadLocalMetaCache();
  // 刪除舊鍵再重設，維持簡易 LRU 順序
  if (Object.prototype.hasOwnProperty.call(cache, char)) {
    delete cache[char];
  }
  cache[char] = meta;
  localMetaCache = trimCacheMap(cache, MOEDICT_CACHE_LIMIT);
  const ls = getLocalStorageSafe();
  if (!ls) return;
  try {
    ls.setItem(MOEDICT_CACHE_KEY, JSON.stringify(localMetaCache));
  } catch {
    // 超過儲存配額時靜默略過，不影響功能
  }
}

/**
 * 取得單字的台灣教育部標準筆順資料 (2048×2048 座標系)
 * 找不到或離線時回傳 null（由呼叫端降級為楷書描紅）
 * @param {string} char
 * @returns {Promise<Array<{ outline: Array, track: Array }> | null>}
 */
export async function getCharStrokeData(char) {
  if (!char || char.length === 0) return null;
  const ch = Array.from(char)[0];
  if (strokeMemoryCache.has(ch)) {
    return strokeMemoryCache.get(ch);
  }

  const hex = ch.codePointAt(0).toString(16).toLowerCase();
  const url = `${STROKE_CDN_BASE}/${hex}.json`;

  try {
    const res = await fetch(url, { mode: 'cors' });
    if (!res.ok) {
      strokeMemoryCache.set(ch, null);
      return null;
    }
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) {
      strokeMemoryCache.set(ch, null);
      return null;
    }
    strokeMemoryCache.set(ch, data);
    return data;
  } catch {
    return null;
  }
}

/**
 * 取得單字的萌典注音（含破音字所有讀音）、部首與總筆畫數
 * @param {string} char
 * @returns {Promise<{ char: string, readings: string[], radical: string, strokeCount: number | null }>}
 */
export async function getCharMeta(char) {
  const fallback = { char, readings: [], radical: '', strokeCount: null };
  if (!char) return fallback;
  const ch = Array.from(char)[0];

  if (metaMemoryCache.has(ch)) {
    return metaMemoryCache.get(ch);
  }

  const localCache = loadLocalMetaCache();
  if (localCache[ch]) {
    metaMemoryCache.set(ch, localCache[ch]);
    return localCache[ch];
  }

  const url = `${MOEDICT_API_BASE}/${encodeURIComponent(ch)}.json`;
  try {
    const res = await fetch(url, { mode: 'cors' });
    if (!res.ok) return fallback;
    const data = await res.json();

    const readingsSet = new Set();
    const heteronyms = Array.isArray(data.heteronyms) ? data.heteronyms : [];
    for (const h of heteronyms) {
      if (typeof h?.bopomofo === 'string' && h.bopomofo.trim()) {
        // 清理括號備註並過濾非注音讀音
        const cleaned = h.bopomofo
          .replace(/[（(][^）)]*[）)]/g, '')
          .replace(/\s+/g, '')
          .trim();
        const parsed = parseZhuyin(cleaned);
        if (parsed.symbols.length > 0) {
          const normalized = parsed.isNeutral
            ? `˙${parsed.symbols.join('')}`
            : `${parsed.symbols.join('')}${parsed.tone}`;
          readingsSet.add(normalized);
        }
      }
    }

    const meta = {
      char: ch,
      readings: Array.from(readingsSet),
      radical: typeof data.radical === 'string' ? data.radical.trim() : '',
      strokeCount: typeof data.stroke_count === 'number' ? data.stroke_count : null
    };

    metaMemoryCache.set(ch, meta);
    saveLocalMetaEntry(ch, meta);
    return meta;
  } catch {
    return fallback;
  }
}
