import { HEAVENLY_STEMS, EARTHLY_BRANCHES, CHANGSAENG_BASE, TWELVE_STAGE_SEQUENCE } from '../constants.js';
import { formatDateParts, formatIso } from '../utils/date.js';

const KST_OFFSET = 9 * 60 * 60000;

function toJulianDay(date) {
  let year = date.getUTCFullYear();
  let month = date.getUTCMonth() + 1;
  const day = date.getUTCDate();
  const hour = date.getUTCHours();
  const minute = date.getUTCMinutes();
  const second = date.getUTCSeconds();

  const a = Math.floor((14 - month) / 12);
  year = year + 4800 - a;
  month = month + 12 * a - 3;
  let jd = day + Math.floor((153 * month + 2) / 5) + 365 * year + Math.floor(year / 4) - Math.floor(year / 100) + Math.floor(year / 400) - 32045;
  const dayFraction = (hour - 12) / 24 + minute / 1440 + second / 86400;
  return jd + dayFraction;
}

function getStem(index) {
  return HEAVENLY_STEMS[(index + 10) % 10];
}

function getBranch(index) {
  return EARTHLY_BRANCHES[(index + 12) % 12];
}

function buildPillar(stemIndex, branchIndex) {
  const stem = getStem(stemIndex);
  const branch = getBranch(branchIndex);
  return {
    stem: stem.symbol,
    stemHanja: stem.hanja,
    branch: branch.symbol,
    branchHanja: branch.hanja,
    stemElement: stem.element,
    branchElement: branch.element,
    stemYinYang: stem.yinYang,
    branchYinYang: branch.yinYang,
    labelKo: `${stem.symbol}${branch.symbol}`,
    labelHanja: `${stem.hanja}${branch.hanja}`
  };
}

function getYearIndex(localDate) {
  const year = localDate.getUTCFullYear();
  const lichun = Date.UTC(year, 1, 4); // Feb 4 00:00 (KST representation)
  const timeValue = localDate.getTime();
  const effectiveYear = timeValue < lichun ? year - 1 : year;
  const cycleIndex = ((effectiveYear - 4) % 60 + 60) % 60;
  return cycleIndex;
}

const MONTH_BRANCH_TRANSITIONS = [
  { month: 1, day: 5, branchIndex: 1 },
  { month: 2, day: 4, branchIndex: 2 },
  { month: 3, day: 6, branchIndex: 3 },
  { month: 4, day: 5, branchIndex: 4 },
  { month: 5, day: 6, branchIndex: 5 },
  { month: 6, day: 6, branchIndex: 6 },
  { month: 7, day: 7, branchIndex: 7 },
  { month: 8, day: 8, branchIndex: 8 },
  { month: 9, day: 8, branchIndex: 9 },
  { month: 10, day: 8, branchIndex: 10 },
  { month: 11, day: 7, branchIndex: 11 },
  { month: 12, day: 7, branchIndex: 0 }
];

function buildMonthCheckpoints(year) {
  const checkpoints = [
    { time: Date.UTC(year - 1, 11, 7), branchIndex: 0 }
  ];
  for (const entry of MONTH_BRANCH_TRANSITIONS) {
    checkpoints.push({
      time: Date.UTC(year, entry.month - 1, entry.day),
      branchIndex: entry.branchIndex
    });
  }
  checkpoints.push({ time: Date.UTC(year + 1, 0, 5), branchIndex: 1 });
  return checkpoints;
}

function selectMonthCheckpoint(localDate, checkpoints) {
  let candidate = checkpoints[0];
  for (const point of checkpoints) {
    if (localDate.getTime() >= point.time) {
      candidate = point;
    }
  }
  return candidate;
}

function getMonthBranchIndex(localDate) {
  const checkpoints = buildMonthCheckpoints(localDate.getUTCFullYear());
  return selectMonthCheckpoint(localDate, checkpoints).branchIndex;
}

function getMonthIndex(localDate, yearStemIndex) {
  const branchIndex = getMonthBranchIndex(localDate);
  const lunarMonthIndex = (branchIndex + 10) % 12;
  const stemIndex = (yearStemIndex * 2 + lunarMonthIndex + 2) % 10;
  return { stemIndex, branchIndex };
}

function getDayIndex(localDate) {
  const jd = Math.floor(toJulianDay(localDate) + 0.5);
  return ((jd + 49) % 60 + 60) % 60;
}

function getHourBranchIndex(localDate) {
  const hour = localDate.getUTCHours();
  const minute = localDate.getUTCMinutes();
  const totalMinutes = hour * 60 + minute;
  const index = Math.floor((totalMinutes + 60) / 120) % 12;
  return (index + 12) % 12;
}

export function buildConversionResult({ utcBirth, source }) {
  const localKst = new Date(utcBirth.getTime() + KST_OFFSET);
  const dayCycleIndex = getDayIndex(localKst);
  const yearCycleIndex = getYearIndex(localKst);
  const yearStemIndex = yearCycleIndex % 10;
  const yearBranchIndex = yearCycleIndex % 12;

  const { stemIndex: monthStemIndex, branchIndex: monthBranchIndex } = getMonthIndex(localKst, yearStemIndex);
  const dayStemIndex = dayCycleIndex % 10;
  const dayBranchIndex = dayCycleIndex % 12;

  const pillars = {
    year: buildPillar(yearStemIndex, yearBranchIndex),
    month: buildPillar(monthStemIndex, monthBranchIndex),
    day: buildPillar(dayStemIndex, dayBranchIndex)
  };

  return {
    solar: {
      ...formatDateParts(utcBirth),
      isoString: formatIso(utcBirth)
    },
    lunar: {
      ...formatDateParts(localKst),
      isLeapMonth: false
    },
    pillars,
    metadata: {
      source
    }
  };
}

export function getHourPillar(conversion, utcBirth) {
  const localKst = new Date(utcBirth.getTime() + KST_OFFSET);
  const dayStem = conversion.pillars.day.stem;
  const dayStemIndex = HEAVENLY_STEMS.findIndex((stem) => stem.symbol === dayStem);
  const branchIndex = getHourBranchIndex(localKst);
  const stemIndex = (dayStemIndex * 2 + branchIndex) % 10;
  return buildPillar(stemIndex, branchIndex);
}

export function getTwelveStage(dayStemSymbol, branchSymbol) {
  const baseBranch = CHANGSAENG_BASE[dayStemSymbol];
  if (!baseBranch) {
    return '미정';
  }
  const baseIndex = EARTHLY_BRANCHES.findIndex((b) => b.symbol === baseBranch);
  const branchIndex = EARTHLY_BRANCHES.findIndex((b) => b.symbol === branchSymbol);
  if (baseIndex === -1 || branchIndex === -1) {
    return '미정';
  }
  const diff = (branchIndex - baseIndex + 12) % 12;
  return TWELVE_STAGE_SEQUENCE[diff];
}

export function getMonthBranchInfo(localDate) {
  const checkpoints = buildMonthCheckpoints(localDate.getUTCFullYear());
  const current = selectMonthCheckpoint(localDate, checkpoints);
  const currentIndex = checkpoints.indexOf(current);
  const next = checkpoints[(currentIndex + 1) % checkpoints.length];
  return {
    branchIndex: current.branchIndex,
    nextBoundary: next.time
  };
}
