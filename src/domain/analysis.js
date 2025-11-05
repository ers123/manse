import { ELEMENTS, HEAVENLY_STEMS, EARTHLY_BRANCHES, TEN_GOD_NAMES, GENDER_VALUES } from '../constants.js';
import { getHourPillar, getMonthBranchInfo, getTwelveStage } from './pillars.js';

function elementIndex(element) {
  return ELEMENTS.indexOf(element);
}

function wrapIndex(value, length) {
  return ((value % length) + length) % length;
}

function classifyTenGod(dayStem, targetStem) {
  if (dayStem.symbol === targetStem.symbol) {
    return dayStem.yinYang === targetStem.yinYang ? TEN_GOD_NAMES.selfYang : TEN_GOD_NAMES.selfYin;
  }

  const dayElementIndex = elementIndex(dayStem.element);
  const targetElementIndex = elementIndex(targetStem.element);
  const diff = wrapIndex(targetElementIndex - dayElementIndex, ELEMENTS.length);

  if (diff === 1) {
    return dayStem.yinYang === targetStem.yinYang ? TEN_GOD_NAMES.outputYang : TEN_GOD_NAMES.outputYin;
  }
  if (diff === 2) {
    return dayStem.yinYang === targetStem.yinYang ? TEN_GOD_NAMES.wealthYang : TEN_GOD_NAMES.wealthYin;
  }
  if (diff === 3) {
    return dayStem.yinYang === targetStem.yinYang ? TEN_GOD_NAMES.powerYang : TEN_GOD_NAMES.powerYin;
  }
  if (diff === 4) {
    return dayStem.yinYang === targetStem.yinYang ? TEN_GOD_NAMES.resourceYang : TEN_GOD_NAMES.resourceYin;
  }
  return '미정';
}

function countElementsFromPillar(pillar, counts) {
  counts[pillar.stemElement] += 1;
  counts[pillar.branchElement] += 1;
}

function buildFiveElementCounts(pillars) {
  const counts = {
    wood: 0,
    fire: 0,
    earth: 0,
    metal: 0,
    water: 0
  };
  countElementsFromPillar(pillars.year, counts);
  countElementsFromPillar(pillars.month, counts);
  countElementsFromPillar(pillars.day, counts);
  if (pillars.hour) {
    countElementsFromPillar(pillars.hour, counts);
  }
  return counts;
}

function buildTenGods(dayStemSymbol, pillars) {
  const dayStem = HEAVENLY_STEMS.find((stem) => stem.symbol === dayStemSymbol);
  if (!dayStem) {
    return {};
  }
  const result = {};
  for (const [key, pillar] of Object.entries(pillars)) {
    if (key === 'day') {
      result[key] = '본원';
    } else {
      const stem = HEAVENLY_STEMS.find((item) => item.symbol === pillar.stem);
      result[key] = stem ? classifyTenGod(dayStem, stem) : '미정';
    }
  }
  return result;
}

function buildTwelveStages(dayStemSymbol, pillars) {
  const result = {};
  for (const [key, pillar] of Object.entries(pillars)) {
    result[key] = getTwelveStage(dayStemSymbol, pillar.branch);
  }
  return result;
}

function determineDirection(yearStemSymbol, gender) {
  const yearStem = HEAVENLY_STEMS.find((stem) => stem.symbol === yearStemSymbol);
  if (!yearStem || !GENDER_VALUES.includes(gender)) {
    return 'forward';
  }
  const isYangYear = yearStem.yinYang === 'yang';
  const isMale = gender === 'male';
  return (isYangYear && isMale) || (!isYangYear && !isMale) ? 'forward' : 'reverse';
}

function computeStartAge(localKst, branchInfo) {
  const diffMs = branchInfo.nextBoundary - localKst.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  const startAge = Math.max(1, Math.round(diffDays / 3));
  return startAge;
}

function buildGreatFortune({ conversion, utcBirth, gender, hourPillar }) {
  const localKst = new Date(utcBirth.getTime() + 9 * 60 * 60000);
  const branchInfo = getMonthBranchInfo(localKst);
  const direction = determineDirection(conversion.pillars.year.stem, gender);
  const startAge = computeStartAge(localKst, branchInfo);
  const cycles = [];
  const baseIndex = (branchInfo.branchIndex + (direction === 'forward' ? 1 : -1) + 12) % 12;
  const baseStemIndex = (HEAVENLY_STEMS.findIndex((stem) => stem.symbol === conversion.pillars.month.stem) + (direction === 'forward' ? 1 : -1) + 10) % 10;

  for (let i = 0; i < 8; i += 1) {
    const stemIndex = (baseStemIndex + (direction === 'forward' ? i : -i) + 10 * 10) % 10;
    const branchIndex = (baseIndex + (direction === 'forward' ? i : -i) + 12 * 12) % 12;
    cycles.push({
      order: i + 1,
      startAge: startAge + i * 10,
      pillar: `${HEAVENLY_STEMS[stemIndex].symbol}${EARTHLY_BRANCHES[branchIndex].symbol}`,
      pillarHanja: `${HEAVENLY_STEMS[stemIndex].hanja}${EARTHLY_BRANCHES[branchIndex].hanja}`,
      startYearOffset: startAge + i * 10
    });
  }

  return { direction, startAge, cycles };
}

export function buildSajuProfile({ conversion, utcBirth, gender }) {
  const hourPillar = getHourPillar(conversion, utcBirth);
  const pillars = { ...conversion.pillars, hour: hourPillar };
  const fiveElements = buildFiveElementCounts(pillars);
  const tenGods = buildTenGods(conversion.pillars.day.stem, pillars);
  const twelveStages = buildTwelveStages(conversion.pillars.day.stem, pillars);
  const greatFortune = buildGreatFortune({ conversion, utcBirth, gender, hourPillar });
  return {
    pillars,
    fiveElements,
    tenGods,
    twelveStages,
    greatFortune
  };
}
