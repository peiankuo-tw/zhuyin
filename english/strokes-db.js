/**
 * 台灣國小英語四線三格標準筆順資料庫（A～Z 大寫 26 字 + a～z 小寫 26 字）
 *
 * 座標系統：
 *   x: 0..100（單字中心為 50）
 *   y: 0..100（精準對應英語四線三格）
 *      y1 = 18（頂線 Ascender / 大寫頂部）
 *      y2 = 44（中線 Midline / 小寫頂部）
 *      y3 = 72（紅基線 Baseline）
 *      y4 = 90（底線 Descender）
 */
(function (global) {
  const Y1 = 18; // 頂線
  const Y2 = 44; // 中線
  const Y3 = 72; // 紅基線
  const Y4 = 90; // 底線

  /** 產生平滑橢圓弧線點陣列（角度以度數表示，0° 為右、90° 為下、180° 為左、270° 為上） */
  function arc(cx, cy, rx, ry, startDeg, endDeg, steps = 16) {
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

  /** 產生平滑直線點陣列 */
  function line(x1, y1, x2, y2, steps = 6) {
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

  /** 串接多段路徑並去除相鄰重複點 */
  function join(...segments) {
    const out = [];
    for (const seg of segments) {
      for (const pt of seg) {
        const last = out[out.length - 1];
        if (!last || Math.hypot(pt[0] - last[0], pt[1] - last[1]) > 0.25) {
          out.push(pt);
        }
      }
    }
    return out;
  }

  /** 單筆結構輔助（isDot 用於小寫 i、j 的圓點，輕點即完成） */
  function stroke(points, extra = {}) {
    return { points, isDot: Boolean(extra.isDot) };
  }

  const UPPER_STROKES = {
    A: [
      stroke(line(50, Y1, 24, Y3, 8)),
      stroke(line(50, Y1, 76, Y3, 8)),
      stroke(line(33, 54, 67, 54, 6))
    ],
    B: [
      stroke(line(28, Y1, 28, Y3, 8)),
      stroke(join(line(28, Y1, 52, Y1, 4), arc(52, 31, 18, 13, -90, 90, 14), line(52, Y2, 28, Y2, 4))),
      stroke(join(line(28, Y2, 54, Y2, 4), arc(54, 58, 20, 14, -90, 90, 14), line(54, Y3, 28, Y3, 4)))
    ],
    C: [
      stroke(arc(54, 45, 25, 27, -42, -318, 24))
    ],
    D: [
      stroke(line(28, Y1, 28, Y3, 8)),
      stroke(join(line(28, Y1, 46, Y1, 4), arc(46, 45, 28, 27, -90, 90, 20), line(46, Y3, 28, Y3, 4)))
    ],
    E: [
      stroke(line(30, Y1, 30, Y3, 8)),
      stroke(line(30, Y1, 72, Y1, 6)),
      stroke(line(30, Y2, 66, Y2, 6)),
      stroke(line(30, Y3, 72, Y3, 6))
    ],
    F: [
      stroke(line(30, Y1, 30, Y3, 8)),
      stroke(line(30, Y1, 72, Y1, 6)),
      stroke(line(30, Y2, 66, Y2, 6))
    ],
    G: [
      stroke(join(arc(52, 45, 25, 27, -42, -360, 24))),
      stroke(line(52, 45, 77, 45, 5))
    ],
    H: [
      stroke(line(28, Y1, 28, Y3, 8)),
      stroke(line(72, Y1, 72, Y3, 8)),
      stroke(line(28, Y2, 72, Y2, 6))
    ],
    I: [
      stroke(line(50, Y1, 50, Y3, 8)),
      stroke(line(34, Y1, 66, Y1, 5)),
      stroke(line(34, Y3, 66, Y3, 5))
    ],
    J: [
      stroke(join(line(60, Y1, 60, 56, 6), arc(44, 56, 16, 16, 0, 165, 14))),
      stroke(line(42, Y1, 76, Y1, 5))
    ],
    K: [
      stroke(line(30, Y1, 30, Y3, 8)),
      stroke(line(72, Y1, 30, 48, 7)),
      stroke(line(41, 41, 74, Y3, 7))
    ],
    L: [
      stroke(join(line(30, Y1, 30, Y3, 8), line(30, Y3, 72, Y3, 6)))
    ],
    M: [
      stroke(line(22, Y1, 22, Y3, 8)),
      stroke(line(22, Y1, 50, 56, 7)),
      stroke(line(78, Y1, 50, 56, 7)),
      stroke(line(78, Y1, 78, Y3, 8))
    ],
    N: [
      stroke(line(26, Y1, 26, Y3, 8)),
      stroke(line(26, Y1, 74, Y3, 9)),
      stroke(line(74, Y1, 74, Y3, 8))
    ],
    O: [
      stroke(arc(50, 45, 26, 27, -90, -450, 28))
    ],
    P: [
      stroke(line(30, Y1, 30, Y3, 8)),
      stroke(join(line(30, Y1, 52, Y1, 4), arc(52, 32, 20, 14, -90, 90, 16), line(52, 46, 30, 46, 4)))
    ],
    Q: [
      stroke(arc(50, 45, 26, 27, -90, -450, 28)),
      stroke(line(54, 54, 78, 75, 5))
    ],
    R: [
      stroke(line(29, Y1, 29, Y3, 8)),
      stroke(join(line(29, Y1, 52, Y1, 4), arc(52, 32, 20, 14, -90, 90, 16), line(52, 46, 29, 46, 4))),
      stroke(line(48, 46, 74, Y3, 7))
    ],
    S: [
      stroke(join(
        arc(50, 31.5, 20, 13.5, -35, -270, 16),
        arc(50, 58.5, 21, 13.5, -90, 145, 16)
      ))
    ],
    T: [
      stroke(line(24, Y1, 76, Y1, 7)),
      stroke(line(50, Y1, 50, Y3, 8))
    ],
    U: [
      stroke(join(
        line(28, Y1, 28, 52, 6),
        arc(50, 52, 22, 20, 180, 0, 16),
        line(72, 52, 72, Y1, 6)
      ))
    ],
    V: [
      stroke(join(line(24, Y1, 50, Y3, 8), line(50, Y3, 76, Y1, 8)))
    ],
    W: [
      stroke(join(
        line(18, Y1, 34, Y3, 7),
        line(34, Y3, 50, 34, 6),
        line(50, 34, 66, Y3, 6),
        line(66, Y3, 82, Y1, 7)
      ))
    ],
    X: [
      stroke(line(26, Y1, 74, Y3, 8)),
      stroke(line(74, Y1, 26, Y3, 8))
    ],
    Y: [
      stroke(line(24, Y1, 50, 46, 6)),
      stroke(line(76, Y1, 50, 46, 6)),
      stroke(line(50, 46, 50, Y3, 6))
    ],
    Z: [
      stroke(join(
        line(26, Y1, 74, Y1, 6),
        line(74, Y1, 26, Y3, 9),
        line(26, Y3, 74, Y3, 6)
      ))
    ]
  };

  const LOWER_STROKES = {
    a: [
      stroke(arc(48, 58, 17, 14, -40, -395, 24)),
      stroke(line(65, Y2, 65, Y3, 6))
    ],
    b: [
      stroke(line(34, Y1, 34, Y3, 8)),
      stroke(arc(51, 58, 17, 14, -140, 140, 22))
    ],
    c: [
      stroke(arc(52, 58, 17, 14, -40, -320, 20))
    ],
    d: [
      stroke(arc(49, 58, 17, 14, -40, -395, 24)),
      stroke(line(66, Y1, 66, Y3, 8))
    ],
    e: [
      stroke(join(
        line(34, 58, 67, 58, 6),
        arc(50, 58, 17, 14, 0, -325, 22)
      ))
    ],
    f: [
      stroke(join(arc(58, 28, 12, 10, -25, -180, 12), line(46, 28, 46, Y3, 8))),
      stroke(line(34, Y2, 62, Y2, 5))
    ],
    g: [
      stroke(arc(49, 58, 17, 14, -40, -395, 24)),
      stroke(join(line(66, Y2, 66, 78, 6), arc(50, 78, 16, 12, 0, 155, 14)))
    ],
    h: [
      stroke(line(34, Y1, 34, Y3, 8)),
      stroke(join(arc(50, 55, 16, 11, 180, 360, 14), line(66, 55, 66, Y3, 5)))
    ],
    i: [
      stroke(line(50, Y2, 50, Y3, 6)),
      stroke([[50, 31], [50.4, 31.4]], { isDot: true })
    ],
    j: [
      stroke(join(line(54, Y2, 54, 78, 6), arc(41, 78, 13, 12, 0, 155, 14))),
      stroke([[54, 31], [54.4, 31.4]], { isDot: true })
    ],
    k: [
      stroke(line(34, Y1, 34, Y3, 8)),
      stroke(line(65, Y2, 35, 60, 6)),
      stroke(line(45, 55, 67, Y3, 6))
    ],
    l: [
      stroke(line(50, Y1, 50, Y3, 8))
    ],
    m: [
      stroke(line(24, Y2, 24, Y3, 6)),
      stroke(join(arc(37, 54, 13, 10, 180, 360, 12), line(50, 54, 50, Y3, 5))),
      stroke(join(arc(63, 54, 13, 10, 180, 360, 12), line(76, 54, 76, Y3, 5)))
    ],
    n: [
      stroke(line(34, Y2, 34, Y3, 6)),
      stroke(join(arc(50, 55, 16, 11, 180, 360, 14), line(66, 55, 66, Y3, 5)))
    ],
    o: [
      stroke(arc(50, 58, 17, 14, -90, -450, 24))
    ],
    p: [
      stroke(line(34, Y2, 34, Y4, 8)),
      stroke(arc(51, 58, 17, 14, -140, 140, 22))
    ],
    q: [
      stroke(arc(49, 58, 17, 14, -40, -395, 24)),
      stroke(line(66, Y2, 66, Y4, 8))
    ],
    r: [
      stroke(line(38, Y2, 38, Y3, 6)),
      stroke(arc(53, 56, 15, 12, 180, 315, 12))
    ],
    s: [
      stroke(join(
        arc(50, 51, 14, 7, -30, -270, 14),
        arc(50, 65, 15, 7, -90, 150, 14)
      ))
    ],
    t: [
      stroke(join(line(48, 26, 48, 64, 7), arc(57, 64, 9, 8, 180, 75, 10))),
      stroke(line(35, Y2, 62, Y2, 5))
    ],
    u: [
      stroke(join(line(34, Y2, 34, 60, 5), arc(50, 60, 16, 12, 180, 0, 14))),
      stroke(line(66, Y2, 66, Y3, 6))
    ],
    v: [
      stroke(join(line(33, Y2, 50, Y3, 6), line(50, Y3, 67, Y2, 6)))
    ],
    w: [
      stroke(join(
        line(24, Y2, 36, Y3, 5),
        line(36, Y3, 50, 50, 5),
        line(50, 50, 64, Y3, 5),
        line(64, Y3, 76, Y2, 5)
      ))
    ],
    x: [
      stroke(line(34, Y2, 66, Y3, 6)),
      stroke(line(66, Y2, 34, Y3, 6))
    ],
    y: [
      stroke(line(34, Y2, 50, Y3, 6)),
      stroke(line(66, Y2, 38, Y4, 8))
    ],
    z: [
      stroke(join(
        line(34, Y2, 66, Y2, 5),
        line(66, Y2, 34, Y3, 7),
        line(34, Y3, 66, Y3, 5)
      ))
    ]
  };

  /**
   * 取得指定字母在目前大小寫模式 ('upper' | 'lower' | 'both') 下的畫布正規化筆畫陣列
   * 回傳的座標已對應到畫布像素空間（px），方便直接繪製與筆順判定。
   */
  function getCanvasStrokes(letter, caseMode, canvasW, canvasH) {
    const upperKey = String(letter || 'A').toUpperCase();
    const lowerKey = upperKey.toLowerCase();
    const uList = UPPER_STROKES[upperKey] || [];
    const lList = LOWER_STROKES[lowerKey] || [];

    function mapGroup(list, centerX, scaleX, groupLabel) {
      return list.map((st, idx) => ({
        group: groupLabel,
        groupStrokeIndex: idx,
        isDot: st.isDot,
        points: st.points.map(([x, y]) => ({
          x: centerX + ((x - 50) / 100) * scaleX,
          y: (y / 100) * canvasH
        }))
      }));
    }

    if (caseMode === 'upper') {
      const scaleX = Math.min(canvasH * 0.86, canvasW * 0.72);
      return mapGroup(uList, canvasW * 0.5, scaleX, 'upper');
    }
    if (caseMode === 'lower') {
      const scaleX = Math.min(canvasH * 0.86, canvasW * 0.72);
      return mapGroup(lList, canvasW * 0.5, scaleX, 'lower');
    }
    // 'both': 大寫在左、小寫在右，依序練習
    const scaleX = Math.min(canvasH * 0.74, canvasW * 0.44);
    return [
      ...mapGroup(uList, canvasW * 0.30, scaleX, 'upper'),
      ...mapGroup(lList, canvasW * 0.70, scaleX, 'lower')
    ];
  }

  global.EnglishStrokesDB = {
    LINES: { Y1, Y2, Y3, Y4 },
    UPPER_STROKES,
    LOWER_STROKES,
    getCanvasStrokes
  };
})(typeof window !== 'undefined' ? window : globalThis);
