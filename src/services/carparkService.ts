import { Carpark, GovDataGovLotData, LotType, OccupancyStatus } from '../types/carpark';
import { INITIAL_CARPARKS } from '../data/singaporeCarparks';

const STORAGE_FAVORITES_KEY = 'sg_parkspot_favorites_v1';

// Haversine formula for distance in km
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Radius of the Earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

export function computeOccupancyStatus(available: number, total: number): OccupancyStatus {
  if (total <= 0 || available <= 0) return 'FULL';
  const ratio = available / total;
  if (ratio > 0.25) return 'PLENTY';
  if (ratio >= 0.1) return 'MODERATE';
  if (ratio > 0) return 'FILLING_FAST';
  return 'FULL';
}

export function getStoredFavorites(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_FAVORITES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function toggleStoredFavorite(carparkId: string): string[] {
  try {
    const current = getStoredFavorites();
    const next = current.includes(carparkId)
      ? current.filter((id) => id !== carparkId)
      : [...current, carparkId];
    localStorage.setItem(STORAGE_FAVORITES_KEY, JSON.stringify(next));
    return next;
  } catch {
    return [];
  }
}

/**
 * Real-time simulator: randomly adjusts carpark availability by +/- 1 to 4 lots
 * mimicking live traffic in Singapore.
 */
export function simulateLotFluctuations(carparks: Carpark[]): Carpark[] {
  const now = new Date();
  const timeString = now.toLocaleTimeString('en-SG', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });

  return carparks.map((cp) => {
    // 60% chance to fluctuate each cycle
    if (Math.random() < 0.4) {
      return cp;
    }

    const deltaC = Math.floor(Math.random() * 7) - 3; // -3 to +3
    const deltaY = Math.floor(Math.random() * 3) - 1; // -1 to +1

    const newLots = { ...cp.lots };

    if (newLots.C && newLots.C.totalLots > 0) {
      const updatedAvailable = Math.max(
        0,
        Math.min(newLots.C.totalLots, newLots.C.availableLots + deltaC)
      );
      newLots.C = {
        ...newLots.C,
        availableLots: updatedAvailable,
      };
    }

    if (newLots.Y && newLots.Y.totalLots > 0) {
      const updatedAvailable = Math.max(
        0,
        Math.min(newLots.Y.totalLots, newLots.Y.availableLots + deltaY)
      );
      newLots.Y = {
        ...newLots.Y,
        availableLots: updatedAvailable,
      };
    }

    const carAvail = newLots.C?.availableLots ?? 0;
    const carTotal = newLots.C?.totalLots ?? 1;

    return {
      ...cp,
      lots: newLots,
      occupancyStatus: computeOccupancyStatus(carAvail, carTotal),
      lastUpdated: timeString,
    };
  });
}

/**
 * Fetch live carpark availability directly from Singapore Data.gov.sg API
 * Public endpoint: https://api.data.gov.sg/v1/transport/carpark-availability
 */
