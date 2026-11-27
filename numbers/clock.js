/**
 * 互動魔法時鐘（支援拖曳指針、點數字跳轉、整點/半點吸附、晝夜天空與生活作息）
 * ＋ 看得見的時間派（Time Timer 彩色扇形倒數計時器）
 */
(function (global) {
  function app() { return global.NumbersApp; }
  function db() { return global.NumbersDB; }

  /** 共用可愛時鐘繪製函式（也供遊樂園遊戲使用） */
  function drawFriendlyClock(ctx, cx, cy, r, hour12, minute, options = {}) {
    const {
      missingNumbers = null,   // Set<number>（拼圖遊戲隱藏數字）
      highlightSlot = null,    // number（目前閃動問號的位置）
      showHands = true,
      highlightHour = null,
      pulsePhase = 0
    } = options;

    ctx.save();
    // 鐘面外框陰影與底座
    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = '#A78BFA';
    ctx.lineWidth = Math.max(6, r * 0.065);
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // 內圈柔彩環
    ctx.strokeStyle = '#EDE9FE';
    ctx.lineWidth = Math.max(3, r * 0.03);
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.91, 0, Math.PI * 2);
    ctx.stroke();

    // 60 個刻度（整點刻度加粗）
    for (let i = 0; i < 60; i++) {
      const ang = (i * 6 - 90) * (Math.PI / 180);
      const isHour = i % 5 === 0;
      const rOuter = r * 0.88;
      const rInner = isHour ? r * 0.80 : r * 0.84;
      ctx.strokeStyle = isHour ? '#7C3AED' : '#CBD5E1';
      ctx.lineWidth = isHour ? 3 : 1.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(ang) * rInner, cy + Math.sin(ang) * rInner);
      ctx.lineTo(cx + Math.cos(ang) * rOuter, cy + Math.sin(ang) * rOuter);
      ctx.stroke();
    }

    // 1～12 數字
    const numRadius = r * 0.67;
    for (let n = 1; n <= 12; n++) {
      const ang = (n * 30 - 90) * (Math.PI / 180);
      const nx = cx + Math.cos(ang) * numRadius;
      const ny = cy + Math.sin(ang) * numRadius;

      if (missingNumbers && missingNumbers.has(n)) {
        const isTarget = highlightSlot === n;
        const slotR = r * 0.145 * (isTarget ? (1 + Math.sin(pulsePhase) * 0.1) : 1);
        ctx.fillStyle = isTarget ? '#FEF3C7' : '#F1F5F9';
        ctx.strokeStyle = isTarget ? '#F97316' : '#CBD5E1';
        ctx.lineWidth = isTarget ? 3 : 2;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.arc(nx, ny, slotR, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.setLineDash([]);

        if (isTarget) {
          ctx.fillStyle = '#EA580C';
          ctx.font = `900 ${Math.round(r * 0.16)}px "Fredoka", sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('?', nx, ny + 1);
        }
        continue;
      }

      const isCurrentH = highlightHour === n;
      if (isCurrentH) {
        ctx.fillStyle = '#FFE4E6';
        ctx.beginPath();
        ctx.arc(nx, ny, r * 0.14, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = isCurrentH ? '#E11D48' : (n === 12 || n === 3 || n === 6 || n === 9 ? '#5B21B6' : '#334155');
      ctx.font = `700 ${Math.round(r * 0.175)}px "Fredoka", "Zen Maru Gothic", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(n), nx, ny + 1);
    }

    // 指針
    if (showHands) {
      const h12 = ((hour12 % 12) + 12) % 12;
      const hourAngle = ((h12 + minute / 60) * 30 - 90) * (Math.PI / 180);
      const minAngle = (minute * 6 - 90) * (Math.PI / 180);

      // 長針（分針 - 藍色）
      ctx.strokeStyle = '#0EA5E9';
      ctx.lineWidth = Math.max(5, r * 0.048);
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(minAngle) * r * 0.72, cy + Math.sin(minAngle) * r * 0.72);
      ctx.stroke();

      // 短針（時針 - 草莓紅）
      ctx.strokeStyle = '#F43F5E';
      ctx.lineWidth = Math.max(8, r * 0.075);
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(hourAngle) * r * 0.46, cy + Math.sin(hourAngle) * r * 0.46);
      ctx.stroke();

      // 中心圓蓋
      ctx.fillStyle = '#F59E0B';
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(cx, cy, Math.max(7, r * 0.065), 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    ctx.restore();
  }

  /**
   * 掛載「🕐 互動魔法時鐘」分頁
   */
  function mountMagicClock(container) {
    let totalMinutes = 8 * 60; // 預設早上 8:00 上幼稚園
    let snapMode = 'half';     // 'hour' | 'half' | 'five'
    let isDragging = false;
    let lastDragAngle = null;

    container.innerHTML = `
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        <!-- 左側：天空場景＋超大互動時鐘 -->
        <div id="clockSkyCard" class="lg:col-span-7 rounded-[2rem] p-4 sm:p-6 shadow-lg border-4 border-violet-200 transition-all duration-500">
          <div class="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div class="flex items-center gap-2">
              <span id="clockSkyIcon" class="text-2xl sm:text-3xl">☀️</span>
              <span id="clockPeriodBadge" class="px-3 py-1 rounded-full text-xs sm:text-sm font-black bg-white/90 text-violet-900 shadow-sm">早上</span>
            </div>

            <!-- 吸附模式切換 -->
            <div class="inline-flex rounded-2xl bg-white/90 p-1 gap-1 shadow-sm border border-violet-200">
              <button data-snap="hour" type="button" class="snap-btn px-2.5 py-1 rounded-xl text-xs font-bold text-violet-800 hover:bg-violet-100">整點</button>
              <button data-snap="half" type="button" class="snap-btn px-2.5 py-1 rounded-xl text-xs font-black bg-violet-500 text-white shadow-sm">整點＋半點</button>
              <button data-snap="five" type="button" class="snap-btn px-2.5 py-1 rounded-xl text-xs font-bold text-violet-800 hover:bg-violet-100">每 5 分</button>
            </div>
          </div>

          <div class="relative mx-auto w-full max-w-[350px] aspect-square">
            <canvas id="magicClockCanvas" class="w-full h-full block cursor-grab active:cursor-grabbing" style="touch-action:none;"></canvas>
          </div>

          <div class="mt-3 flex flex-wrap items-center justify-center gap-2 text-xs font-bold">
            <span class="px-3 py-1 rounded-full bg-white/90 text-rose-600 shadow-sm">🔴 短針＝幾點（時針）</span>
            <span class="px-3 py-1 rounded-full bg-white/90 text-sky-600 shadow-sm">🔵 長針＝幾分（分針）</span>
            <span class="px-3 py-1 rounded-full bg-white/90 text-violet-800 shadow-sm">👆 可直接點數字或拖曳指針</span>
          </div>
        </div>

        <!-- 右側：電子鐘顯示＋作息故事卡＋快速情境按鈕 -->
        <div class="lg:col-span-5 space-y-4">
          <div class="bg-white rounded-[2rem] p-5 shadow-lg border-4 border-violet-200 space-y-4">
            <div class="flex items-center justify-between gap-2">
              <div>
                <div class="text-xs font-bold text-violet-600">現在時間</div>
                <div id="clockDigitalTime" class="text-4xl sm:text-5xl font-black font-abc text-violet-950 tracking-wider">08:00</div>
                <div id="clockSpokenText" class="text-sm sm:text-base font-black text-rose-600 mt-0.5">早上 8 點整</div>
              </div>
              <button id="clockSpeakBtn" type="button"
                class="btn-3d w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-400 hover:from-amber-500 hover:to-orange-500 text-white text-2xl shadow-md border-b-4 border-orange-600 flex items-center justify-center shrink-0">
                🔊
              </button>
            </div>

            <!-- 快捷加減按鈕 -->
            <div class="grid grid-cols-4 gap-2">
              <button id="clockMinusHour" type="button" class="btn-3d py-2 rounded-xl bg-violet-100 hover:bg-violet-200 text-violet-900 font-black text-xs sm:text-sm">-1 小時</button>
              <button id="clockPlusHour" type="button" class="btn-3d py-2 rounded-xl bg-violet-100 hover:bg-violet-200 text-violet-900 font-black text-xs sm:text-sm">+1 小時</button>
              <button id="clockToggleHalf" type="button" class="btn-3d py-2 rounded-xl bg-sky-100 hover:bg-sky-200 text-sky-900 font-black text-xs sm:text-sm">切換半點</button>
              <button id="clockToggleAmPm" type="button" class="btn-3d py-2 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 font-black text-xs sm:text-sm">早 / 晚</button>
            </div>

            <!-- 生活作息故事 -->
            <div class="bg-gradient-to-br from-violet-50 to-fuchsia-50 rounded-2xl p-4 border-2 border-violet-200 flex items-center gap-3.5">
              <div id="routineEmoji" class="w-16 h-16 rounded-2xl bg-white border-2 border-violet-200 flex items-center justify-center text-4xl shrink-0 shadow-sm">🎒</div>
              <div>
                <div id="routineTitle" class="text-lg font-black text-violet-950">開心上幼稚園</div>
                <p id="routineDesc" class="text-xs sm:text-sm text-slate-600 font-bold mt-0.5 leading-relaxed">早上 8 點，揹起書包跟老師同學說早安！</p>
              </div>
            </div>
          </div>

          <!-- 一天的作息快捷卡 -->
          <div class="bg-white rounded-[2rem] p-4 sm:p-5 shadow-lg border-4 border-amber-200">
            <h3 class="text-sm sm:text-base font-black text-amber-900 mb-3">📖 點一點，看一天的小故事：</h3>
            <div id="routineQuickBtns" class="grid grid-cols-2 gap-2">
              ${[
                { h: 7, m: 0, label: '🪥 7:00 起床刷牙' },
                { h: 8, m: 0, label: '🎒 8:00 上幼稚園' },
                { h: 12, m: 0, label: '🍱 12:00 吃午餐' },
                { h: 13, m: 0, label: '😴 1:00 午睡時間' },
                { h: 16, m: 0, label: '🛝 4:00 放學玩耍' },
                { h: 18, m: 0, label: '🍽️ 6:00 吃晚餐' },
                { h: 20, m: 0, label: '🛁 8:00 洗澡聽故事' },
                { h: 21, m: 0, label: '🌙 9:00 晚安睡覺' }
              ].map((r) => `
                <button type="button" data-jump-h="${r.h}" data-jump-m="${r.m}"
                  class="btn-3d py-2 px-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 border-2 border-amber-200 text-amber-950 text-xs font-black text-left">
                  ${r.label}
                </button>`).join('')}
            </div>
          </div>
        </div>
      </div>
    `;

    const canvas = container.querySelector('#magicClockCanvas');
    const ctx = canvas.getContext('2d');
    const skyCard = container.querySelector('#clockSkyCard');
    const skyIcon = container.querySelector('#clockSkyIcon');
    const periodBadge = container.querySelector('#clockPeriodBadge');
    const digitalEl = container.querySelector('#clockDigitalTime');
    const spokenEl = container.querySelector('#clockSpokenText');
    const routineEmoji = container.querySelector('#routineEmoji');
    const routineTitle = container.querySelector('#routineTitle');
    const routineDesc = container.querySelector('#routineDesc');

    let size = 320;
    function resize() {
      const rect = canvas.getBoundingClientRect();
      if (rect.width < 20) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      size = Math.round(rect.width);
      canvas.width = Math.round(size * dpr);
      canvas.height = Math.round(size * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      render();
    }

    function getTimeParts() {
      const norm = ((Math.round(totalMinutes) % 1440) + 1440) % 1440;
      const h24 = Math.floor(norm / 60);
      const min = norm % 60;
      const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
      return { h24, h12, min };
    }

    function formatSpoken({ h24, h12, min }) {
      const routine = db().getRoutineForHour(h24);
      const minText = min === 0 ? '整' : min === 30 ? '半' : `${min} 分`;
      return `${routine.period} ${h12} 點${minText}`;
    }

    function render() {
      const parts = getTimeParts();
      const routine = db().getRoutineForHour(parts.h24);

      skyCard.style.background = `linear-gradient(155deg, ${routine.sky[0]}, ${routine.sky[1]})`;
      skyIcon.textContent = parts.h24 >= 6 && parts.h24 < 18 ? '☀️' : '🌙';
      periodBadge.textContent = routine.period;

      const pad = (n) => String(n).padStart(2, '0');
      digitalEl.textContent = `${pad(parts.h12)}:${pad(parts.min)}`;
      spokenEl.textContent = formatSpoken(parts);
      routineEmoji.textContent = routine.emoji;
      routineTitle.textContent = routine.title;
      routineDesc.textContent = routine.desc;

      ctx.clearRect(0, 0, size, size);
      drawFriendlyClock(ctx, size / 2, size / 2, size * 0.45, parts.h12, parts.min, {
        highlightHour: parts.h12
      });
    }

    function speakCurrentTime() {
      const parts = getTimeParts();
      const routine = db().getRoutineForHour(parts.h24);
      app().speakZh(`現在是${formatSpoken(parts)}，${routine.title}`);
    }

    function snapMinutes(rawMin) {
      if (snapMode === 'hour') return Math.round(rawMin / 60) * 60;
      if (snapMode === 'half') return Math.round(rawMin / 30) * 30;
      return Math.round(rawMin / 5) * 5;
    }

    function getPointerAngle(e) {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      const dist = Math.hypot(x, y);
      let deg = (Math.atan2(y, x) * 180) / Math.PI + 90;
      if (deg < 0) deg += 360;
      return { deg, dist, radius: rect.width * 0.45 };
    }

    canvas.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      canvas.setPointerCapture(e.pointerId);
      const { deg, dist, radius } = getPointerAngle(e);
      // 若直接點擊在數字區且為整點模式，跳到該整點
      if (snapMode === 'hour' && dist > radius * 0.35) {
        const clickedHour = Math.round(deg / 30) % 12;
        const { h24 } = getTimeParts();
        const isPm = h24 >= 12;
        const nextH24 = (isPm ? 12 : 0) + clickedHour;
        totalMinutes = nextH24 * 60;
        app().playSoftPop();
        render();
        return;
      }
      isDragging = true;
      lastDragAngle = deg;
    });

    canvas.addEventListener('pointermove', (e) => {
      if (!isDragging) return;
      e.preventDefault();
      const { deg } = getPointerAngle(e);
      let delta = deg - lastDragAngle;
      if (delta > 180) delta -= 360;
      if (delta < -180) delta += 360;
      totalMinutes = (totalMinutes + delta / 6 + 1440) % 1440;
      lastDragAngle = deg;
      render();
    });

    function endDrag() {
      if (!isDragging) return;
      isDragging = false;
      totalMinutes = (snapMinutes(totalMinutes) + 1440) % 1440;
      app().playSoftPop();
      render();
    }
    canvas.addEventListener('pointerup', endDrag);
    canvas.addEventListener('pointercancel', endDrag);

    // 按鈕事件
    container.querySelectorAll('.snap-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        app().playSoftPop();
        snapMode = btn.dataset.snap;
        totalMinutes = (snapMinutes(totalMinutes) + 1440) % 1440;
        container.querySelectorAll('.snap-btn').forEach((b) => {
          const active = b.dataset.snap === snapMode;
          b.className = active
            ? 'snap-btn px-2.5 py-1 rounded-xl text-xs font-black bg-violet-500 text-white shadow-sm'
            : 'snap-btn px-2.5 py-1 rounded-xl text-xs font-bold text-violet-800 hover:bg-violet-100';
        });
        render();
      });
    });

    container.querySelector('#clockSpeakBtn').addEventListener('click', speakCurrentTime);
    container.querySelector('#clockMinusHour').addEventListener('click', () => { app().playSoftPop(); totalMinutes = (totalMinutes - 60 + 1440) % 1440; render(); });
    container.querySelector('#clockPlusHour').addEventListener('click', () => { app().playSoftPop(); totalMinutes = (totalMinutes + 60) % 1440; render(); });
    container.querySelector('#clockToggleHalf').addEventListener('click', () => {
      app().playSoftPop();
      const { h24, min } = getTimeParts();
      totalMinutes = h24 * 60 + (min === 30 ? 0 : 30);
      render();
    });
    container.querySelector('#clockToggleAmPm').addEventListener('click', () => {
      app().playSoftPop();
      totalMinutes = (totalMinutes + 720) % 1440;
      render();
    });

    container.querySelectorAll('[data-jump-h]').forEach((btn) => {
      btn.addEventListener('click', () => {
        app().playSoftPop();
        totalMinutes = Number(btn.dataset.jumpH) * 60 + Number(btn.dataset.jumpM);
        render();
        speakCurrentTime();
      });
    });

    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => resize()) : null;
    if (ro) ro.observe(canvas);
    requestAnimationFrame(resize);

    return {
      resize,
      destroy() { if (ro) ro.disconnect(); }
    };
  }

  /**
   * 掛載「⏱️ 看得見的時間派（Time Timer 彩色扇形倒數）」分頁
   */
  function mountTimePie(container) {
    let totalSeconds = 180; // 預設 3 分鐘
    let remainSeconds = 180;
    let running = false;
    let timerId = null;
    let activityLabel = '🧸 收玩具時間';

    container.innerHTML = `
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        <div class="lg:col-span-7 bg-white rounded-[2rem] p-5 sm:p-6 shadow-lg border-4 border-rose-200 text-center space-y-4">
          <div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-sm font-black">
            <span id="pieActivityBadge">${activityLabel}</span>
          </div>

          <div class="relative mx-auto w-full max-w-[330px] aspect-square">
            <canvas id="timePieCanvas" class="w-full h-full block"></canvas>
          </div>

          <div id="pieCountdownText" class="text-4xl sm:text-5xl font-black font-abc text-rose-600 tracking-wider">03:00</div>
          <p id="pieStatusText" class="text-xs sm:text-sm font-bold text-slate-500">紅色的時間派會慢慢變小，全部消失就代表時間到囉！</p>

          <div class="flex flex-wrap justify-center gap-3 pt-1">
            <button id="pieStartPauseBtn" type="button"
              class="btn-3d px-6 py-3 rounded-2xl bg-gradient-to-r from-rose-400 to-pink-500 hover:from-rose-500 hover:to-pink-600 text-white border-b-4 border-rose-700 font-black text-base shadow-md">
              ▶️ 開始倒數
            </button>
            <button id="pieResetBtn" type="button"
              class="btn-3d px-5 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 border-b-4 border-slate-300 font-black text-base">
              🔄 重設
            </button>
          </div>
        </div>

        <div class="lg:col-span-5 bg-white rounded-[2rem] p-5 shadow-lg border-4 border-amber-200 space-y-4">
          <h3 class="text-base sm:text-lg font-black text-amber-900">⏱️ 選擇生活計時情境</h3>
          <p class="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
            中班小朋友還看不懂抽象的「還有 3 分鐘」，用會縮小的紅色扇形讓孩子「用眼睛看見時間」，刷牙、收玩具超好用！
          </p>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            ${[
              { sec: 30,  label: '⚡ 體驗 30 秒', desc: '馬上感受扇形縮小' },
              { sec: 60,  label: '🧼 洗手 1 分鐘', desc: '搓搓泡泡洗乾淨' },
              { sec: 120, label: '🪥 刷牙 2 分鐘', desc: '上下左右刷亮亮' },
              { sec: 180, label: '🧸 收玩具 3 分鐘', desc: '玩具排隊回家囉' },
              { sec: 300, label: '🍪 點心 5 分鐘', desc: '慢慢吃細嚼慢嚥' },
              { sec: 600, label: '📖 繪本 10 分鐘', desc: '親子共讀好時光' }
            ].map((p) => `
              <button type="button" data-pie-sec="${p.sec}" data-pie-label="${p.label}"
                class="pie-preset-btn btn-3d p-3 rounded-2xl bg-amber-50 hover:bg-amber-100 border-2 border-amber-200 text-left">
                <div class="text-sm font-black text-amber-950">${p.label}</div>
                <div class="text-[11px] font-bold text-amber-700/80 mt-0.5">${p.desc}</div>
              </button>`).join('')}
          </div>
        </div>
      </div>
    `;

    const canvas = container.querySelector('#timePieCanvas');
    const ctx = canvas.getContext('2d');
    const countdownEl = container.querySelector('#pieCountdownText');
    const statusEl = container.querySelector('#pieStatusText');
    const activityEl = container.querySelector('#pieActivityBadge');
    const startPauseBtn = container.querySelector('#pieStartPauseBtn');

    let size = 300;
    function resize() {
      const rect = canvas.getBoundingClientRect();
      if (rect.width < 20) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      size = Math.round(rect.width);
      canvas.width = Math.round(size * dpr);
      canvas.height = Math.round(size * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      drawPie();
    }

    function drawPie() {
      const cx = size / 2;
      const cy = size / 2;
      const r = size * 0.44;
      ctx.clearRect(0, 0, size, size);

      // 白色底盤與外框
      ctx.fillStyle = '#FFFFFF';
      ctx.strokeStyle = '#FDA4AF';
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // 剩餘比例扇形（從 12 點鐘方向逆時針縮小）
      const ratio = totalSeconds > 0 ? Math.max(0, remainSeconds / totalSeconds) : 0;
      if (ratio > 0) {
        const startAng = -Math.PI / 2;
        const endAng = startAng + Math.PI * 2 * ratio;
        ctx.fillStyle = ratio < 0.2 ? '#F97316' : '#FB7185';
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, r * 0.86, startAng, endAng, false);
        ctx.closePath();
        ctx.fill();
      }

      // 12 等分刻度
      for (let i = 0; i < 12; i++) {
        const ang = (i * 30 - 90) * (Math.PI / 180);
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = i % 3 === 0 ? 3 : 1.5;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(ang) * r * 0.88, cy + Math.sin(ang) * r * 0.88);
        ctx.lineTo(cx + Math.cos(ang) * r * 0.96, cy + Math.sin(ang) * r * 0.96);
        ctx.stroke();
      }

      // 中心圓心
      ctx.fillStyle = '#FFFFFF';
      ctx.strokeStyle = '#E11D48';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(cx, cy, r * 0.14, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      const mm = String(Math.floor(remainSeconds / 60)).padStart(2, '0');
      const ss = String(Math.ceil(remainSeconds % 60 === 0 && remainSeconds > 0 ? 0 : remainSeconds % 60)).padStart(2, '0');
      countdownEl.textContent = `${mm}:${ss}`;
    }

    function stopTimer() {
      running = false;
      if (timerId) { clearInterval(timerId); timerId = null; }
      startPauseBtn.textContent = '▶️ 開始倒數';
    }

    startPauseBtn.addEventListener('click', () => {
      app().playSoftPop();
      if (running) {
        stopTimer();
        statusEl.textContent = '已暫停，按「開始倒數」可以繼續喔！';
        return;
      }
      if (remainSeconds <= 0) remainSeconds = totalSeconds;
      running = true;
      startPauseBtn.textContent = '⏸️ 暫停';
      statusEl.textContent = '時間派正在慢慢變小中，加油喔！';
      timerId = setInterval(() => {
        remainSeconds = Math.max(0, remainSeconds - 1);
        drawPie();
        if (remainSeconds <= 0) {
          stopTimer();
          statusEl.textContent = '🎉 時間到囉！你表現得超棒的！';
          app().playRewardSound();
          app().launchConfetti();
          app().speakZh('時間到囉！你做得好棒！');
        }
      }, 1000);
    });

    container.querySelector('#pieResetBtn').addEventListener('click', () => {
      app().playSoftPop();
      stopTimer();
      remainSeconds = totalSeconds;
      statusEl.textContent = '已重設，按「開始倒數」就可以開始囉！';
      drawPie();
    });

    container.querySelectorAll('.pie-preset-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        app().playSoftPop();
        stopTimer();
        totalSeconds = Number(btn.dataset.pieSec);
        remainSeconds = totalSeconds;
        activityLabel = btn.dataset.pieLabel;
        activityEl.textContent = activityLabel;
        statusEl.textContent = '按「開始倒數」，一起看著時間派慢慢變小吧！';
        drawPie();
      });
    });

    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => resize()) : null;
    if (ro) ro.observe(canvas);
    requestAnimationFrame(resize);

    return {
      resize,
      destroy() { stopTimer(); if (ro) ro.disconnect(); }
    };
  }

  global.NumbersClock = {
    drawFriendlyClock,
    mountMagicClock,
    mountTimePie
  };
})(typeof window !== 'undefined' ? window : globalThis);
