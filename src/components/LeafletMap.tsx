import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { EmergencyRequest, RescueTeam, RouteResult } from '../types';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface LeafletMapProps {
  center?: [number, number];
  zoom?: number;
  requests?: EmergencyRequest[];
  teams?: RescueTeam[];
  selectedRequest?: EmergencyRequest | null;
  selectedTeam?: RescueTeam | null;
  activeRoute?: RouteResult | null;
  onSelectRequest?: (req: EmergencyRequest) => void;
  onSelectTeam?: (team: RescueTeam) => void;
  // Picker mode: if enabled, clicking the map moves the selected pin
  pickLocationMode?: boolean;
  pickedLocation?: [number, number] | null;
  onLocationPicked?: (lat: number, lng: number) => void;
  userLocation?: [number, number] | null;
  showTeams?: boolean;
  showResolved?: boolean;
  height?: string;
}

// Custom Leaflet DivIcon builders for high-definition SVG markers
function createIncidentIcon(severity: string, status: string, isSelected: boolean) {
  let bgColor = '#DC2626'; // red critical
  let borderColor = '#991B1B';
  let badgeLetter = '!';

  if (status === 'resolved') {
    bgColor = '#16A34A'; // green
    borderColor = '#15803D';
    badgeLetter = '✓';
  } else if (severity === 'high') {
    bgColor = '#EA580C'; // orange
    borderColor = '#C2410C';
    badgeLetter = 'H';
  } else if (severity === 'medium') {
    bgColor = '#D97706'; // amber
    borderColor = '#B45309';
    badgeLetter = 'M';
  }

  const ringStyle = isSelected
    ? 'ring-4 ring-offset-2 ring-red-500 scale-125 z-50 animate-bounce'
    : 'hover:scale-110';

  const html = `
    <div class="relative flex items-center justify-center transition-transform ${ringStyle}" style="width: 32px; height: 32px;">
      <div style="background-color: ${bgColor}; border: 2px solid ${borderColor}; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3);" class="w-8 h-8 rounded-full flex items-center justify-center text-white font-black text-xs">
        ${badgeLetter}
      </div>
      <div style="border-top-color: ${bgColor};" class="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px]"></div>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-incident-pin',
    iconSize: [32, 38],
    iconAnchor: [16, 38],
    popupAnchor: [0, -36],
  });
}

function createTeamIcon(status: string, isSelected: boolean) {
  const isAvailable = status === 'available';
  const bgColor = isAvailable ? '#2563EB' : '#475569';
  const ringStyle = isSelected ? 'ring-4 ring-blue-400 scale-125' : 'hover:scale-110';

  const html = `
    <div class="relative flex items-center justify-center transition-transform ${ringStyle}" style="width: 32px; height: 32px;">
      <div style="background-color: ${bgColor}; border: 2px solid #1E40AF; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3);" class="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs">
        SAR
      </div>
      <div style="border-top-color: ${bgColor};" class="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[7px]"></div>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-team-pin',
    iconSize: [32, 38],
    iconAnchor: [16, 38],
    popupAnchor: [0, -36],
  });
}

function createUserLocationIcon() {
  const html = `
    <div class="relative flex items-center justify-center" style="width: 24px; height: 24px;">
      <div class="absolute w-6 h-6 rounded-full bg-blue-500 opacity-30 animate-ping"></div>
      <div class="w-4 h-4 rounded-full bg-blue-600 border-2 border-white shadow-md"></div>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-user-pin',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
}

function createPickerIcon() {
  const html = `
    <div class="relative flex items-center justify-center animate-bounce" style="width: 36px; height: 42px;">
      <div style="background-color: #DC2626; border: 3px solid #FFFFFF; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.4);" class="w-9 h-9 rounded-full flex items-center justify-center text-white font-extrabold text-xs">
        📍
      </div>
      <div class="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[7px] border-l-transparent border-r-[7px] border-r-transparent border-t-[9px] border-t-red-600"></div>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-picker-pin',
    iconSize: [36, 44],
    iconAnchor: [18, 44],
  });
}

