import {
  filterChineseChars,
  parseZhuyin,
  getCharStrokeData,
  getCharMeta
} from './stroke-service.js';
import { HanziCanvas } from './canvas.js';

const PROGRESS_KEY = 'hanzi_practice_progress_v1';
const CUSTOM_LISTS_KEY = 'hanzi_custom_lists_v1';

// =========================================================================
// 應用狀態
// =========================================================================
const state = {
  mode: 'practice', // 'practice' | 'print'
  source: 'textbook', // 'textbook' | 'custom'
  publisher: 'kangxuan',
  grade: 1,
  semester: '1',
  lessonIndex: 0,
  gradeCache: new Map(), // key: `${pub}-${grade}` -> json
  lessonAllChars: [],
  activeChars: [], // 目前啟用要練／要印的生字陣列
  currentCharIndex: 0,
  completedSet: new Set(),
  selectedReadingMap: new Map(), // char -> reading string (破音字選擇)
  charMetaMap: new Map(), // char -> meta
  customLists: [],
  customTitle: '國小生字字帖練習',
  titleManuallyEdited: false,
  showGuide: true,
  printOptions: {
    grid: 'jiugong',
    size: 'standard', // 'standard' | 'large'
    traceCount: 2,
    showZhuyin: true,
    showInfo: true
  }
};

// DOM 參照
const el = {
  modePracticeBtn: document.getElementById('modePracticeBtn'),
  modePrintBtn: document.getElementById('modePrintBtn'),
  sourceTextbookBtn: document.getElementById('sourceTextbookBtn'),
  sourceCustomBtn: document.getElementById('sourceCustomBtn'),
  textbookSourcePane: document.getElementById('textbookSourcePane'),
  customSourcePane: document.getElementById('customSourcePane'),
  activeCountBadge: document.getElementById('activeCountBadge'),

  publisherSelect: document.getElementById('publisherSelect'),
  gradeSelect: document.getElementById('gradeSelect'),
  semesterSelect: document.getElementById('semesterSelect'),
  lessonSelect: document.getElementById('lessonSelect'),
  lessonCharChips: document.getElementById('lessonCharChips'),
  selectAllLessonBtn: document.getElementById('selectAllLessonBtn'),
  clearLessonBtn: document.getElementById('clearLessonBtn'),
  copyToCustomBtn: document.getElementById('copyToCustomBtn'),

  customCharsInput: document.getElementById('customCharsInput'),
  dedupeCheckbox: document.getElementById('dedupeCheckbox'),
  applyCustomBtn: document.getElementById('applyCustomBtn'),
  saveCustomListBtn: document.getElementById('saveCustomListBtn'),
  savedListsContainer: document.getElementById('savedListsContainer'),

  practiceSection: document.getElementById('practiceSection'),
  practiceEmptyState: document.getElementById('practiceEmptyState'),
  practiceWorkspace: document.getElementById('practiceWorkspace'),
  practiceCharStripCard: document.getElementById('practiceCharStripCard'),
  practiceCharStrip: document.getElementById('practiceCharStrip'),
  prevCharBtn: document.getElementById('prevCharBtn'),
  nextCharBtn: document.getElementById('nextCharBtn'),

  infoBigChar: document.getElementById('infoBigChar'),
  infoZhuyinBox: document.getElementById('infoZhuyinBox'),
  speakCharBtn: document.getElementById('speakCharBtn'),
  polyphoneBar: document.getElementById('polyphoneBar'),
  polyphoneButtons: document.getElementById('polyphoneButtons'),
  infoRadical: document.getElementById('infoRadical'),
  infoStrokeCount: document.getElementById('infoStrokeCount'),
  strokeStatusBanner: document.getElementById('strokeStatusBanner'),

  playNormalBtn: document.getElementById('playNormalBtn'),
  playSlowBtn: document.getElementById('playSlowBtn'),
  stepStrokeBtn: document.getElementById('stepStrokeBtn'),
  toggleGuideBtn: document.getElementById('toggleGuideBtn'),
  stepIndicator: document.getElementById('stepIndicator'),
  starStampOverlay: document.getElementById('starStampOverlay'),

  brushWidthInput: document.getElementById('brushWidthInput'),
  undoBtn: document.getElementById('undoBtn'),
  clearBtn: document.getElementById('clearBtn'),
  completeCharBtn: document.getElementById('completeCharBtn'),

  printSection: document.getElementById('printSection'),
  printNowBtn: document.getElementById('printNowBtn'),
  printTitleInput: document.getElementById('printTitleInput'),
  printGridSelect: document.getElementById('printGridSelect'),
  printSizeSelect: document.getElementById('printSizeSelect'),
  printTraceCountSelect: document.getElementById('printTraceCountSelect'),
  printShowZhuyin: document.getElementById('printShowZhuyin'),
  printShowInfo: document.getElementById('printShowInfo'),
  printLoadingHint: document.getElementById('printLoadingHint'),
  a4PreviewContainer: document.getElementById('a4PreviewContainer'),
  confettiCanvas: document.getElementById('confettiCanvas')
};

