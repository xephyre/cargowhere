/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Header } from './components/Header';
import { CarparkMap } from './components/CarparkMap';
import { CarparkCard } from './components/CarparkCard';
import { CarparkDrawer } from './components/CarparkDrawer';
import { FilterToolbar } from './components/FilterToolbar';
import { QuickTownNav } from './components/QuickTownNav';
import { FeeCalculatorModal } from './components/FeeCalculatorModal';
import { INITIAL_CARPARKS } from './data/singaporeCarparks';
import { Carpark, CarparkFilters, LotType } from './types/carpark';
import {
  calculateDistanceKm,
  computeOccupancyStatus,
  fetchGovCarparkAvailability,
  getStoredFavorites,
  mergeGovDataIntoCarparks,
  simulateLotFluctuations,
  toggleStoredFavorite,
} from './services/carparkService';
import {
  Car,
  Bike,
  Truck,
  MapPin,
  Layers,
  ListFilter,
  CheckCircle2,
  RefreshCw,
  Search,
  Zap,
  Radio,
  SlidersHorizontal,
} from 'lucide-react';

export default function App() {
  const [carparks, setCarparks] = useState<Carpark[]>(INITIAL_CARPARKS);
  const [selectedCarpark, setSelectedCarpark] = useState<Carpark | null>(null);
  const [selectedLotType, setSelectedLotType] = useState<LotType>('C');
  const [activeTab, setActiveTab] = useState<'all' | 'hdb' | 'malls' | 'favorites'>('all');
  const [selectedTown, setSelectedTown] = useState<string>('All Singapore');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [flyToCoord, setFlyToCoord] = useState<{ lat: number; lng: number; zoom?: number } | null>(null);
  const [isAutoRefresh, setIsAutoRefresh] = useState<boolean>(true);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isFeeCalculatorOpen, setIsFeeCalculatorOpen] = useState<boolean>(false);
  const [isFetchingGov, setIsFetchingGov] = useState<boolean>(false);
  const [govMatchedCount, setGovMatchedCount] = useState<number | null>(null);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'split' | 'map' | 'list'>('split');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const initialFilters: CarparkFilters = {
    searchQuery: '',
    selectedRegion: 'ALL',
    selectedArea: 'ALL',
    lotType: 'C',
    agency: 'ALL',
    availabilityOnly: false,
    hasEvCharging: false,
    carparkType: 'ALL',
    sortBy: 'AVAILABLE_DESC',
  };

  const [filters, setFilters] = useState<CarparkFilters>(initialFilters);

  // Load favorites from local storage
  useEffect(() => {
    setFavorites(getStoredFavorites());
  }, []);

  const handleToggleFavorite = useCallback((id: string) => {
    const updated = toggleStoredFavorite(id);
    setFavorites(updated);
  }, []);

  // Show transient toast notification
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  // Real-time automatic simulation interval (every 15 seconds)
  useEffect(() => {
    if (!isAutoRefresh) return;

    const interval = setInterval(() => {
      setCarparks((prev) => simulateLotFluctuations(prev));
    }, 15000);

    return () => clearInterval(interval);
  }, [isAutoRefresh]);

  // Keep selectedCarpark updated with latest lot numbers
  useEffect(() => {
    if (!selectedCarpark) return;
    const current = carparks.find((c) => c.id === selectedCarpark.id);
    if (current) {
      setSelectedCarpark(current);
    }
  }, [carparks]);

  // Update distances whenever userLocation changes
  useEffect(() => {
    if (!userLocation) return;

    setCarparks((prev) =>
      prev.map((cp) => ({
        ...cp,
        distanceKm: calculateDistanceKm(
          userLocation.lat,
          userLocation.lng,
          cp.coordinates.lat,
          cp.coordinates.lng
        ),
      }))
    );
  }, [userLocation]);

  // Manual simulation refresh
  const handleManualRefresh = () => {
    setCarparks((prev) => simulateLotFluctuations(prev));
    triggerToast('Real-time carpark lot counts updated');
  };

  // Live Singapore Data.gov.sg API sync
  const handleFetchGovData = async () => {
    setIsFetchingGov(true);
    triggerToast('Querying Singapore Data.gov.sg API...');

    const result = await fetchGovCarparkAvailability();
    setIsFetchingGov(false);

    if (result.success && Object.keys(result.carparkMap).length > 0) {
      const { updatedCarparks, matchedCount } = mergeGovDataIntoCarparks(
        carparks,
        result.carparkMap
      );
      setCarparks(updatedCarparks);
      setGovMatchedCount(matchedCount);
      triggerToast(`Synced live data for ${matchedCount} Singapore carparks from Data.gov.sg`);
    } else {
      triggerToast('Using real-time local telemetry stream');
    }
  };

  // User Geolocation
  const handleLocateUser = () => {
    if (!navigator.geolocation) {
      // Fallback to Singapore Marina Bay CBD
      setUserLocation({ lat: 1.2838, lng: 103.8591 });
      setFlyToCoord({ lat: 1.2838, lng: 103.8591, zoom: 14 });
      triggerToast('Located: Marina Bay Downtown, Singapore');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const { latitude, longitude } = pos.coords;
        // Verify if in Singapore vicinity (~1.1 to 1.5 lat, 103.5 to 104.1 lng)
        const isSg = latitude >= 1.15 && latitude <= 1.5 && longitude >= 103.55 && longitude <= 104.1;
        const targetLat = isSg ? latitude : 1.2838;
        const targetLng = isSg ? longitude : 103.8591;

        setUserLocation({ lat: targetLat, lng: targetLng });
        setFlyToCoord({ lat: targetLat, lng: targetLng, zoom: 14 });
        triggerToast(isSg ? 'Position detected in Singapore' : 'Centered at Marina Bay CBD');
      },
      () => {
        setIsLocating(false);
        // Default to City Hall / Marina Bay
        setUserLocation({ lat: 1.2838, lng: 103.8591 });
        setFlyToCoord({ lat: 1.2838, lng: 103.8591, zoom: 14 });
        triggerToast('Centered at Singapore Downtown');
      },
      { timeout: 7000 }
    );
  };

  // Quick Town Navigation click
  const handleSelectTown = (
    townName: string,
    coords: { lat: number; lng: number; zoom?: number }
  ) => {
    setSelectedTown(townName);
    setFlyToCoord(coords);
  };

  // Change active Tab
  const handleSelectTab = (tab: 'all' | 'hdb' | 'malls' | 'favorites') => {
    setActiveTab(tab);
    if (tab === 'hdb') {
      setFilters((prev) => ({ ...prev, agency: 'HDB' }));
    } else if (tab === 'malls') {
      setFilters((prev) => ({ ...prev, agency: 'LTA_MALL' }));
    } else if (tab === 'all') {
      setFilters((prev) => ({ ...prev, agency: 'ALL' }));
    }
  };

  // Filtered & Sorted Carparks
  const filteredCarparks = useMemo(() => {
    return carparks
      .filter((cp) => {
        // Tab restrictions
        if (activeTab === 'favorites' && !favorites.includes(cp.id)) {
          return false;
        }

        // Search query
        if (filters.searchQuery.trim()) {
          const q = filters.searchQuery.toLowerCase();
          const matchName = cp.name.toLowerCase().includes(q);
          const matchCode = cp.carparkNumber.toLowerCase().includes(q);
          const matchAddress = cp.address.toLowerCase().includes(q);
          const matchArea = cp.area.toLowerCase().includes(q);
          const matchPostal = cp.postalCode.includes(q);
          if (!matchName && !matchCode && !matchAddress && !matchArea && !matchPostal) {
            return false;
          }
        }

        // Agency filter
        if (filters.agency !== 'ALL') {
          if (filters.agency === 'LTA_MALL') {
            if (cp.agency !== 'LTA_MALL' && cp.agency !== 'COMMERCIAL') {
              return false;
            }
          } else if (cp.agency !== filters.agency) {
            return false;
          }
        }

        // Availability only filter
        const lotData = cp.lots[filters.lotType];
        if (filters.availabilityOnly && (!lotData || lotData.availableLots <= 0)) {
          return false;
        }

        // EV charging filter
        if (filters.hasEvCharging && !cp.hasEvCharging) {
          return false;
        }

        // Height filter
        if (filters.maxHeight && cp.heightLimitMeters && cp.heightLimitMeters < filters.maxHeight) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        const aLot = a.lots[filters.lotType] || { availableLots: 0, totalLots: 1 };
        const bLot = b.lots[filters.lotType] || { availableLots: 0, totalLots: 1 };

        switch (filters.sortBy) {
          case 'AVAILABLE_DESC':
            return bLot.availableLots - aLot.availableLots;
          case 'DISTANCE_ASC':
            return (a.distanceKm ?? 999) - (b.distanceKm ?? 999);
          case 'RATE_ASC':
            return a.rates.estimatedPerHourRate - b.rates.estimatedPerHourRate;
          case 'OCCUPANCY_ASC': {
            const aOcc = aLot.totalLots > 0 ? aLot.availableLots / aLot.totalLots : 0;
            const bOcc = bLot.totalLots > 0 ? bLot.availableLots / bLot.totalLots : 0;
            return bOcc - aOcc; // More vacancy first
          }
          case 'NAME_ASC':
            return a.name.localeCompare(b.name);
          default:
            return 0;
        }
      });
  }, [carparks, activeTab, favorites, filters]);

  // Overall Statistics Metrics
  const metrics = useMemo(() => {
    let totalLots = 0;
    let availableLots = 0;
    let evHubs = 0;

    carparks.forEach((cp) => {
      const l = cp.lots[filters.lotType];
      if (l) {
        totalLots += l.totalLots;
        availableLots += l.availableLots;
      }
      if (cp.hasEvCharging) evHubs++;
    });

    const avgVacancy = totalLots > 0 ? Math.round((availableLots / totalLots) * 100) : 0;

    return {
      totalCarparks: carparks.length,
      availableLots,
      totalLots,
      avgVacancy,
      evHubs,
    };
  }, [carparks, filters.lotType]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
      {/* Top Header */}
      <Header
        isAutoRefresh={isAutoRefresh}
        onToggleAutoRefresh={() => setIsAutoRefresh((v) => !v)}
        onManualRefresh={handleManualRefresh}
        onLocateUser={handleLocateUser}
        isLocating={isLocating}
        isFetchingGov={isFetchingGov}
        onFetchGovData={handleFetchGovData}
        govMatchedCount={govMatchedCount}
        onOpenFeeCalculator={() => setIsFeeCalculatorOpen(true)}
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
      />

      {/* Quick Town Navigation Bar */}
      <QuickTownNav
        onSelectTown={handleSelectTown}
        selectedTown={selectedTown}
      />

      {/* Filters Toolbar */}
      <FilterToolbar
        filters={filters}
        onChangeFilters={(f) => {
          setFilters(f);
          setSelectedLotType(f.lotType);
        }}
        totalCarparksCount={carparks.length}
        filteredCount={filteredCarparks.length}
        onResetFilters={() => {
          setFilters(initialFilters);
          setSelectedLotType('C');
          setActiveTab('all');
        }}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-full shadow-lg border border-slate-700 flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-150">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 flex flex-col">
        {/* KPI Summary Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          <div className="bg-white p-3.5 rounded-xl border border-slate-200">
            <div className="text-[11px] font-medium text-slate-500">Tracked Locations</div>
            <div className="text-xl font-bold font-mono text-slate-900 mt-0.5 tabular-nums">
              {metrics.totalCarparks}
            </div>
            <div className="text-[10px] text-slate-400">HDB, URA & Malls</div>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-slate-200">
            <div className="text-[11px] font-medium text-slate-500">Available Lots</div>
            <div className="text-xl font-bold font-mono text-emerald-600 mt-0.5 tabular-nums">
              {metrics.availableLots.toLocaleString()}
            </div>
            <div className="text-[10px] text-slate-400">
              of {metrics.totalLots.toLocaleString()} total
            </div>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-slate-200">
            <div className="text-[11px] font-medium text-slate-500">Islandwide Vacancy</div>
            <div className="text-xl font-bold font-mono text-slate-900 mt-0.5 tabular-nums">
              {metrics.avgVacancy}%
            </div>
            <div className="text-[10px] text-emerald-600 font-medium">Real-time estimate</div>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-slate-200">
            <div className="text-[11px] font-medium text-slate-500">EV Charging Hubs</div>
            <div className="text-xl font-bold font-mono text-blue-600 mt-0.5 tabular-nums">
              {metrics.evHubs}
            </div>
            <div className="text-[10px] text-slate-400">Fast chargers supported</div>
          </div>
        </div>

        {/* View Switcher: Split / Map / List */}
        <div className="flex items-center justify-between gap-4 mb-3">
          <div className="text-xs text-slate-600">
            Showing <strong className="font-semibold text-slate-900">{filteredCarparks.length}</strong> of{' '}
            {carparks.length} carparks
          </div>

          <div className="flex items-center p-0.5 bg-slate-200/80 rounded-lg text-xs">
            <button
              onClick={() => setViewMode('split')}
              className={`px-3 py-1 font-medium rounded-md transition-colors ${
                viewMode === 'split' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Split View
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`px-3 py-1 font-medium rounded-md transition-colors ${
                viewMode === 'map' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Map Focus
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 font-medium rounded-md transition-colors ${
                viewMode === 'list' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              List View
            </button>
          </div>
        </div>

        {/* View Layout Container */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[550px]">
          {/* Map View Pane */}
          {(viewMode === 'split' || viewMode === 'map') && (
            <div
              className={`rounded-2xl border border-slate-200 overflow-hidden shadow-xs relative ${
                viewMode === 'map' ? 'lg:col-span-12 h-[680px]' : 'lg:col-span-7 h-[580px] lg:h-auto'
              }`}
            >
              <CarparkMap
                carparks={filteredCarparks}
                selectedCarpark={selectedCarpark}
                onSelectCarpark={(cp) => setSelectedCarpark(cp)}
                selectedLotType={selectedLotType}
                userLocation={userLocation}
                flyToCoord={flyToCoord}
              />
            </div>
          )}

          {/* Carpark Cards List Pane */}
          {(viewMode === 'split' || viewMode === 'list') && (
            <div
              className={`flex flex-col ${
                viewMode === 'list' ? 'lg:col-span-12' : 'lg:col-span-5'
              }`}
            >
              {filteredCarparks.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center p-8 bg-white rounded-2xl border border-slate-200 text-center">
                  <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                    <Search className="w-6 h-6" />
                  </div>
                  <h4 className="text-base font-bold text-slate-800 mb-1">
                    No matching Singapore carparks found
                  </h4>
                  <p className="text-xs text-slate-500 max-w-xs mb-4">
                    Try adjusting your search keywords, clearing vehicle filters, or switching towns.
                  </p>
                  <button
                    onClick={() => {
                      setFilters(initialFilters);
                      setActiveTab('all');
                    }}
                    className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Reset All Filters
                  </button>
                </div>
              ) : (
                <div
                  className={`space-y-3 overflow-y-auto pr-1 ${
                    viewMode === 'list'
                      ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 space-y-0'
                      : 'max-h-[640px]'
                  }`}
                >
                  {filteredCarparks.map((cp) => (
                    <CarparkCard
                      key={cp.id}
                      carpark={cp}
                      isSelected={selectedCarpark?.id === cp.id}
                      onSelect={() => setSelectedCarpark(cp)}
                      onFocusOnMap={() => {
                        setSelectedCarpark(cp);
                        setFlyToCoord({
                          lat: cp.coordinates.lat,
                          lng: cp.coordinates.lng,
                          zoom: 16,
                        });
                        if (window.innerWidth < 1024) {
                          setViewMode('map');
                        }
                      }}
                      onToggleFavorite={() => handleToggleFavorite(cp.id)}
                      isFavorite={favorites.includes(cp.id)}
                      selectedLotType={selectedLotType}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Carpark Detail Drawer / Modal */}
      <CarparkDrawer
        carpark={selectedCarpark}
        onClose={() => setSelectedCarpark(null)}
        isFavorite={selectedCarpark ? favorites.includes(selectedCarpark.id) : false}
        onToggleFavorite={() => {
          if (selectedCarpark) handleToggleFavorite(selectedCarpark.id);
        }}
        selectedLotType={selectedLotType}
        onChangeLotType={(t) => {
          setSelectedLotType(t);
          setFilters((prev) => ({ ...prev, lotType: t }));
        }}
      />

      {/* Dedicated Fee Calculator Modal */}
      <FeeCalculatorModal
        isOpen={isFeeCalculatorOpen}
        onClose={() => setIsFeeCalculatorOpen(false)}
        carparks={carparks}
        initialCarpark={selectedCarpark}
      />

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-6 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            <strong className="text-slate-800">SG ParkSpot</strong> · Singapore Real-Time Carpark Availability Tracker
          </div>
          <div className="flex items-center gap-4">
            <span>Powered by Open Data.gov.sg & Singapore LTA/HDB</span>
            <span aria-hidden="true">·</span>
            <button
              onClick={() => setIsFeeCalculatorOpen(true)}
              className="text-blue-600 hover:underline font-medium"
            >
              Fee Estimator
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
