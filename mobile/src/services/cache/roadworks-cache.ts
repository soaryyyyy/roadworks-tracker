import { Preferences } from '@capacitor/preferences';
import { RoadworksReportWithId } from '../firebase/roadworks-reports';

const CACHE_KEY = 'roadworks_reports_cache_v1';
const CACHE_MAX_AGE_MS = 1000 * 60 * 30; // 30 minutes

interface RoadworksCachePayload {
  reports: RoadworksReportWithId[];
  cachedAt: number;
}

export const saveRoadworksCache = async (reports: RoadworksReportWithId[]) => {
  const payload: RoadworksCachePayload = {
    reports,
    cachedAt: Date.now(),
  };

  await Preferences.set({
    key: CACHE_KEY,
    value: JSON.stringify(payload),
  });
};

export const readRoadworksCache = async (): Promise<RoadworksCachePayload | null> => {
  const { value } = await Preferences.get({ key: CACHE_KEY });
  if (!value) return null;

  try {
    return JSON.parse(value) as RoadworksCachePayload;
  } catch (error) {
    console.warn('Cache roadworks invalide, purge en cours', error);
    await Preferences.remove({ key: CACHE_KEY });
    return null;
  }
};

export const isCacheFresh = (cachedAt: number): boolean => {
  return Date.now() - cachedAt <= CACHE_MAX_AGE_MS;
};

export const ROADWORKS_CACHE_KEY = CACHE_KEY;