const hanziCanvas = new HanziCanvas(document.getElementById('hanziCanvas'), {
  onStepChange(current, total) {
    if (total === 0) {
      el.stepIndicator.textContent = '楷書描紅模式';
    } else if (current === 0) {
      el.stepIndicator.textContent = `共 ${total} 畫・準備就緒`;
    } else {
      el.stepIndicator.textContent = `第 ${current} / ${total} 畫`;
    }
  }
});

// =========================================================================
// localStorage 持久化（安全 try/catch）
// =========================================================================
function loadPersistedState() {
  try {
    const rawProg = localStorage.getItem(PROGRESS_KEY);
    if (rawProg) {
      const arr = JSON.parse(rawProg);
      if (Array.isArray(arr)) {
        state.completedSet = new Set(arr);
      }
    }
  } catch {
    // ignore
  }

  try {
    const rawLists = localStorage.getItem(CUSTOM_LISTS_KEY);
    if (rawLists) {
      const arr = JSON.parse(rawLists);
      if (Array.isArray(arr)) {
        state.customLists = arr;
      }
    }
  } catch {
    // ignore
  }
}

function saveProgress() {
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(Array.from(state.completedSet)));
  } catch {
    // ignore
  }
}

function saveCustomLists() {
  try {
    localStorage.setItem(CUSTOM_LISTS_KEY, JSON.stringify(state.customLists));
  } catch {
    // ignore
  }
}

// =========================================================================
// 直式注音 HTML 產生器
// =========================================================================
function renderZhuyinHTML(readingStr) {
  const { symbols, tone, isNeutral } = parseZhuyin(readingStr);
  if (symbols.length === 0) return '';
  const neutralHtml = isNeutral ? `<span class="zhuyin-neutral">˙</span>` : '';
  const symbolsHtml = symbols.map((s) => `<span>${s}</span>`).join('');
  const toneHtml = !isNeutral && tone ? `<span class="zhuyin-tone-col">${tone}</span>` : '';
  return `<span class="zhuyin-vertical"><span class="zhuyin-main-col">${neutralHtml}${symbolsHtml}</span>${toneHtml}</span>`;
}

function getEffectiveReading(char) {
  if (state.selectedReadingMap.has(char)) {
    return state.selectedReadingMap.get(char);
  }
  const meta = state.charMetaMap.get(char);
  if (meta && meta.readings.length > 0) {
    return meta.readings[0];
  }
  return '';
}

// =========================================================================
// 課本版本資料載入
// =========================================================================
async function loadGradeData(publisher, grade) {
  const key = `${publisher}-${grade}`;
  if (state.gradeCache.has(key)) {
    return state.gradeCache.get(key);
  }
  const res = await fetch(`../data/${key}.json`);
  if (!res.ok) throw new Error(`無法載入字庫：${key}`);
  const data = await res.json();
  state.gradeCache.set(key, data);
  return data;
}

async function refreshTextbookLessons() {
  el.lessonSelect.innerHTML = '<option>載入中...</option>';
  try {
    const gradeData = await loadGradeData(state.publisher, state.grade);
    const lessons = gradeData.semesters?.[state.semester] || [];
    el.lessonSelect.innerHTML = lessons
      .map((item, idx) => `<option value="${idx}">${item.title}（${item.chars.length}字）</option>`)
      .join('');
    state.lessonIndex = 0;
    applyCurrentLesson(gradeData, lessons[0]);
  } catch (err) {
    el.lessonSelect.innerHTML = '<option>載入失敗，請改用自訂輸入</option>';
    console.error(err);
  }
}

