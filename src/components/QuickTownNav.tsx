import React from 'react';
import { MapPin } from 'lucide-react';

interface QuickTownNavProps {
  onSelectTown: (townName: string, coords: { lat: number; lng: number; zoom?: number }) => void;
  selectedTown: string;
}

const SINGAPORE_TOWNS = [
  { name: 'All Singapore', lat: 1.3521, lng: 103.8198, zoom: 12 },
  { name: 'Orchard Rd', lat: 1.3040, lng: 103.8318, zoom: 15 },
  { name: 'Marina Bay / CBD', lat: 1.2838, lng: 103.8591, zoom: 15 },
  { name: 'Bugis / City Hall', lat: 1.2996, lng: 103.8553, zoom: 15 },
  { name: 'Tampines', lat: 1.3532, lng: 103.9442, zoom: 15 },
  { name: 'Jurong East', lat: 1.3332, lng: 103.7436, zoom: 15 },
  { name: 'Woodlands', lat: 1.4361, lng: 103.7865, zoom: 15 },
  { name: 'Punggol', lat: 1.4067, lng: 103.9022, zoom: 15 },
  { name: 'Bishan / AMK', lat: 1.3508, lng: 103.8488, zoom: 15 },
  { name: 'Bedok / ECP', lat: 1.3248, lng: 103.9298, zoom: 15 },
];

export const QuickTownNav: React.FC<QuickTownNavProps> = ({
  onSelectTown,
  selectedTown,
}) => {
  return (
    <div className="bg-slate-50 border-b border-slate-200 px-4 py-2 sm:px-6 overflow-x-auto scrollbar-none">
      <div className="flex items-center gap-2 text-xs min-w-max">
        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1 shrink-0 mr-1">
          <MapPin className="w-3 h-3 text-slate-400" />
          Jump to:
        </span>
        {SINGAPORE_TOWNS.map((town) => {
          const isActive = selectedTown === town.name;
          return (
            <button
              key={town.name}
              onClick={() =>
                onSelectTown(town.name, {
                  lat: town.lat,
                  lng: town.lng,
                  zoom: town.zoom,
                })
              }
              className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300 hover:text-slate-900'
              }`}
            >
              {town.name}
            </button>
          );
        })}
      </div>
    </div>
  );
};
