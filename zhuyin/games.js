/**
 * =============================================================================
 * 快樂學注音・注音遊樂園（資料驅動 × 無限續關版）
 *
 * 設計理念：
 *  - 資料與遊戲分離：由 window.ZhuyinDB 提供 37 注音 × 200+ 台灣生活圖詞資料庫，
 *    並使用智慧不重複抽牌器（Smart Deck）確保連續玩很久也不會一直重複！
 *  - 單一遊戲無限暢玩：選定喜歡的遊戲後，可一關接一關持續挑戰（第 1 關 → 第 2 關 → ...），
 *    過關時灑紙花＋升級提示並自動進入下一關，不用被迫中斷或換遊戲。
 *  - 教育部標準發音：所有注音符號發音皆透過 app().playZhuyinAudio(char) 播放
 *    中華民國教育部官方錄製的標準注音音檔 (F1.WAV ~ F37.WAV)。
 * =============================================================================
 */
(function () {
  'use strict';

  const GAME_STATS_KEY = 'zhuyin_games_stats_v1';

  const GAMES_META = [
    {
      id: 'connect',
      icon: '🔗',
      name: '注音連連看',
      desc: '拖曳畫線配對・無限續關',
      gradient: 'from-pink-400 to-rose-500',
      border: 'border-rose-600',
      softBg: 'bg-rose-50 border-rose-200 text-rose-800',
    },
    {
      id: 'balloon',
      icon: '🎈',
      name: '戳氣球找注音',
      desc: '聽音射擊氣球・無限續關',
      gradient: 'from-sky-400 to-blue-500',
      border: 'border-blue-600',
      softBg: 'bg-sky-50 border-sky-200 text-sky-800',
    },
    {
      id: 'mole',
      icon: '🐹',
      name: '打地鼠找注音',
      desc: '敲擊注音地鼠・無限續關',
      gradient: 'from-emerald-400 to-green-500',
      border: 'border-green-600',
      softBg: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    },
    {
      id: 'memory',
      icon: '🃏',
      name: '注音翻翻樂',
      desc: '3D 翻牌配對・無限續關',
      gradient: 'from-amber-400 to-orange-500',
      border: 'border-orange-600',
      softBg: 'bg-amber-50 border-amber-200 text-amber-800',
    },
    {
      id: 'listen',
      icon: '👂',
      name: '聽音找注音',
      desc: '標準發音辨識・無限續關',
      gradient: 'from-violet-400 to-purple-500',
      border: 'border-purple-600',
      softBg: 'bg-purple-50 border-purple-200 text-purple-800',
    },
  ];

  const LINE_COLORS = ['#F43F5E', '#0EA5E9', '#10B981', '#F97316', '#8B5CF6', '#EC4899'];

  const BALLOON_PALETTE = [
    { fill: '#FB7185', dark: '#E11D48', light: '#FFE4E6' },
    { fill: '#38BDF8', dark: '#0284C7', light: '#E0F2FE' },
    { fill: '#34D399', dark: '#059669', light: '#D1FAE5' },
    { fill: '#FBBF24', dark: '#D97706', light: '#FEF3C7' },
    { fill: '#A78BFA', dark: '#7C3AED', light: '#EDE9FE' },
    { fill: '#FB923C', dark: '#EA580C', light: '#FFEDD5' },
  ];

  const gState = {
    container: null,
    activeGame: 'connect',
    scope: 'all', // 'all' | 'initial' | 'medial' | 'final' | 'unlearned'
    difficulty: 'easy', // 'easy' | 'normal'
    isVisible: false,
    stats: {
      totalWins: 0,
      winsByGame: { connect: 0, balloon: 0, mole: 0, memory: 0, listen: 0 },
    },
    cleanupCurrentGame: null,
    bannerTimer: null,
  };

  function app() {
    return window.ZhuyinApp;
  }

  function db() {
    return window.ZhuyinDB;
  }

  /* =========================================================================
   * 工具函式：資料庫抽取、獎盃紀錄、音效
   * ========================================================================= */
  function loadGameStats() {
    try {
      const raw = localStorage.getItem(GAME_STATS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          gState.stats.totalWins = Number(parsed.totalWins) || 0;
          gState.stats.winsByGame = Object.assign(
            { connect: 0, balloon: 0, mole: 0, memory: 0, listen: 0 },
            parsed.winsByGame || {}
          );
        }
      }
    } catch (e) {
      console.warn('無法讀取遊戲紀錄：', e);
    }
  }

  function saveGameStats() {
    try {
      localStorage.setItem(GAME_STATS_KEY, JSON.stringify(gState.stats));
    } catch (e) {}
  }

  function recordStageClear(gameId) {
    gState.stats.totalWins += 1;
    gState.stats.winsByGame[gameId] = (gState.stats.winsByGame[gameId] || 0) + 1;
    saveGameStats();
    updateTrophyBadges();
  }

  function shuffle(arr) {
    return db() ? db().shuffleArray(arr) : arr.slice().sort(() => Math.random() - 0.5);
  }

  function getSymbolPool() {
    const { ZHUYIN_DATA, state } = app();
    let list = ZHUYIN_DATA;
    if (gState.scope === 'initial' || gState.scope === 'medial' || gState.scope === 'final') {
      list = ZHUYIN_DATA.filter((item) => item.cat === gState.scope);
    } else if (gState.scope === 'unlearned') {
      const unlearned = ZHUYIN_DATA.filter((item) => !state.completedSet.has(item.char));
      if (unlearned.length >= 3) {
        list = unlearned;
      } else {
        const extras = shuffle(ZHUYIN_DATA.filter((item) => state.completedSet.has(item.char))).slice(
          0,
          Math.max(0, 6 - unlearned.length)
        );
        list = unlearned.concat(extras);
      }
    }
    return list.length > 0 ? list : ZHUYIN_DATA;
  }

  function getVocabPool() {
    const syms = getSymbolPool();
    return db() ? db().getEntriesForSymbols(syms) : syms;
  }

  function playGentleBoing() {
    try {
      const ac = app().getAudioContext();
      if (!ac) return;
      const now = ac.currentTime;
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(280, now);
      osc.frequency.exponentialRampToValueAtTime(190, now + 0.16);
      gain.gain.setValueAtTime(0.14, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      osc.connect(gain);
      gain.connect(ac.destination);
      osc.start(now);
      osc.stop(now + 0.2);
    } catch (e) {}
  }

  function playBalloonPop(combo = 0) {
    try {
      const ac = app().getAudioContext();
      if (!ac) return;
      const now = ac.currentTime;
      const bufferSize = Math.floor(ac.sampleRate * 0.06);
      const buffer = ac.createBuffer(1, bufferSize, ac.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.25));
      }
      const noise = ac.createBufferSource();
      noise.buffer = buffer;
      const noiseGain = ac.createGain();
      noiseGain.gain.setValueAtTime(0.28, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
      noise.connect(noiseGain);
      noiseGain.connect(ac.destination);
      noise.start(now);
      app().playStrokeDing(combo);
    } catch (e) {}
  }

  /* =========================================================================
   * 無縫過關升級橫幅（不打斷遊玩、自動進入下一關）
   * ========================================================================= */
  function showStageClearBanner(title, subtitle, onNextStage, autoDelayMs = 1900) {
    const root = gState.container;
    if (!root) return;
    recordStageClear(gState.activeGame);
    app().playRewardSound();
    app().launchConfetti();

    const banner = root.querySelector('#stageClearBanner');
    const titleEl = root.querySelector('#stageClearTitle');
    const subEl = root.querySelector('#stageClearSub');
    const nextBtn = root.querySelector('#stageClearNextBtn');
    if (!banner) return;

    titleEl.textContent = title;
    subEl.textContent = subtitle;
    banner.classList.remove('hidden');
    banner.classList.add('flex');

    let advanced = false;
    const proceed = () => {
      if (advanced) return;
      advanced = true;
      if (gState.bannerTimer) {
        clearTimeout(gState.bannerTimer);
        gState.bannerTimer = null;
      }
      banner.classList.add('hidden');
      banner.classList.remove('flex');
      if (typeof onNextStage === 'function') onNextStage();
    };

    nextBtn.onclick = () => {
      app().playSoftPop();
      proceed();
    };

    if (gState.bannerTimer) clearTimeout(gState.bannerTimer);
    gState.bannerTimer = setTimeout(proceed, autoDelayMs);
  }

  function hideStageClearBanner() {
    if (gState.bannerTimer) {
      clearTimeout(gState.bannerTimer);
      gState.bannerTimer = null;
    }
    const root = gState.container;
    if (!root) return;
    const banner = root.querySelector('#stageClearBanner');
    if (banner) {
      banner.classList.add('hidden');
      banner.classList.remove('flex');
    }
  }

  /* =========================================================================
   * 主介面框架渲染
   * ========================================================================= */
  function renderHubShell() {
    const root = gState.container;
    if (!root) return;
    const totalWords = db() ? db().getTotalWordCount() : 37;

    root.innerHTML = `
      <!-- 遊戲選單與題庫資訊列 -->
      <section class="bg-white rounded-[2rem] p-4 sm:p-5 shadow-lg shadow-violet-900/5 border-4 border-violet-200/80 space-y-4">
        <div class="flex flex-wrap items-center justify-between gap-2.5">
          <div class="flex items-center gap-2.5">
            <div class="w-10 h-10 rounded-2xl bg-gradient-to-br from-fuchsia-400 to-violet-500 flex items-center justify-center text-2xl shadow-sm border-2 border-white">
              🎡
            </div>
            <div>
              <div class="flex flex-wrap items-center gap-2">
                <h2 class="text-lg sm:text-xl font-black text-violet-950 leading-tight">注音遊樂園・無限續關</h2>
                <span class="px-2 py-0.5 rounded-full text-[11px] font-black bg-emerald-100 text-emerald-700 border border-emerald-200">
                  📚 ${totalWords} 組豐富圖詞
                </span>
                <span class="px-2 py-0.5 rounded-full text-[11px] font-black bg-sky-100 text-sky-700 border border-sky-200">
                  🎙️ 教育部標準發音
                </span>
              </div>
              <p class="text-xs text-violet-700/80 font-medium mt-0.5">選一款喜歡的遊戲就能一關接一關玩很久，每次都會從圖詞庫抽出新鮮題目！</p>
            </div>
          </div>

          <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-amber-50 border-2 border-amber-200 text-amber-900 font-black text-sm shadow-sm">
            <span class="text-lg">🏆</span>
            <span>累積過關</span>
            <span id="totalTrophyCount" class="px-2 py-0.5 rounded-full bg-amber-400 text-white text-xs">${gState.stats.totalWins}</span>
          </div>
        </div>

        <!-- 5 款遊戲切換卡片 -->
        <div id="gameSelectorGrid" class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
          ${GAMES_META.map((g) => `
            <button data-game="${g.id}" type="button"
              class="game-tab-btn btn-3d text-left p-3 rounded-2xl border-2 transition-all flex flex-col justify-between gap-1.5 relative">
              <div class="flex items-center justify-between gap-1">
                <span class="text-2xl sm:text-3xl leading-none">${g.icon}</span>
                <span data-trophy="${g.id}" class="text-[11px] font-black px-2 py-0.5 rounded-full bg-white/85 text-amber-700 border border-amber-200">🏆 ${gState.stats.winsByGame[g.id] || 0}</span>
              </div>
              <div>
                <div class="font-black text-sm sm:text-base leading-tight">${g.name}</div>
                <div class="text-[11px] opacity-80 font-medium mt-0.5 leading-snug">${g.desc}</div>
              </div>
            </button>
          `).join('')}
        </div>

        <!-- 考題範圍與難度/速度設定列 -->
        <div class="bg-violet-50/80 rounded-2xl p-3 border-2 border-violet-100 flex flex-wrap items-center justify-between gap-3">
          <div class="flex flex-wrap items-center gap-1.5">
            <span class="text-xs font-black text-violet-900 mr-1">🎯 抽題範圍：</span>
            <button data-scope="all" type="button" class="scope-btn px-2.5 py-1 rounded-xl text-xs font-bold transition-all">全部 (37)</button>
            <button data-scope="initial" type="button" class="scope-btn px-2.5 py-1 rounded-xl text-xs font-bold transition-all">聲母 (21)</button>
            <button data-scope="medial" type="button" class="scope-btn px-2.5 py-1 rounded-xl text-xs font-bold transition-all">介音 (3)</button>
            <button data-scope="final" type="button" class="scope-btn px-2.5 py-1 rounded-xl text-xs font-bold transition-all">韻母 (13)</button>
            <button data-scope="unlearned" type="button" class="scope-btn px-2.5 py-1 rounded-xl text-xs font-bold transition-all">⭐ 未收集星星</button>
          </div>

          <div class="flex items-center gap-1.5">
            <span class="text-xs font-black text-violet-900">⚡ 節奏：</span>
            <div class="inline-flex rounded-xl bg-white border border-violet-200 p-0.5">
              <button data-diff="easy" type="button" class="diff-btn px-2.5 py-1 rounded-lg text-xs font-bold transition-all">🐢 慢速簡單</button>
              <button data-diff="normal" type="button" class="diff-btn px-2.5 py-1 rounded-lg text-xs font-bold transition-all">🐰 一般挑戰</button>
            </div>
          </div>
        </div>
      </section>

      <!-- 遊戲主舞台 -->
      <section id="gameStageCard" class="relative bg-white rounded-[2rem] p-4 sm:p-6 shadow-lg shadow-amber-900/5 border-4 border-amber-200/90 min-h-[480px]">
        <div id="gameStage"></div>

        <!-- 無縫升級提示覆蓋層（約 1.9 秒自動進入下一關） -->
        <div id="stageClearBanner" class="hidden absolute inset-0 z-20 rounded-[1.75rem] bg-white/88 backdrop-blur-[2px] flex-col items-center justify-center p-6 text-center">
          <div class="text-6xl mb-2 animate-bounce">🌟</div>
          <h3 id="stageClearTitle" class="text-2xl sm:text-3xl font-black text-amber-900 mb-1.5">第 1 關完成！</h3>
          <p id="stageClearSub" class="text-sm sm:text-base text-slate-600 font-bold mb-5 max-w-md"></p>
          <button id="stageClearNextBtn" type="button"
            class="btn-3d px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-500 hover:to-teal-600 text-white border-b-4 border-teal-700 font-black text-base shadow-md">
            ▶ 馬上進下一關
          </button>
        </div>
      </section>
    `;

    root.querySelectorAll('.game-tab-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        app().playSoftPop();
        startGame(btn.dataset.game);
      });
    });

    root.querySelectorAll('.scope-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        app().playSoftPop();
        gState.scope = btn.dataset.scope;
        syncControlStyles();
        startGame(gState.activeGame);
      });
    });

    root.querySelectorAll('.diff-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        app().playSoftPop();
        gState.difficulty = btn.dataset.diff;
        syncControlStyles();
        startGame(gState.activeGame);
      });
    });

    syncControlStyles();
  }

  function updateTrophyBadges() {
    const root = gState.container;
    if (!root) return;
    const totalEl = root.querySelector('#totalTrophyCount');
    if (totalEl) totalEl.textContent = String(gState.stats.totalWins);
    GAMES_META.forEach((g) => {
      const badge = root.querySelector(`[data-trophy="${g.id}"]`);
      if (badge) badge.textContent = `🏆 ${gState.stats.winsByGame[g.id] || 0}`;
    });
  }

  function syncControlStyles() {
    const root = gState.container;
    if (!root) return;

    root.querySelectorAll('.game-tab-btn').forEach((btn) => {
      const meta = GAMES_META.find((g) => g.id === btn.dataset.game);
      const active = btn.dataset.game === gState.activeGame;
      btn.className = active
        ? `game-tab-btn btn-3d text-left p-3 rounded-2xl border-b-4 transition-all flex flex-col justify-between gap-1.5 relative bg-gradient-to-br ${meta.gradient} ${meta.border} text-white shadow-md scale-[1.02]`
        : `game-tab-btn btn-3d text-left p-3 rounded-2xl border-2 transition-all flex flex-col justify-between gap-1.5 relative ${meta.softBg} hover:brightness-95`;
    });

    root.querySelectorAll('.scope-btn').forEach((btn) => {
      const active = btn.dataset.scope === gState.scope;
      btn.className = active
        ? 'scope-btn px-2.5 py-1 rounded-xl text-xs font-black transition-all bg-violet-500 text-white shadow-sm'
        : 'scope-btn px-2.5 py-1 rounded-xl text-xs font-bold transition-all bg-white text-violet-800 border border-violet-200 hover:bg-violet-100';
    });

    root.querySelectorAll('.diff-btn').forEach((btn) => {
      const active = btn.dataset.diff === gState.difficulty;
      btn.className = active
        ? 'diff-btn px-2.5 py-1 rounded-lg text-xs font-black transition-all bg-orange-400 text-white shadow-sm'
        : 'diff-btn px-2.5 py-1 rounded-lg text-xs font-bold transition-all text-violet-800 hover:bg-violet-100';
    });
  }

  function stopCurrentGame() {
    hideStageClearBanner();
    if (typeof gState.cleanupCurrentGame === 'function') {
      try {
        gState.cleanupCurrentGame();
      } catch (e) {}
      gState.cleanupCurrentGame = null;
    }
  }

  function startGame(gameId) {
    stopCurrentGame();
    gState.activeGame = gameId;
    syncControlStyles();

    const stage = gState.container.querySelector('#gameStage');
    if (!stage) return;
    stage.innerHTML = '';

    if (gameId === 'connect') {
      gState.cleanupCurrentGame = mountConnectGame(stage);
    } else if (gameId === 'balloon') {
      gState.cleanupCurrentGame = mountBalloonGame(stage);
    } else if (gameId === 'mole') {
      gState.cleanupCurrentGame = mountMoleGame(stage);
    } else if (gameId === 'memory') {
      gState.cleanupCurrentGame = mountMemoryGame(stage);
    } else if (gameId === 'listen') {
      gState.cleanupCurrentGame = mountListenGame(stage);
    }
  }

  /* =========================================================================
   * 遊戲 1：🔗 注音連連看（無限續關 + 200+ 圖詞庫智慧抽題）
   * ========================================================================= */
  function mountConnectGame(stage) {
    const vocabPool = getVocabPool();
    const deck = db().createSmartDeck(vocabPool);
    const uniqueCharCount = new Set(vocabPool.map((v) => v.char)).size;
    const pairCount = Math.min(uniqueCharCount, gState.difficulty === 'easy' ? 4 : 5);

    let level = 1;
    let totalMatched = 0;
    let chosen = [];
    let matchedMap = new Map();
    let selectedLeft = null;
    let draggingLeft = null;
    let dragPos = null;
    let activeCleanup = null;

    function buildRound() {
      if (activeCleanup) {
        activeCleanup();
        activeCleanup = null;
      }

      chosen = deck.drawBatch(pairCount, true);
      const leftItems = shuffle(chosen);
      const rightItems = shuffle(chosen);
      matchedMap = new Map();
      selectedLeft = null;
      draggingLeft = null;
      dragPos = null;

      stage.innerHTML = `
        <div class="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div class="flex items-center gap-2.5">
            <span class="px-3 py-1 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 text-white font-black text-sm shadow-sm">
              第 ${level} 關
            </span>
            <h3 class="text-xl sm:text-2xl font-black text-rose-900">🔗 注音連連看</h3>
          </div>
          <div class="flex items-center gap-2">
            <span id="connectTotalBadge" class="px-3 py-1.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 font-black text-xs sm:text-sm">
              ⭐ 累計 ${totalMatched} 組
            </span>
            <span id="connectProgress" class="px-3 py-1.5 rounded-full bg-rose-100 text-rose-800 border-2 border-rose-200 font-black text-xs sm:text-sm">
              本關 0 / ${chosen.length}
            </span>
            <button id="connectSkipBtn" type="button" class="btn-3d px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border-b-2 border-slate-300 font-bold text-xs sm:text-sm">
              🎲 換一組詞
            </button>
          </div>
        </div>

        <div id="connectHintBanner" class="mb-3 px-4 py-2 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs sm:text-sm font-bold text-center">
          ✨ 拖曳畫線或先點左邊注音、再點右邊生活圖卡！點左邊聽教育部標準發音，點右邊聽語詞喔！
        </div>

        <div id="connectBoardWrap" class="relative grid grid-cols-2 gap-10 sm:gap-20 md:gap-28 py-2 max-w-3xl mx-auto">
          <svg id="connectSvg" class="absolute inset-0 w-full h-full pointer-events-none z-10 overflow-visible"></svg>

          <div class="space-y-3 sm:space-y-4 relative z-20">
            ${leftItems.map((item, idx) => `
              <button data-side="left" data-char="${item.char}" type="button"
                class="connect-card w-full py-3.5 sm:py-4 px-4 rounded-3xl bg-rose-50 hover:bg-rose-100 border-4 border-rose-200 shadow-sm flex items-center justify-between transition-all">
                <span class="w-7 h-7 rounded-full bg-white text-rose-400 text-xs font-black flex items-center justify-center border border-rose-200">${idx + 1}</span>
                <span class="font-kai text-4xl sm:text-5xl font-black text-rose-900 leading-none">${item.char}</span>
                <span data-anchor="left-${item.char}" class="w-5 h-5 rounded-full bg-rose-400 border-4 border-white shadow"></span>
              </button>
            `).join('')}
          </div>

          <div class="space-y-3 sm:space-y-4 relative z-20">
            ${rightItems.map((item) => `
              <button data-side="right" data-char="${item.char}" type="button"
                class="connect-card w-full py-3 sm:py-3.5 px-3 sm:px-4 rounded-3xl bg-sky-50 hover:bg-sky-100 border-4 border-sky-200 shadow-sm flex items-center justify-between gap-2 transition-all">
                <span data-anchor="right-${item.char}" class="w-5 h-5 rounded-full bg-sky-400 border-4 border-white shadow shrink-0"></span>
                <div class="flex items-center gap-2 sm:gap-3 flex-1 justify-center">
                  <span class="text-3xl sm:text-4xl leading-none">${item.emoji}</span>
                  <div class="text-left">
                    <div class="text-lg sm:text-xl font-black text-slate-800 leading-tight">${item.word}</div>
                    <div class="text-[11px] font-bold text-sky-700/80 font-kai">${item.reading}</div>
                  </div>
                </div>
                <span class="text-xs font-bold px-1.5 py-0.5 rounded-md bg-white/80 text-sky-600 hidden sm:inline">${item.theme}</span>
              </button>
            `).join('')}
          </div>
        </div>
      `;

      const boardWrap = stage.querySelector('#connectBoardWrap');
      const svg = stage.querySelector('#connectSvg');
      const progressEl = stage.querySelector('#connectProgress');
      const totalEl = stage.querySelector('#connectTotalBadge');
      const hintEl = stage.querySelector('#connectHintBanner');

      function getAnchorCenter(selector) {
        const el = boardWrap.querySelector(selector);
        if (!el) return null;
        const bRect = boardWrap.getBoundingClientRect();
        const eRect = el.getBoundingClientRect();
        return {
          x: eRect.left - bRect.left + eRect.width / 2,
          y: eRect.top - bRect.top + eRect.height / 2,
        };
      }

      function drawLines() {
        let paths = '';
        matchedMap.forEach((info, char) => {
          const p1 = getAnchorCenter(`[data-anchor="left-${char}"]`);
          const p2 = getAnchorCenter(`[data-anchor="right-${char}"]`);
          if (p1 && p2) {
            const midX = (p1.x + p2.x) / 2;
            paths += `<path d="M ${p1.x} ${p1.y} C ${midX} ${p1.y}, ${midX} ${p2.y}, ${p2.x} ${p2.y}"
              fill="none" stroke="${info.color}" stroke-width="7" stroke-linecap="round" opacity="0.92" />`;
            paths += `<circle cx="${p1.x}" cy="${p1.y}" r="6" fill="${info.color}" />`;
            paths += `<circle cx="${p2.x}" cy="${p2.y}" r="6" fill="${info.color}" />`;
          }
        });

        if (draggingLeft && dragPos) {
          const p1 = getAnchorCenter(`[data-anchor="left-${draggingLeft}"]`);
          if (p1) {
            const midX = (p1.x + dragPos.x) / 2;
            paths += `<path d="M ${p1.x} ${p1.y} C ${midX} ${p1.y}, ${midX} ${dragPos.y}, ${dragPos.x} ${dragPos.y}"
              fill="none" stroke="#FB923C" stroke-width="6" stroke-dasharray="10 8" stroke-linecap="round" />`;
          }
        }
        svg.innerHTML = paths;
      }

      function updateCardStates() {
        boardWrap.querySelectorAll('.connect-card').forEach((card) => {
          const side = card.dataset.side;
          const ch = card.dataset.char;
          const matched = matchedMap.has(ch);

          card.classList.remove('ring-4', 'ring-orange-400', 'scale-[1.03]', 'bg-emerald-50', 'border-emerald-400');
          if (matched) {
            card.classList.add('bg-emerald-50', 'border-emerald-400');
          } else if (side === 'left' && selectedLeft === ch) {
            card.classList.add('ring-4', 'ring-orange-400', 'scale-[1.03]');
          }
        });
      }

      function tryMatch(leftChar, rightChar) {
        if (matchedMap.has(leftChar) || matchedMap.has(rightChar)) return;
        const leftItem = chosen.find((x) => x.char === leftChar);
        const rightItem = chosen.find((x) => x.char === rightChar);

        if (leftChar === rightChar) {
          const color = LINE_COLORS[matchedMap.size % LINE_COLORS.length];
          matchedMap.set(leftChar, { color });
          totalMatched += 1;
          selectedLeft = null;
          app().playStrokeDing(matchedMap.size - 1);
          app().speakText(leftItem.word);
          progressEl.textContent = `本關 ${matchedMap.size} / ${chosen.length}`;
          totalEl.textContent = `⭐ 累計 ${totalMatched} 組`;
          hintEl.textContent = `🎉 答對了！「${leftItem.char}」就是「${leftItem.emoji} ${leftItem.word}」！`;
          updateCardStates();
          drawLines();

          if (matchedMap.size === chosen.length) {
            const clearedLevel = level;
            level += 1;
            setTimeout(() => {
              showStageClearBanner(
                `第 ${clearedLevel} 關完成！🔗`,
                `累計已連對 ${totalMatched} 組！準備抽出全新圖詞，進入第 ${level} 關…`,
                buildRound
              );
            }, 450);
          }
        } else {
          playGentleBoing();
          app().playZhuyinAudio(rightItem.char);
          hintEl.textContent = `再試試看喔！「${rightItem.emoji} ${rightItem.word}」對應的是「${rightItem.char}」，不是「${leftItem.char}」喔！`;
          const rightBtn = boardWrap.querySelector(`[data-side="right"][data-char="${rightChar}"]`);
          if (rightBtn) {
            rightBtn.classList.remove('animate-gentle-shake');
            void rightBtn.offsetWidth;
            rightBtn.classList.add('animate-gentle-shake');
          }
          selectedLeft = null;
          updateCardStates();
        }
      }

      function onPointerDown(e) {
        const card = e.target.closest('.connect-card');
        if (!card) return;
        const side = card.dataset.side;
        const ch = card.dataset.char;
        const item = chosen.find((x) => x.char === ch);

        if (side === 'left') {
          if (matchedMap.has(ch)) {
            app().playZhuyinAudio(item.char);
            return;
          }
          app().playSoftPop();
          app().playZhuyinAudio(item.char);
          selectedLeft = ch;
          draggingLeft = ch;
          const bRect = boardWrap.getBoundingClientRect();
          dragPos = { x: e.clientX - bRect.left, y: e.clientY - bRect.top };
          updateCardStates();
          drawLines();
        } else if (side === 'right') {
          if (matchedMap.has(ch)) {
            app().speakText(item.word);
            return;
          }
          if (selectedLeft) {
            tryMatch(selectedLeft, ch);
          } else {
            app().playSoftPop();
            app().speakText(item.word);
            hintEl.textContent = `👆 先點左邊的注音，再點「${item.emoji} ${item.word}」連起來喔！`;
          }
        }
      }

      function onPointerMove(e) {
        if (!draggingLeft) return;
        const bRect = boardWrap.getBoundingClientRect();
        dragPos = { x: e.clientX - bRect.left, y: e.clientY - bRect.top };
        drawLines();
      }

      function onPointerUp(e) {
        if (!draggingLeft) return;
        const fromChar = draggingLeft;
        draggingLeft = null;
        dragPos = null;
        drawLines();

        const elUnder = document.elementFromPoint(e.clientX, e.clientY);
        const targetCard = elUnder ? elUnder.closest('.connect-card[data-side="right"]') : null;
        if (targetCard) {
          tryMatch(fromChar, targetCard.dataset.char);
        }
      }

      boardWrap.addEventListener('pointerdown', onPointerDown);
      window.addEventListener('pointermove', onPointerMove);
      window.addEventListener('pointerup', onPointerUp);
      window.addEventListener('resize', drawLines);

      stage.querySelector('#connectSkipBtn').addEventListener('click', () => {
        app().playSoftPop();
        buildRound();
      });

      activeCleanup = () => {
        boardWrap.removeEventListener('pointerdown', onPointerDown);
        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('pointerup', onPointerUp);
        window.removeEventListener('resize', drawLines);
      };
    }

    buildRound();

    return () => {
      if (activeCleanup) activeCleanup();
    };
  }

  /* =========================================================================
   * 遊戲 2：🎈 戳氣球找注音（無限續關 Canvas 氣球射擊）
   * ========================================================================= */
  function mountBalloonGame(stage) {
    const vocabPool = getVocabPool();
    const deck = db().createSmartDeck(vocabPool);
    const STAGE_GOAL = 8;

    let level = 1;
    let stageScore = 0;
    let totalScore = 0;
    let combo = 0;
    let paused = false;
    let targetItem = deck.draw();
    let spawnsSinceTarget = 0;
    let animId = null;
    let lastTime = performance.now();

    const balloons = [];
    const particles = [];
    const popTexts = [];
    const clouds = [
      { x: 0.15, y: 0.14, s: 1.0, v: 0.008 },
      { x: 0.58, y: 0.22, s: 0.85, v: 0.006 },
      { x: 0.85, y: 0.12, s: 1.1, v: 0.009 },
    ];

    stage.innerHTML = `
      <div class="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div class="flex flex-wrap items-center gap-2.5">
          <span id="balloonLevelBadge" class="px-3 py-1 rounded-full bg-gradient-to-r from-sky-500 to-blue-500 text-white font-black text-sm shadow-sm">
            第 1 關
          </span>
          <div class="px-4 py-1.5 rounded-2xl bg-sky-100 border-2 border-sky-300 flex items-center gap-3 shadow-sm">
            <span class="text-xs font-black text-sky-800">請戳破</span>
            <span id="balloonTargetChar" class="font-kai text-4xl font-black text-sky-950 leading-none">${targetItem.char}</span>
            <span id="balloonTargetHint" class="text-sm font-bold text-sky-700 hidden sm:inline">${targetItem.emoji} ${targetItem.word}</span>
          </div>
          <button id="balloonSpeakBtn" type="button"
            class="btn-3d px-3.5 py-2 rounded-2xl bg-gradient-to-r from-sky-400 to-blue-500 text-white border-b-4 border-blue-700 font-black text-sm flex items-center gap-1.5 shadow-sm">
            <span>🔊</span><span>標準發音</span>
          </button>
        </div>

        <div class="flex items-center gap-2">
          <span id="balloonComboBadge" class="hidden px-3 py-1.5 rounded-full bg-orange-100 text-orange-700 border-2 border-orange-300 font-black text-xs sm:text-sm">
            🔥 連擊 x0
          </span>
          <span id="balloonTotalBadge" class="px-3 py-1.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 font-black text-xs sm:text-sm">
            ⭐ 總分 0
          </span>
          <span id="balloonScoreBadge" class="px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-800 border-2 border-emerald-300 font-black text-xs sm:text-sm">
            🎈 0 / ${STAGE_GOAL}
          </span>
        </div>
      </div>

      <div id="balloonFeedback" class="mb-2.5 px-4 py-1.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs sm:text-sm font-bold text-center">
        🎯 找找看寫著「${targetItem.char}（${targetItem.emoji} ${targetItem.word}）」的氣球，點一下戳破它！
      </div>

      <div class="relative w-full h-[380px] sm:h-[430px] rounded-3xl overflow-hidden border-4 border-sky-200 shadow-inner bg-sky-100">
        <canvas id="balloonCanvas" class="w-full h-full block cursor-pointer"></canvas>
      </div>
    `;

    const canvas = stage.querySelector('#balloonCanvas');
    const ctx = canvas.getContext('2d');
    const levelBadge = stage.querySelector('#balloonLevelBadge');
    const targetCharEl = stage.querySelector('#balloonTargetChar');
    const targetHintEl = stage.querySelector('#balloonTargetHint');
    const scoreBadge = stage.querySelector('#balloonScoreBadge');
    const totalBadge = stage.querySelector('#balloonTotalBadge');
    const comboBadge = stage.querySelector('#balloonComboBadge');
    const feedbackEl = stage.querySelector('#balloonFeedback');

    let cw = 600;
    let ch = 400;

    function resize() {
      const rect = canvas.parentElement.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      cw = Math.max(300, Math.floor(rect.width));
      ch = Math.max(320, Math.floor(rect.height));
      canvas.width = cw * dpr;
      canvas.height = ch * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function pickDistractor() {
      const others = vocabPool.filter((x) => x.char !== targetItem.char);
      const src = others.length > 0 ? others : vocabPool;
      return src[Math.floor(Math.random() * src.length)];
    }

    function spawnBalloon(forceMode = 'auto', startY = null) {
      // forceMode: 'auto' | 'target' | 'distractor'
      const hasTarget = balloons.some((b) => b.item.char === targetItem.char && b.y > 40);
      let useTarget = false;
      if (forceMode === 'target') {
        useTarget = true;
      } else if (forceMode === 'distractor') {
        useTarget = false;
      } else {
        // 不再永遠讓「剛生出來的第一顆」就是答案：隨機穿插干擾氣球，最多連續 2 顆干擾後才保底出答案
        if (!hasTarget && spawnsSinceTarget >= 2) {
          useTarget = true;
        } else if (!hasTarget) {
          useTarget = Math.random() < 0.34;
        } else {
          useTarget = Math.random() < 0.16;
        }
      }

      if (useTarget) {
        spawnsSinceTarget = 0;
      } else {
        spawnsSinceTarget += 1;
      }

      const item = useTarget ? targetItem : pickDistractor();
      const pal = BALLOON_PALETTE[Math.floor(Math.random() * BALLOON_PALETTE.length)];
      const r = cw < 450 ? 34 : 40;
      const levelBoost = Math.min(28, (level - 1) * 4);
      const baseSpeed = (gState.difficulty === 'easy' ? 40 : 66) + levelBoost;

      let x = r + 14 + Math.random() * (cw - (r + 14) * 2);
      for (let tries = 0; tries < 5; tries++) {
        const candidate = r + 14 + Math.random() * (cw - (r + 14) * 2);
        const tooClose = balloons.some(
          (b) => Math.abs(b.x - candidate) < r * 1.9 && Math.abs(b.y - (startY ?? ch + r)) < r * 2
        );
        if (!tooClose) {
          x = candidate;
          break;
        }
      }

      balloons.push({
        item,
        x,
        baseX: x,
        y: startY !== null ? startY : ch + r + 10 + Math.random() * 50,
        r,
        vy: baseSpeed + Math.random() * 20,
        swayAmp: 10 + Math.random() * 14,
        swayFreq: 1.2 + Math.random() * 0.9,
        phase: Math.random() * Math.PI * 2,
        pal,
        wobble: 0,
      });
    }

    function setNewTarget() {
      const prevChar = targetItem.char;
      // 優先從「畫面上已經存在的氣球」中挑一顆當新題目（約 65% 機率），讓小朋友必須掃視全部氣球思考尋找！
      const visibleCandidates = balloons.filter(
        (b) => b.item.char !== prevChar && b.y > 105 && b.y < ch - 35
      );
      if (visibleCandidates.length >= 2 && Math.random() < 0.65) {
        const picked = visibleCandidates[Math.floor(Math.random() * visibleCandidates.length)];
        targetItem = picked.item;
      } else {
        targetItem = deck.draw((it) => it.char === prevChar);
      }

      spawnsSinceTarget = 0;
      targetCharEl.textContent = targetItem.char;
      targetHintEl.textContent = `${targetItem.emoji} ${targetItem.word}`;
      feedbackEl.textContent = `🎯 找找看寫著「${targetItem.char}（${targetItem.emoji} ${targetItem.word}）」的氣球！`;
      app().playZhuyinAudio(targetItem.char);
      // 不再於換題瞬間單獨生成一顆答案氣球，改由自然波次穿插干擾氣球出現
    }

    function spawnBurst(x, y, color) {
      for (let i = 0; i < 18; i++) {
        const ang = (Math.PI * 2 * i) / 18 + Math.random() * 0.3;
        const spd = 70 + Math.random() * 150;
        particles.push({
          x,
          y,
          vx: Math.cos(ang) * spd,
          vy: Math.sin(ang) * spd,
          r: 4 + Math.random() * 4,
          color: i % 3 === 0 ? '#FDE047' : color,
          life: 1,
        });
      }
    }

    function drawCloud(cx, cy, scale) {
      ctx.save();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.82)';
      ctx.beginPath();
      ctx.arc(cx, cy, 22 * scale, 0, Math.PI * 2);
      ctx.arc(cx + 20 * scale, cy - 8 * scale, 26 * scale, 0, Math.PI * 2);
      ctx.arc(cx + 44 * scale, cy, 20 * scale, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    function drawBalloon(b) {
      ctx.save();
      const wobbleOffset = b.wobble > 0 ? Math.sin(b.wobble * 35) * 6 : 0;
      const bx = b.x + wobbleOffset;
      const by = b.y;
      const rx = b.r;
      const ry = b.r * 1.14;

      ctx.strokeStyle = 'rgba(100, 116, 139, 0.55)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(bx, by + ry);
      ctx.quadraticCurveTo(bx + Math.sin(b.phase * 2) * 8, by + ry + 18, bx - 3, by + ry + 36);
      ctx.stroke();

      ctx.fillStyle = b.pal.dark;
      ctx.beginPath();
      ctx.moveTo(bx - 6, by + ry + 4);
      ctx.lineTo(bx + 6, by + ry + 4);
      ctx.lineTo(bx, by + ry - 3);
      ctx.closePath();
      ctx.fill();

      const grad = ctx.createRadialGradient(bx - rx * 0.3, by - ry * 0.3, rx * 0.1, bx, by, ry * 1.1);
      grad.addColorStop(0, b.pal.light);
      grad.addColorStop(0.32, b.pal.fill);
      grad.addColorStop(1, b.pal.dark);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.ellipse(bx, by, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.beginPath();
      ctx.ellipse(bx - rx * 0.36, by - ry * 0.34, rx * 0.16, ry * 0.28, -0.4, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#FFFFFF';
      ctx.strokeStyle = 'rgba(15, 23, 42, 0.28)';
      ctx.lineWidth = 4;
      ctx.font = `900 ${Math.round(rx * 1.05)}px "DFKai-SB", "BiauKai", "標楷體", "Noto Sans TC", serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.strokeText(b.item.char, bx, by + 2);
      ctx.fillText(b.item.char, bx, by + 2);
      ctx.restore();
    }

    function tick(now) {
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;

      const sky = ctx.createLinearGradient(0, 0, 0, ch);
      sky.addColorStop(0, '#BAE6FD');
      sky.addColorStop(0.7, '#E0F2FE');
      sky.addColorStop(1, '#FEF9C3');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, cw, ch);

      clouds.forEach((c) => {
        c.x += c.v * dt;
        if (c.x > 1.15) c.x = -0.15;
        drawCloud(c.x * cw, c.y * ch, c.s);
      });

      const desiredCount = gState.difficulty === 'easy' ? 5 : 7;
      if (!paused && balloons.length < desiredCount) {
        spawnBalloon('auto');
      }

      for (let i = balloons.length - 1; i >= 0; i--) {
        const b = balloons[i];
        if (!paused) {
          b.y -= b.vy * dt;
          b.phase += b.swayFreq * dt;
          b.x = b.baseX + Math.sin(b.phase) * b.swayAmp;
          if (b.wobble > 0) b.wobble = Math.max(0, b.wobble - dt);
        }
        if (b.y < -b.r * 1.6) {
          balloons.splice(i, 1);
          continue;
        }
        drawBalloon(b);
      }

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 260 * dt;
        p.life -= dt * 2.1;
        if (p.life <= 0) {
          particles.splice(i, 1);
          continue;
        }
        ctx.save();
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      for (let i = popTexts.length - 1; i >= 0; i--) {
        const t = popTexts[i];
        t.y -= 48 * dt;
        t.life -= dt * 1.4;
        if (t.life <= 0) {
          popTexts.splice(i, 1);
          continue;
        }
        ctx.save();
        ctx.globalAlpha = Math.max(0, t.life);
        ctx.font = '900 24px "Zen Maru Gothic", sans-serif';
        ctx.fillStyle = '#EA580C';
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 4;
        ctx.textAlign = 'center';
        ctx.strokeText(t.text, t.x, t.y);
        ctx.fillText(t.text, t.x, t.y);
        ctx.restore();
      }

      animId = requestAnimationFrame(tick);
    }

    function onCanvasDown(e) {
      if (paused) return;
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;

      for (let i = balloons.length - 1; i >= 0; i--) {
        const b = balloons[i];
        const dx = (px - b.x) / (b.r * 1.18);
        const dy = (py - b.y) / (b.r * 1.28);
        if (dx * dx + dy * dy <= 1) {
          if (b.item.char === targetItem.char) {
            balloons.splice(i, 1);
            stageScore += 1;
            totalScore += 1;
            combo += 1;
            playBalloonPop(combo - 1);
            spawnBurst(b.x, b.y, b.pal.fill);
            popTexts.push({ x: b.x, y: b.y, text: combo >= 3 ? `+1 🔥x${combo}` : '+1 ⭐', life: 1 });

            scoreBadge.textContent = `🎈 ${stageScore} / ${STAGE_GOAL}`;
            totalBadge.textContent = `⭐ 總分 ${totalScore}`;
            if (combo >= 2) {
              comboBadge.classList.remove('hidden');
              comboBadge.textContent = `🔥 連擊 x${combo}`;
            }

            if (stageScore >= STAGE_GOAL) {
              paused = true;
              const clearedLevel = level;
              level += 1;
              setTimeout(() => {
                showStageClearBanner(
                  `第 ${clearedLevel} 關過關！🎈`,
                  `你已經戳破 ${totalScore} 顆注音氣球囉！準備進入第 ${level} 關…`,
                  () => {
                    stageScore = 0;
                    paused = false;
                    levelBadge.textContent = `第 ${level} 關`;
                    scoreBadge.textContent = `🎈 0 / ${STAGE_GOAL}`;
                    setNewTarget();
                  }
                );
              }, 350);
            } else {
              setNewTarget();
            }
          } else {
            combo = 0;
            comboBadge.classList.add('hidden');
            b.wobble = 0.45;
            playGentleBoing();
            app().playZhuyinAudio(b.item.char);
            feedbackEl.textContent = `那是「${b.item.char}（${b.item.emoji} ${b.item.word}）」喔！我們要找的是「${targetItem.char}」！`;
          }
          break;
        }
      }
    }

    resize();
    // 開局同時放 5 顆混合氣球（隨機位置與高度，其中 1 顆是目標、4 顆是干擾）
    const initHeights = shuffle([ch * 0.42, ch * 0.56, ch * 0.68, ch * 0.80, ch * 0.92]);
    spawnBalloon('target', initHeights[0]);
    spawnBalloon('distractor', initHeights[1]);
    spawnBalloon('distractor', initHeights[2]);
    spawnBalloon('distractor', initHeights[3]);
    spawnBalloon('distractor', initHeights[4]);

    app().playZhuyinAudio(targetItem.char);
    animId = requestAnimationFrame(tick);

    canvas.addEventListener('pointerdown', onCanvasDown);
    window.addEventListener('resize', resize);
    stage.querySelector('#balloonSpeakBtn').addEventListener('click', () => {
      app().playZhuyinAudio(targetItem.char);
    });

    return () => {
      if (animId) cancelAnimationFrame(animId);
      canvas.removeEventListener('pointerdown', onCanvasDown);
      window.removeEventListener('resize', resize);
    };
  }

  /* =========================================================================
   * 遊戲 3：🐹 打地鼠找注音（無限續關 3×3 草地洞口）
   * ========================================================================= */
  function mountMoleGame(stage) {
    const vocabPool = getVocabPool();
    const deck = db().createSmartDeck(vocabPool);
    const STAGE_GOAL = 8;

    let level = 1;
    let stageScore = 0;
    let totalScore = 0;
    let combo = 0;
    let paused = false;
    let destroyed = false;
    let targetItem = deck.draw();
    let molesSinceTarget = 0;
    const holeTimers = new Array(9).fill(null);
    const holeItems = new Array(9).fill(null);
    let spawnLoopTimer = null;

    stage.innerHTML = `
      <div class="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div class="flex flex-wrap items-center gap-2.5">
          <span id="moleLevelBadge" class="px-3 py-1 rounded-full bg-gradient-to-r from-emerald-500 to-green-500 text-white font-black text-sm shadow-sm">
            第 1 關
          </span>
          <div class="px-4 py-1.5 rounded-2xl bg-emerald-100 border-2 border-emerald-300 flex items-center gap-3 shadow-sm">
            <span class="text-xs font-black text-emerald-800">請敲打</span>
            <span id="moleTargetChar" class="font-kai text-4xl font-black text-emerald-950 leading-none">${targetItem.char}</span>
            <span id="moleTargetHint" class="text-sm font-bold text-emerald-700 hidden sm:inline">${targetItem.emoji} ${targetItem.word}</span>
          </div>
          <button id="moleSpeakBtn" type="button"
            class="btn-3d px-3.5 py-2 rounded-2xl bg-gradient-to-r from-emerald-400 to-green-500 text-white border-b-4 border-green-700 font-black text-sm flex items-center gap-1.5 shadow-sm">
            <span>🔊</span><span>標準發音</span>
          </button>
        </div>

        <div class="flex items-center gap-2">
          <span id="moleComboBadge" class="hidden px-3 py-1.5 rounded-full bg-orange-100 text-orange-700 border-2 border-orange-300 font-black text-xs sm:text-sm">
            🔥 連擊 x0
          </span>
          <span id="moleTotalBadge" class="px-3 py-1.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 font-black text-xs sm:text-sm">
            ⭐ 總分 0
          </span>
          <span id="moleScoreBadge" class="px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-900 border-2 border-emerald-300 font-black text-xs sm:text-sm">
            🐹 0 / ${STAGE_GOAL}
          </span>
        </div>
      </div>

      <div id="moleFeedback" class="mb-3 px-4 py-1.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs sm:text-sm font-bold text-center">
        🔨 抱著「${targetItem.char}（${targetItem.emoji} ${targetItem.word}）」牌子的地鼠探頭時，快輕輕敲牠一下！
      </div>

      <div class="max-w-xl mx-auto rounded-3xl p-4 sm:p-6 bg-gradient-to-b from-lime-200 via-emerald-200 to-green-300 border-4 border-emerald-400 shadow-inner">
        <div id="moleGrid" class="grid grid-cols-3 gap-3 sm:gap-5">
          ${Array.from({ length: 9 }, (_, i) => `
            <button data-hole="${i}" type="button"
              class="mole-hole relative h-28 sm:h-32 rounded-3xl overflow-hidden focus:outline-none select-none cursor-pointer flex items-end justify-center">
              <div class="absolute bottom-2 w-[86%] h-9 rounded-[50%] bg-amber-950/85 border-4 border-amber-800 shadow-inner"></div>
              <div class="mole-sprite relative z-10 w-[78%] flex flex-col items-center pointer-events-none">
                <div class="relative w-20 sm:w-24 h-24 sm:h-28 rounded-t-[2.4rem] bg-gradient-to-b from-amber-500 to-amber-700 border-4 border-amber-800 flex flex-col items-center pt-2 shadow-md">
                  <span class="absolute -top-2 -left-1 w-5 h-5 rounded-full bg-amber-600 border-2 border-amber-800"></span>
                  <span class="absolute -top-2 -right-1 w-5 h-5 rounded-full bg-amber-600 border-2 border-amber-800"></span>
                  <div class="flex items-center gap-3 mt-0.5">
                    <span class="mole-eye w-2.5 h-2.5 rounded-full bg-slate-900"></span>
                    <span class="mole-eye w-2.5 h-2.5 rounded-full bg-slate-900"></span>
                  </div>
                  <div class="w-4 h-2.5 rounded-full bg-rose-400 mt-0.5"></div>
                  <div class="mt-1 px-2.5 py-0.5 rounded-xl bg-white border-2 border-amber-300 shadow-sm">
                    <span class="mole-char font-kai text-2xl sm:text-3xl font-black text-slate-900 leading-none">ㄅ</span>
                  </div>
                </div>
              </div>
              <div class="absolute bottom-0 inset-x-0 h-6 bg-gradient-to-t from-green-600 to-emerald-500 rounded-b-2xl border-t-4 border-amber-700/80 z-20 pointer-events-none"></div>
              <div class="mole-fx absolute top-2 left-1/2 z-30 pointer-events-none"></div>
            </button>
          `).join('')}
        </div>
      </div>
    `;

    const holes = Array.from(stage.querySelectorAll('.mole-hole'));
    const levelBadge = stage.querySelector('#moleLevelBadge');
    const targetCharEl = stage.querySelector('#moleTargetChar');
    const targetHintEl = stage.querySelector('#moleTargetHint');
    const scoreBadge = stage.querySelector('#moleScoreBadge');
    const totalBadge = stage.querySelector('#moleTotalBadge');
    const comboBadge = stage.querySelector('#moleComboBadge');
    const feedbackEl = stage.querySelector('#moleFeedback');

    function pickDistractor() {
      const others = vocabPool.filter((x) => x.char !== targetItem.char);
      const src = others.length > 0 ? others : vocabPool;
      return src[Math.floor(Math.random() * src.length)];
    }

    function hideHole(idx) {
      if (holeTimers[idx]) {
        clearTimeout(holeTimers[idx]);
        holeTimers[idx] = null;
      }
      holeItems[idx] = null;
      holes[idx].classList.remove('is-up', 'is-bonked');
    }

    function popUpHole(idx, forceMode = 'auto') {
      if (paused || destroyed || holeItems[idx]) return;
      const targetAlreadyUp = holeItems.some((it) => it && it.char === targetItem.char);
      let useTarget = false;
      if (forceMode === 'target') {
        useTarget = true;
      } else if (forceMode === 'distractor') {
        useTarget = false;
      } else {
        // 不再於換題後立刻讓下一隻探頭的地鼠 100% 是答案：穿插 1~3 隻干擾地鼠，讓小朋友真的看字判斷！
        if (!targetAlreadyUp && molesSinceTarget >= 3) {
          useTarget = true;
        } else if (!targetAlreadyUp) {
          useTarget = Math.random() < 0.32;
        } else {
          useTarget = Math.random() < 0.14;
        }
      }

      if (useTarget) {
        molesSinceTarget = 0;
      } else {
        molesSinceTarget += 1;
      }

      const item = useTarget ? targetItem : pickDistractor();

      holeItems[idx] = item;
      const holeEl = holes[idx];
      holeEl.querySelector('.mole-char').textContent = item.char;
      holeEl.classList.remove('is-bonked');
      holeEl.classList.add('is-up');

      const speedReduction = Math.min(550, (level - 1) * 70);
      const stayMs = Math.max(1150, (gState.difficulty === 'easy' ? 2700 : 1800) - speedReduction);
      holeTimers[idx] = setTimeout(() => hideHole(idx), stayMs);
    }

    function scheduleSpawn() {
      if (destroyed) return;
      if (!paused) {
        const activeCount = holeItems.filter(Boolean).length;
        const maxActive = gState.difficulty === 'easy' ? 3 : 4;
        if (activeCount < maxActive) {
          const freeIndices = holeItems.map((it, idx) => (it ? -1 : idx)).filter((idx) => idx >= 0);
          if (freeIndices.length > 0) {
            // 偶爾同時冒出 2 隻不同注音的地鼠，增加比較與思考樂趣
            const burst = activeCount <= 1 && freeIndices.length >= 2 && Math.random() < 0.55 ? 2 : 1;
            const pickedHoles = shuffle(freeIndices).slice(0, burst);
            pickedHoles.forEach((hIdx) => popUpHole(hIdx, 'auto'));
          }
        }
      }
      const intervalMs = gState.difficulty === 'easy' ? 920 : 620;
      spawnLoopTimer = setTimeout(scheduleSpawn, intervalMs);
    }

    function nextTarget() {
      const prevChar = targetItem.char;
      // 如果草地上已經有 2 隻以上地鼠，約 45% 機率直接從其中挑一隻當新題目，考驗即時觀察
      const activeMoles = holeItems.filter((it) => it && it.char !== prevChar);
      if (activeMoles.length >= 2 && Math.random() < 0.45) {
        targetItem = activeMoles[Math.floor(Math.random() * activeMoles.length)];
      } else {
        targetItem = deck.draw((it) => it.char === prevChar);
      }
      molesSinceTarget = 0;
      targetCharEl.textContent = targetItem.char;
      targetHintEl.textContent = `${targetItem.emoji} ${targetItem.word}`;
      feedbackEl.textContent = `🔨 下一隻！找抱著「${targetItem.char}（${targetItem.emoji} ${targetItem.word}）」牌子的地鼠！`;
      app().playZhuyinAudio(targetItem.char);
    }

    function showHoleFx(holeEl, text, colorClass) {
      const fx = holeEl.querySelector('.mole-fx');
      fx.innerHTML = `<span class="animate-float-score inline-block font-black text-xl drop-shadow ${colorClass}">${text}</span>`;
      setTimeout(() => {
        fx.innerHTML = '';
      }, 760);
    }

    holes.forEach((holeEl, idx) => {
      holeEl.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        if (paused || destroyed) return;
        const item = holeItems[idx];
        if (!item) return;

        if (item.char === targetItem.char) {
          stageScore += 1;
          totalScore += 1;
          combo += 1;
          app().playStrokeDing(combo - 1);

          holeEl.classList.add('is-bonked');
          showHoleFx(holeEl, combo >= 3 ? `+1 🔥` : '+1 ⭐', 'text-amber-600');
          scoreBadge.textContent = `🐹 ${stageScore} / ${STAGE_GOAL}`;
          totalBadge.textContent = `⭐ 總分 ${totalScore}`;
          if (combo >= 2) {
            comboBadge.classList.remove('hidden');
            comboBadge.textContent = `🔥 連擊 x${combo}`;
          }

          if (holeTimers[idx]) clearTimeout(holeTimers[idx]);
          holeItems[idx] = null;
          setTimeout(() => hideHole(idx), 250);

          if (stageScore >= STAGE_GOAL) {
            paused = true;
            const clearedLevel = level;
            level += 1;
            setTimeout(() => {
              showStageClearBanner(
                `第 ${clearedLevel} 關過關！🐹`,
                `累計已敲中 ${totalScore} 隻注音地鼠！準備進入第 ${level} 關…`,
                () => {
                  stageScore = 0;
                  paused = false;
                  levelBadge.textContent = `第 ${level} 關`;
                  scoreBadge.textContent = `🐹 0 / ${STAGE_GOAL}`;
                  nextTarget();
                  const startHoles = shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8]).slice(0, 3);
                  popUpHole(startHoles[0], 'distractor');
                  popUpHole(startHoles[1], 'distractor');
                  popUpHole(startHoles[2], 'target');
                }
              );
            }, 350);
          } else {
            nextTarget();
          }
        } else {
          combo = 0;
          comboBadge.classList.add('hidden');
          playGentleBoing();
          app().playZhuyinAudio(item.char);
          showHoleFx(holeEl, item.char, 'text-rose-600');
          feedbackEl.textContent = `那是「${item.char}（${item.emoji} ${item.word}）」地鼠喔！我們要敲「${targetItem.char}」！`;
          holeEl.classList.remove('animate-gentle-shake');
          void holeEl.offsetWidth;
          holeEl.classList.add('animate-gentle-shake');
        }
      });
    });

    stage.querySelector('#moleSpeakBtn').addEventListener('click', () => {
      app().playZhuyinAudio(targetItem.char);
    });

    app().playZhuyinAudio(targetItem.char);
    // 開局同時在隨機 3 個洞冒出「2 隻干擾 + 1 隻目標」，不會固定在中間或第一隻就是答案
    const initHoles = shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8]).slice(0, 3);
    popUpHole(initHoles[0], 'distractor');
    popUpHole(initHoles[1], 'target');
    popUpHole(initHoles[2], 'distractor');
    scheduleSpawn();

    return () => {
      destroyed = true;
      if (spawnLoopTimer) clearTimeout(spawnLoopTimer);
      holeTimers.forEach((t) => t && clearTimeout(t));
    };
  }

  /* =========================================================================
   * 遊戲 4：🃏 注音翻翻樂（無限續關 3D 記憶配對）
   * ========================================================================= */
  function mountMemoryGame(stage) {
    const vocabPool = getVocabPool();
    const deck = db().createSmartDeck(vocabPool);
    const uniqueCharCount = new Set(vocabPool.map((v) => v.char)).size;
    const pairCount = Math.min(uniqueCharCount, gState.difficulty === 'easy' ? 4 : 6);

    let level = 1;
    let totalMatched = 0;
    let flipBackTimer = null;

    function buildRound() {
      if (flipBackTimer) {
        clearTimeout(flipBackTimer);
        flipBackTimer = null;
      }

      const chosen = deck.drawBatch(pairCount, true);
      const cards = shuffle(
        chosen.flatMap((item) => [
          { char: item.char, kind: 'symbol', item },
          { char: item.char, kind: 'word', item },
        ])
      );

      let firstCard = null;
      let lockBoard = false;
      let matchedPairs = 0;
      let moves = 0;
      const colsClass = chosen.length <= 3 ? 'grid-cols-3' : 'grid-cols-4';

      stage.innerHTML = `
        <div class="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div class="flex items-center gap-2.5">
            <span class="px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-black text-sm shadow-sm">
              第 ${level} 關
            </span>
            <h3 class="text-xl sm:text-2xl font-black text-amber-900">🃏 注音翻翻樂</h3>
          </div>
          <div class="flex items-center gap-2">
            <span id="memTotalBadge" class="px-3 py-1.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 font-black text-xs sm:text-sm">
              ⭐ 累計 ${totalMatched} 對
            </span>
            <span id="memPairsBadge" class="px-3 py-1.5 rounded-full bg-orange-100 text-orange-900 border-2 border-orange-200 font-black text-xs sm:text-sm">
              本關 0 / ${chosen.length}
            </span>
            <span id="memMovesBadge" class="px-3 py-1.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 font-bold text-xs sm:text-sm">
              翻牌 0 次
            </span>
          </div>
        </div>

        <div id="memoryGrid" class="grid ${colsClass} gap-2.5 sm:gap-4 max-w-2xl mx-auto">
          ${cards.map((card, idx) => `
            <button data-idx="${idx}" type="button"
              class="flip-card aspect-[4/5] sm:aspect-square w-full focus:outline-none cursor-pointer">
              <div class="flip-card-inner">
                <div class="flip-card-face rounded-3xl bg-gradient-to-br from-amber-300 via-orange-300 to-rose-300 border-4 border-white shadow-md flex flex-col items-center justify-center">
                  <span class="text-3xl sm:text-4xl drop-shadow">🌟</span>
                  <span class="text-xs font-black text-white/95 mt-1">點我翻開</span>
                </div>
                <div class="flip-card-face flip-card-back rounded-3xl bg-white border-4 ${card.kind === 'symbol' ? 'border-rose-300' : 'border-sky-300'} shadow-md flex flex-col items-center justify-center p-2">
                  ${card.kind === 'symbol'
                    ? `<span class="font-kai text-5xl sm:text-6xl font-black text-rose-800 leading-none">${card.item.char}</span>
                       <span class="mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-600">注音</span>`
                    : `<span class="text-4xl sm:text-5xl leading-none">${card.item.emoji}</span>
                       <span class="mt-1.5 text-sm sm:text-base font-black text-slate-800 leading-tight">${card.item.word}</span>`
                  }
                </div>
              </div>
            </button>
          `).join('')}
        </div>
      `;

      const pairsBadge = stage.querySelector('#memPairsBadge');
      const totalBadge = stage.querySelector('#memTotalBadge');
      const movesBadge = stage.querySelector('#memMovesBadge');
      const cardEls = Array.from(stage.querySelectorAll('.flip-card'));

      cardEls.forEach((el, idx) => {
        el.addEventListener('click', () => {
          if (lockBoard) return;
          if (el.classList.contains('is-flipped') || el.classList.contains('is-matched')) return;

          const cardData = cards[idx];
          app().playSoftPop();
          el.classList.add('is-flipped');
          if (cardData.kind === 'symbol') {
            app().playZhuyinAudio(cardData.item.char);
          } else {
            app().speakText(cardData.item.word);
          }

          if (!firstCard) {
            firstCard = { el, data: cardData };
            return;
          }

          moves += 1;
          movesBadge.textContent = `翻牌 ${moves} 次`;

          if (firstCard.data.char === cardData.char) {
            const matchedA = firstCard.el;
            const matchedB = el;
            firstCard = null;
            matchedPairs += 1;
            totalMatched += 1;
            pairsBadge.textContent = `本關 ${matchedPairs} / ${chosen.length}`;
            totalBadge.textContent = `⭐ 累計 ${totalMatched} 對`;

            setTimeout(() => {
              matchedA.classList.add('is-matched');
              matchedB.classList.add('is-matched');
              matchedA.querySelector('.flip-card-back').classList.add('bg-emerald-50', '!border-emerald-400');
              matchedB.querySelector('.flip-card-back').classList.add('bg-emerald-50', '!border-emerald-400');
              app().playStrokeDing(matchedPairs - 1);

              if (matchedPairs === chosen.length) {
                const clearedLevel = level;
                level += 1;
                setTimeout(() => {
                  showStageClearBanner(
                    `第 ${clearedLevel} 關過關！🃏`,
                    `只花了 ${moves} 次翻牌！準備發一組全新圖詞進入第 ${level} 關…`,
                    buildRound
                  );
                }, 450);
              }
            }, 220);
          } else {
            lockBoard = true;
            const prevEl = firstCard.el;
            firstCard = null;
            flipBackTimer = setTimeout(() => {
              prevEl.classList.remove('is-flipped');
              el.classList.remove('is-flipped');
              lockBoard = false;
            }, 1050);
          }
        });
      });
    }

    buildRound();

    return () => {
      if (flipBackTimer) clearTimeout(flipBackTimer);
    };
  }

  /* =========================================================================
   * 遊戲 5：👂 聽音找注音（無限續關・教育部標準發音聽力辨識）
   * ========================================================================= */
  function mountListenGame(stage) {
    const vocabPool = getVocabPool();
    const deck = db().createSmartDeck(vocabPool);
    const uniqueChars = Array.from(new Set(vocabPool.map((v) => v.char)));
    const optionCount = Math.min(uniqueChars.length, 4);
    const STAGE_Q = 5;

    let level = 1;
    let qInStage = 0;
    let totalCorrect = 0;
    let streak = 0;
    let currentTarget = null;
    let nextTimer = null;
    let locked = false;

    const CARD_STYLES = [
      'bg-rose-50 hover:bg-rose-100 border-rose-300 text-rose-900',
      'bg-sky-50 hover:bg-sky-100 border-sky-300 text-sky-900',
      'bg-amber-50 hover:bg-amber-100 border-amber-300 text-amber-900',
      'bg-emerald-50 hover:bg-emerald-100 border-emerald-300 text-emerald-900',
    ];

    stage.innerHTML = `
      <div class="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div class="flex items-center gap-2.5">
          <span id="listenLevelBadge" class="px-3 py-1 rounded-full bg-gradient-to-r from-violet-500 to-purple-500 text-white font-black text-sm shadow-sm">
            第 1 關
          </span>
          <h3 class="text-xl sm:text-2xl font-black text-purple-900">👂 聽音找注音</h3>
        </div>
        <div class="flex items-center gap-2">
          <span id="listenTotalBadge" class="px-3 py-1.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 font-black text-xs sm:text-sm">
            ⭐ 累計答對 0 題
          </span>
          <div id="listenStarsRow" class="flex items-center gap-1 bg-purple-50 px-3 py-1 rounded-full border-2 border-purple-200">
            ${Array.from({ length: STAGE_Q }, () => '<span class="text-lg opacity-25">⭐</span>').join('')}
          </div>
        </div>
      </div>

      <div class="max-w-xl mx-auto text-center bg-gradient-to-br from-violet-50 to-fuchsia-50 rounded-3xl p-5 sm:p-6 border-4 border-violet-200 mb-5">
        <div class="text-xs font-black text-violet-700 mb-3" id="listenQuestionNum">第 1 關・第 1 / ${STAGE_Q} 題</div>

        <button id="listenPlayBtn" type="button"
          class="btn-3d mx-auto w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 text-white border-b-8 border-purple-800 shadow-xl flex flex-col items-center justify-center gap-1">
          <span id="listenSpeakerIcon" class="text-4xl sm:text-5xl">🔊</span>
          <span class="text-xs sm:text-sm font-black">聽標準發音</span>
        </button>

        <div class="mt-4 flex items-center justify-center gap-2">
          <button id="listenHintBtn" type="button"
            class="btn-3d px-3.5 py-1.5 rounded-xl bg-white hover:bg-amber-50 text-amber-800 border-2 border-amber-200 text-xs sm:text-sm font-bold shadow-sm">
            💡 看圖案提示
          </button>
          <span id="listenHintBox" class="hidden px-3.5 py-1.5 rounded-xl bg-amber-100 text-amber-900 border border-amber-300 text-sm font-black"></span>
        </div>

        <p id="listenFeedback" class="mt-3 text-xs sm:text-sm font-bold text-violet-900 min-h-[20px]">
          仔細聽教育部標準發音，再選出下面正確的注音卡片！
        </p>
      </div>

      <div id="listenOptionsGrid" class="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 max-w-2xl mx-auto"></div>
    `;

    const levelBadge = stage.querySelector('#listenLevelBadge');
    const totalBadge = stage.querySelector('#listenTotalBadge');
    const starsRow = stage.querySelector('#listenStarsRow');
    const qNumEl = stage.querySelector('#listenQuestionNum');
    const speakerIcon = stage.querySelector('#listenSpeakerIcon');
    const hintBtn = stage.querySelector('#listenHintBtn');
    const hintBox = stage.querySelector('#listenHintBox');
    const feedbackEl = stage.querySelector('#listenFeedback');
    const optionsGrid = stage.querySelector('#listenOptionsGrid');

    function resetStageStars() {
      Array.from(starsRow.children).forEach((el) => {
        el.classList.add('opacity-25');
        el.classList.remove('animate-star-pop');
      });
    }

    function loadQuestion() {
      locked = false;
      currentTarget = deck.draw((it) => currentTarget && it.char === currentTarget.char);

      const distractorChars = shuffle(uniqueChars.filter((c) => c !== currentTarget.char)).slice(0, optionCount - 1);
      const distractors = distractorChars.map((c) => vocabPool.find((v) => v.char === c));
      const options = shuffle([currentTarget, ...distractors]);

      levelBadge.textContent = `第 ${level} 關`;
      qNumEl.textContent = `第 ${level} 關・第 ${qInStage + 1} / ${STAGE_Q} 題${streak >= 2 ? `（🔥 連續答對 ${streak} 題）` : ''}`;
      hintBox.classList.add('hidden');
      hintBtn.classList.remove('hidden');
      feedbackEl.textContent = '👂 聽聽看，這是哪一個注音呢？';

      optionsGrid.innerHTML = options.map((opt, i) => `
        <button data-char="${opt.char}" type="button"
          class="listen-opt btn-3d py-6 sm:py-8 rounded-3xl border-4 border-b-8 shadow-md flex flex-col items-center justify-center transition-all ${CARD_STYLES[i % CARD_STYLES.length]}">
          <span class="font-kai text-5xl sm:text-6xl font-black leading-none">${opt.char}</span>
        </button>
      `).join('');

      optionsGrid.querySelectorAll('.listen-opt').forEach((btn) => {
        btn.addEventListener('click', () => {
          if (locked) return;
          const ch = btn.dataset.char;
          const picked = options.find((o) => o.char === ch);

          if (ch === currentTarget.char) {
            locked = true;
            totalCorrect += 1;
            streak += 1;
            app().playStrokeDing(qInStage);
            btn.className = 'listen-opt btn-3d py-6 sm:py-8 rounded-3xl border-4 border-emerald-500 bg-emerald-400 text-white shadow-lg scale-105 flex flex-col items-center justify-center transition-all';
            feedbackEl.textContent = `🎉 答對了！就是「${currentTarget.char}（${currentTarget.emoji} ${currentTarget.word}）」！`;
            totalBadge.textContent = `⭐ 累計答對 ${totalCorrect} 題`;

            const starEl = starsRow.children[qInStage];
            if (starEl) {
              starEl.classList.remove('opacity-25');
              starEl.classList.add('animate-star-pop');
            }

            qInStage += 1;
            if (qInStage >= STAGE_Q) {
              const clearedLevel = level;
              level += 1;
              nextTimer = setTimeout(() => {
                showStageClearBanner(
                  `第 ${clearedLevel} 關過關！👂`,
                  `累計答對 ${totalCorrect} 題！準備進入第 ${level} 關繼續挑戰…`,
                  () => {
                    qInStage = 0;
                    resetStageStars();
                    loadQuestion();
                  }
                );
              }, 650);
            } else {
              nextTimer = setTimeout(loadQuestion, 900);
            }
          } else {
            streak = 0;
            playGentleBoing();
            app().playZhuyinAudio(picked.char);
            feedbackEl.textContent = `那是「${picked.char}（${picked.emoji} ${picked.word}）」喔！再聽一次看看！`;
            btn.classList.remove('animate-gentle-shake');
            void btn.offsetWidth;
            btn.classList.add('animate-gentle-shake');
          }
        });
      });

      app().playZhuyinAudio(currentTarget.char, speakerIcon);
    }

    stage.querySelector('#listenPlayBtn').addEventListener('click', () => {
      if (currentTarget) app().playZhuyinAudio(currentTarget.char, speakerIcon);
    });

    hintBtn.addEventListener('click', () => {
      if (!currentTarget) return;
      app().playSoftPop();
      hintBtn.classList.add('hidden');
      hintBox.classList.remove('hidden');
      hintBox.textContent = `提示：${currentTarget.emoji} ${currentTarget.word}`;
      app().speakText(currentTarget.word);
    });

    loadQuestion();

    return () => {
      if (nextTimer) clearTimeout(nextTimer);
    };
  }

  /* =========================================================================
   * 匯出生命週期介面
   * ========================================================================= */
  window.ZhuyinGames = {
    init(container) {
      gState.container = container;
      loadGameStats();
      renderHubShell();
    },
    onEnter() {
      gState.isVisible = true;
      startGame(gState.activeGame);
    },
    onLeave() {
      gState.isVisible = false;
      stopCurrentGame();
    },
  };
})();
