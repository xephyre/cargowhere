import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { Carpark, LotType } from '../types/carpark';
import { Zap, Navigation, Clock } from 'lucide-react';

interface CarparkMapProps {
  carparks: Carpark[];
  selectedCarpark: Carpark | null;
  onSelectCarpark: (carpark: Carpark) => void;
  selectedLotType: LotType;
  userLocation: { lat: number; lng: number } | null;
  flyToCoord: { lat: number; lng: number; zoom?: number } | null;
}

export const CarparkMap: React.FC<CarparkMapProps> = ({
  carparks,
  selectedCarpark,
  onSelectCarpark,
  selectedLotType,
  userLocation,
  flyToCoord,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const userMarkerRef = useRef<L.Marker | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Center of Singapore
    const sgCenter: L.LatLngExpression = [1.3521, 103.8198];

    const map = L.map(mapContainerRef.current, {
      center: sgCenter,
      zoom: 12,
      zoomControl: false,
      maxBounds: [
        [1.15, 103.55], // Southwest coordinates of SG region
        [1.50, 104.10], // Northeast coordinates of SG region
      ],
      minZoom: 11,
      maxZoom: 18,
    });

    // Add crisp CartoDB Positron tiles for high readability
    L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
      {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 19,
      }
    ).addTo(map);

    // Zoom control in bottom right
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Sync user location marker
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (userLocation) {
      if (userMarkerRef.current) {
        userMarkerRef.current.setLatLng([userLocation.lat, userLocation.lng]);
      } else {
        const userIcon = L.divIcon({
          className: 'custom-carpark-pin',
          html: `
            <div style="position: relative; width: 22px; height: 22px;">
              <div style="position: absolute; inset: -4px; border-radius: 9999px; background-color: rgba(59, 130, 246, 0.3); animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
              <div style="width: 22px; height: 22px; border-radius: 9999px; background-color: #2563eb; border: 3px solid white; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.2);"></div>
            </div>
          `,
          iconSize: [22, 22],
          iconAnchor: [11, 11],
        });

        userMarkerRef.current = L.marker([userLocation.lat, userLocation.lng], {
          icon: userIcon,
          zIndexOffset: 1000,
        }).addTo(map);
        userMarkerRef.current.bindTooltip('Your Location in Singapore', {
          direction: 'top',
          offset: [0, -10],
        });
      }
    } else if (userMarkerRef.current) {
      userMarkerRef.current.remove();
      userMarkerRef.current = null;
    }
  }, [userLocation]);

  // Sync Carpark Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const currentMarkers = markersRef.current;
    const incomingIds = new Set(carparks.map((cp) => cp.id));

    // Remove markers that are no longer in list
    currentMarkers.forEach((marker, id) => {
      if (!incomingIds.has(id)) {
        marker.remove();
        currentMarkers.delete(id);
      }
    });

    // Add or update markers
    carparks.forEach((cp) => {
      const lotData = cp.lots[selectedLotType] || {
        totalLots: 0,
        availableLots: 0,
      };
      const available = lotData.availableLots;
      const total = lotData.totalLots;
      const ratio = total > 0 ? available / total : 0;

      // Color scheme based on availability
      let bgClass = '#16a34a'; // Emerald green >25%
      let textClass = '#ffffff';
      let borderClass = '#15803d';
      let statusLabel = 'Plenty Lots';

      if (available === 0) {
        bgClass = '#dc2626'; // Red 0 lots
        borderClass = '#b91c1c';
        statusLabel = 'Full';
      } else if (ratio < 0.1) {
        bgClass = '#ea580c'; // Orange <10%
        borderClass = '#c2410c';
        statusLabel = 'Few Lots';
      } else if (ratio <= 0.25) {
        bgClass = '#d97706'; // Amber 10-25%
        borderClass = '#b45309';
        statusLabel = 'Filling Fast';
      }

      const isSelected = selectedCarpark?.id === cp.id;
      const scaleTransform = isSelected ? 'scale(1.2)' : 'scale(1)';
      const zIndex = isSelected ? 900 : Math.round(available);

      const html = `
        <div style="display: flex; flex-direction: column; align-items: center; cursor: pointer; transform: ${scaleTransform}; transition: transform 0.15s ease-out;">
          <div style="display: flex; align-items: center; justify-content: center; min-width: 38px; height: 26px; padding: 0 7px; background-color: ${bgClass}; color: ${textClass}; border-radius: 9999px; font-weight: 700; font-size: 11px; font-family: 'JetBrains Mono', monospace; border: 2px solid white; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.25);">
            ${available}
          </div>
          <div style="margin-top: 2px; font-size: 9px; font-weight: 600; color: #1e293b; background: rgba(255,255,255,0.92); padding: 1px 5px; border-radius: 4px; box-shadow: 0 1px 2px rgba(0,0,0,0.15); white-space: nowrap; max-width: 90px; overflow: hidden; text-overflow: ellipsis; text-align: center;">
            ${cp.carparkNumber}
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'custom-carpark-pin',
        html,
        iconSize: [44, 40],
        iconAnchor: [22, 26],
      });

      const popupHtml = `
        <div style="padding: 12px 14px; font-family: 'Plus Jakarta Sans', sans-serif; min-width: 220px;">
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 4px;">
            <span style="font-size: 10px; font-weight: 700; text-transform: uppercase; color: #64748b; letter-spacing: 0.05em;">${cp.agency.replace('_', ' ')} · ${cp.carparkNumber}</span>
            <span style="font-size: 10px; font-weight: 600; color: ${bgClass};">${statusLabel}</span>
          </div>
          <h4 style="font-size: 13px; font-weight: 700; color: #0f172a; margin: 0 0 4px 0; line-height: 1.3;">${cp.name}</h4>
          <p style="font-size: 11px; color: #64748b; margin: 0 0 8px 0;">${cp.address}</p>
          
          <div style="display: flex; align-items: center; justify-content: space-between; background: #f8fafc; padding: 6px 8px; border-radius: 6px; margin-bottom: 8px; border: 1px solid #e2e8f0;">
            <div>
              <div style="font-size: 10px; color: #64748b;">Available Lots</div>
              <div style="font-size: 15px; font-weight: 700; color: #0f172a; font-family: 'JetBrains Mono', monospace;">
                ${available} <span style="font-size: 11px; font-weight: 500; color: #94a3b8;">/ ${total}</span>
              </div>
            </div>
            ${
              cp.hasEvCharging
                ? `<div style="display: flex; align-items: center; gap: 4px; font-size: 11px; font-weight: 600; color: #059669;">
                    <span>⚡ EV Available</span>
                   </div>`
                : ''
            }
          </div>

          <div style="font-size: 11px; color: #475569; margin-bottom: 10px;">
            <strong>Est. Rate:</strong> $${cp.rates.estimatedPerHourRate.toFixed(2)}/hr · Grace: ${cp.rates.gracePeriodMins}m
          </div>

          <button id="view-carpark-${cp.id}" style="width: 100%; background: #2563eb; color: white; border: none; padding: 6px 12px; font-size: 12px; font-weight: 600; border-radius: 6px; cursor: pointer;">
            View Rates & Directions
          </button>
        </div>
      `;

      let marker = currentMarkers.get(cp.id);
      if (!marker) {
        marker = L.marker([cp.coordinates.lat, cp.coordinates.lng], {
          icon: customIcon,
          zIndexOffset: zIndex,
        }).addTo(map);

        marker.bindPopup(popupHtml, {
          closeButton: false,
          offset: [0, -14],
        });

        marker.on('popupopen', () => {
          const btn = document.getElementById(`view-carpark-${cp.id}`);
          if (btn) {
            btn.onclick = () => {
              onSelectCarpark(cp);
              map.closePopup();
            };
          }
        });

        marker.on('click', () => {
          onSelectCarpark(cp);
        });

        currentMarkers.set(cp.id, marker);
      } else {
        marker.setIcon(customIcon);
        marker.setZIndexOffset(zIndex);
        marker.setPopupContent(popupHtml);
      }
    });
  }, [carparks, selectedCarpark, selectedLotType, onSelectCarpark]);

  // Handle fly-to coordinate requests (e.g. from town navigation or clicking a card)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !flyToCoord) return;

    map.flyTo([flyToCoord.lat, flyToCoord.lng], flyToCoord.zoom ?? 15, {
      duration: 1.2,
      easeLinearity: 0.25,
    });
  }, [flyToCoord]);

  return (
    <div className="relative w-full h-full min-h-[350px] bg-slate-100 overflow-hidden">
      <div ref={mapContainerRef} className="w-full h-full z-10" />

      {/* Map Legend Overlay */}
      <div className="absolute top-4 right-4 z-20 bg-white/95 backdrop-blur-md px-3 py-2 rounded-lg border border-slate-200 shadow-sm text-xs pointer-events-auto">
        <div className="text-[11px] font-semibold text-slate-700 mb-1.5">Lots Availability</div>
        <div className="flex flex-col gap-1 text-[11px] text-slate-600">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 shrink-0"></span>
            <span>Plenty (&gt;25% lots)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0"></span>
            <span>Filling (10–25% lots)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-600 shrink-0"></span>
            <span>Low (&lt;10% lots)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600 shrink-0"></span>
            <span>Full (0 lots)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
