export type LotType = 'C' | 'H' | 'Y'; // C: Car, H: Heavy Vehicle, Y: Motorcycle

export interface LotInfo {
  totalLots: number;
  availableLots: number;
  lotType: LotType;
}

export type CarparkAgency = 'HDB' | 'URA' | 'LTA_MALL' | 'COMMERCIAL';

export type CarparkType = 'MSCP' | 'SURFACE' | 'BASEMENT' | 'MECHANIZED' | 'COVERED';

export type OccupancyStatus = 'PLENTY' | 'MODERATE' | 'FILLING_FAST' | 'FULL';

export interface CarparkRate {
  weekdayDay: string;
  weekdayNight: string;
  weekend: string;
  gracePeriodMins: number;
  hdbStandardRate?: boolean;
  centralAreaRate?: boolean;
  estimatedPerHourRate: number;
}

export interface EvChargerInfo {
  available: number;
  total: number;
  powerKw: number;
  operator: string;
}

export interface Carpark {
  id: string;
  carparkNumber: string;
  name: string;
  address: string;
  postalCode: string;
  area: string;
  region: 'Central' | 'East' | 'West' | 'North' | 'North-East';
  coordinates: {
    lat: number;
    lng: number;
  };
  agency: CarparkAgency;
  carparkType: CarparkType;
  lots: Record<LotType, LotInfo>;
  heightLimitMeters?: number;
  hasEvCharging: boolean;
  evChargers?: EvChargerInfo;
  hasWashingBay: boolean;
  hasShelteredWalkway: boolean;
  paymentSystem: 'EPS' | 'ELECTRONIC_IU' | 'COUPON' | 'CASHLESS';
  rates: CarparkRate;
  lastUpdated: string;
  occupancyStatus: OccupancyStatus;
  distanceKm?: number;
  isFavorite?: boolean;
}

export interface CarparkFilters {
  searchQuery: string;
  selectedRegion: string;
  selectedArea: string;
  lotType: LotType;
  agency: 'ALL' | CarparkAgency;
  availabilityOnly: boolean;
  hasEvCharging: boolean;
  maxHeight?: number;
  carparkType: 'ALL' | CarparkType;
  sortBy: 'AVAILABLE_DESC' | 'DISTANCE_ASC' | 'NAME_ASC' | 'OCCUPANCY_ASC' | 'RATE_ASC';
}

export interface GovDataGovLotData {
  carpark_number: string;
  update_datetime: string;
  carpark_info: Array<{
    total_lots: string;
    lot_type: string;
    lots_available: string;
  }>;
}
