import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Filter,
  Navigation,
  Route,
  Clock,
  Layers,
  ChevronRight,
  ExternalLink,
  Users,
  Shield,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import { LeafletMap } from '../components/LeafletMap';
import { EmergencyRequest, RescueTeam, RouteResult } from '../types';
import { fetchRoute } from '../services/api';

interface LiveMapPageProps {
  requests: EmergencyRequest[];
  teams: RescueTeam[];
  onOpenDashboardWithRequest?: (req: EmergencyRequest) => void;
}

export const LiveMapPage: React.FC<LiveMapPageProps> = ({
  requests,
  teams,
  onOpenDashboardWithRequest,
}) => {
  const [selectedRequest, setSelectedRequest] = useState<EmergencyRequest | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<RescueTeam | null>(null);
  const [activeRoute, setActiveRoute] = useState<RouteResult | null>(null);
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);

  // Filters
  const [filterType, setFilterType] = useState('all');
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [showTeams, setShowTeams] = useState(true);
  const [showResolved, setShowResolved] = useState(false);

  // Map viewport state
  const [mapCenter, setMapCenter] = useState<[number, number]>([12.9716, 77.5946]);
  const [mapZoom, setMapZoom] = useState(12);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);

  // Filter requests
  const filteredRequests = requests.filter((r) => {
    if (filterType !== 'all' && r.emergencyType !== filterType) return false;
    if (filterSeverity !== 'all' && r.severity !== filterSeverity) return false;
    if (!showResolved && r.status === 'resolved') return false;
    return true;
  });

  // Calculate route when both selectedRequest and selectedTeam are chosen
  const handleCalculateRoute = async (req: EmergencyRequest, team: RescueTeam) => {
    setSelectedRequest(req);
    setSelectedTeam(team);
    setLoadingRoute(true);
    setRouteError(null);

    try {
      const route = await fetchRoute(
        team.latitude,
        team.longitude,
        req.latitude,
        req.longitude
      );
      setActiveRoute(route);
    } catch (err: any) {
      setRouteError(err.message || 'Routing service unavailable. Displaying direct coordinates.');
    } finally {
      setLoadingRoute(false);
    }
  };

  // Find and route from nearest available team automatically when selecting an incident
  const handleSelectIncident = (req: EmergencyRequest) => {
    setSelectedRequest(req);
    setActiveRoute(null);
    setRouteError(null);

    // Auto-select best available team
    const availableTeams = teams.filter((t) => t.status === 'available');
    if (availableTeams.length > 0) {
      // Pick first (already ranked by API or default)
      handleCalculateRoute(req, availableTeams[0]);
    }
  };

  const handleLocateUser = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setUserLocation([lat, lng]);
          setMapCenter([lat, lng]);
          setMapZoom(14);
        },
        () => {
          // Graceful fallback to central Bangalore
          setMapCenter([12.9716, 77.5946]);
          setMapZoom(13);
          alert('Device GPS lookup timed out or was unavailable. Map centered on Central Bangalore (MG Road / Vidhana Soudha).');
        },
        { timeout: 15000, enableHighAccuracy: true, maximumAge: 10000 }
      );
    }
  };

  const handleResetToSector = () => {
    setMapCenter([12.9716, 77.5946]);
    setMapZoom(12);
    setSelectedRequest(null);
    setSelectedTeam(null);
    setActiveRoute(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Interactive Disaster Response Map
          </h1>
          <p className="text-xs sm:text-sm text-slate-600">
            Real-time geospatial tracking across Bengaluru (Bangalore) urban disaster grid, deployed SAR units, and road corridors.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleLocateUser}
            className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5"
          >
            <Navigation className="w-3.5 h-3.5 text-blue-600" />
            <span>My Location</span>
          </button>
          <button
            onClick={handleResetToSector}
            className="px-3 py-1.5 bg-slate-900 text-white hover:bg-slate-800 text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to Bengaluru Grid</span>
          </button>
        </div>
      </div>

      {/* Filter and Control Bar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-bold text-slate-700 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" />
            <span>Filter:</span>
          </span>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-slate-50 border border-slate-300 text-slate-800 rounded-lg px-2.5 py-1.5 font-medium focus:ring-1 focus:ring-red-500"
          >
            <option value="all">All Disaster Types</option>
            <option value="flood">Flood</option>
            <option value="earthquake">Earthquake</option>
            <option value="fire">Fire</option>
            <option value="landslide">Landslide</option>
            <option value="medical">Medical</option>
            <option value="trapped">Trapped Person</option>
            <option value="collapse">Building Collapse</option>
          </select>

          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="bg-slate-50 border border-slate-300 text-slate-800 rounded-lg px-2.5 py-1.5 font-medium focus:ring-1 focus:ring-red-500"
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical Only</option>
            <option value="high">High Priority</option>
            <option value="medium">Medium Priority</option>
          </select>
        </div>

        <div className="flex items-center gap-4">
          <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 font-medium">
            <input
              type="checkbox"
              checked={showTeams}
              onChange={(e) => setShowTeams(e.target.checked)}
              className="rounded text-blue-600 focus:ring-blue-500"
            />
            <span>Show Rescue Teams</span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 font-medium">
            <input
              type="checkbox"
              checked={showResolved}
              onChange={(e) => setShowResolved(e.target.checked)}
              className="rounded text-emerald-600 focus:ring-emerald-500"
            />
            <span>Show Resolved</span>
          </label>
        </div>
      </div>

      {/* Main Grid: Map + Side Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left / Center: Interactive Map */}
        <div className="lg:col-span-8 space-y-3">
          <LeafletMap
            center={mapCenter}
            zoom={mapZoom}
            requests={filteredRequests}
            teams={teams}
            selectedRequest={selectedRequest}
            selectedTeam={selectedTeam}
            activeRoute={activeRoute}
            onSelectRequest={handleSelectIncident}
            onSelectTeam={(team) => {
              setSelectedTeam(team);
              if (selectedRequest) {
                handleCalculateRoute(selectedRequest, team);
              }
            }}
            userLocation={userLocation}
            showTeams={showTeams}
            showResolved={showResolved}
            height="580px"
          />

          {/* Quick instructions bar */}
          <div className="bg-slate-100 rounded-lg px-3 py-2 text-xs text-slate-600 flex items-center justify-between">
            <span>
              💡 <strong>Tip:</strong> Click on any incident marker (Red/Orange/Green) or rescue team pin (Blue) to inspect details and compute road routing.
            </span>
            <span className="font-mono tabular-nums text-slate-500">
              {filteredRequests.length} incidents shown
            </span>
          </div>
        </div>

        {/* Right Column: Selected Incident & Route Panel */}
        <div className="lg:col-span-4 space-y-4">
          {selectedRequest ? (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-4">
              {/* Selected Incident Header */}
              <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm text-slate-900">
                      {selectedRequest.requestCode}
                    </span>
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                        selectedRequest.severity === 'critical'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-orange-100 text-orange-800'
                      }`}
                    >
                      {selectedRequest.severity}
                    </span>
                  </div>
                  <h3 className="font-bold text-base text-slate-900 capitalize mt-1">
                    {selectedRequest.emergencyType} Emergency
                  </h3>
                </div>

                <button
                  onClick={() => {
                    setSelectedRequest(null);
                    setActiveRoute(null);
                  }}
                  className="text-slate-400 hover:text-slate-600 text-xs font-bold"
                >
                  ✕
                </button>
              </div>

              {/* Description & Details */}
              <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                "{selectedRequest.description}"
              </p>

              <div className="space-y-1.5 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="font-medium text-slate-900">{selectedRequest.address}</span>
                </div>
                {selectedRequest.landmark && (
                  <div className="flex items-center gap-2 pl-5 text-[11px] text-slate-500">
                    <span>Landmark: {selectedRequest.landmark}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span><strong>{selectedRequest.peopleAffected}</strong> people reported affected</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>Reported: {new Date(selectedRequest.createdAt).toLocaleTimeString()}</span>
                </div>
              </div>

              {/* Road Routing Status Box */}
              <div className="pt-3 border-t border-slate-100 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                    <Route className="w-3.5 h-3.5 text-blue-600" />
                    <span>Calculated Road Route</span>
                  </span>
                  {loadingRoute && (
                    <span className="text-[11px] text-blue-600 font-semibold animate-pulse">
                      Calculating via OSRM...
                    </span>
                  )}
                </div>

                {/* Team selection dropdown */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Select Responding SAR Team:
                  </label>
                  <select
                    value={selectedTeam?.id || ''}
                    onChange={(e) => {
                      const t = teams.find((item) => item.id === e.target.value);
                      if (t && selectedRequest) {
                        handleCalculateRoute(selectedRequest, t);
                      }
                    }}
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2 font-medium focus:ring-1 focus:ring-blue-500"
                  >
                    {teams.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.status})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Route Result details */}
                {activeRoute && (
                  <div className="bg-blue-50/80 border border-blue-200 rounded-xl p-3 space-y-2 text-xs">
                    <div className="grid grid-cols-2 gap-2 text-center">
                      <div className="bg-white p-2 rounded-lg border border-blue-100">
                        <span className="block text-[10px] text-slate-500 uppercase font-bold">Est. Distance</span>
                        <span className="text-base font-extrabold text-blue-900 font-mono">
                          {activeRoute.distanceKm} km
                        </span>
                      </div>
                      <div className="bg-white p-2 rounded-lg border border-blue-100">
                        <span className="block text-[10px] text-slate-500 uppercase font-bold">Est. Travel Time</span>
                        <span className="text-base font-extrabold text-blue-900 font-mono">
                          ~{activeRoute.durationMin} min
                        </span>
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-600">
                      <strong>Corridor:</strong> {activeRoute.summary}
                    </div>

                    {/* Important Disaster Road Caution */}
                    <div className="text-[10px] text-amber-800 bg-amber-100/60 p-2 rounded border border-amber-200 flex items-start gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
                      <span>{activeRoute.warning}</span>
                    </div>

                    {/* Open external navigation */}
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${selectedRequest.latitude},${selectedRequest.longitude}&origin=${selectedTeam?.latitude},${selectedTeam?.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <span>Open External Navigation</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}

                {routeError && (
                  <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800">
                    {routeError}
                  </div>
                )}
              </div>

              {/* Action: Open in Rescue Dashboard */}
              {onOpenDashboardWithRequest && (
                <button
                  onClick={() => onOpenDashboardWithRequest(selectedRequest)}
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5"
                >
                  <Shield className="w-3.5 h-3.5 text-red-400" />
                  <span>Open in Rescue Operator Dashboard</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 p-6 text-center space-y-3">
              <MapPin className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="font-bold text-sm text-slate-800">No Incident Selected</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Click on any emergency marker on the map to review victim details, match rescue teams, and inspect live road routing.
              </p>
              <div className="pt-2 text-left space-y-2 border-t border-slate-100">
                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  Active Demo Sector Incidents:
                </span>
                <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                  {filteredRequests.slice(0, 5).map((req) => (
                    <button
                      key={req.id}
                      onClick={() => handleSelectIncident(req)}
                      className="w-full text-left p-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors flex items-center justify-between text-xs"
                    >
                      <div className="truncate">
                        <span className="font-mono font-bold text-slate-800 mr-2">{req.requestCode}</span>
                        <span className="capitalize text-slate-600">{req.emergencyType}</span>
                      </div>
                      <span
                        className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                          req.severity === 'critical' ? 'bg-red-100 text-red-800' : 'bg-orange-100 text-orange-800'
                        }`}
                      >
                        {req.severity}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Rescue Teams Availability Summary */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="font-bold text-xs text-slate-900">Deployed SAR Units</span>
              <span className="text-[11px] font-semibold text-blue-600">
                {teams.filter((t) => t.status === 'available').length} / {teams.length} Available
              </span>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {teams.map((t) => (
                <div
                  key={t.id}
                  onClick={() => {
                    setSelectedTeam(t);
                    if (selectedRequest) {
                      handleCalculateRoute(selectedRequest, t);
                    }
                  }}
                  className={`p-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                    selectedTeam?.id === t.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-slate-100 bg-slate-50/50 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{t.name}</span>
                    <span
                      className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                        t.status === 'available'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {t.status}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1 line-clamp-1">
                    {t.vehicleType}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
