/**
 * 國小生字互動描寫與台灣教育部筆順動畫畫布
 * 支援：九宮格 / 十字格 / 米字格、2048×2048 教育部向量筆順動畫、單步筆順、標楷體降級描紅、觸控筆與彩虹筆。
 */

const MOE_COORD_SIZE = 2048;

export class HanziCanvas {
  /**
   * @param {HTMLCanvasElement} canvasEl
   * @param {{ onDrawChange?: () => void, onStepChange?: (current: number, total: number) => void }} options
   */
  constructor(canvasEl, options = {}) {
    this.canvas = canvasEl;
    this.ctx = canvasEl.getContext('2d');
    this.onDrawChange = options.onDrawChange || (() => {});
    this.onStepChange = options.onStepChange || (() => {});

    this.char = '';
    this.strokeData = null; // Array<{ outline, track }> | null
    this.gridType = 'jiugong'; // 'jiugong' | 'shizi' | 'mizi'
    this.showGuide = true;
    this.brushColor = '#2563EB';
    this.brushWidth = 14;

    // 手寫筆跡（以 0~1 正規化座標儲存，resize 不會跑位）
    this.userStrokes = [];
    this.activeStroke = null;
    this.isDrawing = false;
    this.rainbowHue = 0;

    // 筆順動畫與單步狀態
    this.animFrameId = null;
    this.isAnimating = false;
    this.animStrokeIndex = -1;
    this.animStrokeProgress = 0;
    this.stepIndex = -1; // -1 表示非單步模式；0..N-1 表示停在第 stepIndex 筆

    this.logicalSize = 360;
    this._bindEvents();
    this.resize();
  }

