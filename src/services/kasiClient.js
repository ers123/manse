import { HEAVENLY_STEMS, EARTHLY_BRANCHES } from '../constants.js';
import { formatIso } from '../utils/date.js';

const BASE_URL = 'https://apis.data.go.kr/B090041/openapi/service/LrsrCldInfoService';

function extractTag(xml, tag) {
  const regex = new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`);
  const match = xml.match(regex);
  return match ? match[1].trim() : null;
}

function parseItem(xml) {
  const itemMatch = xml.match(/<item>([\s\S]*?)<\/item>/);
  return itemMatch ? itemMatch[1] : null;
}

function parsePillar(text) {
  if (!text) {
    return null;
  }
  const trimmed = text.trim();
  const match = trimmed.match(/^([가-힣]{2})\((.{2})\)$/);
  if (match) {
    const [stemKo, branchKo] = match[1].split('');
    const [stemHanja, branchHanja] = match[2].split('');
    return { stemKo, branchKo, stemHanja, branchHanja };
  }
  const [stemKo, branchKo] = trimmed.slice(0, 2).split('');
  return { stemKo, branchKo, stemHanja: '', branchHanja: '' };
}

function buildPillarFromSymbols(stemSymbol, branchSymbol) {
  const stem = HEAVENLY_STEMS.find((item) => item.symbol === stemSymbol);
  const branch = EARTHLY_BRANCHES.find((item) => item.symbol === branchSymbol);
  if (!stem || !branch) {
    return null;
  }
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

function parseConversion(xml, utcBirth) {
  const item = parseItem(xml);
  if (!item) {
    throw new Error('KASI 응답에 item이 없습니다.');
  }
  const solYear = Number(extractTag(item, 'solYear'));
  const solMonth = Number(extractTag(item, 'solMonth'));
  const solDay = Number(extractTag(item, 'solDay'));
  const lunYear = Number(extractTag(item, 'lunYear'));
  const lunMonth = Number(extractTag(item, 'lunMonth'));
  const lunDay = Number(extractTag(item, 'lunDay'));
  const lunLeapmonth = extractTag(item, 'lunLeapmonth') === '윤';

  const yearPillarRaw = parsePillar(extractTag(item, 'lunSecha'));
  const monthPillarRaw = parsePillar(extractTag(item, 'lunWolgeon'));
  const dayPillarRaw = parsePillar(extractTag(item, 'lunIljin'));

  const yearPillar = yearPillarRaw ? buildPillarFromSymbols(yearPillarRaw.stemKo, yearPillarRaw.branchKo) : null;
  const monthPillar = monthPillarRaw ? buildPillarFromSymbols(monthPillarRaw.stemKo, monthPillarRaw.branchKo) : null;
  const dayPillar = dayPillarRaw ? buildPillarFromSymbols(dayPillarRaw.stemKo, dayPillarRaw.branchKo) : null;

  if (!yearPillar || !monthPillar || !dayPillar) {
    throw new Error('KASI 응답에서 기둥 정보를 파싱하지 못했습니다.');
  }

  return {
    solar: {
      year: solYear,
      month: solMonth,
      day: solDay,
      isoString: formatIso(utcBirth)
    },
    lunar: {
      year: lunYear,
      month: lunMonth,
      day: lunDay,
      isLeapMonth: lunLeapmonth
    },
    pillars: {
      year: yearPillar,
      month: monthPillar,
      day: dayPillar
    },
    metadata: {
      source: 'kasi',
      raw: item
    }
  };
}

async function requestKasi(endpoint, params) {
  const apiKey = process.env.KASI_API_KEY;
  if (!apiKey) {
    throw new Error('KASI_API_KEY가 설정되어 있지 않습니다.');
  }
  const url = new URL(`${BASE_URL}/${endpoint}`);
  url.searchParams.set('serviceKey', apiKey);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, String(value));
  }
  url.searchParams.set('numOfRows', '10');
  url.searchParams.set('pageNo', '1');

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`KASI 호출 실패: ${response.status}`);
  }
  const text = await response.text();
  const resultCode = extractTag(text, 'resultCode');
  if (resultCode && resultCode !== '00') {
    const resultMsg = extractTag(text, 'resultMsg');
    throw new Error(`KASI 오류: ${resultCode} ${resultMsg || ''}`.trim());
  }
  return text;
}

export async function fetchLunarBySolar({ year, month, day, utcBirth }) {
  const xml = await requestKasi('getLunCalInfo', {
    solYear: year,
    solMonth: month,
    solDay: day
  });
  return parseConversion(xml, utcBirth);
}

export async function fetchSolarByLunar({ year, month, day, isLeapMonth, utcBirth }) {
  const xml = await requestKasi('getSolCalInfo', {
    lunYear: year,
    lunMonth: month,
    lunDay: day,
    lunLeapmonth: isLeapMonth ? '윤' : '평'
  });
  return parseConversion(xml, utcBirth);
}
