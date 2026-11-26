/**
 * =============================================================================
 * 快樂學注音・注音語詞資料庫與教育部標準發音對照表 (zhuyin/vocab-db.js)
 *
 * 1. 教育部標準注音發音音檔：
 *    2017 © 教育部，國語注音符號手冊-開放部件（創用CC 姓名標示 4.0 國際版本）
 *    F1~F21: 聲母 (ㄅ~ㄙ)
 *    F22~F34: 韻母 (ㄚ~ㄦ)
 *    F35~F37: 介音 (ㄧ~ㄩ)
 *
 * 2. 豐富生活語詞資料庫：
 *    37 個注音符號 × 每個 5～6 個台灣幼兒園常見生活語詞（超過 200 組圖詞！）
 *    供描線小教室與 5 款互動遊戲共用抽取。
 * =============================================================================
 */
(function () {
  'use strict';

  const MOE_AUDIO_MAP = {
    // 聲母 (21) -> F1.WAV ~ F21.WAV
    'ㄅ': './audio/F1.WAV',
    'ㄆ': './audio/F2.WAV',
    'ㄇ': './audio/F3.WAV',
    'ㄈ': './audio/F4.WAV',
    'ㄉ': './audio/F5.WAV',
    'ㄊ': './audio/F6.WAV',
    'ㄋ': './audio/F7.WAV',
    'ㄌ': './audio/F8.WAV',
    'ㄍ': './audio/F9.WAV',
    'ㄎ': './audio/F10.WAV',
    'ㄏ': './audio/F11.WAV',
    'ㄐ': './audio/F12.WAV',
    'ㄑ': './audio/F13.WAV',
    'ㄒ': './audio/F14.WAV',
    'ㄓ': './audio/F15.WAV',
    'ㄔ': './audio/F16.WAV',
    'ㄕ': './audio/F17.WAV',
    'ㄖ': './audio/F18.WAV',
    'ㄗ': './audio/F19.WAV',
    'ㄘ': './audio/F20.WAV',
    'ㄙ': './audio/F21.WAV',
    // 韻母 (13) -> F22.WAV ~ F34.WAV
    'ㄚ': './audio/F22.WAV',
    'ㄛ': './audio/F23.WAV',
    'ㄜ': './audio/F24.WAV',
    'ㄝ': './audio/F25.WAV',
    'ㄞ': './audio/F26.WAV',
    'ㄟ': './audio/F27.WAV',
    'ㄠ': './audio/F28.WAV',
    'ㄡ': './audio/F29.WAV',
    'ㄢ': './audio/F30.WAV',
    'ㄣ': './audio/F31.WAV',
    'ㄤ': './audio/F32.WAV',
    'ㄥ': './audio/F33.WAV',
    'ㄦ': './audio/F34.WAV',
    // 介音 (3) -> F35.WAV ~ F37.WAV
    'ㄧ': './audio/F35.WAV',
    'ㄨ': './audio/F36.WAV',
    'ㄩ': './audio/F37.WAV',
  };

  const ZHUYIN_VOCAB_DB = {
    // ==================== 聲母 (21) ====================
    'ㄅ': [
      { word: '爸爸', reading: 'ㄅㄚˋ ㄅㄚ˙', emoji: '👨', theme: '人物' },
      { word: '包子', reading: 'ㄅㄠ ㄗ˙', emoji: '🥟', theme: '食物' },
      { word: '斑馬', reading: 'ㄅㄢ ㄇㄚˇ', emoji: '🦓', theme: '動物' },
      { word: '餅乾', reading: 'ㄅㄧㄥˇ ㄍㄢ', emoji: '🍪', theme: '食物' },
      { word: '冰淇淋', reading: 'ㄅㄧㄥ ㄑㄧˊ ㄌㄧㄣˊ', emoji: '🍦', theme: '食物' },
      { word: '白雲', reading: 'ㄅㄞˊ ㄩㄣˊ', emoji: '☁️', theme: '自然' },
    ],
    'ㄆ': [
      { word: '葡萄', reading: 'ㄆㄨˊ ㄊㄠˊ', emoji: '🍇', theme: '食物' },
      { word: '蘋果', reading: 'ㄆㄧㄥˊ ㄍㄨㄛˇ', emoji: '🍎', theme: '食物' },
      { word: '螃蟹', reading: 'ㄆㄤˊ ㄒㄧㄝˋ', emoji: '🦀', theme: '動物' },
      { word: '泡泡', reading: 'ㄆㄠˋ ㄆㄠˋ', emoji: '🫧', theme: '生活' },
      { word: '披薩', reading: 'ㄆㄧ ㄙㄚˋ', emoji: '🍕', theme: '食物' },
      { word: '瀑布', reading: 'ㄆㄨˋ ㄅㄨˋ', emoji: '🏞️', theme: '自然' },
    ],
    'ㄇ': [
      { word: '貓咪', reading: 'ㄇㄠ ㄇㄧ', emoji: '🐱', theme: '動物' },
      { word: '媽媽', reading: 'ㄇㄚ ㄇㄚ˙', emoji: '👩', theme: '人物' },
      { word: '麵包', reading: 'ㄇㄧㄢˋ ㄅㄠ', emoji: '🍞', theme: '食物' },
      { word: '蜜蜂', reading: 'ㄇㄧˋ ㄈㄥ', emoji: '🐝', theme: '動物' },
      { word: '帽子', reading: 'ㄇㄠˋ ㄗ˙', emoji: '🧢', theme: '生活' },
      { word: '芒果', reading: 'ㄇㄤˊ ㄍㄨㄛˇ', emoji: '🥭', theme: '食物' },
    ],
    'ㄈ': [
      { word: '飛機', reading: 'ㄈㄟ ㄐㄧ', emoji: '✈️', theme: '交通' },
      { word: '番茄', reading: 'ㄈㄢ ㄑㄧㄝˊ', emoji: '🍅', theme: '食物' },
      { word: '房子', reading: 'ㄈㄤˊ ㄗ˙', emoji: '🏠', theme: '生活' },
      { word: '鳳梨', reading: 'ㄈㄥˋ ㄌㄧˊ', emoji: '🍍', theme: '食物' },
      { word: '風箏', reading: 'ㄈㄥ ㄓㄥ', emoji: '🪁', theme: '生活' },
      { word: '蜂蜜', reading: 'ㄈㄥ ㄇㄧˋ', emoji: '🍯', theme: '食物' },
    ],
    'ㄉ': [
      { word: '大象', reading: 'ㄉㄚˋ ㄒㄧㄤˋ', emoji: '🐘', theme: '動物' },
      { word: '蛋糕', reading: 'ㄉㄢˋ ㄍㄠ', emoji: '🎂', theme: '食物' },
      { word: '恐龍蛋', reading: 'ㄉㄢˋ', emoji: '🥚', theme: '自然' },
      { word: '電燈', reading: 'ㄉㄧㄢˋ ㄉㄥ', emoji: '💡', theme: '生活' },
      { word: '豆漿', reading: 'ㄉㄡˋ ㄐㄧㄤ', emoji: '🥛', theme: '食物' },
      { word: '大樹', reading: 'ㄉㄚˋ ㄕㄨˋ', emoji: '🌳', theme: '自然' },
    ],
    'ㄊ': [
      { word: '兔子', reading: 'ㄊㄨˋ ㄗ˙', emoji: '🐰', theme: '動物' },
      { word: '太陽', reading: 'ㄊㄞˋ ㄧㄤˊ', emoji: '☀️', theme: '自然' },
      { word: '糖果', reading: 'ㄊㄤˊ ㄍㄨㄛˇ', emoji: '🍬', theme: '食物' },
      { word: '桃子', reading: 'ㄊㄠˊ ㄗ˙', emoji: '🍑', theme: '食物' },
      { word: '湯匙', reading: 'ㄊㄤ ㄔˊ', emoji: '🥄', theme: '生活' },
      { word: '太空船', reading: 'ㄊㄞˋ ㄎㄨㄥ ㄔㄨㄢˊ', emoji: '🚀', theme: '交通' },
    ],
    'ㄋ': [
      { word: '牛奶', reading: 'ㄋㄧㄡˊ ㄋㄞˇ', emoji: '🥛', theme: '食物' },
      { word: '乳牛', reading: 'ㄋㄧㄡˊ', emoji: '🐄', theme: '動物' },
      { word: '南瓜', reading: 'ㄋㄢˊ ㄍㄨㄚ', emoji: '🎃', theme: '食物' },
      { word: '小鳥', reading: 'ㄋㄧㄠˇ', emoji: '🐦', theme: '動物' },
      { word: '檸檬', reading: 'ㄋㄧㄥˊ ㄇㄥˊ', emoji: '🍋', theme: '食物' },
      { word: '奶奶', reading: 'ㄋㄞˇ ㄋㄞ˙', emoji: '👵', theme: '人物' },
    ],
    'ㄌ': [
      { word: '老鼠', reading: 'ㄌㄠˇ ㄕㄨˇ', emoji: '🐭', theme: '動物' },
      { word: '老虎', reading: 'ㄌㄠˇ ㄏㄨˇ', emoji: '🐯', theme: '動物' },
      { word: '藍莓', reading: 'ㄌㄢˊ ㄇㄟˊ', emoji: '🫐', theme: '食物' },
      { word: '禮物', reading: 'ㄌㄧˇ ㄨˋ', emoji: '🎁', theme: '生活' },
      { word: '蠟燭', reading: 'ㄌㄚˋ ㄓㄨˊ', emoji: '🕯️', theme: '生活' },
      { word: '輪船', reading: 'ㄌㄨㄣˊ ㄔㄨㄢˊ', emoji: '🚢', theme: '交通' },
    ],
    'ㄍ': [
      { word: '狗狗', reading: 'ㄍㄡˇ ㄍㄡˇ', emoji: '🐶', theme: '動物' },
      { word: '公車', reading: 'ㄍㄨㄥ ㄔㄜ', emoji: '🚌', theme: '交通' },
      { word: '公雞', reading: 'ㄍㄨㄥ ㄐㄧ', emoji: '🐓', theme: '動物' },
      { word: '鋼琴', reading: 'ㄍㄤ ㄑㄧㄣˊ', emoji: '🎹', theme: '生活' },
      { word: '國王', reading: 'ㄍㄨㄛˊ ㄨㄤˊ', emoji: '🤴', theme: '人物' },
      { word: '高麗菜', reading: 'ㄍㄠ ㄌㄧˋ ㄘㄞˋ', emoji: '🥬', theme: '食物' },
    ],
    'ㄎ': [
      { word: '恐龍', reading: 'ㄎㄨㄥˇ ㄌㄨㄥˊ', emoji: '🦖', theme: '動物' },
      { word: '卡車', reading: 'ㄎㄚˇ ㄔㄜ', emoji: '🚚', theme: '交通' },
      { word: '咖啡', reading: 'ㄎㄚ ㄈㄟ', emoji: '☕', theme: '食物' },
      { word: '口罩', reading: 'ㄎㄡˇ ㄓㄠˋ', emoji: '😷', theme: '生活' },
      { word: '褲子', reading: 'ㄎㄨˋ ㄗ˙', emoji: '👖', theme: '生活' },
      { word: '筷子', reading: 'ㄎㄨㄞˋ ㄗ˙', emoji: '🥢', theme: '生活' },
    ],
    'ㄏ': [
      { word: '蝴蝶', reading: 'ㄏㄨˊ ㄉㄧㄝˊ', emoji: '🦋', theme: '動物' },
      { word: '猴子', reading: 'ㄏㄡˊ ㄗ˙', emoji: '🐵', theme: '動物' },
      { word: '漢堡', reading: 'ㄏㄢˋ ㄅㄠˇ', emoji: '🍔', theme: '食物' },
      { word: '花朵', reading: 'ㄏㄨㄚ ㄉㄨㄛˇ', emoji: '🌸', theme: '自然' },
      { word: '火車', reading: 'ㄏㄨㄛˇ ㄔㄜ', emoji: '🚂', theme: '交通' },
      { word: '河馬', reading: 'ㄏㄜˊ ㄇㄚˇ', emoji: '🦛', theme: '動物' },
    ],
    'ㄐ': [
      { word: '雞蛋', reading: 'ㄐㄧ ㄉㄢˋ', emoji: '🥚', theme: '食物' },
      { word: '橘子', reading: 'ㄐㄩˊ ㄗ˙', emoji: '🍊', theme: '食物' },
      { word: '剪刀', reading: 'ㄐㄧㄢˇ ㄉㄠ', emoji: '✂️', theme: '生活' },
      { word: '鯨魚', reading: 'ㄐㄧㄥ ㄩˊ', emoji: '🐳', theme: '動物' },
      { word: '吉他', reading: 'ㄐㄧˊ ㄊㄚ', emoji: '🎸', theme: '生活' },
      { word: '警車', reading: 'ㄐㄧㄥˇ ㄔㄜ', emoji: '🚓', theme: '交通' },
    ],
    'ㄑ': [
      { word: '氣球', reading: 'ㄑㄧˋ ㄑㄧㄡˊ', emoji: '🎈', theme: '生活' },
      { word: '企鵝', reading: 'ㄑㄧˋ ㄜˊ', emoji: '🐧', theme: '動物' },
      { word: '青蛙', reading: 'ㄑㄧㄥ ㄨㄚ', emoji: '🐸', theme: '動物' },
      { word: '鉛筆', reading: 'ㄑㄧㄢ ㄅㄧˇ', emoji: '✏️', theme: '生活' },
      { word: '茄子', reading: 'ㄑㄧㄝˊ ㄗ˙', emoji: '🍆', theme: '食物' },
      { word: '巧克力', reading: 'ㄑㄧㄠˇ ㄎㄜˋ ㄌㄧˋ', emoji: '🍫', theme: '食物' },
    ],
    'ㄒ': [
      { word: '西瓜', reading: 'ㄒㄧ ㄍㄨㄚ', emoji: '🍉', theme: '食物' },
      { word: '星星', reading: 'ㄒㄧㄥ ㄒㄧㄥ˙', emoji: '⭐', theme: '自然' },
      { word: '香蕉', reading: 'ㄒㄧㄤ ㄐㄧㄠ', emoji: '🍌', theme: '食物' },
      { word: '熊貓', reading: 'ㄒㄩㄥˊ ㄇㄠ', emoji: '🐼', theme: '動物' },
      { word: '鞋子', reading: 'ㄒㄧㄝˊ ㄗ˙', emoji: '👟', theme: '生活' },
      { word: '雪人', reading: 'ㄒㄩㄝˇ ㄖㄣˊ', emoji: '⛄', theme: '自然' },
    ],
    'ㄓ': [
      { word: '章魚', reading: 'ㄓㄤ ㄩˊ', emoji: '🐙', theme: '動物' },
      { word: '豬豬', reading: 'ㄓㄨ ㄓㄨ', emoji: '🐷', theme: '動物' },
      { word: '蜘蛛', reading: 'ㄓ ㄓㄨ', emoji: '🕷️', theme: '動物' },
      { word: '竹子', reading: 'ㄓㄨˊ ㄗ˙', emoji: '🎍', theme: '自然' },
      { word: '珍奶', reading: 'ㄓㄣ ㄋㄞˇ', emoji: '🧋', theme: '食物' },
      { word: '鐘錶', reading: 'ㄓㄨㄥ ㄅㄧㄠˇ', emoji: '⏰', theme: '生活' },
    ],
    'ㄔ': [
      { word: '車子', reading: 'ㄔㄜ ㄗ˙', emoji: '🚗', theme: '交通' },
      { word: '長頸鹿', reading: 'ㄔㄤˊ ㄐㄧㄥˇ ㄌㄨˋ', emoji: '🦒', theme: '動物' },
      { word: '船隻', reading: 'ㄔㄨㄢˊ', emoji: '⛵', theme: '交通' },
      { word: '尺', reading: 'ㄔˇ', emoji: '📏', theme: '生活' },
      { word: '炒飯', reading: 'ㄔㄠˇ ㄈㄢˋ', emoji: '🍛', theme: '食物' },
      { word: '毛毛蟲', reading: 'ㄔㄨㄥˊ', emoji: '🐛', theme: '動物' },
    ],
    'ㄕ': [
      { word: '獅子', reading: 'ㄕ ㄗ˙', emoji: '🦁', theme: '動物' },
      { word: '書本', reading: 'ㄕㄨ ㄅㄣˇ', emoji: '📚', theme: '生活' },
      { word: '水餃', reading: 'ㄕㄨㄟˇ ㄐㄧㄠˇ', emoji: '🥟', theme: '食物' },
      { word: '閃電', reading: 'ㄕㄢˇ ㄉㄧㄢˋ', emoji: '⚡', theme: '自然' },
      { word: '手錶', reading: 'ㄕㄡˇ ㄅㄧㄠˇ', emoji: '⌚', theme: '生活' },
      { word: '薯條', reading: 'ㄕㄨˇ ㄊㄧㄠˊ', emoji: '🍟', theme: '食物' },
    ],
    'ㄖ': [
      { word: '熱狗', reading: 'ㄖㄜˋ ㄍㄡˇ', emoji: '🌭', theme: '食物' },
      { word: '日曆', reading: 'ㄖˋ ㄌㄧˋ', emoji: '📅', theme: '生活' },
      { word: '肉排', reading: 'ㄖㄡˋ ㄆㄞˊ', emoji: '🥩', theme: '食物' },
      { word: '人', reading: 'ㄖㄣˊ', emoji: '🧑', theme: '人物' },
      { word: '熱茶', reading: 'ㄖㄜˋ ㄔㄚˊ', emoji: '🍵', theme: '食物' },
      { word: '日出', reading: 'ㄖˋ ㄔㄨ', emoji: '🌅', theme: '自然' },
    ],
    'ㄗ': [
      { word: '嘴巴', reading: 'ㄗㄨㄟˇ ㄅㄚ', emoji: '👄', theme: '人物' },
      { word: '粽子', reading: 'ㄗㄨㄥˋ ㄗ˙', emoji: '🍙', theme: '食物' },
      { word: '足球', reading: 'ㄗㄨˊ ㄑㄧㄡˊ', emoji: '⚽', theme: '生活' },
      { word: '鑽石', reading: 'ㄗㄨㄢˋ ㄕˊ', emoji: '💎', theme: '生活' },
      { word: '腳踏車', reading: 'ㄗˋ ㄒㄧㄥˊ ㄔㄜ', emoji: '🚲', theme: '交通' },
    ],
    'ㄘ': [
      { word: '草莓', reading: 'ㄘㄠˇ ㄇㄟˊ', emoji: '🍓', theme: '食物' },
      { word: '彩虹', reading: 'ㄘㄞˇ ㄏㄨㄥˊ', emoji: '🌈', theme: '自然' },
      { word: '刺蝟', reading: 'ㄘˋ ㄨㄟˋ', emoji: '🦔', theme: '動物' },
      { word: '餐具', reading: 'ㄘㄢ ㄐㄩˋ', emoji: '🍽️', theme: '生活' },
      { word: '蔥', reading: 'ㄘㄨㄥ', emoji: '🧅', theme: '食物' },
    ],
    'ㄙ': [
      { word: '松鼠', reading: 'ㄙㄨㄥ ㄕㄨˇ', emoji: '🐿️', theme: '動物' },
      { word: '森林', reading: 'ㄙㄣ ㄌㄧㄣˊ', emoji: '🌲', theme: '自然' },
      { word: '雨傘', reading: 'ㄙㄢˇ', emoji: '☂️', theme: '生活' },
      { word: '骰子', reading: 'ㄙㄞˇ ㄗ˙', emoji: '🎲', theme: '生活' },
      { word: '絲瓜', reading: 'ㄙ ㄍㄨㄚ', emoji: '🥒', theme: '食物' },
    ],

    // ==================== 介音 (3) ====================
    'ㄧ': [
      { word: '衣服', reading: 'ㄧ ㄈㄨˊ', emoji: '👕', theme: '生活' },
      { word: '醫生', reading: 'ㄧ ㄕㄥ', emoji: '👩‍⚕️', theme: '人物' },
      { word: '椅子', reading: 'ㄧˇ ㄗ˙', emoji: '🪑', theme: '生活' },
      { word: '櫻桃', reading: 'ㄧㄥ ㄊㄠˊ', emoji: '🍒', theme: '食物' },
      { word: '音符', reading: 'ㄧㄣ ㄈㄨˊ', emoji: '🎵', theme: '生活' },
      { word: '葉子', reading: 'ㄧㄝˋ ㄗ˙', emoji: '🍃', theme: '自然' },
    ],
    'ㄨ': [
      { word: '烏龜', reading: 'ㄨ ㄍㄨㄟ', emoji: '🐢', theme: '動物' },
      { word: '蝸牛', reading: 'ㄨㄛ ㄋㄧㄡˊ', emoji: '🐌', theme: '動物' },
      { word: '襪子', reading: 'ㄨㄚˋ ㄗ˙', emoji: '🧦', theme: '生活' },
      { word: '碗', reading: 'ㄨㄢˇ', emoji: '🥣', theme: '生活' },
      { word: '王子', reading: 'ㄨㄤˊ ㄗ˙', emoji: '🤴', theme: '人物' },
      { word: '小木屋', reading: 'ㄨ', emoji: '🏡', theme: '生活' },
    ],
    'ㄩ': [
      { word: '雨傘', reading: 'ㄩˇ ㄙㄢˇ', emoji: '☂️', theme: '生活' },
      { word: '小魚', reading: 'ㄩˊ', emoji: '🐟', theme: '動物' },
      { word: '月亮', reading: 'ㄩㄝˋ ㄌㄧㄤˋ', emoji: '🌙', theme: '自然' },
      { word: '玉米', reading: 'ㄩˋ ㄇㄧˇ', emoji: '🌽', theme: '食物' },
      { word: '雲朵', reading: 'ㄩㄣˊ ㄉㄨㄛˇ', emoji: '☁️', theme: '自然' },
      { word: '羽毛', reading: 'ㄩˇ ㄇㄠˊ', emoji: '🪶', theme: '自然' },
    ],

    // ==================== 韻母 (13) ====================
    'ㄚ': [
      { word: '阿公', reading: 'ㄚ ㄍㄨㄥ', emoji: '👴', theme: '人物' },
      { word: '鴨子', reading: 'ㄧㄚ ㄗ˙', emoji: '🦆', theme: '動物' },
      { word: '牙刷', reading: 'ㄧㄚˊ ㄕㄨㄚ', emoji: '🪥', theme: '生活' },
      { word: '西瓜', reading: 'ㄒㄧ ㄍㄨㄚ', emoji: '🍉', theme: '食物' },
      { word: '青蛙', reading: 'ㄑㄧㄥ ㄨㄚ', emoji: '🐸', theme: '動物' },
    ],
    'ㄛ': [
      { word: '公雞喔喔叫', reading: 'ㄛ ㄛ ㄐㄧㄠˋ', emoji: '🐓', theme: '動物' },
      { word: '蘿蔔', reading: 'ㄌㄨㄛˊ ㄅㄛ˙', emoji: '🥕', theme: '食物' },
      { word: '菠菜', reading: 'ㄅㄛ ㄘㄞˋ', emoji: '🥬', theme: '食物' },
      { word: '魔術帽', reading: 'ㄇㄛˊ ㄕㄨˋ', emoji: '🎩', theme: '生活' },
      { word: '蝸牛', reading: 'ㄨㄛ ㄋㄧㄡˊ', emoji: '🐌', theme: '動物' },
    ],
    'ㄜ': [
      { word: '白鵝', reading: 'ㄅㄞˊ ㄜˊ', emoji: '🦢', theme: '動物' },
      { word: '鱷魚', reading: 'ㄜˋ ㄩˊ', emoji: '🐊', theme: '動物' },
      { word: '可樂', reading: 'ㄎㄜˇ ㄌㄜˋ', emoji: '🥤', theme: '食物' },
      { word: '車子', reading: 'ㄔㄜ ㄗ˙', emoji: '🚗', theme: '交通' },
      { word: '鴿子', reading: 'ㄍㄜ ㄗ˙', emoji: '🕊️', theme: '動物' },
    ],
    'ㄝ': [
      { word: '椰子', reading: 'ㄧㄝˊ ㄗ˙', emoji: '🥥', theme: '食物' },
      { word: '爺爺', reading: 'ㄧㄝˊ ㄧㄝ˙', emoji: '👴', theme: '人物' },
      { word: '樹葉', reading: 'ㄕㄨˋ ㄧㄝˋ', emoji: '🍁', theme: '自然' },
      { word: '蝴蝶', reading: 'ㄏㄨˊ ㄉㄧㄝˊ', emoji: '🦋', theme: '動物' },
      { word: '拖鞋', reading: 'ㄊㄨㄛ ㄒㄧㄝˊ', emoji: '🩴', theme: '生活' },
    ],
    'ㄞ': [
      { word: '愛心', reading: 'ㄞˋ ㄒㄧㄣ', emoji: '❤️', theme: '生活' },
      { word: '白菜', reading: 'ㄅㄞˊ ㄘㄞˋ', emoji: '🥬', theme: '食物' },
      { word: '牛奶', reading: 'ㄋㄧㄡˊ ㄋㄞˇ', emoji: '🥛', theme: '食物' },
      { word: '海星', reading: 'ㄏㄞˇ ㄒㄧㄥ', emoji: '⭐', theme: '動物' },
      { word: '彩虹', reading: 'ㄘㄞˇ ㄏㄨㄥˊ', emoji: '🌈', theme: '自然' },
    ],
    'ㄟ': [
      { word: '杯子', reading: 'ㄅㄟ ㄗ˙', emoji: '🥤', theme: '生活' },
      { word: '飛機', reading: 'ㄈㄟ ㄐㄧ', emoji: '✈️', theme: '交通' },
      { word: '烏龜', reading: 'ㄨ ㄍㄨㄟ', emoji: '🐢', theme: '動物' },
      { word: '草莓', reading: 'ㄘㄠˇ ㄇㄟˊ', emoji: '🍓', theme: '食物' },
      { word: '玫瑰', reading: 'ㄇㄟˊ ㄍㄨㄟ', emoji: '🌹', theme: '自然' },
    ],
    'ㄠ': [
      { word: '蛋糕', reading: 'ㄉㄢˋ ㄍㄠ', emoji: '🎂', theme: '食物' },
      { word: '貓咪', reading: 'ㄇㄠ ㄇㄧ', emoji: '🐱', theme: '動物' },
      { word: '葡萄', reading: 'ㄆㄨˊ ㄊㄠˊ', emoji: '🍇', theme: '食物' },
      { word: '帽子', reading: 'ㄇㄠˋ ㄗ˙', emoji: '🎩', theme: '生活' },
      { word: '包子', reading: 'ㄅㄠ ㄗ˙', emoji: '🥟', theme: '食物' },
    ],
    'ㄡ': [
      { word: '海鷗', reading: 'ㄏㄞˇ ㄡ', emoji: '🕊️', theme: '動物' },
      { word: '猴子', reading: 'ㄏㄡˊ ㄗ˙', emoji: '🐵', theme: '動物' },
      { word: '狗狗', reading: 'ㄍㄡˇ ㄍㄡˇ', emoji: '🐶', theme: '動物' },
      { word: '手套', reading: 'ㄕㄡˇ ㄊㄠˋ', emoji: '🧤', theme: '生活' },
      { word: '牛肉', reading: 'ㄋㄧㄡˊ ㄖㄡˋ', emoji: '🥩', theme: '食物' },
    ],
    'ㄢ': [
      { word: '安全帽', reading: 'ㄢ ㄑㄩㄢˊ ㄇㄠˋ', emoji: '⛑️', theme: '生活' },
      { word: '高山', reading: 'ㄍㄠ ㄕㄢ', emoji: '⛰️', theme: '自然' },
      { word: '餅乾', reading: 'ㄅㄧㄥˇ ㄍㄢ', emoji: '🍪', theme: '食物' },
      { word: '飯糰', reading: 'ㄈㄢˋ ㄊㄨㄢˊ', emoji: '🍙', theme: '食物' },
      { word: '雨傘', reading: 'ㄩˇ ㄙㄢˇ', emoji: '☂️', theme: '生活' },
    ],
    'ㄣ': [
      { word: '森林', reading: 'ㄙㄣ ㄌㄧㄣˊ', emoji: '🌲', theme: '自然' },
      { word: '大門', reading: 'ㄉㄚˋ ㄇㄣˊ', emoji: '🚪', theme: '生活' },
      { word: '盆栽', reading: 'ㄆㄣˊ ㄗㄞ', emoji: '🪴', theme: '自然' },
      { word: '珍奶', reading: 'ㄓㄣ ㄋㄞˇ', emoji: '🧋', theme: '食物' },
      { word: '書本', reading: 'ㄕㄨ ㄅㄣˇ', emoji: '📖', theme: '生活' },
    ],
    'ㄤ': [
      { word: '糖果', reading: 'ㄊㄤˊ ㄍㄨㄛˇ', emoji: '🍬', theme: '食物' },
      { word: '太陽', reading: 'ㄊㄞˋ ㄧㄤˊ', emoji: '☀️', theme: '自然' },
      { word: '章魚', reading: 'ㄓㄤ ㄩˊ', emoji: '🐙', theme: '動物' },
      { word: '湯圓', reading: 'ㄊㄤ ㄩㄢˊ', emoji: '🍡', theme: '食物' },
      { word: '大象', reading: 'ㄉㄚˋ ㄒㄧㄤˋ', emoji: '🐘', theme: '動物' },
    ],
    'ㄥ': [
      { word: '蜜蜂', reading: 'ㄇㄧˋ ㄈㄥ', emoji: '🐝', theme: '動物' },
      { word: '風箏', reading: 'ㄈㄥ ㄓㄥ', emoji: '🪁', theme: '生活' },
      { word: '電燈', reading: 'ㄉㄧㄢˋ ㄉㄥ', emoji: '💡', theme: '生活' },
      { word: '彩虹', reading: 'ㄘㄞˇ ㄏㄨㄥˊ', emoji: '🌈', theme: '自然' },
      { word: '青蛙', reading: 'ㄑㄧㄥ ㄨㄚ', emoji: '🐸', theme: '動物' },
    ],
    'ㄦ': [
      { word: '耳朵', reading: 'ㄦˇ ㄉㄨㄛ˙', emoji: '👂', theme: '人物' },
      { word: '兒童', reading: 'ㄦˊ ㄊㄨㄥˊ', emoji: '🧒', theme: '人物' },
      { word: '耳機', reading: 'ㄦˇ ㄐㄧ', emoji: '🎧', theme: '生活' },
      { word: '數字二', reading: 'ㄦˋ', emoji: '2️⃣', theme: '生活' },
      { word: '兒歌', reading: 'ㄦˊ ㄍㄜ', emoji: '🎶', theme: '生活' },
    ],
  };

  function shuffleArray(arr) {
    const copy = arr.slice();
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  /**
   * 智慧不重複抽牌器（Bag Shuffle）
   * 確保小朋友連續玩好幾關時，題目與圖詞會輪流出現、不會一直抽到重複的！
   */
  function createSmartDeck(items) {
    let bag = shuffleArray(items);
    return {
      draw(excludeKeyFn = null) {
        if (bag.length === 0) {
          bag = shuffleArray(items);
        }
        if (excludeKeyFn && bag.length > 1) {
          const idx = bag.findIndex((it) => !excludeKeyFn(it));
          if (idx >= 0) {
            return bag.splice(idx, 1)[0];
          }
        }
        return bag.pop();
      },
      drawBatch(count, uniqueChar = true) {
        const result = [];
        const usedChars = new Set();
        let guard = 0;
        const maxGuard = Math.max(40, count * 8);
        while (result.length < count && guard < maxGuard) {
          guard++;
          const picked = this.draw(uniqueChar ? (it) => usedChars.has(it.char) : null);
          if (!picked) break;
          if (uniqueChar && usedChars.has(picked.char)) continue;
          usedChars.add(picked.char);
          result.push(picked);
        }
        return result;
      },
    };
  }

  function getTotalWordCount() {
    return Object.values(ZHUYIN_VOCAB_DB).reduce((sum, list) => sum + list.length, 0);
  }

  function getWords(char) {
    return ZHUYIN_VOCAB_DB[char] || [];
  }

  function getAudioUrl(char) {
    return MOE_AUDIO_MAP[char] || null;
  }

  /**
   * 根據範圍取得展平後的「注音 + 圖詞」題庫
   * 每筆包含 { char, cat, word, reading, emoji, theme }
   */
  function getEntriesForSymbols(symbolItems) {
    const entries = [];
    symbolItems.forEach((sym) => {
      const words = ZHUYIN_VOCAB_DB[sym.char];
      if (words && words.length > 0) {
        words.forEach((w) => {
          entries.push({
            char: sym.char,
            cat: sym.cat,
            word: w.word,
            reading: w.reading,
            emoji: w.emoji,
            theme: w.theme,
            ttsChar: sym.ttsChar,
            ttsWord: w.word,
          });
        });
      } else {
        entries.push({
          char: sym.char,
          cat: sym.cat,
          word: sym.word,
          reading: sym.reading,
          emoji: sym.emoji,
          theme: '生活',
          ttsChar: sym.ttsChar,
          ttsWord: sym.ttsWord || sym.word,
        });
      }
    });
    return entries;
  }

  window.ZhuyinDB = {
    MOE_AUDIO_MAP,
    ZHUYIN_VOCAB_DB,
    getAudioUrl,
    getWords,
    getEntriesForSymbols,
    getTotalWordCount,
    createSmartDeck,
    shuffleArray,
  };
})();
