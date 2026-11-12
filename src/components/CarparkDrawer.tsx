import React, { useState } from 'react';
import {
  X,
  Navigation,
  Bookmark,
  Zap,
  Clock,
  DollarSign,
  Car,
  Bike,
  Truck,
  ShieldAlert,
  Compass,
  ArrowUpRight,
  Sparkles,
  Info,
} from 'lucide-react';
import { Carpark, LotType } from '../types/carpark';
import { estimateParkingFee } from '../services/carparkService';

interface CarparkDrawerProps {
  carpark: Carpark | null;
  onClose: () => void;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  selectedLotType: LotType;
  onChangeLotType: (lotType: LotType) => void;
}

export const CarparkDrawer: React.FC<CarparkDrawerProps> = ({
  carpark,
  onClose,
  isFavorite,
  onToggleFavorite,
  selectedLotType,
  onChangeLotType,
}) => {
  const [calculatorDurationMinutes, setCalculatorDurationMinutes] = useState<number>(90); // default 1.5 hrs
  const [isWeekendTrip, setIsWeekendTrip] = useState<boolean>(false);

  if (!carpark) return null;

  const currentLot = carpark.lots[selectedLotType] || {
    totalLots: 0,
    availableLots: 0,
  };
  const available = currentLot.availableLots;
  const total = currentLot.totalLots;
  const percentage = total > 0 ? Math.round((available / total) * 100) : 0;

  const feeEstimate = estimateParkingFee(
    carpark,
    calculatorDurationMinutes,
    isWeekendTrip,
    selectedLotType
  );

  // External Navigation URLs
  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${carpark.coordinates.lat},${carpark.coordinates.lng}`;
  const wazeUrl = `https://waze.com/ul?ll=${carpark.coordinates.lat},${carpark.coordinates.lng}&navigate=yes`;
  const appleMapsUrl = `http://maps.apple.com/?daddr=${carpark.coordinates.lat},${carpark.coordinates.lng}`;

  // Hourly simulated trend data
  const hourlyOccupancy = [
    { hour: '06:00', occupancy: 20 },
    { hour: '08:00', occupancy: 55 },
    { hour: '10:00', occupancy: 70 },
    { hour: '12:00', occupancy: 92 },
    { hour: '14:00', occupancy: 78 },
    { hour: '16:00', occupancy: 65 },
    { hour: '18:00', occupancy: 88 },
    { hour: '20:00', occupancy: 60 },
    { hour: '22:00', occupancy: 35 },
  ];

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:max-w-md bg-white shadow-2xl border-l border-slate-200 flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
      {/* Header bar */}
      <div className="p-4 sm:p-5 border-b border-slate-200 flex items-start justify-between gap-3 bg-slate-50/50">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <span className="font-bold text-blue-700">{carpark.agency.replace('_', ' ')}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono text-slate-700">{carpark.carparkNumber}</span>
            <span aria-hidden="true">·</span>
            <span>{carpark.area}</span>
          </div>
          <h2 className="text-lg font-bold text-slate-900 leading-snug">{carpark.name}</h2>
          <p className="text-xs text-slate-500 mt-0.5">{carpark.address}, Singapore {carpark.postalCode}</p>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={onToggleFavorite}
            title={isFavorite ? 'Remove bookmark' : 'Bookmark this carpark'}
            className={`p-2 rounded-lg border transition-colors ${
              isFavorite
                ? 'bg-amber-50 border-amber-300 text-amber-600'
                : 'border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Bookmark className={`w-4 h-4 ${isFavorite ? 'fill-amber-500' : ''}`} />
          </button>
          <button
            onClick={onClose}
            className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
        {/* Real-time Availability Hero Box */}
        <div className="p-4 rounded-xl bg-slate-900 text-white">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-400">Real-Time Vacancy</span>
            <span className="text-xs text-emerald-400 font-mono">
              Updated {carpark.lastUpdated}
            </span>
          </div>

          <div className="flex items-baseline justify-between mb-2">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold font-mono tracking-tight tabular-nums">
                {available}
              </span>
              <span className="text-slate-400 text-sm">/ {total} total lots</span>
            </div>
            <div className="text-right">
              <span className="text-sm font-semibold text-emerald-400 font-mono">
                {percentage}% vacant
              </span>
            </div>
          </div>

          {/* Availability Bar */}
          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden mb-3">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, Math.max(2, percentage))}%` }}
            />
          </div>

          {/* Vehicle Type Switcher */}
          <div className="grid grid-cols-3 gap-1 p-1 bg-slate-800/80 rounded-lg text-xs">
            <button
              onClick={() => onChangeLotType('C')}
              className={`py-1.5 px-2 rounded-md font-medium flex items-center justify-center gap-1.5 transition-colors ${
                selectedLotType === 'C' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Car className="w-3.5 h-3.5" />
              <span>Cars ({carpark.lots.C?.availableLots ?? 0})</span>
            </button>
            <button
              onClick={() => onChangeLotType('Y')}
              className={`py-1.5 px-2 rounded-md font-medium flex items-center justify-center gap-1.5 transition-colors ${
                selectedLotType === 'Y' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Bike className="w-3.5 h-3.5" />
              <span>Bikes ({carpark.lots.Y?.availableLots ?? 0})</span>
            </button>
            <button
              onClick={() => onChangeLotType('H')}
              className={`py-1.5 px-2 rounded-md font-medium flex items-center justify-center gap-1.5 transition-colors ${
                selectedLotType === 'H' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Truck className="w-3.5 h-3.5" />
              <span>Heavy ({carpark.lots.H?.availableLots ?? 0})</span>
            </button>
          </div>
        </div>

        {/* Quick Physical Specifications */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-lg border border-slate-200 bg-slate-50">
            <div className="text-slate-500 mb-0.5">Height Limit</div>
            <div className="font-bold text-slate-800 text-sm font-mono">
              {carpark.heightLimitMeters ? `${carpark.heightLimitMeters}m` : 'No restriction'}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">{carpark.carparkType} Layout</div>
          </div>
          <div className="p-3 rounded-lg border border-slate-200 bg-slate-50">
            <div className="text-slate-500 mb-0.5">Payment Mode</div>
            <div className="font-bold text-slate-800 text-sm">
              {carpark.paymentSystem === 'EPS' ? 'Electronic (IU / EPS)' : 'Cashless Card'}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {carpark.rates.gracePeriodMins} mins Grace Period
            </div>
          </div>
        </div>

        {/* EV Charging Station Info */}
        {carpark.hasEvCharging && carpark.evChargers && (
          <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/50">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900">
                <Zap className="w-4 h-4 text-emerald-600" />
                <span>EV Charging Hub</span>
              </div>
              <span className="text-xs font-semibold text-emerald-700 font-mono">
                {carpark.evChargers.available} / {carpark.evChargers.total} Available
              </span>
            </div>
            <div className="text-xs text-emerald-800 space-y-0.5">
              <div>
                Operator: <strong className="font-medium">{carpark.evChargers.operator}</strong>
              </div>
              <div>
                Output: <strong className="font-mono">{carpark.evChargers.powerKw} kW Fast Charger</strong>
              </div>
            </div>
          </div>
        )}

        {/* Parking Rates Schedule */}
        <div>
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <DollarSign className="w-3.5 h-3.5 text-blue-600" />
            <span>Parking Rates</span>
          </h4>

          <div className="border border-slate-200 rounded-lg overflow-hidden text-xs divide-y divide-slate-200">
            <div className="p-2.5 bg-slate-50 flex justify-between gap-2">
              <span className="font-medium text-slate-600">Weekday (Day)</span>
              <span className="font-semibold text-slate-900 text-right">{carpark.rates.weekdayDay}</span>
            </div>
            <div className="p-2.5 bg-white flex justify-between gap-2">
              <span className="font-medium text-slate-600">Weekday (Night)</span>
              <span className="font-semibold text-slate-900 text-right">{carpark.rates.weekdayNight}</span>
            </div>
            <div className="p-2.5 bg-slate-50 flex justify-between gap-2">
              <span className="font-medium text-slate-600">Weekends & PH</span>
              <span className="font-semibold text-slate-900 text-right">{carpark.rates.weekend}</span>
            </div>
            <div className="p-2.5 bg-white flex justify-between gap-2">
              <span className="font-medium text-slate-600">Grace Period</span>
              <span className="font-semibold text-emerald-600 text-right">{carpark.rates.gracePeriodMins} minutes free</span>
            </div>
          </div>
        </div>

        {/* Interactive Parking Fee Estimator */}
        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-blue-600" />
              <span>Fee Estimator</span>
            </h4>
            <span className="text-xs text-slate-500">
              For {selectedLotType === 'C' ? 'Cars' : selectedLotType === 'Y' ? 'Bikes' : 'Heavy'}
            </span>
          </div>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs text-slate-600 mb-1">
                <span>Parking Duration:</span>
                <span className="font-bold text-slate-900 font-mono">
                  {Math.floor(calculatorDurationMinutes / 60)}h {calculatorDurationMinutes % 60}m
                </span>
              </div>
              <input
                type="range"
                min="10"
                max="360"
                step="15"
                value={calculatorDurationMinutes}
                onChange={(e) => setCalculatorDurationMinutes(parseInt(e.target.value, 10))}
                className="w-full accent-blue-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>15m</span>
                <span>1h</span>
                <span>2h</span>
                <span>4h</span>
                <span>6h</span>
              </div>
            </div>

            <div className="p-3 bg-white rounded-lg border border-slate-200 flex items-center justify-between">
              <div>
                <div className="text-[11px] text-slate-500">Estimated Total Fee</div>
                <div className="text-xs text-slate-600">{feeEstimate.breakdown}</div>
              </div>
              <div className="text-right">
                <span className="text-xl font-bold font-mono text-blue-600">
                  ${feeEstimate.totalFee.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Simulated Occupancy Trend Bar Chart */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Typical Daily Occupancy
            </h4>
            <span className="text-[11px] text-slate-500">Singapore pattern</span>
          </div>

          <div className="p-3 rounded-lg border border-slate-200 bg-white">
            <div className="flex items-end justify-between gap-1.5 h-24 pt-4">
              {hourlyOccupancy.map((item, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                  <div
                    className={`w-full rounded-t-sm transition-all ${
                      item.occupancy > 80
                        ? 'bg-orange-500'
                        : item.occupancy > 50
                        ? 'bg-amber-400'
                        : 'bg-emerald-400'
                    }`}
                    style={{ height: `${item.occupancy}%` }}
                    title={`${item.hour}: ${item.occupancy}% busy`}
                  />
                  <span className="text-[9px] text-slate-400 font-mono scale-90">
                    {item.hour.split(':')[0]}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-100 pt-1.5 mt-1">
              <span>Peak: Lunch (12pm) & Dinner (6pm)</span>
              <span>Off-peak: Night & Mid-afternoon</span>
            </div>
          </div>
        </div>
      </div>

      {/* Fixed Bottom Action Strip */}
      <div className="p-4 border-t border-slate-200 bg-white space-y-2 shrink-0">
        <div className="text-xs font-semibold text-slate-700 mb-1">Open Navigation App:</div>
        <div className="grid grid-cols-3 gap-2">
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1 py-2 px-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors border border-slate-200"
          >
            <span>Google Maps</span>
            <ArrowUpRight className="w-3 h-3 text-slate-400" />
          </a>
          <a
            href={wazeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1 py-2 px-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors border border-slate-200"
          >
            <span>Waze</span>
            <ArrowUpRight className="w-3 h-3 text-slate-400" />
          </a>
          <a
            href={appleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1 py-2 px-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors border border-slate-200"
          >
            <span>Apple Maps</span>
            <ArrowUpRight className="w-3 h-3 text-slate-400" />
          </a>
        </div>
      </div>
    </div>
  );
};
