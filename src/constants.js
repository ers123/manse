export const HEAVENLY_STEMS = [
  { symbol: '갑', hanja: '甲', element: 'wood', yinYang: 'yang' },
  { symbol: '을', hanja: '乙', element: 'wood', yinYang: 'yin' },
  { symbol: '병', hanja: '丙', element: 'fire', yinYang: 'yang' },
  { symbol: '정', hanja: '丁', element: 'fire', yinYang: 'yin' },
  { symbol: '무', hanja: '戊', element: 'earth', yinYang: 'yang' },
  { symbol: '기', hanja: '己', element: 'earth', yinYang: 'yin' },
  { symbol: '경', hanja: '庚', element: 'metal', yinYang: 'yang' },
  { symbol: '신', hanja: '辛', element: 'metal', yinYang: 'yin' },
  { symbol: '임', hanja: '壬', element: 'water', yinYang: 'yang' },
  { symbol: '계', hanja: '癸', element: 'water', yinYang: 'yin' }
];

export const EARTHLY_BRANCHES = [
  { symbol: '자', hanja: '子', element: 'water', yinYang: 'yang', hours: [23, 1] },
  { symbol: '축', hanja: '丑', element: 'earth', yinYang: 'yin', hours: [1, 3] },
  { symbol: '인', hanja: '寅', element: 'wood', yinYang: 'yang', hours: [3, 5] },
  { symbol: '묘', hanja: '卯', element: 'wood', yinYang: 'yin', hours: [5, 7] },
  { symbol: '진', hanja: '辰', element: 'earth', yinYang: 'yang', hours: [7, 9] },
  { symbol: '사', hanja: '巳', element: 'fire', yinYang: 'yin', hours: [9, 11] },
  { symbol: '오', hanja: '午', element: 'fire', yinYang: 'yang', hours: [11, 13] },
  { symbol: '미', hanja: '未', element: 'earth', yinYang: 'yin', hours: [13, 15] },
  { symbol: '신', hanja: '申', element: 'metal', yinYang: 'yang', hours: [15, 17] },
  { symbol: '유', hanja: '酉', element: 'metal', yinYang: 'yin', hours: [17, 19] },
  { symbol: '술', hanja: '戌', element: 'earth', yinYang: 'yang', hours: [19, 21] },
  { symbol: '해', hanja: '亥', element: 'water', yinYang: 'yin', hours: [21, 23] }
];

export const ELEMENTS = ['wood', 'fire', 'earth', 'metal', 'water'];

export const TEN_GOD_NAMES = {
  selfYang: '비견',
  selfYin: '겁재',
  outputYang: '식신',
  outputYin: '상관',
  wealthYang: '편재',
  wealthYin: '정재',
  powerYang: '편관',
  powerYin: '정관',
  resourceYang: '편인',
  resourceYin: '정인'
};

export const TWELVE_STAGE_SEQUENCE = [
  '장생',
  '목욕',
  '관대',
  '임관',
  '제왕',
  '쇠',
  '병',
  '사',
  '묘',
  '절',
  '태',
  '양'
];

export const CHANGSAENG_BASE = {
  갑: '해',
  을: '오',
  병: '인',
  정: '신',
  무: '인',
  기: '신',
  경: '사',
  신: '해',
  임: '신',
  계: '인'
};

export const GENDER_VALUES = ['male', 'female'];
