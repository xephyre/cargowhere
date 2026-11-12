import React from 'react';
import { RefreshCw, Locate, Wifi, Radio } from 'lucide-react';

interface HeaderProps {
  isAutoRefresh: boolean;
  onToggleAutoRefresh: () => void;
  onManualRefresh: () => void;
  onLocateUser: () => void;
  isLocating: boolean;
  isFetchingGov: boolean;
  onFetchGovData: () => void;
  govMatchedCount: number | null;
  onOpenFeeCalculator: () => void;
  activeTab: 'all' | 'hdb' | 'malls' | 'favorites';
  onSelectTab: (tab: 'all' | 'hdb' | 'malls' | 'favorites') => void;
}

export const Header: React.FC<HeaderProps> = ({
  isAutoRefresh,
  onToggleAutoRefresh,
  onManualRefresh,
  onLocateUser,
  isLocating,
  isFetchingGov,
  onFetchGovData,
  govMatchedCount,
  onOpenFeeCalculator,
  activeTab,
  onSelectTab,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between gap-8 h-16">
        {/* Zone 1: Single element brand wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
            P
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap">
              SG ParkSpot
            </span>
            <span className="text-[11px] text-slate-500 font-medium tracking-wide">
              Singapore Real-Time Availability
            </span>
          </div>
        </div>

        {/* Zone 2: Clean single-line navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
          <button
            onClick={() => onSelectTab('all')}
            className={`whitespace-nowrap transition-colors py-1 ${
              activeTab === 'all'
                ? 'text-blue-600 font-semibold border-b-2 border-blue-600'
                : 'hover:text-slate-900'
            }`}
          >
            All Carparks
          </button>
          <button
            onClick={() => onSelectTab('hdb')}
            className={`whitespace-nowrap transition-colors py-1 ${
              activeTab === 'hdb'
                ? 'text-blue-600 font-semibold border-b-2 border-blue-600'
                : 'hover:text-slate-900'
            }`}
          >
            HDB Estates
          </button>
          <button
            onClick={() => onSelectTab('malls')}
            className={`whitespace-nowrap transition-colors py-1 ${
              activeTab === 'malls'
                ? 'text-blue-600 font-semibold border-b-2 border-blue-600'
                : 'hover:text-slate-900'
            }`}
          >
            Shopping Malls & URA
          </button>
          <button
            onClick={() => onSelectTab('favorites')}
            className={`whitespace-nowrap transition-colors py-1 ${
              activeTab === 'favorites'
                ? 'text-blue-600 font-semibold border-b-2 border-blue-600'
                : 'hover:text-slate-900'
            }`}
          >
            Saved Lots
          </button>
          <button
            onClick={onOpenFeeCalculator}
            className="whitespace-nowrap transition-colors py-1 text-slate-600 hover:text-slate-900"
          >
            Fee Calculator
          </button>
        </nav>

        {/* Zone 3: 1 primary action with live controls */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={onFetchGovData}
            disabled={isFetchingGov}
            title="Fetch real-time government lot availability from data.gov.sg"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors border border-slate-200"
          >
            <Radio className={`w-3.5 h-3.5 ${isFetchingGov ? 'text-blue-600 animate-spin' : 'text-emerald-600'}`} />
            <span>{isFetchingGov ? 'Syncing...' : govMatchedCount ? `Gov API Active (${govMatchedCount})` : 'Sync Gov Data'}</span>
          </button>

          <button
            onClick={onLocateUser}
            disabled={isLocating}
            title="Locate my position in Singapore"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition-colors"
          >
            <Locate className={`w-3.5 h-3.5 ${isLocating ? 'animate-pulse text-blue-600' : 'text-slate-600'}`} />
            <span className="hidden sm:inline">{isLocating ? 'Locating...' : 'Near Me'}</span>
          </button>

          <button
            onClick={onToggleAutoRefresh}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              isAutoRefresh
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isAutoRefresh ? 'animate-spin' : ''}`} style={{ animationDuration: '4s' }} />
            <span>{isAutoRefresh ? 'Live Auto' : 'Paused'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