function applyCurrentLesson(gradeData, lessonObj) {
  if (!lessonObj) {
    state.lessonAllChars = [];
    setActiveChars([]);
    return;
  }
  const chars = filterChineseChars(lessonObj.chars, true);
  state.lessonAllChars = chars;
  const semText = state.semester === '1' ? '上學期' : '下學期';
  const gradeNames = ['', '一', '二', '三', '四', '五', '六'];
  const autoTitle = `${gradeData.publisherName} ${gradeNames[gradeData.grade]}年級${semText} ${lessonObj.title} 生字練習`;
  if (!state.titleManuallyEdited) {
    state.customTitle = autoTitle;
    el.printTitleInput.value = autoTitle;
  }
  setActiveChars([...chars]);
  renderLessonCharChips();
}

function renderLessonCharChips() {
  const activeSet = new Set(state.activeChars);
  el.lessonCharChips.innerHTML = state.lessonAllChars
    .map((ch) => {
      const selected = activeSet.has(ch);
      const cls = selected
        ? 'bg-emerald-500 text-white border-emerald-600 shadow-sm'
        : 'bg-white text-stone-400 border-stone-200 line-through';
      return `<button type="button" data-lesson-char="${ch}" class="btn-3d w-9 h-9 rounded-xl border-2 font-kai text-lg font-bold ${cls}">${ch}</button>`;
    })
    .join('');
}

// =========================================================================
// 目前啟用生字清單更新
// =========================================================================
function setActiveChars(chars) {
  state.activeChars = chars;
  state.currentCharIndex = 0;
  el.activeCountBadge.textContent = String(chars.length);
  el.printNowBtn.disabled = chars.length === 0;

  if (state.mode === 'practice') {
    renderPracticeSection();
  } else {
    renderPrintPreview();
  }
}

// =========================================================================
// 模式一：線上互動描寫渲染
// =========================================================================
async function renderPracticeSection() {
  if (state.activeChars.length === 0) {
    el.practiceEmptyState.classList.remove('hidden');
    el.practiceWorkspace.classList.add('hidden');
    el.practiceCharStripCard.classList.add('hidden');
    return;
  }

  el.practiceEmptyState.classList.add('hidden');
  el.practiceWorkspace.classList.remove('hidden');
  el.practiceCharStripCard.classList.remove('hidden');

  renderPracticeCharStrip();
  await loadCurrentCharToWorkspace();
}

function renderPracticeCharStrip() {
  el.practiceCharStrip.innerHTML = state.activeChars
    .map((ch, idx) => {
      const isCurrent = idx === state.currentCharIndex;
      const isDone = state.completedSet.has(ch);
      const baseCls = isCurrent
        ? 'bg-emerald-500 text-white border-emerald-600 scale-105 shadow-md'
        : isDone
          ? 'bg-amber-50 text-amber-900 border-amber-300'
          : 'bg-white text-stone-700 border-stone-200 hover:border-emerald-300';
      const starBadge = isDone
        ? `<span class="absolute -top-1.5 -right-1.5 text-xs">⭐</span>`
        : '';
      return `<button type="button" data-strip-idx="${idx}" class="relative btn-3d w-11 h-11 rounded-2xl border-2 font-kai text-xl font-bold shrink-0 ${baseCls}">${ch}${starBadge}</button>`;
    })
    .join('');
}