  _bindEvents() {
    this.canvas.addEventListener('pointerdown', (e) => this._onPointerDown(e));
    this.canvas.addEventListener('pointermove', (e) => this._onPointerMove(e));
    const endHandler = (e) => this._onPointerUp(e);
    this.canvas.addEventListener('pointerup', endHandler);
    this.canvas.addEventListener('pointercancel', endHandler);
    this.canvas.addEventListener('pointerleave', endHandler);

    this._resizeObserver = new ResizeObserver(() => this.resize());
    if (this.canvas.parentElement) {
      this._resizeObserver.observe(this.canvas.parentElement);
    }
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    const size = Math.max(240, Math.round(rect.width || 360));
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.logicalSize = size;
    this.canvas.width = Math.round(size * dpr);
    this.canvas.height = Math.round(size * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.render();
  }

  setCharacter(char, strokeData) {
    this.stopAnimation();
    this.char = char || '';
    this.strokeData = Array.isArray(strokeData) && strokeData.length > 0 ? strokeData : null;
    this.userStrokes = [];
    this.activeStroke = null;
    this.stepIndex = -1;
    this.onStepChange(0, this.strokeData ? this.strokeData.length : 0);
    this.onDrawChange();
    this.render();
  }

  setGridType(type) {
    if (['jiugong', 'shizi', 'mizi'].includes(type)) {
      this.gridType = type;
      this.render();
    }
  }

  setShowGuide(show) {
    this.showGuide = Boolean(show);
    this.render();
  }

  setBrushColor(color) {
    this.brushColor = color;
  }

  setBrushWidth(width) {
    this.brushWidth = Math.max(4, Math.min(32, Number(width) || 14));
  }

  hasDrawing() {
    return this.userStrokes.length > 0;
  }

  undo() {
    if (this.userStrokes.length === 0) return;
    this.userStrokes.pop();
    this.onDrawChange();
    this.render();
  }

  clearDrawing() {
    this.userStrokes = [];
    this.activeStroke = null;
    this.onDrawChange();
    this.render();
  }

  stopAnimation() {
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    this.isAnimating = false;
    this.animStrokeIndex = -1;
    this.animStrokeProgress = 0;
  }

  resetStepMode() {
    this.stopAnimation();
    this.stepIndex = -1;
    this.onStepChange(0, this.strokeData ? this.strokeData.length : 0);
    this.render();
  }

  stepNextStroke() {
    if (!this.strokeData || this.strokeData.length === 0) return false;
    this.stopAnimation();
    this.stepIndex = (this.stepIndex + 1) % this.strokeData.length;
    this.onStepChange(this.stepIndex + 1, this.strokeData.length);
    this.render();
    return true;
  }

  /**
   * 播放台灣教育部標準筆順動畫
   * @param {'slow' | 'normal'} speed
   */
  playStrokeAnimation(speed = 'normal') {
    if (!this.strokeData || this.strokeData.length === 0) return false;
    this.stopAnimation();
    this.stepIndex = -1;
    this.isAnimating = true;
    this.animStrokeIndex = 0;
    this.animStrokeProgress = 0;

    const strokeDurationMs = speed === 'slow' ? 900 : 520;
    const pauseBetweenMs = speed === 'slow' ? 260 : 140;
    let strokeStartTime = performance.now();

    const tick = (now) => {
      if (!this.isAnimating) return;
      const elapsed = now - strokeStartTime;
      const totalDuration = strokeDurationMs + pauseBetweenMs;

      if (elapsed >= totalDuration) {
        this.animStrokeIndex++;
        if (this.animStrokeIndex >= this.strokeData.length) {
          this.stopAnimation();
          this.onStepChange(this.strokeData.length, this.strokeData.length);
          this.render();
          return;
        }
        strokeStartTime = now;
        this.animStrokeProgress = 0;
      } else {
        this.animStrokeProgress = Math.min(1, elapsed / strokeDurationMs);
      }

      this.onStepChange(this.animStrokeIndex + 1, this.strokeData.length);
      this.render();
      this.animFrameId = requestAnimationFrame(tick);
    };

    this.animFrameId = requestAnimationFrame(tick);
    return true;
  }

  // =========================================================================
  // Pointer 手寫事件
  // =========================================================================

  _getNormalizedPoint(e) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)),
      y: Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height))
    };
  }

  _onPointerDown(e) {
    if (e.button !== undefined && e.button !== 0 && e.pointerType === 'mouse') return;
    e.preventDefault();
    if (this.isAnimating) {
      this.stopAnimation();
    }
    this.isDrawing = true;
    try {
      this.canvas.setPointerCapture(e.pointerId);
    } catch {
      // ignore
    }
    const pt = this._getNormalizedPoint(e);
    this.activeStroke = {
      color: this.brushColor,
      width: this.brushWidth,
      points: [{ ...pt, hue: this.rainbowHue }]
    };
    this.userStrokes.push(this.activeStroke);
    this.onDrawChange();
    this.render();
  }

  _onPointerMove(e) {
    if (!this.isDrawing || !this.activeStroke) return;
    e.preventDefault();
    const pt = this._getNormalizedPoint(e);
    const prev = this.activeStroke.points[this.activeStroke.points.length - 1];
    const dist = Math.hypot(pt.x - prev.x, pt.y - prev.y);
    if (dist < 0.002) return;
    this.rainbowHue = (this.rainbowHue + 5) % 360;
    this.activeStroke.points.push({ ...pt, hue: this.rainbowHue });
    this.render();
  }

  _onPointerUp(e) {
    if (!this.isDrawing) return;
    this.isDrawing = false;
    this.activeStroke = null;
    try {
      this.canvas.releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  }

  // =========================================================================
  // 繪製流程
  // =========================================================================

  render() {
    const ctx = this.ctx;
    const size = this.logicalSize;
    ctx.clearRect(0, 0, size, size);

    // 1. 畫紙底色
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, size, size);

    // 2. 格線（九宮格 / 十字格 / 米字格）
    this._drawGrid(ctx, size);

    // 3. 底字範本 / 筆順動畫 / 單步提示
    this._drawCharacterGuide(ctx, size);

    // 4. 使用者手寫筆跡
    this._drawUserStrokes(ctx, size);
  }

  _drawGrid(ctx, size) {
    ctx.save();
    // 外框
    ctx.strokeStyle = '#FCA5A5';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(1.5, 1.5, size - 3, size - 3);

    // 內部虛線
    ctx.strokeStyle = '#FECACA';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 6]);

    if (this.gridType === 'jiugong') {
      const third = size / 3;
      const twoThird = (size * 2) / 3;
      ctx.beginPath();
      ctx.moveTo(third, 0); ctx.lineTo(third, size);
      ctx.moveTo(twoThird, 0); ctx.lineTo(twoThird, size);
      ctx.moveTo(0, third); ctx.lineTo(size, third);
      ctx.moveTo(0, twoThird); ctx.lineTo(size, twoThird);
      ctx.stroke();
    } else {
      const half = size / 2;
      ctx.beginPath();
      ctx.moveTo(half, 0); ctx.lineTo(half, size);
      ctx.moveTo(0, half); ctx.lineTo(size, half);
      if (this.gridType === 'mizi') {
        ctx.moveTo(0, 0); ctx.lineTo(size, size);
        ctx.moveTo(size, 0); ctx.lineTo(0, size);
      }
      ctx.stroke();
    }
    ctx.restore();
  }

  _buildMoeStrokePath(ctx, outline) {
    ctx.beginPath();
    for (const cmd of outline) {
      if (cmd.type === 'M') {
        ctx.moveTo(cmd.x, cmd.y);
      } else if (cmd.type === 'L') {
        ctx.lineTo(cmd.x, cmd.y);
      } else if (cmd.type === 'Q' && cmd.begin && cmd.end) {
        ctx.quadraticCurveTo(cmd.begin.x, cmd.begin.y, cmd.end.x, cmd.end.y);
      } else if (cmd.type === 'C' && cmd.begin && cmd.mid && cmd.end) {
        ctx.bezierCurveTo(cmd.begin.x, cmd.begin.y, cmd.mid.x, cmd.mid.y, cmd.end.x, cmd.end.y);
      }
    }
    ctx.closePath();
  }

  _drawCharacterGuide(ctx, size) {
    if (!this.char) return;

    // 沒有教育部筆順資料時，以淡色標楷體降級繪製
    if (!this.strokeData) {
      if (!this.showGuide) return;
      ctx.save();
      ctx.fillStyle = 'rgba(225, 29, 72, 0.16)';
      ctx.font = `${Math.round(size * 0.78)}px "DFKai-SB", "BiauKai", "標楷體", "LXGW WenKai TC", serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(this.char, size / 2, size / 2 + size * 0.04);
      ctx.restore();
      return;
    }

    const padding = size * 0.07;
    const scale = (size - padding * 2) / MOE_COORD_SIZE;

    ctx.save();
    ctx.translate(padding, padding);
    ctx.scale(scale, scale);

    // 1. 完整淡色描紅底字（若開啟 showGuide，或在動畫／單步中作為底稿）
    if (this.showGuide || this.isAnimating || this.stepIndex >= 0) {
      ctx.fillStyle = 'rgba(225, 29, 72, 0.15)';
      for (const stroke of this.strokeData) {
        this._buildMoeStrokePath(ctx, stroke.outline);
        ctx.fill();
      }
    }

    // 2. 動畫模式：已寫完的筆畫＋正在寫的筆畫
    if (this.isAnimating && this.animStrokeIndex >= 0) {
      // 已完成的筆畫
      ctx.fillStyle = 'rgba(234, 88, 12, 0.65)';
      for (let i = 0; i < this.animStrokeIndex; i++) {
        this._buildMoeStrokePath(ctx, this.strokeData[i].outline);
        ctx.fill();
      }

      // 正在書寫中的筆畫（利用 outline clip + track 漸進繪製）
      const active = this.strokeData[this.animStrokeIndex];
      if (active) {
        this._drawAnimatedStroke(ctx, active, this.animStrokeProgress, '#EA580C');
      }
    }

    // 3. 單步模式：已走過筆畫＋當前高亮筆畫＋起點標記與方向箭頭
    if (!this.isAnimating && this.stepIndex >= 0) {
      ctx.fillStyle = 'rgba(100, 116, 139, 0.45)';
      for (let i = 0; i < this.stepIndex; i++) {
        this._buildMoeStrokePath(ctx, this.strokeData[i].outline);
        ctx.fill();
      }

      const current = this.strokeData[this.stepIndex];
      if (current) {
        ctx.fillStyle = 'rgba(234, 88, 12, 0.85)';
        this._buildMoeStrokePath(ctx, current.outline);
        ctx.fill();
        this._drawTrackHint(ctx, current.track, this.stepIndex + 1);
      }
    }

    ctx.restore();
  }

  _drawAnimatedStroke(ctx, stroke, progress, color) {
    const track = Array.isArray(stroke.track) ? stroke.track : [];
    if (track.length < 2) {
      ctx.save();
      ctx.fillStyle = color;
      this._buildMoeStrokePath(ctx, stroke.outline);
      ctx.fill();
      ctx.restore();
      return;
    }

    // 計算 track 總長度
    let totalLen = 0;
    const segLens = [];
    for (let i = 1; i < track.length; i++) {
      const len = Math.hypot(track[i].x - track[i - 1].x, track[i].y - track[i - 1].y);
      segLens.push(len);
      totalLen += len;
    }

    const targetLen = totalLen * Math.max(0.02, progress);

    ctx.save();
    this._buildMoeStrokePath(ctx, stroke.outline);
    ctx.clip();

    ctx.strokeStyle = color;
    ctx.lineWidth = 340;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(track[0].x, track[0].y);

    let acc = 0;
    let tip = track[0];
    for (let i = 0; i < segLens.length; i++) {
      const segLen = segLens[i];
      if (acc + segLen <= targetLen) {
        ctx.lineTo(track[i + 1].x, track[i + 1].y);
        acc += segLen;
        tip = track[i + 1];
      } else {
        const remain = targetLen - acc;
        const ratio = segLen > 0 ? remain / segLen : 0;
        const nx = track[i].x + (track[i + 1].x - track[i].x) * ratio;
        const ny = track[i].y + (track[i + 1].y - track[i].y) * ratio;
        ctx.lineTo(nx, ny);
        tip = { x: nx, y: ny };
        break;
      }
    }
    ctx.stroke();
    ctx.restore();

    // 筆尖發光小圓點
    ctx.save();
    ctx.fillStyle = '#FACC15';
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 18;
    ctx.beginPath();
    ctx.arc(tip.x, tip.y, 44, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  _drawTrackHint(ctx, track, strokeNum) {
    if (!Array.isArray(track) || track.length === 0) return;
    const start = track[0];

    ctx.save();
    // 虛線方向軌跡
    if (track.length >= 2) {
      ctx.strokeStyle = '#FACC15';
      ctx.lineWidth = 22;
      ctx.setLineDash([40, 28]);
      ctx.beginPath();
      ctx.moveTo(track[0].x, track[0].y);
      for (let i = 1; i < track.length; i++) {
        ctx.lineTo(track[i].x, track[i].y);
      }
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // 起點編號圓徽章
    ctx.fillStyle = '#EA580C';
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 16;
    ctx.beginPath();
    ctx.arc(start.x, start.y, 68, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 72px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(strokeNum), start.x, start.y + 4);
    ctx.restore();
  }

  _drawUserStrokes(ctx, size) {
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    for (const stroke of this.userStrokes) {
      const pts = stroke.points;
      if (pts.length === 0) continue;

      if (pts.length === 1) {
        ctx.fillStyle = stroke.color === 'rainbow' ? `hsl(${pts[0].hue}, 90%, 55%)` : stroke.color;
        ctx.beginPath();
        ctx.arc(pts[0].x * size, pts[0].y * size, stroke.width / 2, 0, Math.PI * 2);
        ctx.fill();
        continue;
      }

      if (stroke.color === 'rainbow') {
        ctx.lineWidth = stroke.width;
        for (let i = 1; i < pts.length; i++) {
          ctx.strokeStyle = `hsl(${pts[i].hue}, 90%, 52%)`;
          ctx.beginPath();
          ctx.moveTo(pts[i - 1].x * size, pts[i - 1].y * size);
          ctx.lineTo(pts[i].x * size, pts[i].y * size);
          ctx.stroke();
        }
      } else {
        ctx.strokeStyle = stroke.color;
        ctx.lineWidth = stroke.width;
        ctx.beginPath();
        ctx.moveTo(pts[0].x * size, pts[0].y * size);
        for (let i = 1; i < pts.length; i++) {
          ctx.lineTo(pts[i].x * size, pts[i].y * size);
        }
        ctx.stroke();
      }
    }
    ctx.restore();
  }
}
