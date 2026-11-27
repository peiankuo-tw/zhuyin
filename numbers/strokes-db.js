/**
 * 幼稚園中班～低年級「數字與時鐘啟蒙」資料庫
 * 包含：
 *   1. 0～9 標準手寫筆順（支援 0～12 單/雙位數自動排版）
 *   2. 0～12 數與量生活水果/可愛圖示、中英文讀音
 *   3. 一天 24 小時生活作息故事與天空色彩（搭配互動魔法時鐘）
 */
(function (global) {
  function arc(cx, cy, rx, ry, startDeg, endDeg, steps = 18) {
    const pts = [];
    for (let i = 0; i <= steps; i++) {
      const deg = startDeg + ((endDeg - startDeg) * i) / steps;
      const rad = (deg * Math.PI) / 180;
      pts.push([
        Number((cx + Math.cos(rad) * rx).toFixed(2)),
        Number((cy + Math.sin(rad) * ry).toFixed(2))
      ]);
    }
    return pts;
  }

  function line(x1, y1, x2, y2, steps = 7) {
    const pts = [];
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      pts.push([
        Number((x1 + (x2 - x1) * t).toFixed(2)),
        Number((y1 + (y2 - y1) * t).toFixed(2))
      ]);
    }
    return pts;
  }

  function join(...segments) {
    const out = [];
    for (const seg of segments) {
      for (const pt of seg) {
        const last = out[out.length - 1];
        if (!last || Math.hypot(pt[0] - last[0], pt[1] - last[1]) > 0.3) {
          out.push(pt);
        }
      }
    }
    return out;
  }

  // 0～9 單字座標空間：x in 18..82, y in 16..84
  const DIGIT_STROKES = {
    '0': [
      { points: arc(50, 50, 23, 33, -90, -450, 28) }
    ],
    '1': [
      { points: line(50, 17, 50, 83, 10) }
    ],
    '2': [
      { points: join(arc(50, 34, 21, 17, -155, 25, 16), line(69, 41, 28, 83, 9), line(28, 83, 74, 83, 7)) }
    ],
    '3': [
      { points: join(arc(49, 33, 21, 16, -155, 90, 16), arc(50, 66, 22, 17, -90, 165, 18)) }
    ],
    '4': [
      { points: join(line(56, 17, 25, 62, 8), line(25, 62, 76, 62, 8)) },
      { points: line(59, 18, 59, 83, 10) }
    ],
    '5': [
      { points: join(line(32, 18, 30, 47, 6), arc(50, 64, 22, 19, -135, 155, 20)) },
      { points: line(32, 18, 70, 18, 6) }
    ],
    '6': [
      { points: join(arc(53, 50, 25, 33, -55, -180, 14), arc(50, 65, 22, 18, 180, -180, 22)) }
    ],
    '7': [
      { points: join(line(26, 18, 74, 18, 7), line(74, 18, 42, 83, 10)) }
    ],
    '8': [
      { points: join(
        arc(50, 33, 19, 16, -35, -270, 16),
        arc(50, 66, 22, 17, -90, 270, 22),
        arc(50, 33, 19, 16, 90, -35, 10)
      ) }
    ],
    '9': [
      { points: join(arc(49, 35, 21, 18, -15, -375, 22), line(70, 35, 58, 83, 9)) }
    ]
  };

  const NUMBERS_LIST = [
    { num: 0,  zh: '零', en: 'Zero',   emoji: '🫧', itemName: '個泡泡（空空的）', tip: '0 代表一個也沒有，像圓圓的蛋！' },
    { num: 1,  zh: '一', en: 'One',    emoji: '🍎', itemName: '顆蘋果', tip: '1 像直直的鉛筆，從上往下畫！' },
    { num: 2,  zh: '二', en: 'Two',    emoji: '🐥', itemName: '隻小鴨', tip: '2 像可愛的小鴨子，注意彎彎向右再往左斜下喔！' },
    { num: 3,  zh: '三', en: 'Three',  emoji: '🍓', itemName: '顆草莓', tip: '3 像兩隻小耳朵，開口朝左邊喔！' },
    { num: 4,  zh: '四', en: 'Four',   emoji: '🚗', itemName: '台小車', tip: '4 像一面小旗子，先寫左邊折線再畫直直的旗桿！' },
    { num: 5,  zh: '五', en: 'Five',   emoji: '⭐', itemName: '顆星星', tip: '5 像掛鉤戴帽子，先畫豎彎大肚子再戴上屋頂帽！' },
    { num: 6,  zh: '六', en: 'Six',    emoji: '🎈', itemName: '顆氣球', tip: '6 像吹泡泡的哨子，從上面滑下來畫個圓肚子！' },
    { num: 7,  zh: '七', en: 'Seven',  emoji: '🦋', itemName: '隻蝴蝶', tip: '7 像小拐杖，橫線往右再斜斜往下！' },
    { num: 8,  zh: '八', en: 'Eight',  emoji: '🍩', itemName: '個甜甜圈', tip: '8 像雪人也像麻花，一筆畫完兩個圈！' },
    { num: 9,  zh: '九', en: 'Nine',   emoji: '🌸', itemName: '朵小花', tip: '9 像長尾巴的氣球，先畫上面的圓再往下拉！' },
    { num: 10, zh: '十', en: 'Ten',    emoji: '🍪', itemName: '片餅乾', tip: '10 是 1 和 0 的好朋友，十格陣剛好裝滿滿！' },
    { num: 11, zh: '十一', en: 'Eleven', emoji: '🦖', itemName: '隻小恐龍', tip: '11 是兩個 1 並排站好，像一雙筷子！' },
    { num: 12, zh: '十二', en: 'Twelve', emoji: '🕰️', itemName: '點鐘（時鐘最大數字）', tip: '12 住在時鐘的最上面，是鐘面最大的數字喔！' }
  ];

  // 一天 24 小時（0..23）生活作息與天空色彩主題（適合幼稚園中班）
  const ROUTINE_BY_HOUR = {
    0:  { period: '半夜', emoji: '🌙', title: '呼呼大睡中', desc: '半夜 12 點，星星月亮守護小朋友睡覺。', sky: ['#0F172A', '#1E1B4B'], textLight: true },
    1:  { period: '凌晨', emoji: '💤', title: '甜甜美夢中', desc: '凌晨 1 點，大家都在做甜甜的夢。', sky: ['#0F172A', '#1E1B4B'], textLight: true },
    2:  { period: '凌晨', emoji: '✨', title: '安靜的夜晚', desc: '凌晨 2 點，夜空閃閃發亮。', sky: ['#0F172A', '#1E1B4B'], textLight: true },
    3:  { period: '凌晨', emoji: '🦉', title: '貓頭鷹值班', desc: '凌晨 3 點，只有貓頭鷹還沒睡。', sky: ['#1E1B4B', '#312E81'], textLight: true },
    4:  { period: '凌晨', emoji: '🌌', title: '天快亮囉', desc: '凌晨 4 點，太陽公公準備起床了。', sky: ['#1E1B4B', '#3B2F63'], textLight: true },
    5:  { period: '清晨', emoji: '🌅', title: '清晨微光', desc: '清晨 5 點，天空慢慢變成暖暖的粉橘色。', sky: ['#FDBA74', '#FEF08A'], textLight: false },
    6:  { period: '早上', emoji: '🐓', title: '太陽起床囉', desc: '早上 6 點，小鳥吱吱喳喳唱歌了！', sky: ['#FDE68A', '#BAE6FD'], textLight: false },
    7:  { period: '早上', emoji: '🪥', title: '起床刷牙吃早餐', desc: '早上 7 點，刷刷牙、吃飽飽最有精神！', sky: ['#BAE6FD', '#FEF9C3'], textLight: false },
    8:  { period: '早上', emoji: '🎒', title: '開心上幼稚園', desc: '早上 8 點，揹起書包跟老師同學說早安！', sky: ['#7DD3FC', '#E0F2FE'], textLight: false },
    9:  { period: '早上', emoji: '🎨', title: '畫畫唱遊時間', desc: '早上 9 點，動動小手畫畫、聽繪本故事！', sky: ['#38BDF8', '#E0F2FE'], textLight: false },
    10: { period: '早上', emoji: '🍎', title: '點心與戶外玩耍', desc: '早上 10 點，吃點心、去操場溜滑梯！', sky: ['#38BDF8', '#BAE6FD'], textLight: false },
    11: { period: '上午', emoji: '🧼', title: '洗手準備吃飯', desc: '上午 11 點，把小手洗乾淨準備吃午餐囉！', sky: ['#60A5FA', '#DBEAFE'], textLight: false },
    12: { period: '中午', emoji: '🍱', title: '香噴噴午餐時間', desc: '中午 12 點，短針長針一起指著 12，吃午餐囉！', sky: ['#38BDF8', '#FEF08A'], textLight: false },
    13: { period: '下午', emoji: '😴', title: '午睡充電時間', desc: '下午 1 點，蓋好小被子休息一下長高高！', sky: ['#93C5FD', '#E0F2FE'], textLight: false },
    14: { period: '下午', emoji: '🧸', title: '起床收棉被', desc: '下午 2 點，睡飽起床疊棉被、喝口水！', sky: ['#7DD3FC', '#FEF3C7'], textLight: false },
    15: { period: '下午', emoji: '🧁', title: '下午點心時間', desc: '下午 3 點，吃個小點心補充體力！', sky: ['#FDE68A', '#BAE6FD'], textLight: false },
    16: { period: '下午', emoji: '🛝', title: '放學回家囉', desc: '下午 4 點，爸爸媽媽來接你放學去公園玩！', sky: ['#FDBA74', '#FED7AA'], textLight: false },
    17: { period: '傍晚', emoji: '🌇', title: '夕陽西下回家', desc: '傍晚 5 點，天空橘紅橘紅的，準備回家洗手！', sky: ['#FB923C', '#FDE68A'], textLight: false },
    18: { period: '晚上', emoji: '🍽️', title: '全家吃晚餐', desc: '晚上 6 點，跟爸爸媽媽一起吃美味晚餐！', sky: ['#6366F1', '#F97316'], textLight: true },
    19: { period: '晚上', emoji: '🧩', title: '親子遊戲時間', desc: '晚上 7 點，玩積木、收玩具、練練小教室！', sky: ['#312E81', '#6366F1'], textLight: true },
    20: { period: '晚上', emoji: '🛁', title: '洗澡聽床邊故事', desc: '晚上 8 點，洗香香、聽一本好聽的故事書！', sky: ['#1E1B4B', '#4338CA'], textLight: true },
    21: { period: '晚上', emoji: '🌙', title: '晚安睡覺囉', desc: '晚上 9 點，關燈蓋被子，祝你有個好夢！', sky: ['#0F172A', '#312E81'], textLight: true },
    22: { period: '晚上', emoji: '⭐', title: '進入夢鄉', desc: '晚上 10 點，小朋友都乖乖睡著囉！', sky: ['#0F172A', '#1E1B4B'], textLight: true },
    23: { period: '深夜', emoji: '🌠', title: '星星眨眼睛', desc: '晚上 11 點，晚安世界！', sky: ['#0F172A', '#1E1B4B'], textLight: true }
  };

  function getRoutineForHour(hour24) {
    const h = ((Math.floor(hour24) % 24) + 24) % 24;
    return ROUTINE_BY_HOUR[h];
  }

  /**
   * 取得 0～12 在畫布像素空間內的標準筆順陣列
   * @param {number} num 0..12
   * @param {number} w 畫布寬度
   * @param {number} h 畫布高度
   */
  function getNumberCanvasStrokes(num, w, h) {
    const str = String(num);
    const digits = str.split('');
    const result = [];

    if (digits.length === 1) {
      const list = DIGIT_STROKES[digits[0]] || [];
      const size = Math.min(w, h);
      const offsetX = (w - size) / 2;
      const offsetY = (h - size) / 2;
      list.forEach((st) => {
        result.push({
          points: st.points.map(([x, y]) => ({
            x: offsetX + (x / 100) * size,
            y: offsetY + (y / 100) * size
          }))
        });
      });
      return result;
    }

    // 雙位數（10、11、12）：左右對稱並排
    const slotW = w * 0.44;
    const slotH = h * 0.92;
    const centers = [w * 0.30, w * 0.70];
    digits.forEach((d, dIdx) => {
      const list = DIGIT_STROKES[d] || [];
      const cx = centers[dIdx];
      const scale = Math.min(slotW, slotH);
      const offsetY = (h - scale) / 2;
      list.forEach((st) => {
        result.push({
          points: st.points.map(([x, y]) => ({
            x: cx + ((x - 50) / 100) * scale,
            y: offsetY + (y / 100) * scale
          }))
        });
      });
    });
    return result;
  }

  global.NumbersDB = {
    DIGIT_STROKES,
    NUMBERS_LIST,
    ROUTINE_BY_HOUR,
    getRoutineForHour,
    getNumberCanvasStrokes
  };
})(typeof window !== 'undefined' ? window : globalThis);
