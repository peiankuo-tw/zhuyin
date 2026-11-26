/**
 * =============================================================================
 * 快樂學英文・ABC 單字圖詞資料庫 (english/vocab-db.js)
 *
 * 26 個英文字母 (A~Z) × 每個 5～6 個幼兒園常見生活單字（約 140+ 組圖詞！）
 * 供描線寫字小教室與 5 款無限續關互動遊戲共用抽取。
 * =============================================================================
 */
(function () {
  'use strict';

  const ENGLISH_LETTERS = [
    { letter: 'A', lower: 'a', isVowel: true,  half: 'am', phonics: '/æ/' },
    { letter: 'B', lower: 'b', isVowel: false, half: 'am', phonics: '/b/' },
    { letter: 'C', lower: 'c', isVowel: false, half: 'am', phonics: '/k/' },
    { letter: 'D', lower: 'd', isVowel: false, half: 'am', phonics: '/d/' },
    { letter: 'E', lower: 'e', isVowel: true,  half: 'am', phonics: '/ɛ/' },
    { letter: 'F', lower: 'f', isVowel: false, half: 'am', phonics: '/f/' },
    { letter: 'G', lower: 'g', isVowel: false, half: 'am', phonics: '/g/' },
    { letter: 'H', lower: 'h', isVowel: false, half: 'am', phonics: '/h/' },
    { letter: 'I', lower: 'i', isVowel: true,  half: 'am', phonics: '/ɪ/' },
    { letter: 'J', lower: 'j', isVowel: false, half: 'am', phonics: '/dʒ/' },
    { letter: 'K', lower: 'k', isVowel: false, half: 'am', phonics: '/k/' },
    { letter: 'L', lower: 'l', isVowel: false, half: 'am', phonics: '/l/' },
    { letter: 'M', lower: 'm', isVowel: false, half: 'am', phonics: '/m/' },
    { letter: 'N', lower: 'n', isVowel: false, half: 'nz', phonics: '/n/' },
    { letter: 'O', lower: 'o', isVowel: true,  half: 'nz', phonics: '/ɑ/' },
    { letter: 'P', lower: 'p', isVowel: false, half: 'nz', phonics: '/p/' },
    { letter: 'Q', lower: 'q', isVowel: false, half: 'nz', phonics: '/kw/' },
    { letter: 'R', lower: 'r', isVowel: false, half: 'nz', phonics: '/r/' },
    { letter: 'S', lower: 's', isVowel: false, half: 'nz', phonics: '/s/' },
    { letter: 'T', lower: 't', isVowel: false, half: 'nz', phonics: '/t/' },
    { letter: 'U', lower: 'u', isVowel: true,  half: 'nz', phonics: '/ʌ/' },
    { letter: 'V', lower: 'v', isVowel: false, half: 'nz', phonics: '/v/' },
    { letter: 'W', lower: 'w', isVowel: false, half: 'nz', phonics: '/w/' },
    { letter: 'X', lower: 'x', isVowel: false, half: 'nz', phonics: '/ks/' },
    { letter: 'Y', lower: 'y', isVowel: false, half: 'nz', phonics: '/j/' },
    { letter: 'Z', lower: 'z', isVowel: false, half: 'nz', phonics: '/z/' },
  ];

  const ENGLISH_VOCAB_DB = {
    A: [
      { word: 'Apple',     zh: '蘋果',   emoji: '🍎', theme: '食物' },
      { word: 'Ant',       zh: '螞蟻',   emoji: '🐜', theme: '動物' },
      { word: 'Airplane',  zh: '飛機',   emoji: '✈️', theme: '交通' },
      { word: 'Alligator', zh: '鱷魚',   emoji: '🐊', theme: '動物' },
      { word: 'Avocado',   zh: '酪梨',   emoji: '🥑', theme: '食物' },
      { word: 'Astronaut', zh: '太空人', emoji: '👩‍🚀', theme: '人物' },
    ],
    B: [
      { word: 'Bear',      zh: '熊',     emoji: '🐻', theme: '動物' },
      { word: 'Banana',    zh: '香蕉',   emoji: '🍌', theme: '食物' },
      { word: 'Bus',       zh: '公車',   emoji: '🚌', theme: '交通' },
      { word: 'Bee',       zh: '蜜蜂',   emoji: '🐝', theme: '動物' },
      { word: 'Ball',      zh: '球',     emoji: '⚽', theme: '生活' },
      { word: 'Butterfly', zh: '蝴蝶',   emoji: '🦋', theme: '動物' },
    ],
    C: [
      { word: 'Cat',       zh: '貓咪',   emoji: '🐱', theme: '動物' },
      { word: 'Car',       zh: '汽車',   emoji: '🚗', theme: '交通' },
      { word: 'Cake',      zh: '蛋糕',   emoji: '🎂', theme: '食物' },
      { word: 'Cow',       zh: '乳牛',   emoji: '🐄', theme: '動物' },
      { word: 'Cookie',    zh: '餅乾',   emoji: '🍪', theme: '食物' },
      { word: 'Cloud',     zh: '雲朵',   emoji: '☁️', theme: '自然' },
    ],
    D: [
      { word: 'Dog',       zh: '狗狗',   emoji: '🐶', theme: '動物' },
      { word: 'Duck',      zh: '鴨子',   emoji: '🦆', theme: '動物' },
      { word: 'Dinosaur',  zh: '恐龍',   emoji: '🦖', theme: '動物' },
      { word: 'Donut',     zh: '甜甜圈', emoji: '🍩', theme: '食物' },
      { word: 'Dolphin',   zh: '海豚',   emoji: '🐬', theme: '動物' },
      { word: 'Drum',      zh: '鼓',     emoji: '🥁', theme: '生活' },
    ],
    E: [
      { word: 'Elephant',  zh: '大象',   emoji: '🐘', theme: '動物' },
      { word: 'Egg',       zh: '雞蛋',   emoji: '🥚', theme: '食物' },
      { word: 'Earth',     zh: '地球',   emoji: '🌍', theme: '自然' },
      { word: 'Eagle',     zh: '老鷹',   emoji: '🦅', theme: '動物' },
      { word: 'Ear',       zh: '耳朵',   emoji: '👂', theme: '人物' },
      { word: 'Eggplant',  zh: '茄子',   emoji: '🍆', theme: '食物' },
    ],
    F: [
      { word: 'Fish',      zh: '小魚',   emoji: '🐟', theme: '動物' },
      { word: 'Frog',      zh: '青蛙',   emoji: '🐸', theme: '動物' },
      { word: 'Flower',    zh: '花朵',   emoji: '🌸', theme: '自然' },
      { word: 'Fox',       zh: '狐狸',   emoji: '🦊', theme: '動物' },
      { word: 'Fire',      zh: '火焰',   emoji: '🔥', theme: '自然' },
      { word: 'Fries',     zh: '薯條',   emoji: '🍟', theme: '食物' },
    ],
    G: [
      { word: 'Grape',     zh: '葡萄',   emoji: '🍇', theme: '食物' },
      { word: 'Giraffe',   zh: '長頸鹿', emoji: '🦒', theme: '動物' },
      { word: 'Gift',      zh: '禮物',   emoji: '🎁', theme: '生活' },
      { word: 'Guitar',    zh: '吉他',   emoji: '🎸', theme: '生活' },
      { word: 'Ghost',     zh: '小幽靈', emoji: '👻', theme: '生活' },
      { word: 'Gorilla',   zh: '大猩猩', emoji: '🦍', theme: '動物' },
    ],
    H: [
      { word: 'Hat',       zh: '帽子',   emoji: '🎩', theme: '生活' },
      { word: 'House',     zh: '房子',   emoji: '🏠', theme: '生活' },
      { word: 'Horse',     zh: '馬',     emoji: '🐴', theme: '動物' },
      { word: 'Heart',     zh: '愛心',   emoji: '❤️', theme: '生活' },
      { word: 'Hamburger', zh: '漢堡',   emoji: '🍔', theme: '食物' },
      { word: 'Honey',     zh: '蜂蜜',   emoji: '🍯', theme: '食物' },
    ],
    I: [
      { word: 'Ice cream', zh: '冰淇淋', emoji: '🍦', theme: '食物' },
      { word: 'Ice',       zh: '冰塊',   emoji: '🧊', theme: '自然' },
      { word: 'Island',    zh: '小島',   emoji: '🏝️', theme: '自然' },
      { word: 'Insect',    zh: '昆蟲',   emoji: '🐞', theme: '動物' },
      { word: 'Igloo',     zh: '冰屋',   emoji: '🏠', theme: '生活' },
    ],
    J: [
      { word: 'Juice',     zh: '果汁',   emoji: '🧃', theme: '食物' },
      { word: 'Jellyfish', zh: '水母',   emoji: '🪼', theme: '動物' },
      { word: 'Jacket',    zh: '外套',   emoji: '🧥', theme: '生活' },
      { word: 'Jam',       zh: '果醬',   emoji: '🍓', theme: '食物' },
      { word: 'Jet',       zh: '噴射機', emoji: '🛩️', theme: '交通' },
    ],
    K: [
      { word: 'Kite',      zh: '風箏',   emoji: '🪁', theme: '生活' },
      { word: 'King',      zh: '國王',   emoji: '🤴', theme: '人物' },
      { word: 'Key',       zh: '鑰匙',   emoji: '🔑', theme: '生活' },
      { word: 'Koala',     zh: '無尾熊', emoji: '🐨', theme: '動物' },
      { word: 'Kiwi',      zh: '奇異果', emoji: '🥝', theme: '食物' },
      { word: 'Kangaroo',  zh: '袋鼠',   emoji: '🦘', theme: '動物' },
    ],
    L: [
      { word: 'Lion',      zh: '獅子',   emoji: '🦁', theme: '動物' },
      { word: 'Lemon',     zh: '檸檬',   emoji: '🍋', theme: '食物' },
      { word: 'Leaf',      zh: '樹葉',   emoji: '🍃', theme: '自然' },
      { word: 'Lollipop',  zh: '棒棒糖', emoji: '🍭', theme: '食物' },
      { word: 'Lamp',      zh: '電燈',   emoji: '💡', theme: '生活' },
      { word: 'Ladybug',   zh: '瓢蟲',   emoji: '🐞', theme: '動物' },
    ],
    M: [
      { word: 'Monkey',    zh: '猴子',   emoji: '🐵', theme: '動物' },
      { word: 'Moon',      zh: '月亮',   emoji: '🌙', theme: '自然' },
      { word: 'Milk',      zh: '牛奶',   emoji: '🥛', theme: '食物' },
      { word: 'Mouse',     zh: '老鼠',   emoji: '🐭', theme: '動物' },
      { word: 'Mango',     zh: '芒果',   emoji: '🥭', theme: '食物' },
      { word: 'Mushroom',  zh: '蘑菇',   emoji: '🍄', theme: '食物' },
    ],
    N: [
      { word: 'Nest',      zh: '鳥巢',   emoji: '🪺', theme: '自然' },
      { word: 'Nose',      zh: '鼻子',   emoji: '👃', theme: '人物' },
      { word: 'Noodle',    zh: '麵條',   emoji: '🍜', theme: '食物' },
      { word: 'Nut',       zh: '堅果',   emoji: '🥜', theme: '食物' },
      { word: 'Notebook',  zh: '筆記本', emoji: '📓', theme: '生活' },
      { word: 'Night',     zh: '夜晚',   emoji: '🌃', theme: '自然' },
    ],
    O: [
      { word: 'Orange',    zh: '橘子',   emoji: '🍊', theme: '食物' },
      { word: 'Octopus',   zh: '章魚',   emoji: '🐙', theme: '動物' },
      { word: 'Owl',       zh: '貓頭鷹', emoji: '🦉', theme: '動物' },
      { word: 'Onion',     zh: '洋蔥',   emoji: '🧅', theme: '食物' },
      { word: 'Ocean',     zh: '大海',   emoji: '🌊', theme: '自然' },
    ],
    P: [
      { word: 'Pig',       zh: '小豬',   emoji: '🐷', theme: '動物' },
      { word: 'Panda',     zh: '熊貓',   emoji: '🐼', theme: '動物' },
      { word: 'Penguin',   zh: '企鵝',   emoji: '🐧', theme: '動物' },
      { word: 'Pizza',     zh: '披薩',   emoji: '🍕', theme: '食物' },
      { word: 'Peach',     zh: '桃子',   emoji: '🍑', theme: '食物' },
      { word: 'Pencil',    zh: '鉛筆',   emoji: '✏️', theme: '生活' },
    ],
    Q: [
      { word: 'Queen',     zh: '皇后',   emoji: '👸', theme: '人物' },
      { word: 'Question',  zh: '問題',   emoji: '❓', theme: '生活' },
      { word: 'Quiet',     zh: '安靜',   emoji: '🤫', theme: '人物' },
      { word: 'Quilt',     zh: '棉被',   emoji: '🛏️', theme: '生活' },
      { word: 'Quarter',   zh: '硬幣',   emoji: '🪙', theme: '生活' },
    ],
    R: [
      { word: 'Rabbit',    zh: '兔子',   emoji: '🐰', theme: '動物' },
      { word: 'Rainbow',   zh: '彩虹',   emoji: '🌈', theme: '自然' },
      { word: 'Robot',     zh: '機器人', emoji: '🤖', theme: '生活' },
      { word: 'Rocket',    zh: '火箭',   emoji: '🚀', theme: '交通' },
      { word: 'Rose',      zh: '玫瑰',   emoji: '🌹', theme: '自然' },
      { word: 'Rice',      zh: '米飯',   emoji: '🍚', theme: '食物' },
    ],
    S: [
      { word: 'Sun',        zh: '太陽',   emoji: '☀️', theme: '自然' },
      { word: 'Star',       zh: '星星',   emoji: '⭐', theme: '自然' },
      { word: 'Strawberry', zh: '草莓',   emoji: '🍓', theme: '食物' },
      { word: 'Snake',      zh: '蛇',     emoji: '🐍', theme: '動物' },
      { word: 'Shark',      zh: '鯊魚',   emoji: '🦈', theme: '動物' },
      { word: 'Snowman',    zh: '雪人',   emoji: '⛄', theme: '自然' },
    ],
    T: [
      { word: 'Tiger',     zh: '老虎',   emoji: '🐯', theme: '動物' },
      { word: 'Tree',      zh: '大樹',   emoji: '🌳', theme: '自然' },
      { word: 'Train',     zh: '火車',   emoji: '🚂', theme: '交通' },
      { word: 'Turtle',    zh: '烏龜',   emoji: '🐢', theme: '動物' },
      { word: 'Tomato',    zh: '番茄',   emoji: '🍅', theme: '食物' },
      { word: 'Truck',     zh: '卡車',   emoji: '🚚', theme: '交通' },
    ],
    U: [
      { word: 'Umbrella',  zh: '雨傘',   emoji: '☂️', theme: '生活' },
      { word: 'Unicorn',   zh: '獨角獸', emoji: '🦄', theme: '動物' },
      { word: 'Up',        zh: '向上',   emoji: '⬆️', theme: '生活' },
      { word: 'Uniform',   zh: '制服',   emoji: '👕', theme: '生活' },
      { word: 'UFO',       zh: '飛碟',   emoji: '🛸', theme: '交通' },
    ],
    V: [
      { word: 'Violin',    zh: '小提琴', emoji: '🎻', theme: '生活' },
      { word: 'Van',       zh: '廂型車', emoji: '🚐', theme: '交通' },
      { word: 'Volcano',   zh: '火山',   emoji: '🌋', theme: '自然' },
      { word: 'Vegetable', zh: '蔬菜',   emoji: '🥦', theme: '食物' },
      { word: 'Vest',      zh: '背心',   emoji: '🦺', theme: '生活' },
    ],
    W: [
      { word: 'Whale',      zh: '鯨魚',   emoji: '🐳', theme: '動物' },
      { word: 'Watermelon', zh: '西瓜',   emoji: '🍉', theme: '食物' },
      { word: 'Watch',      zh: '手錶',   emoji: '⌚', theme: '生活' },
      { word: 'Wolf',       zh: '狼',     emoji: '🐺', theme: '動物' },
      { word: 'Water',      zh: '水滴',   emoji: '💧', theme: '自然' },
      { word: 'Waffle',     zh: '鬆餅',   emoji: '🧇', theme: '食物' },
    ],
    X: [
      { word: 'Xylophone', zh: '木琴',   emoji: '🎹', theme: '生活' },
      { word: 'X-ray',     zh: 'X光',    emoji: '🩻', theme: '生活' },
      { word: 'Xmas',      zh: '聖誕節', emoji: '🎄', theme: '生活' },
      { word: 'Box',       zh: '盒子',   emoji: '📦', theme: '生活' },
      { word: 'Fox',       zh: '狐狸',   emoji: '🦊', theme: '動物' },
    ],
    Y: [
      { word: 'Yo-yo',     zh: '溜溜球', emoji: '🪀', theme: '生活' },
      { word: 'Yacht',     zh: '遊艇',   emoji: '🛥️', theme: '交通' },
      { word: 'Yellow',    zh: '黃色',   emoji: '💛', theme: '自然' },
      { word: 'Yarn',      zh: '毛線球', emoji: '🧶', theme: '生活' },
      { word: 'Yawn',      zh: '打哈欠', emoji: '🥱', theme: '人物' },
    ],
    Z: [
      { word: 'Zebra',     zh: '斑馬',   emoji: '🦓', theme: '動物' },
      { word: 'Zoo',       zh: '動物園', emoji: '🦒', theme: '生活' },
      { word: 'Zero',      zh: '數字零', emoji: '0️⃣', theme: '生活' },
      { word: 'Zipper',    zh: '拉鍊',   emoji: '🤐', theme: '生活' },
      { word: 'Zombie',    zh: '小殭屍', emoji: '🧟', theme: '人物' },
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

  function createSmartDeck(items) {
    let bag = shuffleArray(items);
    return {
      draw(excludeKeyFn = null) {
        if (bag.length === 0) bag = shuffleArray(items);
        if (excludeKeyFn && bag.length > 1) {
          const idx = bag.findIndex((it) => !excludeKeyFn(it));
          if (idx >= 0) return bag.splice(idx, 1)[0];
        }
        return bag.pop();
      },
      drawBatch(count, uniqueLetter = true) {
        const result = [];
        const used = new Set();
        let guard = 0;
        const maxGuard = Math.max(40, count * 8);
        while (result.length < count && guard < maxGuard) {
          guard++;
          const picked = this.draw(uniqueLetter ? (it) => used.has(it.letter) : null);
          if (!picked) break;
          if (uniqueLetter && used.has(picked.letter)) continue;
          used.add(picked.letter);
          result.push(picked);
        }
        return result;
      },
    };
  }

  function getWords(letter) {
    return ENGLISH_VOCAB_DB[letter] || [];
  }

  function getTotalWordCount() {
    return Object.values(ENGLISH_VOCAB_DB).reduce((sum, list) => sum + list.length, 0);
  }

  function getEntriesForLetters(letterItems) {
    const entries = [];
    letterItems.forEach((item) => {
      const words = ENGLISH_VOCAB_DB[item.letter] || [];
      words.forEach((w) => {
        entries.push({
          letter: item.letter,
          lower: item.lower,
          isVowel: item.isVowel,
          half: item.half,
          phonics: item.phonics,
          word: w.word,
          zh: w.zh,
          emoji: w.emoji,
          theme: w.theme,
        });
      });
    });
    return entries;
  }

  window.EnglishDB = {
    ENGLISH_LETTERS,
    ENGLISH_VOCAB_DB,
    getWords,
    getTotalWordCount,
    getEntriesForLetters,
    createSmartDeck,
    shuffleArray,
  };
})();