export const LeafletMap: React.FC<LeafletMapProps> = ({
  center = [12.9716, 77.5946], // Bengaluru (Bangalore), Karnataka, India demo sector default
  zoom = 12,
  requests = [],
  teams = [],
  selectedRequest,
  selectedTeam,
  activeRoute,
  onSelectRequest,
  onSelectTeam,
  pickLocationMode = false,
  pickedLocation,
  onLocationPicked,
  userLocation,
  showTeams = true,
  showResolved = true,
  height = '500px',
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const routeLayerRef = useRef<L.LayerGroup | null>(null);

  const [tileError, setTileError] = useState(false);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center,
      zoom,
      zoomControl: true,
      attributionControl: true,
    });

    const tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors',
    });

    tileLayer.on('tileerror', () => {
      setTileError(true);
    });

    tileLayer.on('load', () => {
      setTileError(false);
    });

    tileLayer.addTo(map);

    const markersLayer = L.layerGroup().addTo(map);
    const routeLayer = L.layerGroup().addTo(map);

    mapInstanceRef.current = map;
    tileLayerRef.current = tileLayer;
    markersLayerRef.current = markersLayer;
    routeLayerRef.current = routeLayer;

    // Handle map clicks in picker mode
    map.on('click', (e: L.LeafletMouseEvent) => {
      if (onLocationPicked) {
        onLocationPicked(e.latlng.lat, e.latlng.lng);
      }
    });

    // Invalidate size on load
    setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update map view when center/zoom changes externally
  useEffect(() => {
    if (mapInstanceRef.current && center) {
      mapInstanceRef.current.setView(center, zoom, { animate: true });
    }
  }, [center?.[0], center?.[1], zoom]);

  // Redraw markers
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;
    const markersLayer = markersLayerRef.current;
    markersLayer.clearLayers();

    // 1. User location marker
    if (userLocation) {
      const userMarker = L.marker(userLocation, { icon: createUserLocationIcon() });
      userMarker.bindTooltip('Your Reported Device Location', { direction: 'top' });
      markersLayer.addLayer(userMarker);
    }

    // 2. Location Picker marker
    if (pickLocationMode && pickedLocation) {
      const pickerMarker = L.marker(pickedLocation, {
        icon: createPickerIcon(),
        draggable: true,
      });

      pickerMarker.on('dragend', (e) => {
        const marker = e.target as L.Marker;
        const position = marker.getLatLng();
        if (onLocationPicked) {
          onLocationPicked(position.lat, position.lng);
        }
      });

      pickerMarker.bindTooltip('Selected Emergency Location (Drag to adjust)', {
        permanent: true,
        direction: 'top',
        className: 'bg-red-600 text-white font-bold text-xs px-2 py-0.5 rounded shadow',
      });

      markersLayer.addLayer(pickerMarker);
    }

    // 3. Emergency Incident markers
    requests.forEach((req) => {
      if (!showResolved && req.status === 'resolved') return;

      const isSelected = selectedRequest?.id === req.id;
      const icon = createIncidentIcon(req.severity, req.status, isSelected);

      const marker = L.marker([req.latitude, req.longitude], { icon });

      // Custom Popup HTML
      const statusLabel = req.status.replace('_', ' ').toUpperCase();
      const popupHtml = `
        <div class="p-3 max-w-[260px] text-slate-800 text-xs">
          <div class="flex items-center justify-between pb-1 mb-1 border-b border-slate-200">
            <span class="font-bold text-slate-900">${req.requestCode}</span>
            <span class="font-semibold uppercase tracking-wider text-[10px] px-1.5 py-0.5 rounded ${
              req.severity === 'critical' ? 'bg-red-100 text-red-800' : 'bg-orange-100 text-orange-800'
            }">${req.severity}</span>
          </div>
          <div class="font-bold text-sm text-slate-900 mb-1 capitalize">${req.emergencyType} Incident</div>
          <p class="text-slate-600 text-xs line-clamp-2 mb-2">${req.description}</p>
          <div class="space-y-0.5 text-[11px] text-slate-500 mb-2">
            <div><strong>People:</strong> ${req.peopleAffected} affected</div>
            <div><strong>Location:</strong> ${req.address}</div>
            <div><strong>Status:</strong> <span class="font-medium text-slate-800">${statusLabel}</span></div>
          </div>
          <button id="btn-select-${req.id}" class="w-full text-center font-bold text-xs py-1.5 px-2 bg-slate-900 text-white rounded hover:bg-slate-800 transition-colors">
            Select & View Details
          </button>
        </div>
      `;

      marker.bindPopup(popupHtml);

      marker.on('popupopen', () => {
        const btn = document.getElementById(`btn-select-${req.id}`);
        if (btn) {
          btn.onclick = () => {
            if (onSelectRequest) onSelectRequest(req);
            marker.closePopup();
          };
        }
      });

      marker.on('click', () => {
        if (onSelectRequest) onSelectRequest(req);
      });

      markersLayer.addLayer(marker);
    });

    // 4. Rescue Team markers
    if (showTeams) {
      teams.forEach((team) => {
        const isSelected = selectedTeam?.id === team.id;
        const icon = createTeamIcon(team.status, isSelected);
        const marker = L.marker([team.latitude, team.longitude], { icon });

        const popupHtml = `
          <div class="p-3 max-w-[260px] text-slate-800 text-xs">
            <div class="flex items-center justify-between pb-1 mb-1 border-b border-slate-200">
              <span class="font-bold text-blue-900">${team.callsign}</span>
              <span class="font-semibold text-[10px] px-1.5 py-0.5 rounded ${
                team.status === 'available' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-600'
              }">${team.status.toUpperCase()}</span>
            </div>
            <div class="font-bold text-sm text-slate-900 mb-1">${team.name}</div>
            <div class="text-[11px] text-slate-600 mb-1"><strong>Base:</strong> ${team.baseLocation}</div>
            <div class="text-[11px] text-slate-600 mb-2"><strong>Vehicle:</strong> ${team.vehicleType}</div>
            <button id="btn-team-${team.id}" class="w-full text-center font-bold text-xs py-1.5 px-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
              Select Rescue Unit
            </button>
          </div>
        `;

        marker.bindPopup(popupHtml);

        marker.on('popupopen', () => {
          const btn = document.getElementById(`btn-team-${team.id}`);
          if (btn) {
            btn.onclick = () => {
              if (onSelectTeam) onSelectTeam(team);
              marker.closePopup();
            };
          }
        });

        markersLayer.addLayer(marker);
      });
    }
  }, [
    requests,
    teams,
    selectedRequest?.id,
    selectedTeam?.id,
    userLocation,
    pickLocationMode,
    pickedLocation,
    showTeams,
    showResolved,
  ]);

  // Draw active route polyline
  useEffect(() => {
    if (!mapInstanceRef.current || !routeLayerRef.current) return;
    const routeLayer = routeLayerRef.current;
    routeLayer.clearLayers();

    if (activeRoute && activeRoute.coordinates && activeRoute.coordinates.length > 0) {
      // Draw alternatives first (muted style)
      if (activeRoute.alternatives) {
        activeRoute.alternatives.forEach((alt) => {
          const altLine = L.polyline(alt.coordinates, {
            color: '#94A3B8',
            weight: 4,
            opacity: 0.7,
            dashArray: '6, 6',
          });
          altLine.bindTooltip(`Alternative: ${alt.distanceKm} km (~${alt.durationMin}m)`, {
            sticky: true,
          });
          routeLayer.addLayer(altLine);
        });
      }

      // Draw primary route (high-contrast blue route with dark outline)
      const borderLine = L.polyline(activeRoute.coordinates, {
        color: '#1E3A8A',
        weight: 7,
        opacity: 0.9,
      });
      const mainLine = L.polyline(activeRoute.coordinates, {
        color: '#3B82F6',
        weight: 5,
        opacity: 1,
      });

      routeLayer.addLayer(borderLine);
      routeLayer.addLayer(mainLine);

      // Fit bounds to show the entire route with padding
      const bounds = L.latLngBounds(activeRoute.coordinates);
      mapInstanceRef.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
    }
  }, [activeRoute]);

  const handleRetryTiles = () => {
    if (tileLayerRef.current) {
      tileLayerRef.current.redraw();
      setTileError(false);
    }
  };

  return (
    <div className="relative w-full rounded-xl overflow-hidden border border-slate-300 shadow-sm" style={{ height }}>
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Tile loading error notification */}
      {tileError && (
        <div className="absolute top-3 left-3 right-3 z-30 bg-red-50 border border-red-300 rounded-lg p-3 text-red-800 text-xs shadow-md flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>Map tile loading encountered an issue. OpenStreetMap standard tiles are retrying.</span>
          </div>
          <button
            onClick={handleRetryTiles}
            className="flex items-center gap-1 bg-red-600 text-white font-semibold px-2 py-1 rounded text-xs hover:bg-red-700"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* Map Legend Overlay */}
      <div className="absolute bottom-3 left-3 z-20 bg-white/95 backdrop-blur-sm px-3 py-2 rounded-lg border border-slate-200 shadow-md text-[11px] text-slate-700 pointer-events-auto flex flex-wrap items-center gap-3">
        <span className="font-bold text-slate-900 uppercase tracking-wider text-[10px]">Legend:</span>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-600 inline-block"></span>
          <span>Critical</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-orange-500 inline-block"></span>
          <span>High Priority</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block"></span>
          <span>Rescue Unit (SAR)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-green-600 inline-block"></span>
          <span>Resolved</span>
        </div>
      </div>
    </div>
  );
};
