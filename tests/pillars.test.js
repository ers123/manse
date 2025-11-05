import test from 'node:test';
import assert from 'node:assert/strict';
import { buildConversionResult } from '../src/domain/pillars.js';
import { buildSajuProfile } from '../src/domain/analysis.js';

test('buildConversionResult matches PRD example', () => {
  const birthUtc = new Date(Date.UTC(2023, 0, 19, 22, 30));
  const conversion = buildConversionResult({ utcBirth: birthUtc, source: 'test' });
  assert.equal(conversion.pillars.year.labelKo, '임인');
  assert.equal(conversion.pillars.month.labelKo, '계축');
  assert.equal(conversion.pillars.day.labelKo, '무인');
});

test('saju profile calculates hour pillar and derived data', () => {
  const birthUtc = new Date(Date.UTC(2023, 0, 19, 22, 30));
  const conversion = buildConversionResult({ utcBirth: birthUtc, source: 'test' });
  const saju = buildSajuProfile({ conversion, utcBirth: birthUtc, gender: 'male' });
  assert.equal(saju.pillars.hour.labelKo, '병진');
  assert.deepEqual(saju.fiveElements, {
    wood: 2,
    fire: 1,
    earth: 3,
    metal: 0,
    water: 2
  });
  assert.equal(saju.tenGods.year, '편재');
  assert.equal(saju.tenGods.month, '정재');
  assert.equal(saju.tenGods.hour, '편인');
  assert.equal(saju.twelveStages.year, '장생');
  assert.equal(saju.greatFortune.direction, 'forward');
  assert.equal(saju.greatFortune.startAge, 5);
});
