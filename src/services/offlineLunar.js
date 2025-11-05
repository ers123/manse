import { buildConversionResult } from '../domain/pillars.js';

export async function convertSolarToLunarOffline({ utcBirth }) {
  return buildConversionResult({ utcBirth, source: 'offline-approximation' });
}

export async function convertLunarToSolarOffline({ utcBirth }) {
  return buildConversionResult({ utcBirth, source: 'offline-approximation' });
}
