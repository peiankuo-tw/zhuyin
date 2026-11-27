/**
 * 幼稚園中班「數字與時鐘遊樂園」4 款互動小遊戲（無限續關）
 * 1. 🕰️ 幫數字回家（時鐘拼圖）
 * 2. 🎯 撥出正確時間（整點／半點生活挑戰）
 * 3. 🍎 點一點數一數（1～12 數感對應）
 * 4. 🐊 大嘴鱷魚比大小（1～12）
 */
(function (global) {
  function app() { return global.NumbersApp; }
  function db() { return global.NumbersDB; }
  function clockMod() { return global.NumbersClock; }

  const GAMES_META = [
    { id: 'clock-puzzle', icon: '🕰️', title: '幫數字回家', desc: '把缺掉的 1～12 放回時鐘正確位置', color: 'from-violet-400 to-fuchsia-500' },
    { id: 'set-time',     icon: '🎯', title: '撥出正確時間', desc: '看生活故事，幫忙撥出正確幾點鐘', color: 'from-sky-400 to-indigo-500' },
    { id: 'count-items',  icon: '🍎', title: '點一點數一數', desc: '點一點水果或小恐龍，數出共有幾個', color: 'from-amber-400 to-orange-500' },
    { id: 'compare-croc', icon: '🐊', title: '鱷魚比大小', desc: '大嘴鱷魚最愛吃比較多的一邊！', color: 'from-emerald-400 to-teal-500' }
  ];

  let rootEl = null;
  let activeCleanup = null;

  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function clearActiveGame() {
    if (typeof activeCleanup === 'function') {
      activeCleanup();
      activeCleanup = null;
    }
  }

  function renderLobby() {
    clearActiveGame();
    rootEl.innerHTML = `
      <div class="bg-white rounded-[2rem] p-5 sm:p-6 shadow-lg border-4 border-fuchsia-200 space-y-5">
        <div class="text-center">
          <h2 class="text-2xl sm:text-3xl font-black text-violet-950">🎮 數字與時鐘遊樂園</h2>
          <p class="text-sm text-slate-600 font-bold mt-1">挑一款喜歡的小遊戲，邊玩邊認識數字與時間！</p>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          ${GAMES_META.map((g) => `
            <button type="button" data-game-id="${g.id}"
              class="btn-3d group text-left p-5 rounded-3xl bg-gradient-to-br ${g.color} text-white shadow-md border-b-4 border-black/15 flex items-center gap-4">
              <div class="w-16 h-16 rounded-2xl bg-white/25 backdrop-blur-sm flex items-center justify-center text-4xl shrink-0 group-hover:scale-110 transition-transform">
                ${g.icon}
              </div>
              <div>
                <div class="text-xl font-black">${g.title}</div>
                <div class="text-xs sm:text-sm text-white/90 font-bold mt-1">${g.desc}</div>
              </div>
            </button>`).join('')}
        </div>
      </div>
    `;

    rootEl.querySelectorAll('[data-game-id]').forEach((btn) => {
      btn.addEventListener('click', () => {
        app().playSoftPop();
        launchGame(btn.dataset.gameId);
      });
    });
  }

  function launchGame(gameId) {
    clearActiveGame();
    const meta = GAMES_META.find((g) => g.id === gameId);
    rootEl.innerHTML = `
      <div class="bg-white rounded-[2rem] p-4 sm:p-6 shadow-lg border-4 border-violet-200 space-y-4">
        <div class="flex flex-wrap items-center justify-between gap-2 pb-3 border-b-2 border-violet-100">
          <button id="backToLobbyBtn" type="button"
            class="btn-3d px-3.5 py-2 rounded-2xl bg-violet-100 hover:bg-violet-200 text-violet-900 font-black text-xs sm:text-sm">
            ⬅️ 回遊戲大廳
          </button>
          <div class="text-lg sm:text-xl font-black text-violet-950">${meta.icon} ${meta.title}</div>
          <span id="gameScoreBadge" class="px-3 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 font-black text-xs sm:text-sm">⭐ 得分 0</span>
        </div>
        <div id="gameStage"></div>
      </div>
    `;

    rootEl.querySelector('#backToLobbyBtn').addEventListener('click', () => {
      app().playSoftPop();
      renderLobby();
    });

    const stage = rootEl.querySelector('#gameStage');
    const scoreBadge = rootEl.querySelector('#gameScoreBadge');

    if (gameId === 'clock-puzzle') activeCleanup = mountClockPuzzle(stage, scoreBadge);
    else if (gameId === 'set-time') activeCleanup = mountSetTimeGame(stage, scoreBadge);
    else if (gameId === 'count-items') activeCleanup = mountCountGame(stage, scoreBadge);
    else if (gameId === 'compare-croc') activeCleanup = mountCompareGame(stage, scoreBadge);
  }

  /* =========================================================================
   * 遊戲 1：🕰️ 幫數字回家（時鐘拼圖）
   * ========================================================================= */
  function mountClockPuzzle(stage, scoreBadge) {
    let score = 0;
    let round = 1;
    let missingSet = new Set();
    let missingQueue = [];
    let currentTarget = 12;
    let rafId = null;

    stage.innerHTML = `
      <div class="text-center space-y-4">
        <div id="puzzlePrompt" class="px-4 py-2 rounded-2xl bg-amber-50 border-2 border-amber-200 text-amber-950 font-black text-sm sm:text-base">
          看閃閃發亮的「？」位置，應該住著哪一個數字呢？
        </div>
        <div class="mx-auto w-full max-w-[320px] aspect-square">
          <canvas id="puzzleClockCanvas" class="w-full h-full block"></canvas>
        </div>
        <div id="puzzleChoices" class="flex flex-wrap justify-center gap-2.5"></div>
      </div>
    `;

    const canvas = stage.querySelector('#puzzleClockCanvas');
    const ctx = canvas.getContext('2d');
    const promptEl = stage.querySelector('#puzzlePrompt');
    const choicesEl = stage.querySelector('#puzzleChoices');

    let size = 300;
    function resize() {
      const rect = canvas.getBoundingClientRect();
      if (rect.width < 20) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      size = Math.round(rect.width);
      canvas.width = Math.round(size * dpr);
      canvas.height = Math.round(size * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function startRound() {
      const count = Math.min(6, 3 + Math.floor((round - 1) / 2));
      const picked = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]).slice(0, count).sort((a, b) => a - b);
      missingSet = new Set(picked);
      missingQueue = [...picked];
      currentTarget = missingQueue[0];
      promptEl.textContent = `第 ${round} 關：幫忙把不見的數字送回「？」的家！`;
      renderChoices();
    }

    function renderChoices() {
      const pool = Array.from(missingSet);
      // 補齊至少 4 個選項
      const all = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
      for (const n of all) {
        if (pool.length >= Math.max(4, missingSet.size)) break;
        if (!pool.includes(n)) pool.push(n);
      }
      const opts = shuffle(pool);
      choicesEl.innerHTML = opts
        .map((n) => `
          <button type="button" data-pick="${n}"
            class="btn-3d w-16 h-16 rounded-2xl bg-violet-100 hover:bg-violet-200 border-b-4 border-violet-400 font-abc text-3xl font-black text-violet-950 shadow-sm">
            ${n}
          </button>`)
        .join('');
    }

    choicesEl.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-pick]');
      if (!btn) return;
      const pick = Number(btn.dataset.pick);
      if (pick === currentTarget) {
        app().playStrokeDing(score);
        app().speakZh(`答對了，這裡是 ${pick}`);
        missingSet.delete(pick);
        missingQueue.shift();
        score++;
        scoreBadge.textContent = `⭐ 得分 ${score}`;

        if (missingQueue.length === 0) {
          app().playRewardSound();
          app().launchConfetti();
          promptEl.textContent = `🎉 太棒了！時鐘上的數字全部回家囉！準備進入第 ${round + 1} 關…`;
          round++;
          setTimeout(startRound, 1400);
        } else {
          currentTarget = missingQueue[0];
          renderChoices();
        }
      } else {
        app().playSoftPop();
        btn.classList.add('animate-gentle-shake', 'bg-rose-100');
        promptEl.textContent = `差一點點！數數看前一個數字後面是誰喔？`;
        setTimeout(() => btn.classList.remove('animate-gentle-shake', 'bg-rose-100'), 500);
      }
    });

    function loop(ts) {
      ctx.clearRect(0, 0, size, size);
      clockMod().drawFriendlyClock(ctx, size / 2, size / 2, size * 0.45, 12, 0, {
        missingNumbers: missingSet,
        highlightSlot: currentTarget,
        showHands: false,
        pulsePhase: (ts || 0) * 0.006
      });
      rafId = requestAnimationFrame(loop);
    }

    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => resize()) : null;
    if (ro) ro.observe(canvas);
    requestAnimationFrame(() => { resize(); startRound(); rafId = requestAnimationFrame(loop); });

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      if (ro) ro.disconnect();
    };
  }

  /* =========================================================================
   * 遊戲 2：🎯 撥出正確時間（生活作息撥時鐘）
   * ========================================================================= */
  function mountSetTimeGame(stage, scoreBadge) {
    let score = 0;
    let includeHalf = false;
    let targetH = 8;
    let targetM = 0;
    let userH = 12;
    let userM = 0;

    const storyPrompts = [
      { h: 7,  text: '早上 7 點起床刷牙囉！', emoji: '🪥' },
      { h: 8,  text: '早上 8 點開心上幼稚園！', emoji: '🎒' },
      { h: 9,  text: '早上 9 點畫畫聽故事！', emoji: '🎨' },
      { h: 10, text: '早上 10 點吃水果點心！', emoji: '🍎' },
      { h: 12, text: '中午 12 點吃香噴噴午餐！', emoji: '🍱' },
      { h: 1,  text: '下午 1 點蓋被子午睡！', emoji: '😴' },
      { h: 3,  text: '下午 3 點吃小點心囉！', emoji: '🧁' },
      { h: 4,  text: '下午 4 點放學去公園玩！', emoji: '🛝' },
      { h: 6,  text: '晚上 6 點全家吃晚餐！', emoji: '🍽️' },
      { h: 8,  text: '晚上 8 點洗香香聽故事！', emoji: '🛁' },
      { h: 9,  text: '晚上 9 點晚安睡覺囉！', emoji: '🌙' }
    ];

    stage.innerHTML = `
      <div class="text-center space-y-4">
        <div class="flex flex-wrap items-center justify-center gap-2">
          <button id="setModeWholeBtn" type="button" class="px-3 py-1.5 rounded-xl text-xs font-black bg-sky-500 text-white shadow-sm">整點練習</button>
          <button id="setModeHalfBtn" type="button" class="px-3 py-1.5 rounded-xl text-xs font-bold bg-sky-50 text-sky-900 border border-sky-200">進階：含半點</button>
        </div>

        <div id="setTimePromptCard" class="inline-flex items-center gap-3 px-5 py-3 rounded-3xl bg-sky-50 border-2 border-sky-200 shadow-sm">
          <span id="setTimeEmoji" class="text-4xl">🎒</span>
          <div class="text-left">
            <div id="setTimeTitle" class="text-lg sm:text-xl font-black text-sky-950">請撥出 8 點整</div>
            <div id="setTimeStory" class="text-xs sm:text-sm font-bold text-sky-700">早上 8 點開心上幼稚園！</div>
          </div>
          <button id="setTimeSpeakBtn" type="button" class="btn-3d w-10 h-10 rounded-xl bg-white border border-sky-200 text-xl">🔊</button>
        </div>

        <div class="mx-auto w-full max-w-[300px] aspect-square">
          <canvas id="setTimeCanvas" class="w-full h-full block cursor-pointer" style="touch-action:none;"></canvas>
        </div>

        <div class="text-sm font-black text-violet-800">你目前撥的時間：<span id="userClockReadout" class="text-xl text-rose-600 font-abc">12:00</span></div>

        <div class="flex flex-wrap justify-center gap-2">
          <button id="uMinusH" type="button" class="btn-3d px-3.5 py-2 rounded-xl bg-violet-100 hover:bg-violet-200 text-violet-900 font-black text-sm">⬅️ 往前 1 小時</button>
          <button id="uPlusH" type="button" class="btn-3d px-3.5 py-2 rounded-xl bg-violet-100 hover:bg-violet-200 text-violet-900 font-black text-sm">往後 1 小時 ➡️</button>
          <button id="uToggleHalf" type="button" class="hidden btn-3d px-3.5 py-2 rounded-xl bg-sky-100 hover:bg-sky-200 text-sky-900 font-black text-sm">🌓 切換整點/半點</button>
          <button id="uCheckBtn" type="button" class="btn-3d px-6 py-2 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-500 text-white border-b-4 border-emerald-700 font-black text-base shadow-md">✓ 檢查答案</button>
        </div>
        <div id="setTimeFeedback" class="text-sm font-black text-amber-700 min-h-[24px]">點鐘面上的數字，或用下方按鈕撥指針喔！</div>
      </div>
    `;

    const canvas = stage.querySelector('#setTimeCanvas');
    const ctx = canvas.getContext('2d');
    const emojiEl = stage.querySelector('#setTimeEmoji');
    const titleEl = stage.querySelector('#setTimeTitle');
    const storyEl = stage.querySelector('#setTimeStory');
    const readoutEl = stage.querySelector('#userClockReadout');
    const feedbackEl = stage.querySelector('#setTimeFeedback');
    const toggleHalfBtn = stage.querySelector('#uToggleHalf');

    let size = 280;
    function resize() {
      const rect = canvas.getBoundingClientRect();
      if (rect.width < 20) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      size = Math.round(rect.width);
      canvas.width = Math.round(size * dpr);
      canvas.height = Math.round(size * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw();
    }

    function draw() {
      ctx.clearRect(0, 0, size, size);
      clockMod().drawFriendlyClock(ctx, size / 2, size / 2, size * 0.45, userH, userM, { highlightHour: userH });
      readoutEl.textContent = `${userH}:${userM === 0 ? '00' : '30'}`;
    }

    function nextQuestion() {
      const pick = storyPrompts[Math.floor(Math.random() * storyPrompts.length)];
      targetH = pick.h;
      targetM = includeHalf && Math.random() < 0.5 ? 30 : 0;
      userH = ((targetH + 3) % 12) || 12;
      userM = 0;

      const label = `${targetH} 點${targetM === 30 ? '半' : '整'}`;
      emojiEl.textContent = pick.emoji;
      titleEl.textContent = `請撥出「${label}」`;
      storyEl.textContent = targetM === 30 ? `短針指在 ${targetH} 過一點、長針指著 6 就是 ${label} 喔！` : pick.text;
      feedbackEl.textContent = '直接點時鐘上的數字，或是按下方按鈕調整！';
      app().speakZh(`請把時鐘撥到 ${label}`);
      draw();
    }

    canvas.addEventListener('pointerdown', (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      let deg = (Math.atan2(y, x) * 180) / Math.PI + 90;
      if (deg < 0) deg += 360;
      const clicked = Math.round(deg / 30) % 12;
      userH = clicked === 0 ? 12 : clicked;
      app().playSoftPop();
      draw();
    });

    stage.querySelector('#uMinusH').addEventListener('click', () => { app().playSoftPop(); userH = userH === 1 ? 12 : userH - 1; draw(); });
    stage.querySelector('#uPlusH').addEventListener('click', () => { app().playSoftPop(); userH = userH === 12 ? 1 : userH + 1; draw(); });
    toggleHalfBtn.addEventListener('click', () => { app().playSoftPop(); userM = userM === 0 ? 30 : 0; draw(); });
    stage.querySelector('#setTimeSpeakBtn').addEventListener('click', () => app().speakZh(`請把時鐘撥到 ${targetH} 點${targetM === 30 ? '半' : '整'}`));

    stage.querySelector('#uCheckBtn').addEventListener('click', () => {
      if (userH === targetH && userM === targetM) {
        score++;
        scoreBadge.textContent = `⭐ 得分 ${score}`;
        app().playRewardSound();
        app().launchConfetti();
        feedbackEl.textContent = `🎉 答對了！這就是 ${targetH} 點${targetM === 30 ? '半' : '整'}！`;
        app().speakZh(`答對了！好棒喔！`);
        setTimeout(nextQuestion, 1300);
      } else {
        app().playSoftPop();
        const hint = userH !== targetH
          ? `再看看紅色的短針，要指向數字 ${targetH} 喔！`
          : `短針對了！再把藍色的長針切到${targetM === 30 ? '半點（6）' : '整點（12）'}！`;
        feedbackEl.textContent = `💡 ${hint}`;
      }
    });

    const wholeBtn = stage.querySelector('#setModeWholeBtn');
    const halfBtn = stage.querySelector('#setModeHalfBtn');
    wholeBtn.addEventListener('click', () => {
      includeHalf = false;
      toggleHalfBtn.classList.add('hidden');
      wholeBtn.className = 'px-3 py-1.5 rounded-xl text-xs font-black bg-sky-500 text-white shadow-sm';
      halfBtn.className = 'px-3 py-1.5 rounded-xl text-xs font-bold bg-sky-50 text-sky-900 border border-sky-200';
      nextQuestion();
    });
    halfBtn.addEventListener('click', () => {
      includeHalf = true;
      toggleHalfBtn.classList.remove('hidden');
      halfBtn.className = 'px-3 py-1.5 rounded-xl text-xs font-black bg-sky-500 text-white shadow-sm';
      wholeBtn.className = 'px-3 py-1.5 rounded-xl text-xs font-bold bg-sky-50 text-sky-900 border border-sky-200';
      nextQuestion();
    });

    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => resize()) : null;
    if (ro) ro.observe(canvas);
    requestAnimationFrame(() => { resize(); nextQuestion(); });

    return () => { if (ro) ro.disconnect(); };
  }

  /* =========================================================================
   * 遊戲 3：🍎 點一點數一數（1～12 數感對應）
   * ========================================================================= */
  function mountCountGame(stage, scoreBadge) {
    let score = 0;
    let answer = 5;
    let countedOrder = [];

    const themes = [
      { emoji: '🍎', name: '顆蘋果' },
      { emoji: '🍓', name: '顆草莓' },
      { emoji: '🦖', name: '隻小恐龍' },
      { emoji: '⭐', name: '顆星星' },
      { emoji: '🐥', name: '隻小鴨' },
      { emoji: '🍩', name: '個甜甜圈' }
    ];

    stage.innerHTML = `
      <div class="text-center space-y-4">
        <div id="countPrompt" class="px-4 py-2 rounded-2xl bg-amber-50 border-2 border-amber-200 text-amber-950 font-black text-base">
          點一點每個圖案一起數，共有幾個呢？
        </div>
        <div id="countItemsBox" class="max-w-lg mx-auto bg-amber-50/60 rounded-3xl p-5 border-2 border-amber-200 grid grid-cols-5 gap-3 justify-items-center"></div>
        <div id="countChoices" class="flex flex-wrap justify-center gap-3"></div>
      </div>
    `;

    const promptEl = stage.querySelector('#countPrompt');
    const itemsBox = stage.querySelector('#countItemsBox');
    const choicesEl = stage.querySelector('#countChoices');

    function nextRound() {
      const theme = themes[Math.floor(Math.random() * themes.length)];
      answer = 1 + Math.floor(Math.random() * 12);
      countedOrder = [];
      promptEl.textContent = `數數看，畫面上一共有幾${theme.name}？（可以點圖案幫你數喔！）`;

      itemsBox.innerHTML = Array.from({ length: answer }, (_, i) => `
        <button type="button" data-item-idx="${i}"
          class="relative btn-3d w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white border-2 border-amber-200 text-3xl sm:text-4xl flex items-center justify-center shadow-sm">
          <span>${theme.emoji}</span>
          <span class="count-tag hidden absolute -top-2 -right-2 w-6 h-6 rounded-full bg-orange-500 text-white text-xs font-black flex items-center justify-center shadow"></span>
        </button>`).join('');

      const distractors = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].filter((n) => n !== answer)).slice(0, 3);
      const opts = shuffle([answer, ...distractors]);
      choicesEl.innerHTML = opts.map((n) => `
        <button type="button" data-ans="${n}"
          class="btn-3d w-20 h-16 rounded-2xl bg-orange-100 hover:bg-orange-200 border-b-4 border-orange-400 font-abc text-3xl font-black text-orange-950 shadow-sm">
          ${n}
        </button>`).join('');
    }

    itemsBox.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-item-idx]');
      if (!btn) return;
      const idx = Number(btn.dataset.itemIdx);
      if (countedOrder.includes(idx)) return;
      countedOrder.push(idx);
      const num = countedOrder.length;
      btn.classList.add('ring-4', 'ring-amber-300', 'bg-amber-50');
      const tag = btn.querySelector('.count-tag');
      tag.textContent = String(num);
      tag.classList.remove('hidden');
      app().playStrokeDing(num - 1);
      app().speakZh(String(num));
    });

    choicesEl.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-ans]');
      if (!btn) return;
      const pick = Number(btn.dataset.ans);
      if (pick === answer) {
        score++;
        scoreBadge.textContent = `⭐ 得分 ${score}`;
        app().playRewardSound();
        app().launchConfetti();
        promptEl.textContent = `🎉 答對了！一共有 ${answer} 個，你數得超準！`;
        app().speakZh(`答對了！一共有 ${answer} 個！`);
        setTimeout(nextRound, 1250);
      } else {
        app().playSoftPop();
        btn.classList.add('animate-gentle-shake', 'bg-rose-100');
        promptEl.textContent = '再點上面的圖案，一個一個慢慢數數看喔！';
        setTimeout(() => btn.classList.remove('animate-gentle-shake', 'bg-rose-100'), 500);
      }
    });

    nextRound();
    return () => {};
  }

  /* =========================================================================
   * 遊戲 4：🐊 大嘴鱷魚比大小（1～12）
   * ========================================================================= */
  function mountCompareGame(stage, scoreBadge) {
    let score = 0;
    let leftNum = 3;
    let rightNum = 5;

    const emojis = ['🍓', '🍪', '⭐', '🍎', '🎈', '🐥'];

    stage.innerHTML = `
      <div class="text-center space-y-5">
        <div id="crocPrompt" class="px-4 py-2 rounded-2xl bg-emerald-50 border-2 border-emerald-200 text-emerald-950 font-black text-base">
          🐊 大嘴鱷魚嘴巴永遠朝向「比較多」的那一邊！哪一邊比較多呢？
        </div>

        <div class="grid grid-cols-11 gap-2 items-center max-w-2xl mx-auto">
          <div class="col-span-5 bg-rose-50 rounded-3xl p-4 border-4 border-rose-200">
            <div id="crocLeftNum" class="font-abc text-5xl font-black text-rose-600 mb-2">3</div>
            <div id="crocLeftIcons" class="flex flex-wrap justify-center gap-1 text-2xl min-h-[68px]"></div>
          </div>
          <div class="col-span-1 text-3xl sm:text-4xl font-black text-emerald-600" id="crocMidSign">?</div>
          <div class="col-span-5 bg-sky-50 rounded-3xl p-4 border-4 border-sky-200">
            <div id="crocRightNum" class="font-abc text-5xl font-black text-sky-600 mb-2">5</div>
            <div id="crocRightIcons" class="flex flex-wrap justify-center gap-1 text-2xl min-h-[68px]"></div>
          </div>
        </div>

        <div class="flex flex-wrap justify-center gap-3">
          <button type="button" data-cmp=">" class="btn-3d px-6 py-3 rounded-2xl bg-rose-100 hover:bg-rose-200 border-b-4 border-rose-400 text-rose-900 font-black text-xl">
            &gt; 左邊比較多
          </button>
          <button type="button" data-cmp="=" class="btn-3d px-6 py-3 rounded-2xl bg-amber-100 hover:bg-amber-200 border-b-4 border-amber-400 text-amber-900 font-black text-xl">
            = 一樣多
          </button>
          <button type="button" data-cmp="<" class="btn-3d px-6 py-3 rounded-2xl bg-sky-100 hover:bg-sky-200 border-b-4 border-sky-400 text-sky-900 font-black text-xl">
            &lt; 右邊比較多
          </button>
        </div>
      </div>
    `;

    const promptEl = stage.querySelector('#crocPrompt');
    const leftNumEl = stage.querySelector('#crocLeftNum');
    const rightNumEl = stage.querySelector('#crocRightNum');
    const leftIcons = stage.querySelector('#crocLeftIcons');
    const rightIcons = stage.querySelector('#crocRightIcons');
    const midSign = stage.querySelector('#crocMidSign');

    function nextRound() {
      const icon = emojis[Math.floor(Math.random() * emojis.length)];
      leftNum = 1 + Math.floor(Math.random() * 12);
      rightNum = Math.random() < 0.18 ? leftNum : (1 + Math.floor(Math.random() * 12));
      leftNumEl.textContent = String(leftNum);
      rightNumEl.textContent = String(rightNum);
      leftIcons.innerHTML = Array.from({ length: leftNum }, () => `<span>${icon}</span>`).join('');
      rightIcons.innerHTML = Array.from({ length: rightNum }, () => `<span>${icon}</span>`).join('');
      midSign.textContent = '?';
      promptEl.textContent = '🐊 哪一邊比較多呢？還是兩邊一樣多？';
    }

    stage.querySelectorAll('[data-cmp]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const expected = leftNum > rightNum ? '>' : leftNum < rightNum ? '<' : '=';
        if (btn.dataset.cmp === expected) {
          score++;
          scoreBadge.textContent = `⭐ 得分 ${score}`;
          midSign.textContent = expected;
          app().playRewardSound();
          app().launchConfetti();
          const msg = expected === '=' ? `${leftNum} 和 ${rightNum} 一樣多！` : expected === '>' ? `${leftNum} 比 ${rightNum} 大！` : `${rightNum} 比 ${leftNum} 大！`;
          promptEl.textContent = `🎉 答對了！${msg}`;
          app().speakZh(`答對了！${msg}`);
          setTimeout(nextRound, 1250);
        } else {
          app().playSoftPop();
          btn.classList.add('animate-gentle-shake');
          promptEl.textContent = '再數數看兩邊的圖案，看看哪一邊比較多喔！';
          setTimeout(() => btn.classList.remove('animate-gentle-shake'), 450);
        }
      });
    });

    nextRound();
    return () => {};
  }

  global.NumbersGames = {
    init(el) {
      rootEl = el;
      renderLobby();
    },
    onEnter() {
      if (rootEl) renderLobby();
    },
    onLeave() {
      clearActiveGame();
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