export async function fetchGovCarparkAvailability(): Promise<{
  success: boolean;
  carparkMap: Record<string, { C?: number; Y?: number; H?: number }>;
  timestamp: string;
}> {
  try {
    const res = await fetch('https://api.data.gov.sg/v1/transport/carpark-availability', {
      headers: {
        Accept: 'application/json',
      },
    });

    if (!res.ok) {
      throw new Error(`Data.gov.sg returned HTTP ${res.status}`);
    }

    const json = await res.json();
    const items = json?.items?.[0]?.carpark_data as GovDataGovLotData[] | undefined;
    const timestamp = json?.items?.[0]?.timestamp || new Date().toISOString();

    if (!items || !Array.isArray(items)) {
      throw new Error('Invalid format returned by Data.gov.sg');
    }

    const carparkMap: Record<string, { C?: number; Y?: number; H?: number }> = {};

    for (const item of items) {
      const code = item.carpark_number;
      if (!code) continue;
      carparkMap[code] = {};

      for (const info of item.carpark_info || []) {
        const type = info.lot_type as LotType;
        const avail = parseInt(info.lots_available, 10);
        if (!isNaN(avail)) {
          carparkMap[code][type] = avail;
        }
      }
    }

    return {
      success: true,
      carparkMap,
      timestamp,
    };
  } catch (err) {
    console.warn('Could not fetch from data.gov.sg live API:', err);
    return {
      success: false,
      carparkMap: {},
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Merge live Data.gov.sg feed into existing carpark models
 */
export function mergeGovDataIntoCarparks(
  carparks: Carpark[],
  govMap: Record<string, { C?: number; Y?: number; H?: number }>
): { updatedCarparks: Carpark[]; matchedCount: number } {
  let matched = 0;
  const now = new Date().toLocaleTimeString('en-SG', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });

  const updatedCarparks = carparks.map((cp) => {
    const govEntry = govMap[cp.carparkNumber];
    if (!govEntry) return cp;

    matched++;
    const newLots = { ...cp.lots };

    if (govEntry.C !== undefined && newLots.C) {
      newLots.C = {
        ...newLots.C,
        availableLots: Math.min(newLots.C.totalLots, govEntry.C),
      };
    }
    if (govEntry.Y !== undefined && newLots.Y) {
      newLots.Y = {
        ...newLots.Y,
        availableLots: Math.min(newLots.Y.totalLots, govEntry.Y),
      };
    }
    if (govEntry.H !== undefined && newLots.H) {
      newLots.H = {
        ...newLots.H,
        availableLots: Math.min(newLots.H.totalLots, govEntry.H),
      };
    }

    const carAvail = newLots.C?.availableLots ?? 0;
    const carTotal = newLots.C?.totalLots ?? 1;

    return {
      ...cp,
      lots: newLots,
      occupancyStatus: computeOccupancyStatus(carAvail, carTotal),
      lastUpdated: `${now} (Data.gov.sg)`,
    };
  });

  return { updatedCarparks, matchedCount: matched };
}

/**
 * Calculates estimated parking fee given a duration and carpark
 */
export function estimateParkingFee(
  carpark: Carpark,
  durationMinutes: number,
  isWeekend: boolean = false,
  lotType: LotType = 'C'
): {
  totalFee: number;
  breakdown: string;
  isGracePeriod: boolean;
} {
  if (durationMinutes <= carpark.rates.gracePeriodMins) {
    return {
      totalFee: 0,
      breakdown: `Free within ${carpark.rates.gracePeriodMins}-minute grace period`,
      isGracePeriod: true,
    };
  }

  // Motorcycle flat rate
  if (lotType === 'Y') {
    if (carpark.agency === 'HDB' || carpark.agency === 'URA') {
      return {
        totalFee: 0.65,
        breakdown: 'HDB standard motorcycle parking ($0.65 per session)',
        isGracePeriod: false,
      };
    }
    return {
      totalFee: 1.20,
      breakdown: 'Commercial mall motorcycle rate (~$1.20 flat)',
      isGracePeriod: false,
    };
  }

  // HDB standard parking calculation ($0.60 per 30 mins, or $1.20 for Central Area)
  if (carpark.agency === 'HDB' || carpark.rates.hdbStandardRate) {
    const halfHours = Math.ceil(durationMinutes / 30);
    const ratePerHalfHour = carpark.rates.centralAreaRate ? 1.20 : 0.60;
    const total = Math.round(halfHours * ratePerHalfHour * 100) / 100;
    return {
      totalFee: total,
      breakdown: `${halfHours} x 30min blocks @ $${ratePerHalfHour.toFixed(2)} (${carpark.rates.centralAreaRate ? 'Central Area' : 'Standard HDB'})`,
      isGracePeriod: false,
    };
  }

  // Commercial / Mall parking rate calculation
  const hours = durationMinutes / 60;
  if (hours <= 1) {
    const fee = carpark.rates.estimatedPerHourRate;
    return {
      totalFee: fee,
      breakdown: `First hour rate: $${fee.toFixed(2)}`,
      isGracePeriod: false,
    };
  } else {
    const firstHrFee = carpark.rates.estimatedPerHourRate;
    const remainingMins = durationMinutes - 60;
    const remainingQuarterHours = Math.ceil(remainingMins / 15);
    const subsequentRatePer15m = 0.55;
    const subsequentFee = remainingQuarterHours * subsequentRatePer15m;
    const total = Math.round((firstHrFee + subsequentFee) * 100) / 100;

    return {
      totalFee: total,
      breakdown: `$${firstHrFee.toFixed(2)} (1st hr) + ${remainingQuarterHours} x 15m @ $0.55 ($${subsequentFee.toFixed(2)})`,
      isGracePeriod: false,
    };
  }
}
