import React from 'react';
import { Search, SlidersHorizontal, X, Zap, ArrowDownUp, Car, Bike, Truck } from 'lucide-react';
import { CarparkAgency, CarparkFilters, LotType } from '../types/carpark';

interface FilterToolbarProps {
  filters: CarparkFilters;
  onChangeFilters: (filters: CarparkFilters) => void;
  totalCarparksCount: number;
  filteredCount: number;
  onResetFilters: () => void;
}

export const FilterToolbar: React.FC<FilterToolbarProps> = ({
  filters,
  onChangeFilters,
  totalCarparksCount,
  filteredCount,
  onResetFilters,
}) => {
  const hasActiveFilters =
    filters.searchQuery !== '' ||
    filters.agency !== 'ALL' ||
    filters.lotType !== 'C' ||
    filters.availabilityOnly ||
    filters.hasEvCharging ||
    filters.maxHeight !== undefined ||
    filters.sortBy !== 'AVAILABLE_DESC';

  return (
    <div className="bg-white border-b border-slate-200 px-4 py-3 sm:px-6">
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Search Bar */}
        <div className="relative flex-1 max-w-lg">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={filters.searchQuery}
            onChange={(e) => onChangeFilters({ ...filters, searchQuery: e.target.value })}
            placeholder="Search by carpark name, code (e.g. ACB, TM31), area, or street..."
            className="w-full pl-9 pr-9 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
          />
          {filters.searchQuery && (
            <button
              onClick={() => onChangeFilters({ ...filters, searchQuery: '' })}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Controls Row */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Vehicle Type Segmented Control */}
          <div className="flex items-center p-0.5 bg-slate-100 rounded-lg border border-slate-200">
            <button
              onClick={() => onChangeFilters({ ...filters, lotType: 'C' })}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                filters.lotType === 'C'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Car className="w-3.5 h-3.5" />
              <span>Cars</span>
            </button>
            <button
              onClick={() => onChangeFilters({ ...filters, lotType: 'Y' })}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                filters.lotType === 'Y'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Bike className="w-3.5 h-3.5" />
              <span>Motorcycles</span>
            </button>
            <button
              onClick={() => onChangeFilters({ ...filters, lotType: 'H' })}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                filters.lotType === 'H'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Truck className="w-3.5 h-3.5" />
              <span>Heavy</span>
            </button>
          </div>

          {/* Agency Filter */}
          <select
            value={filters.agency}
            onChange={(e) =>
              onChangeFilters({
                ...filters,
                agency: e.target.value as 'ALL' | CarparkAgency,
              })
            }
            className="px-3 py-1.5 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="ALL">All Agencies</option>
            <option value="HDB">HDB Only</option>
            <option value="LTA_MALL">Shopping Malls</option>
            <option value="URA">URA Only</option>
            <option value="COMMERCIAL">Commercial / Hubs</option>
          </select>

          {/* EV Charging Quick Filter */}
          <button
            onClick={() =>
              onChangeFilters({ ...filters, hasEvCharging: !filters.hasEvCharging })
            }
            className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
              filters.hasEvCharging
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300 font-semibold'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <Zap className={`w-3.5 h-3.5 ${filters.hasEvCharging ? 'text-emerald-600' : 'text-slate-400'}`} />
            <span>EV Charging</span>
          </button>

          {/* Available Lots Only */}
          <button
            onClick={() =>
              onChangeFilters({
                ...filters,
                availabilityOnly: !filters.availabilityOnly,
              })
            }
            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
              filters.availabilityOnly
                ? 'bg-blue-50 text-blue-800 border-blue-300 font-semibold'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            Available Only (&gt;0)
          </button>

          {/* Sort Selection */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <ArrowDownUp className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={filters.sortBy}
              onChange={(e) =>
                onChangeFilters({
                  ...filters,
                  sortBy: e.target.value as CarparkFilters['sortBy'],
                })
              }
              className="px-2.5 py-1.5 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none"
            >
              <option value="AVAILABLE_DESC">Most Lots Available</option>
              <option value="DISTANCE_ASC">Nearest Distance</option>
              <option value="RATE_ASC">Lowest Hourly Rate</option>
              <option value="OCCUPANCY_ASC">Lowest Occupancy %</option>
              <option value="NAME_ASC">Name (A-Z)</option>
            </select>
          </div>

          {/* Reset Filters */}
          {hasActiveFilters && (
            <button
              onClick={onResetFilters}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-slate-500 hover:text-slate-800 underline decoration-slate-300"
            >
              Reset
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
