import { parseBirthDate, toUtc } from '../utils/date.js';
import { buildSajuProfile } from '../domain/analysis.js';
import { fetchLunarBySolar, fetchSolarByLunar } from '../services/kasiClient.js';
import { convertSolarToLunarOffline, convertLunarToSolarOffline } from '../services/offlineLunar.js';

function writeJson(res, statusCode, payload) {
  const data = JSON.stringify(payload, null, 2);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(data, 'utf8')
  });
  res.end(data);
}

function validatePayload(body) {
  const requiredFields = ['date', 'time', 'timezone', 'gender'];
  for (const field of requiredFields) {
    if (!body[field]) {
      throw new Error(`필수 입력 ${field}가 누락되었습니다.`);
    }
  }
  if (body.calendarType && !['solar', 'lunar'].includes(body.calendarType)) {
    throw new Error('calendarType은 solar 또는 lunar 여야 합니다.');
  }
  if (!['male', 'female'].includes(body.gender)) {
    throw new Error('gender는 male 또는 female 이어야 합니다.');
  }
}

async function resolveConversion(payload, utcBirth) {
  const calendarType = payload.calendarType || 'solar';
  if (calendarType === 'solar') {
    const { year, month, day } = parseBirthDate(payload.date, payload.time);
    try {
      return await fetchLunarBySolar({ year, month, day, utcBirth });
    } catch (error) {
      return convertSolarToLunarOffline({ utcBirth });
    }
  }
  const { year, month, day } = payload.lunarDate || {};
  if (!year || !month || !day) {
    return convertLunarToSolarOffline({ utcBirth });
  }
  try {
    return await fetchSolarByLunar({
      year,
      month,
      day,
      isLeapMonth: Boolean(payload.isLeapMonth),
      utcBirth
    });
  } catch (error) {
    return convertLunarToSolarOffline({ utcBirth });
  }
}

export function createSajuHandler() {
  return async function handleRequest(req, res) {
    if (req.method !== 'POST') {
      writeJson(res, 405, { message: 'POST 메서드만 지원합니다.' });
      return;
    }

    let rawBody = '';
    req.on('data', (chunk) => {
      rawBody += chunk;
      if (rawBody.length > 1_000_000) {
        req.destroy();
      }
    });

    req.on('end', async () => {
      try {
        const body = rawBody ? JSON.parse(rawBody) : {};
        validatePayload(body);
        const birthParts = parseBirthDate(body.date, body.time);
        const utcBirth = toUtc(birthParts, body.timezone);
        const conversion = await resolveConversion({ ...body }, utcBirth);
        const saju = buildSajuProfile({ conversion, utcBirth, gender: body.gender });
        writeJson(res, 200, {
          input: body,
          conversion,
          saju
        });
      } catch (error) {
        writeJson(res, 400, { message: error.message });
      }
    });
  };
}

export function createHealthHandler() {
  return function handleHealth(req, res) {
    if (req.method !== 'GET') {
      writeJson(res, 405, { message: 'GET 메서드만 지원합니다.' });
      return;
    }
    writeJson(res, 200, { status: 'ok' });
  };
}