let loadCharToken = 0;
async function loadCurrentCharToWorkspace() {
  const ch = state.activeChars[state.currentCharIndex];
  if (!ch) return;

  const myToken = ++loadCharToken;
  el.infoBigChar.textContent = ch;
  el.infoZhuyinBox.innerHTML = '';
  el.infoRadical.textContent = '...';
  el.infoStrokeCount.textContent = '...';
  el.polyphoneBar.classList.add('hidden');
  el.strokeStatusBanner.textContent = '載入台灣教育部標準筆順中...';
  el.strokeStatusBanner.className = 'text-xs font-bold px-3 py-2 rounded-xl bg-stone-100 text-stone-600';
  el.starStampOverlay.classList.add('hidden');

  // 先用楷書底字快速顯示，避免等待網路閃白
  hanziCanvas.setCharacter(ch, null);

  // 並行載入教育部筆順與萌典注音/部首
  const [strokeData, meta] = await Promise.all([
    getCharStrokeData(ch),
    getCharMeta(ch)
  ]);

  if (myToken !== loadCharToken) return; // 使用者已切到其他字

  state.charMetaMap.set(ch, meta);
  hanziCanvas.setCharacter(ch, strokeData);

  // 更新筆順狀態提示
  if (strokeData && strokeData.length > 0) {
    el.strokeStatusBanner.textContent = `✅ 已載入台灣教育部標準筆順（共 ${strokeData.length} 畫）`;
    el.strokeStatusBanner.className = 'text-xs font-bold px-3 py-2 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200';
    el.playNormalBtn.disabled = false;
    el.playSlowBtn.disabled = false;
    el.stepStrokeBtn.disabled = false;
  } else {
    el.strokeStatusBanner.textContent = '💡 此字無筆順動畫資料，已自動切換為楷書描紅練習';
    el.strokeStatusBanner.className = 'text-xs font-bold px-3 py-2 rounded-xl bg-amber-50 text-amber-800 border border-amber-200';
    el.playNormalBtn.disabled = true;
    el.playSlowBtn.disabled = true;
    el.stepStrokeBtn.disabled = true;
  }

  // 更新部首與總筆畫
  el.infoRadical.textContent = meta.radical || '—';
  const totalStrokes = meta.strokeCount ?? (strokeData ? strokeData.length : null);
  el.infoStrokeCount.textContent = totalStrokes ? `${totalStrokes} 畫` : '—';

  // 更新注音與破音字按鈕
  renderInfoZhuyinAndPolyphone(ch, meta);
}

function renderInfoZhuyinAndPolyphone(ch, meta) {
  const reading = getEffectiveReading(ch);
  el.infoZhuyinBox.innerHTML = reading ? renderZhuyinHTML(reading) : '';

  if (meta.readings.length > 1) {
    el.polyphoneBar.classList.remove('hidden');
    el.polyphoneButtons.innerHTML = meta.readings
      .map((r) => {
        const isSelected = r === reading;
        const cls = isSelected
          ? 'bg-amber-400 text-amber-950 border-amber-500 shadow-sm'
          : 'bg-white text-stone-700 border-amber-200 hover:bg-amber-100';
        return `<button type="button" data-reading="${r}" class="px-2.5 py-1 rounded-xl border text-xs font-black ${cls}">${r}</button>`;
      })
      .join('');
  } else {
    el.polyphoneBar.classList.add('hidden');
  }
}

// =========================================================================
// 語音朗讀與慶祝紙花
// =========================================================================
function speakCharacter(ch) {
  if (!ch || !('speechSynthesis' in window)) return;
  try {
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(ch);
    utter.lang = 'zh-TW';
    utter.rate = 0.85;
    const voices = window.speechSynthesis.getVoices();
    const twVoice = voices.find((v) => v.lang && v.lang.toLowerCase().includes('zh-tw'));
    if (twVoice) utter.voice = twVoice;
    window.speechSynthesis.speak(utter);
  } catch {
    // ignore
  }
}

function launchConfetti() {
  const canvas = el.confettiCanvas;
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  const colors = ['#F59E0B', '#10B981', '#F43F5E', '#3B82F6', '#A855F7'];
  const particles = Array.from({ length: 70 }, () => ({
    x: canvas.width * (0.25 + Math.random() * 0.5),
    y: canvas.height * 0.35,
    vx: (Math.random() - 0.5) * 12,
    vy: -Math.random() * 11 - 3,
    size: 6 + Math.random() * 6,
    color: colors[Math.floor(Math.random() * colors.length)],
    rot: Math.random() * Math.PI * 2,
    vRot: (Math.random() - 0.5) * 0.25,
    life: 1
  }));

  function frame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let alive = false;
    for (const p of particles) {
      if (p.life <= 0) continue;
      alive = true;
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.35;
      p.rot += p.vRot;
      p.life -= 0.018;
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
      ctx.restore();
    }
    if (alive) {
      requestAnimationFrame(frame);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }
  requestAnimationFrame(frame);
}

