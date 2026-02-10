import { Preferences } from '@capacitor/preferences';
import { RoadworksReportWithId } from '../firebase/roadworks-reports';

const CACHE_KEY = 'roadworks_reports_cache_v1';

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
