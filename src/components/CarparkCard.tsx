import React from 'react';
import { Carpark, LotType } from '../types/carpark';
import { Zap, Navigation, Bookmark, MapPin, ShieldCheck } from 'lucide-react';

interface CarparkCardProps {
  carpark: Carpark;
  isSelected: boolean;
  onSelect: () => void;
  onFocusOnMap: () => void;
  onToggleFavorite: () => void;
  isFavorite: boolean;
  selectedLotType: LotType;
}

export const CarparkCard: React.FC<CarparkCardProps> = ({
  carpark,
  isSelected,
  onSelect,
  onFocusOnMap,
  onToggleFavorite,
  isFavorite,
  selectedLotType,
}) => {
  const lot = carpark.lots[selectedLotType] || {
    totalLots: 0,
    availableLots: 0,
  };
  const available = lot.availableLots;
  const total = lot.totalLots;
  const percentage = total > 0 ? Math.round((available / total) * 100) : 0;

  // Status visual cues
  let statusText = 'Plenty Lots';
  let statusColor = 'text-emerald-700 dark:text-emerald-500';
  let progressBg = 'bg-emerald-600';

  if (available === 0) {
    statusText = 'Full';
    statusColor = 'text-red-700 dark:text-red-500';
    progressBg = 'bg-red-600';
  } else if (percentage < 10) {
    statusText = 'Filling Fast';
    statusColor = 'text-orange-700 dark:text-orange-500';
    progressBg = 'bg-orange-600';
  } else if (percentage <= 25) {
    statusText = 'Moderate';
    statusColor = 'text-amber-700 dark:text-amber-500';
    progressBg = 'bg-amber-500';
  }

  const lotTypeLabel =
    selectedLotType === 'C' ? 'Cars' : selectedLotType === 'Y' ? 'Bikes' : 'Heavy';

  return (
    <div
      onClick={onSelect}
      className={`group relative p-4 rounded-xl border transition-all cursor-pointer ${
        isSelected
          ? 'bg-blue-50/60 border-blue-500 shadow-sm ring-1 ring-blue-500/20'
          : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-xs'
      }`}
    >
      {/* Top Header Row */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <div>
          {/* Unboxed metadata line with typographic separator */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
            <span className="font-semibold text-slate-700">
              {carpark.agency.replace('_', ' ')}
            </span>
            <span aria-hidden="true">·</span>
            <span className="font-mono">{carpark.carparkNumber}</span>
            <span aria-hidden="true">·</span>
            <span>{carpark.carparkType}</span>
            {carpark.distanceKm !== undefined && (
              <>
                <span aria-hidden="true">·</span>
                <span className="font-medium text-blue-600">{carpark.distanceKm} km away</span>
              </>
            )}
          </div>

          <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors leading-snug">
            {carpark.name}
          </h3>
          <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{carpark.address}</p>
        </div>

        {/* Favorite Bookmark Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite();
          }}
          title={isFavorite ? 'Remove from saved' : 'Save carpark'}
          className={`p-1.5 rounded-lg border transition-colors shrink-0 ${
            isFavorite
              ? 'bg-amber-50 border-amber-300 text-amber-600'
              : 'border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Bookmark className={`w-4 h-4 ${isFavorite ? 'fill-amber-500' : ''}`} />
        </button>
      </div>

      {/* Real-time Vacancy Metric Strip */}
      <div className="mt-3 p-3 bg-slate-50/80 rounded-lg border border-slate-100">
        <div className="flex items-baseline justify-between mb-1.5">
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
              {available}
            </span>
            <span className="text-xs text-slate-500 font-medium">
              / {total} {lotTypeLabel} lots
            </span>
          </div>
          <span className={`text-xs font-semibold ${statusColor}`}>
            {statusText} ({percentage}%)
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
          <div
            className={`h-full ${progressBg} transition-all duration-500`}
            style={{ width: `${Math.min(100, Math.max(3, percentage))}%` }}
          />
        </div>

        {/* Secondary Info: Bike / Heavy Lot Counts & Features */}
        <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-200/60">
          <div className="flex items-center gap-3">
            <span>
              Bike lots: <strong className="font-mono text-slate-700">{carpark.lots.Y?.availableLots ?? 0}</strong>
            </span>
            {carpark.heightLimitMeters && (
              <span>
                Height: <strong className="font-mono text-slate-700">{carpark.heightLimitMeters}m</strong>
              </span>
            )}
          </div>

          {carpark.hasEvCharging && (
            <div className="flex items-center gap-1 text-emerald-700 font-medium text-[11px]">
              <Zap className="w-3 h-3 text-emerald-600" />
              <span>EV Available</span>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Footer Info & Action */}
      <div className="mt-3 flex items-center justify-between text-xs pt-1">
        <div className="text-slate-600">
          <span className="font-medium text-slate-800">
            ${carpark.rates.estimatedPerHourRate.toFixed(2)}/hr
          </span>
          <span className="text-slate-400 mx-1">·</span>
          <span className="text-slate-500">{carpark.rates.gracePeriodMins}m grace</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onFocusOnMap();
            }}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-50 transition-colors"
          >
            <MapPin className="w-3 h-3 text-blue-600" />
            <span>Map</span>
          </button>
          <button
            onClick={onSelect}
            className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
          >
            Details
          </button>
        </div>
      </div>
    </div>
  );
};