// =========================================================================
// 模式二：A4 列印字帖預覽生成
// =========================================================================
let printRenderToken = 0;
async function renderPrintPreview() {
  const myToken = ++printRenderToken;
  const chars = state.activeChars;

  if (chars.length === 0) {
    el.a4PreviewContainer.innerHTML = `
      <div class="no-print bg-white rounded-3xl border-2 border-dashed border-amber-300 p-10 text-center">
        <div class="text-4xl mb-2">🖨️</div>
        <p class="text-base font-black text-amber-900">目前沒有可列印的生字</p>
        <p class="text-sm text-stone-500 mt-1">請先在上方選擇課本課次，或在自訂輸入區貼上生字。</p>
      </div>`;
    return;
  }

  // 補齊尚未載入萌典資訊的生字（並行最多 6 個一組避免瞬間請求過多）
  const missing = chars.filter((ch) => !state.charMetaMap.has(ch));
  if (missing.length > 0) {
    el.printLoadingHint.classList.remove('hidden');
    for (let i = 0; i < missing.length; i += 6) {
      const batch = missing.slice(i, i + 6);
      const metas = await Promise.all(batch.map((ch) => getCharMeta(ch)));
      if (myToken !== printRenderToken) return;
      metas.forEach((m) => state.charMetaMap.set(m.char, m));
    }
    el.printLoadingHint.classList.add('hidden');
  }

  const { grid, size, traceCount, showZhuyin, showInfo } = state.printOptions;
  const colsPerRow = size === 'large' ? 6 : 8;
  const rowsPerPage = size === 'large' ? 8 : 10;
  const effectiveTraceCount = Math.min(traceCount, colsPerRow - 1);
  const gridClass = `grid-${grid}`;
  const sheetSizeClass = size === 'large' ? 'sheet-large' : 'sheet-standard';
  const titleText = (el.printTitleInput.value || '國小生字字帖練習').trim();

  const totalPages = Math.ceil(chars.length / rowsPerPage);
  const pagesHtml = [];

  for (let p = 0; p < totalPages; p++) {
    const pageChars = chars.slice(p * rowsPerPage, (p + 1) * rowsPerPage);
    const rowsHtml = pageChars
      .map((ch) => {
        const meta = state.charMetaMap.get(ch) || { radical: '', strokeCount: null };
        const reading = getEffectiveReading(ch);
        const zhuyinHtml = showZhuyin ? renderZhuyinHTML(reading) : '';

        const infoColHtml = showInfo
          ? `<div class="row-info-col">
               <div class="font-kai font-bold text-stone-700">${meta.radical ? meta.radical + '部' : '—'}</div>
               <div>${meta.strokeCount ? meta.strokeCount + '畫' : ''}</div>
             </div>`
          : '';

        const cellsHtml = [];
        for (let c = 0; c < colsPerRow; c++) {
          const isModel = c === 0;
          const isTrace = !isModel && c <= effectiveTraceCount;
          const glyphHtml = isModel
            ? `<span class="font-kai cell-glyph cell-glyph-model">${ch}</span>`
            : isTrace
              ? `<span class="font-kai cell-glyph cell-glyph-trace">${ch}</span>`
              : '';

          const zhuyinColHtml = showZhuyin
            ? `<div class="cell-zhuyin-box ${isModel ? 'cell-zhuyin-model' : isTrace ? 'cell-zhuyin-trace' : ''}">
                 ${isModel || isTrace ? zhuyinHtml : ''}
               </div>`
            : '';

          cellsHtml.push(`
            <div class="hanzi-cell ${showZhuyin ? '' : 'no-zhuyin'}">
              <div class="cell-char-box ${gridClass}">${glyphHtml}</div>
              ${zhuyinColHtml}
            </div>`);
        }

        return `
          <div class="copybook-row">
            ${infoColHtml}
            <div class="hanzi-cells-group">${cellsHtml.join('')}</div>
          </div>`;
      })
      .join('');

    pagesHtml.push(`
      <article class="a4-sheet ${sheetSizeClass}">
        <div class="sheet-header">
          <div class="sheet-title">${escapeHtml(titleText)}</div>
          <div class="sheet-meta-fields">班級：______　座號：____　姓名：__________　日期：___/___</div>
        </div>
        <div class="sheet-rows">${rowsHtml}</div>
        <div class="sheet-footer">
          <span>快樂學習小教室・國小生字字帖</span>
          <span>第 ${p + 1} / ${totalPages} 頁</span>
        </div>
      </article>`);
  }

  el.a4PreviewContainer.innerHTML = pagesHtml.join('');
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// =========================================================================
// 自訂清單 UI
// =========================================================================
function renderSavedLists() {
  if (state.customLists.length === 0) {
    el.savedListsContainer.innerHTML = '<span class="text-xs text-stone-400">尚未儲存清單（輸入生字後點「儲存成我的清單」即可保存）</span>';
    return;
  }

  el.savedListsContainer.innerHTML = state.customLists
    .map((item, idx) => `
      <div class="inline-flex items-center gap-1 bg-white border border-amber-300 rounded-xl px-2.5 py-1 shadow-sm">
        <button type="button" data-load-list="${idx}" class="text-xs font-black text-amber-900 hover:text-emerald-700">
          ${escapeHtml(item.name)}（${item.chars.length}字）
        </button>
        <button type="button" data-del-list="${idx}" title="刪除清單" class="text-xs text-rose-400 hover:text-rose-600 font-bold pl-1">✕</button>
      </div>`)
    .join('');
}

// =========================================================================
// 事件綁定
// =========================================================================
function bindEvents() {
  // 主模式切換
  el.modePracticeBtn.addEventListener('click', () => switchMode('practice'));
  el.modePrintBtn.addEventListener('click', () => switchMode('print'));

  // 字源切換
  el.sourceTextbookBtn.addEventListener('click', () => switchSource('textbook'));
  el.sourceCustomBtn.addEventListener('click', () => switchSource('custom'));

  // 課本四層下拉選單
  el.publisherSelect.addEventListener('change', () => {
    state.publisher = el.publisherSelect.value;
    state.titleManuallyEdited = false;
    refreshTextbookLessons();
  });
  el.gradeSelect.addEventListener('change', () => {
    state.grade = Number(el.gradeSelect.value);
    state.titleManuallyEdited = false;
    refreshTextbookLessons();
  });
  el.semesterSelect.addEventListener('change', () => {
    state.semester = el.semesterSelect.value;
    state.titleManuallyEdited = false;
    refreshTextbookLessons();
  });
  el.lessonSelect.addEventListener('change', async () => {
    state.lessonIndex = Number(el.lessonSelect.value);
    state.titleManuallyEdited = false;
    const gradeData = await loadGradeData(state.publisher, state.grade);
    const lessonObj = gradeData.semesters?.[state.semester]?.[state.lessonIndex];
    applyCurrentLesson(gradeData, lessonObj);
  });

  // 課次單字開關
  el.lessonCharChips.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-lesson-char]');
    if (!btn) return;
    const ch = btn.getAttribute('data-lesson-char');
    const set = new Set(state.activeChars);
    if (set.has(ch)) set.delete(ch);
    else set.add(ch);
    const ordered = state.lessonAllChars.filter((c) => set.has(c));
    setActiveChars(ordered);
    renderLessonCharChips();
  });

  el.selectAllLessonBtn.addEventListener('click', () => {
    setActiveChars([...state.lessonAllChars]);
    renderLessonCharChips();
  });
  el.clearLessonBtn.addEventListener('click', () => {
    setActiveChars([]);
    renderLessonCharChips();
  });
  el.copyToCustomBtn.addEventListener('click', () => {
    el.customCharsInput.value = state.activeChars.join('');
    switchSource('custom');
    el.customCharsInput.focus();
  });

  // 自訂輸入
  el.applyCustomBtn.addEventListener('click', () => {
    const chars = filterChineseChars(el.customCharsInput.value, el.dedupeCheckbox.checked);
    if (!state.titleManuallyEdited) {
      el.printTitleInput.value = '自訂生字字帖練習';
    }
    setActiveChars(chars);
  });

  el.saveCustomListBtn.addEventListener('click', () => {
    const chars = filterChineseChars(el.customCharsInput.value, el.dedupeCheckbox.checked);
    if (chars.length === 0) {
      alert('請先在輸入框輸入至少一個國字喔！');
      return;
    }
    const name = prompt('幫這份生字清單取個名字吧：', `我的生字清單 ${state.customLists.length + 1}`);
    if (!name || !name.trim()) return;
    state.customLists.unshift({ name: name.trim(), chars: chars.join('') });
    saveCustomLists();
    renderSavedLists();
  });

  el.savedListsContainer.addEventListener('click', (e) => {
    const loadBtn = e.target.closest('[data-load-list]');
    if (loadBtn) {
      const idx = Number(loadBtn.getAttribute('data-load-list'));
      const item = state.customLists[idx];
      if (!item) return;
      el.customCharsInput.value = item.chars;
      el.printTitleInput.value = `${item.name} 字帖練習`;
      state.titleManuallyEdited = false;
      setActiveChars(filterChineseChars(item.chars, el.dedupeCheckbox.checked));
      return;
    }
    const delBtn = e.target.closest('[data-del-list]');
    if (delBtn) {
      const idx = Number(delBtn.getAttribute('data-del-list'));
      state.customLists.splice(idx, 1);
      saveCustomLists();
      renderSavedLists();
    }
  });

  // 線上描寫：發音、破音字切換、筆順控制
  el.speakCharBtn.addEventListener('click', () => {
    const ch = state.activeChars[state.currentCharIndex];
    speakCharacter(ch);
  });

  el.polyphoneButtons.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-reading]');
    if (!btn) return;
    const ch = state.activeChars[state.currentCharIndex];
    const reading = btn.getAttribute('data-reading');
    state.selectedReadingMap.set(ch, reading);
    const meta = state.charMetaMap.get(ch);
    if (meta) renderInfoZhuyinAndPolyphone(ch, meta);
  });

  el.playNormalBtn.addEventListener('click', () => hanziCanvas.playStrokeAnimation('normal'));
  el.playSlowBtn.addEventListener('click', () => hanziCanvas.playStrokeAnimation('slow'));
  el.stepStrokeBtn.addEventListener('click', () => hanziCanvas.stepNextStroke());
  el.toggleGuideBtn.addEventListener('click', () => {
    state.showGuide = !state.showGuide;
    hanziCanvas.setShowGuide(state.showGuide);
    el.toggleGuideBtn.textContent = state.showGuide ? '👁️ 底字：開' : '👁️ 底字：關';
  });

  // 格線切換
  document.querySelectorAll('.grid-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const grid = btn.getAttribute('data-grid');
      hanziCanvas.setGridType(grid);
      document.querySelectorAll('.grid-btn').forEach((b) => {
        const active = b === btn;
        b.className = active
          ? 'grid-btn px-3 py-1 rounded-lg text-xs font-black bg-white text-rose-700 shadow-sm'
          : 'grid-btn px-3 py-1 rounded-lg text-xs font-black text-stone-600';
      });
    });
  });

  // 筆刷顏色與粗細
  document.querySelectorAll('.color-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const color = btn.getAttribute('data-color');
      hanziCanvas.setBrushColor(color);
      document.querySelectorAll('.color-btn').forEach((b) => {
        b.classList.remove('ring-emerald-500', 'scale-110');
        b.classList.add('ring-transparent');
      });
      btn.classList.remove('ring-transparent');
      btn.classList.add('ring-emerald-500', 'scale-110');
    });
  });

  el.brushWidthInput.addEventListener('input', () => {
    hanziCanvas.setBrushWidth(Number(el.brushWidthInput.value));
  });
  el.undoBtn.addEventListener('click', () => hanziCanvas.undo());
  el.clearBtn.addEventListener('click', () => hanziCanvas.clearDrawing());

  // 完成蓋章
  el.completeCharBtn.addEventListener('click', () => {
    const ch = state.activeChars[state.currentCharIndex];
    if (!ch) return;
    state.completedSet.add(ch);
    saveProgress();
    renderPracticeCharStrip();
    el.starStampOverlay.classList.remove('hidden');
    launchConfetti();
    setTimeout(() => {
      el.starStampOverlay.classList.add('hidden');
    }, 1100);
  });

  // 生字切換列
  el.practiceCharStrip.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-strip-idx]');
    if (!btn) return;
    state.currentCharIndex = Number(btn.getAttribute('data-strip-idx'));
    renderPracticeCharStrip();
    loadCurrentCharToWorkspace();
  });
  el.prevCharBtn.addEventListener('click', () => {
    if (state.activeChars.length === 0) return;
    state.currentCharIndex = (state.currentCharIndex - 1 + state.activeChars.length) % state.activeChars.length;
    renderPracticeCharStrip();
    loadCurrentCharToWorkspace();
  });
  el.nextCharBtn.addEventListener('click', () => {
    if (state.activeChars.length === 0) return;
    state.currentCharIndex = (state.currentCharIndex + 1) % state.activeChars.length;
    renderPracticeCharStrip();
    loadCurrentCharToWorkspace();
  });

  // A4 列印設定
  el.printTitleInput.addEventListener('input', () => {
    state.titleManuallyEdited = true;
    renderPrintPreview();
  });
  el.printGridSelect.addEventListener('change', () => {
    state.printOptions.grid = el.printGridSelect.value;
    renderPrintPreview();
  });
  el.printSizeSelect.addEventListener('change', () => {
    state.printOptions.size = el.printSizeSelect.value;
    renderPrintPreview();
  });
  el.printTraceCountSelect.addEventListener('change', () => {
    state.printOptions.traceCount = Number(el.printTraceCountSelect.value);
    renderPrintPreview();
  });
  el.printShowZhuyin.addEventListener('change', () => {
    state.printOptions.showZhuyin = el.printShowZhuyin.checked;
    renderPrintPreview();
  });
  el.printShowInfo.addEventListener('change', () => {
    state.printOptions.showInfo = el.printShowInfo.checked;
    renderPrintPreview();
  });
  el.printNowBtn.addEventListener('click', () => window.print());
}

