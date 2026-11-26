# 快樂學習小教室（入口首頁＋國小生字字帖練習）Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 將 `peiankuo-tw/zhuyin` 靜態網站重組為「入口首頁＋注音描線小教室＋國小生字字帖小教室（線上互動描寫與 A4 列印，支援康軒／南一／翰林 1～6 年級字庫與自訂輸入）」。

**Architecture:** 維持零建置純靜態架構（HTML + Tailwind CSS CDN + Vanilla ES Modules），根目錄 `index.html` 作為入口首頁，既有注音頁搬至 `zhuyin/index.html`，全新字帖模組置於 `hanzi/`（職責拆分為 `stroke-service.js`、`canvas.js`、`app.js`、`print.css`），三大版本 1～6 年級生字庫按版本與年級拆分為 18 個獨立 JSON 檔存於 `data/` 按需載入。

**Tech Stack:** HTML5 Canvas (`PointerEvent`), CSS3 (`@media print` A4), Tailwind CSS CDN, Vanilla ES6 Modules, Google Fonts (`Zen Maru Gothic`, `Noto Sans TC`, `LXGW WenKai TC`), Taiwan MOE `zh-stroke-data` CDN, Moedict JSON API, Web Speech API (`speechSynthesis`), `localStorage`.

## Global Constraints

- 專案根目錄：`G:\我的雲端硬碟\生活\zhuyin`，不提交未追蹤的 PDF 檔案。
- 純靜態網站，不可引入需要 Node.js 建置步驟才能部署到 GitHub Pages 的工具。
- 既有的注音進度 `localStorage` 鍵名 `zhuyin_practice_progress_v2` 必須完整保留且相容。
- 新增 `localStorage` 鍵名：`hanzi_practice_progress_v1`、`hanzi_custom_lists_v1`、`hanzi_moedict_cache_v1`（上限 500 字），所有讀寫必須以 `try/catch` 包裝。
- 繁體楷書字型堆疊：`DFKai-SB, BiauKai, "標楷體", "LXGW WenKai TC", serif`。
- 筆順資料來源為台灣教育部標準筆順（`c9s/zh-stroke-data`，2048×2048 座標系）；無資料時優雅降級為淡色楷書描紅，不可中斷體驗。

---

### Task 1: 重組目錄結構、搬移注音教室並建立入口首頁

**Files:**
- Create: `zhuyin/index.html`（從原 `index.html` 搬移並加上「🏠 首頁」返回鈕）
- Modify: `index.html`（改寫為「快樂學習小教室」入口首頁）

**Interfaces:**
- Consumes: `localStorage['zhuyin_practice_progress_v2']`, `localStorage['hanzi_practice_progress_v1']`
- Produces: 首頁連結 `./zhuyin/` 與 `./hanzi/`；`zhuyin/index.html` 返回連結 `../index.html`

- [ ] **Step 1: 將現有 `index.html` 複製到 `zhuyin/index.html` 並在 header 加入「🏠 首頁」按鈕**
- [ ] **Step 2: 建立全新入口首頁 `index.html`（延續 `#FFFDF6` 點點背景與童趣 3D 卡片，顯示注音收集星星進度與字帖練習字數）**
- [ ] **Step 3: 驗證檔案結構與連結正確性（確認 `zhuyin/index.html` 保留完整注音邏輯）**
- [ ] **Step 4: Commit**

---

### Task 2: 建立三大版本 1～6 年級國小生字字庫與結構驗證

**Files:**
- Create: `data/index.json`
- Create: `data/kangxuan-1.json` ~ `data/kangxuan-6.json`
- Create: `data/nanyi-1.json` ~ `data/nanyi-6.json`
- Create: `data/hanlin-1.json` ~ `data/hanlin-6.json`
- Test: `tests/validate-data.mjs`

**Interfaces:**
- Produces:
  - `data/index.json`: `{ publishers: [{ id, name, grades: [1..6] }] }`
  - `data/{publisher}-{grade}.json`: `{ publisher, publisherName, grade, semesters: { "1": [{ lesson, title, chars }], "2": [...] } }`

- [ ] **Step 1: 撰寫字庫驗證測試腳本 `tests/validate-data.mjs`（檢查 JSON 格式、18 個檔案齊全、上下學期皆有課次、生字皆為有效繁體中文）**
- [ ] **Step 2: 執行 `node tests/validate-data.mjs` 確認初始失敗**
- [ ] **Step 3: 建立 `data/index.json` 與 18 個版本年級生字 JSON 檔**
- [ ] **Step 4: 執行 `node tests/validate-data.mjs` 確認全部通過**
- [ ] **Step 5: Commit**

---

### Task 3: 實作教育部筆順與萌典注音服務（`hanzi/stroke-service.js`）

