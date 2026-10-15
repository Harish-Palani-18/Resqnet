import React, { useState } from 'react';
import {
  ShieldAlert,
  MapPin,
  Route,
  Search,
  ArrowRight,
  Clock,
  Phone,
  Flame,
  Waves,
  Mountain,
  HeartPulse,
  Users,
} from 'lucide-react';
import { EmergencyRequest } from '../types';

interface HomePageProps {
  onNavigate: (tab: string) => void;
  onRequestRescue: () => void;
  onTrackCode: (code: string) => void;
  recentRequests: EmergencyRequest[];
}

export const HomePage: React.FC<HomePageProps> = ({
  onNavigate,
  onRequestRescue,
  onTrackCode,
  recentRequests,
}) => {
  const [trackInput, setTrackInput] = useState('');

  const handleTrackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (trackInput.trim()) {
      onTrackCode(trackInput.trim());
    }
  };

  return (
    <div className="space-y-12 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Column: Urgent Emergency CTA */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-red-50 text-red-700 text-xs font-bold tracking-wide uppercase border border-red-200">
                <ShieldAlert className="w-3.5 h-3.5 text-red-600" />
                <span>Smart Emergency Coordination System</span>
              </div>

              <div className="space-y-3">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 text-balance leading-tight">
                  Need Emergency Help?
                </h1>
                <p className="text-lg sm:text-xl text-slate-600 max-w-2xl font-normal leading-relaxed">
                  Request rescue assistance and share your location with the response team.
                </p>
                <p className="text-sm font-semibold tracking-wide text-slate-500 uppercase">
                  "Every Second Matters. Every Life Counts."
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
                <button
                  onClick={onRequestRescue}
                  className="px-6 py-4 text-sm sm:text-base font-bold uppercase tracking-wider text-white bg-red-600 rounded-xl hover:bg-red-700 active:scale-[0.98] shadow-lg shadow-red-200 transition-all flex items-center justify-center gap-2"
                >
                  <ShieldAlert className="w-5 h-5" />
                  <span>REQUEST EMERGENCY RESCUE</span>
                </button>
                <button
                  onClick={() => onNavigate('map')}
                  className="px-6 py-4 text-sm sm:text-base font-bold uppercase tracking-wider text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all border border-slate-300 flex items-center justify-center gap-2"
                >
                  <MapPin className="w-5 h-5 text-slate-700" />
                  <span>VIEW RESCUE MAP</span>
                </button>
              </div>

              {/* Quick Status Check Bar */}
              <div className="pt-4 border-t border-slate-100">
                <form
                  onSubmit={handleTrackSubmit}
                  className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 max-w-lg"
                >
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={trackInput}
                      onChange={(e) => setTrackInput(e.target.value)}
                      placeholder="Already submitted? Enter Request ID (e.g. RQ-8841)"
                      className="w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white transition-all font-mono"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-800 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors whitespace-nowrap"
                  >
                    Track Status
                  </button>
                </form>
              </div>
            </div>

            {/* Right Column: Hero Visual */}
            <div className="lg:col-span-5">
              <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-xl bg-slate-100">
                <img
                  src="/src/assets/images/resqnet_hero_banner_1791988388737.jpg"
                  alt="Search and Rescue Emergency Response Team"
                  className="w-full h-72 sm:h-80 lg:h-96 object-cover"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    // Fallback to stylized SVG placeholder if image unavailable
                    const target = e.currentTarget;
                    target.style.display = 'none';
                    if (target.parentElement) {
                      const fallback = target.parentElement.querySelector('.image-fallback');
                      if (fallback) (fallback as HTMLElement).style.display = 'flex';
                    }
                  }}
                />
                <div className="image-fallback hidden w-full h-80 flex-col items-center justify-center p-8 bg-gradient-to-br from-slate-900 to-slate-800 text-white text-center">
                  <ShieldAlert className="w-16 h-16 text-red-500 mb-4" />
                  <h3 className="text-xl font-bold">RESQNET Field Response Ready</h3>
                  <p className="text-xs text-slate-300 mt-2">
                    Coordinated ground, swiftwater, and mountain rescue dispatch.
                  </p>
                </div>
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-slate-950/80 via-slate-950/40 to-transparent p-4 text-white">
                  <p className="text-xs font-semibold uppercase tracking-wider text-red-400">
                    Demonstration Disaster Sector
                  </p>
                  <p className="text-sm font-bold">Bengaluru Urban Disaster & Monsoon Flood Grid</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Cards Section (3 Main Pillars required by prompt) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-10 space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Designed for Critical Lifesaving Moments
          </h2>
          <p className="text-sm sm:text-base text-slate-600">
            Engineered to bridge victims, dispatchers, and rescue teams with zero delay and open-source geographic mapping.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Quick Emergency Requests */}
          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow space-y-4">
            <div className="w-12 h-12 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center text-red-600">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-slate-900">1. Quick Emergency Requests</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Streamlined, low-bandwidth emergency form designed for high-stress situations. Collects critical victim count, disaster type, and situation description within seconds.
              </p>
            </div>
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Mobile-optimized</span>
              <span className="font-semibold text-red-600">No login required</span>
            </div>
          </div>

          {/* Card 2: Location-Based Rescue */}
          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow space-y-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
              <MapPin className="w-6 h-6" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-slate-900">2. Location-Based Rescue</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Instant browser GPS coordinates paired with interactive OpenStreetMap pin placement and automated reverse geocoding to pinpoint exact trapped victim locations.
              </p>
            </div>
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>OpenStreetMap & Leaflet</span>
              <span className="font-semibold text-blue-600">High-precision GPS</span>
            </div>
          </div>

          {/* Card 3: Smart Route Planning */}
          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow space-y-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
              <Route className="w-6 h-6" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-slate-900">3. Smart Route Planning</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Calculates road network navigation corridors using the open OSRM routing engine. Computes travel time, distance, and suggests the best-equipped available rescue unit.
              </p>
            </div>
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>OSRM Engine</span>
              <span className="font-semibold text-emerald-600">Multi-unit dispatch</span>
            </div>
          </div>
        </div>
      </section>

      {/* Emergency Disaster Protocols Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-900 rounded-2xl p-6 sm:p-8 text-white space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-xl font-bold">What is your current emergency?</h3>
              <p className="text-xs sm:text-sm text-slate-400">
                Select your disaster type for instant prioritized response triage.
              </p>
            </div>
            <button
              onClick={onRequestRescue}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider rounded-lg shrink-0"
            >
              Start Request
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <button
              onClick={onRequestRescue}
              className="p-4 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 text-left transition-colors group"
            >
              <Waves className="w-6 h-6 text-blue-400 mb-2 group-hover:scale-110 transition-transform" />
              <div className="font-bold text-sm">Flood / Rising Water</div>
              <div className="text-[11px] text-slate-400 mt-1">Move to roof/upper level. Do not walk into moving current.</div>
            </button>
            <button
              onClick={onRequestRescue}
              className="p-4 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 text-left transition-colors group"
            >
              <Mountain className="w-6 h-6 text-amber-400 mb-2 group-hover:scale-110 transition-transform" />
              <div className="font-bold text-sm">Landslide / Mudflow</div>
              <div className="text-[11px] text-slate-400 mt-1">Stay alert for rumble sounds. Move away from steep slopes.</div>
            </button>
            <button
              onClick={onRequestRescue}
              className="p-4 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 text-left transition-colors group"
            >
              <Flame className="w-6 h-6 text-orange-400 mb-2 group-hover:scale-110 transition-transform" />
              <div className="font-bold text-sm">Wildfire / Structural</div>
              <div className="text-[11px] text-slate-400 mt-1">Stay low under smoke. Close windows and evacuate clear zone.</div>
            </button>
            <button
              onClick={onRequestRescue}
              className="p-4 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 text-left transition-colors group"
            >
              <HeartPulse className="w-6 h-6 text-red-400 mb-2 group-hover:scale-110 transition-transform" />
              <div className="font-bold text-sm">Trapped / Medical</div>
              <div className="text-[11px] text-slate-400 mt-1">Tap loudly on pipes or walls. Protect airways from dust.</div>
            </button>
          </div>
        </div>
      </section>

      {/* Recent Incidents Activity Feed (Demonstration scenario) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Current Demonstration Incidents</h3>
              <p className="text-xs text-slate-500">
                Sample requests within the active Bengaluru (Bangalore) disaster sector demo environment.
              </p>
            </div>
            <button
              onClick={() => onNavigate('dashboard')}
              className="text-xs font-bold text-red-600 hover:text-red-700 flex items-center gap-1"
            >
              <span>Open Operator Dashboard</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {recentRequests.slice(0, 4).map((req) => (
              <div key={req.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs text-slate-900">{req.requestCode}</span>
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                        req.severity === 'critical'
                          ? 'bg-red-100 text-red-800'
                          : req.severity === 'high'
                          ? 'bg-orange-100 text-orange-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {req.severity}
                    </span>
                    <span className="text-xs font-semibold capitalize text-slate-700">
                      {req.emergencyType}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 line-clamp-1">{req.description}</p>
                  <p className="text-[11px] text-slate-400 flex items-center gap-2">
                    <MapPin className="w-3 h-3" />
                    <span>{req.address}</span>
                    <span>·</span>
                    <Users className="w-3 h-3" />
                    <span>{req.peopleAffected} affected</span>
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`text-xs font-medium px-2.5 py-1 rounded-md capitalize ${
                      req.status === 'in_progress'
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : req.status === 'verified'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : req.status === 'resolved'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-100 text-slate-700 border border-slate-200'
                    }`}
                  >
                    {req.status.replace('_', ' ')}
                  </span>
                  <button
                    onClick={() => onTrackCode(req.requestCode)}
                    className="text-xs font-semibold px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded text-slate-800 transition-colors"
                  >
                    Track
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Official Emergency Contact Notice */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-red-50 border border-red-200 rounded-xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-600 text-white flex items-center justify-center shrink-0">
              <Phone className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-red-900">Immediate Real-Life Emergency Contact Numbers</h4>
              <p className="text-xs text-red-700">
                If you or someone else is in immediate peril, do not rely solely on web portals. Call official emergency lines.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs font-bold text-red-900">
            <span className="bg-white border border-red-300 px-3 py-1.5 rounded-lg shadow-sm">USA / Canada: 911</span>
            <span className="bg-white border border-red-300 px-3 py-1.5 rounded-lg shadow-sm">Europe / UK: 112 / 999</span>
            <span className="bg-white border border-red-300 px-3 py-1.5 rounded-lg shadow-sm">India: 112 / 100</span>
          </div>
        </div>
      </section>
    </div>
  );
};