function switchMode(mode) {
  state.mode = mode;
  const isPractice = mode === 'practice';
  el.practiceSection.classList.toggle('hidden', !isPractice);
  el.printSection.classList.toggle('hidden', isPractice);

  el.modePracticeBtn.className = isPractice
    ? 'btn-3d px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-black bg-white text-emerald-800 shadow-sm'
    : 'btn-3d px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-black text-emerald-700 hover:bg-white/60';
  el.modePrintBtn.className = !isPractice
    ? 'btn-3d px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-black bg-white text-emerald-800 shadow-sm'
    : 'btn-3d px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-black text-emerald-700 hover:bg-white/60';

  if (isPractice) {
    renderPracticeSection();
    requestAnimationFrame(() => hanziCanvas.resize());
  } else {
    renderPrintPreview();
  }
}

function switchSource(source) {
  state.source = source;
  const isTextbook = source === 'textbook';
  el.textbookSourcePane.classList.toggle('hidden', !isTextbook);
  el.customSourcePane.classList.toggle('hidden', isTextbook);

  el.sourceTextbookBtn.className = isTextbook
    ? 'px-3 py-1.5 rounded-xl text-xs sm:text-sm font-black bg-amber-400 text-amber-950 shadow-sm'
    : 'px-3 py-1.5 rounded-xl text-xs sm:text-sm font-black text-amber-800 hover:bg-amber-100';
  el.sourceCustomBtn.className = !isTextbook
    ? 'px-3 py-1.5 rounded-xl text-xs sm:text-sm font-black bg-amber-400 text-amber-950 shadow-sm'
    : 'px-3 py-1.5 rounded-xl text-xs sm:text-sm font-black text-amber-800 hover:bg-amber-100';
}

// =========================================================================
// 初始化啟動
// =========================================================================
loadPersistedState();
renderSavedLists();
bindEvents();
refreshTextbookLessons();