**Files:**
- Create: `hanzi/stroke-service.js`
- Test: `tests/stroke-service.test.mjs`

**Interfaces:**
- Produces (ES Module exports):
  - `filterChineseChars(text, deduplicate = true): string[]`
  - `parseZhuyin(bopomofo): { symbols: string[], tone: string, isNeutral: boolean }`
  - `getCharStrokeData(char): Promise<Array<{ outline: Array, track: Array }> | null>`
  - `getCharMeta(char): Promise<{ char: string, readings: string[], radical: string, strokeCount: number | null }>`

- [ ] **Step 1: 撰寫 `tests/stroke-service.test.mjs` 測試 `filterChineseChars`（過濾標點英文空白、去重開關）、`parseZhuyin`（一聲／二三四聲／輕聲／三拼注音拆解）與快取淘汰邏輯**
- [ ] **Step 2: 執行 `node --test tests/stroke-service.test.mjs` 確認失敗**
- [ ] **Step 3: 實作 `hanzi/stroke-service.js`（串接 `zh-stroke-data` CDN 與 `moedict.tw/uni/<char>.json`，含記憶體快取、`hanzi_moedict_cache_v1` 上限 500 字與錯誤降級）**
- [ ] **Step 4: 執行 `node --test tests/stroke-service.test.mjs` 確認通過**
- [ ] **Step 5: Commit**

---

### Task 4: 實作互動描寫與教育部筆順動畫畫布（`hanzi/canvas.js`）

**Files:**
- Create: `hanzi/canvas.js`

**Interfaces:**
- Consumes: `strokeData` (`Array<{ outline, track }> | null`) from `stroke-service.js`
- Produces (ES Module export):
  - `class HanziCanvas(canvasEl, options)`
    - `setCharacter(char, strokeData)`
    - `setGridType('jiugong' | 'shizi' | 'mizi')`
    - `setShowGuide(boolean)`
    - `setBrushColor(color | 'rainbow')`
    - `setBrushWidth(px)`
    - `playStrokeAnimation(speed = 'normal')`
    - `stopAnimation()`
    - `stepNextStroke()`
    - `resetStepMode()`
    - `undo()`
    - `clearDrawing()`
    - `hasDrawing(): boolean`

- [ ] **Step 1: 實作 `hanzi/canvas.js`（高 DPI 畫布適配、三種格線、2048×2048 教育部 `outline` 向量繪製、`track` 筆順動畫與單步起點標記、標楷體降級底字、PointerEvent 手寫與彩虹筆/復原/清除）**
- [ ] **Step 2: 以語法檢查確認無 ES module 語法錯誤**
- [ ] **Step 3: Commit**

---

### Task 5: 實作國小生字字帖主介面與 A4 列印樣式（`hanzi/index.html`、`hanzi/app.js`、`hanzi/print.css`）

**Files:**
- Create: `hanzi/print.css`
- Create: `hanzi/index.html`
- Create: `hanzi/app.js`

**Interfaces:**
- Consumes: `hanzi/stroke-service.js`, `hanzi/canvas.js`, `data/index.json`, `data/{publisher}-{grade}.json`
- Produces: 完整的線上描寫模式與 A4 列印預覽／列印輸出，讀寫 `hanzi_practice_progress_v1` 與 `hanzi_custom_lists_v1`

- [ ] **Step 1: 建立 `hanzi/print.css`（`@page { size: A4 portrait; margin: 10mm; }`、直式注音排版 `.zhuyin-vertical`、九宮格／十字格／米字格背景、標準 8×10 與大格 6×8、`break-inside: avoid`、`@media print` 隱藏非列印 UI）**
- [ ] **Step 2: 建立 `hanzi/index.html`（導覽列、模式切換、課本選字與自訂生字區、線上描寫區、A4 列印設定與預覽區、慶祝紙花畫布）**
- [ ] **Step 3: 建立 `hanzi/app.js`（串接選字連動、「帶入自訂區微調」、自訂清單 CRUD、破音字讀音切換與記憶、TTS 朗讀、`HanziCanvas` 控制、A4 分頁預覽生成與 `window.print()`）**
- [ ] **Step 4: Commit**

---

### Task 6: 端對端瀏覽器實測與驗證

**Files:**
- Verify: `index.html`, `zhuyin/index.html`, `hanzi/index.html`

- [ ] **Step 1: 執行所有自動化測試（`node tests/validate-data.mjs` 與 `node --test tests/stroke-service.test.mjs`）**
- [ ] **Step 2: 啟動本機靜態伺服器並使用瀏覽器驗證首頁入口、注音頁回歸、國小字帖線上描寫／筆順動畫／破音字／A4 列印預覽**
- [ ] **Step 3: 修復任何發現的排版或互動問題並 commit**
