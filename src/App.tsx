import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { EmergencyBanner } from './components/EmergencyBanner';
import { HomePage } from './pages/HomePage';
import { RequestRescuePage } from './pages/RequestRescuePage';
import { AerialViewPage } from './pages/AerialViewPage';
import { LiveMapPage } from './pages/LiveMapPage';
import { DashboardPage } from './pages/DashboardPage';
import { TrackStatusPage } from './pages/TrackStatusPage';
import { AboutPage } from './pages/AboutPage';
import { EmergencyRequest, RescueTeam } from './types';
import { fetchRequests, fetchRescueTeams } from './services/api';
import { ShieldAlert, Heart, Phone } from 'lucide-react';

export default function App() {
  const [currentTab, setCurrentTab] = useState<string>('home');
  const [isOperator, setIsOperator] = useState<boolean>(true); // Default to operator authorized for smooth demo review
  const [requests, setRequests] = useState<EmergencyRequest[]>([]);
  const [teams, setTeams] = useState<RescueTeam[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [trackingCode, setTrackingCode] = useState<string>('');
  const [dashboardPreSelected, setDashboardPreSelected] = useState<EmergencyRequest | null>(null);

  const loadData = async () => {
    try {
      const [reqs, tms] = await Promise.all([
        fetchRequests(),
        fetchRescueTeams(),
      ]);
      setRequests(reqs);
      setTeams(tms);
    } catch (err) {
      console.error('Failed to load initial data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // Poll updates every 15 seconds to reflect changes made
    const timer = setInterval(loadData, 15000);
    return () => clearInterval(timer);
  }, []);

  const handleTrackCode = (code: string) => {
    setTrackingCode(code);
    setCurrentTab('track');
  };

  const handleRequestCreatedSuccess = (requestCode: string) => {
    setTrackingCode(requestCode);
    loadData();
    setCurrentTab('track');
  };

  const handleOpenDashboardWithRequest = (req: EmergencyRequest) => {
    setDashboardPreSelected(req);
    setIsOperator(true);
    setCurrentTab('dashboard');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans selection:bg-red-600 selection:text-white">
      {/* Top Universal Emergency Disclaimer Banner */}
      <EmergencyBanner />

      {/* Main Top Navigation Bar (Zone 1: Wordmark, Zone 2: Links, Zone 3: SOS CTA) */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setCurrentTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onRequestRescueClick={() => {
          setCurrentTab('request');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        isOperator={isOperator}
        onToggleOperator={() => setIsOperator(!isOperator)}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {currentTab === 'home' && (
          <HomePage
            onNavigate={(tab) => {
              setCurrentTab(tab);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onRequestRescue={() => {
              setCurrentTab('request');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onTrackCode={handleTrackCode}
            recentRequests={requests}
          />
        )}

        {currentTab === 'request' && (
          <RequestRescuePage
            onSuccess={handleRequestCreatedSuccess}
            onNavigate={(tab) => {
              setCurrentTab(tab);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {currentTab === 'aerial' && (
          <AerialViewPage
            onNavigateToDashboard={() => {
              setCurrentTab('dashboard');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onNavigateToMap={() => {
              setCurrentTab('map');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onAlertCreated={() => {
              loadData();
            }}
          />
        )}

        {currentTab === 'map' && (
          <LiveMapPage
            requests={requests}
            teams={teams}
            onOpenDashboardWithRequest={handleOpenDashboardWithRequest}
          />
        )}

        {currentTab === 'dashboard' && (
          <DashboardPage
            requests={requests}
            teams={teams}
            isOperator={isOperator}
            onLoginOperator={() => setIsOperator(true)}
            onRefreshData={loadData}
            preSelectedRequest={dashboardPreSelected}
          />
        )}

        {currentTab === 'track' && (
          <TrackStatusPage
            initialCode={trackingCode}
            onNavigateToRequest={() => setCurrentTab('request')}
          />
        )}

        {currentTab === 'about' && <AboutPage />}
      </main>

      {/* Site Footer */}
      <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
            <div className="space-y-1.5">
              <div className="flex items-center justify-center md:justify-start gap-2 text-white font-extrabold text-base">
                <ShieldAlert className="w-5 h-5 text-red-500" />
                <span>RESQNET</span>
              </div>
              <p className="text-slate-400 font-medium">
                "Every Second Matters. Every Life Counts."
              </p>
              <p className="text-slate-500 text-[11px]">
                Smart Disaster Rescue and Emergency Response Platform Prototype
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-6 font-semibold text-slate-300">
              <button
                onClick={() => {
                  setCurrentTab('home');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="hover:text-white transition-colors"
              >
                Home
              </button>
              <button
                onClick={() => {
                  setCurrentTab('request');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="hover:text-white transition-colors text-red-400"
              >
                Request Rescue
              </button>
              <button
                onClick={() => {
                  setCurrentTab('aerial');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="hover:text-white transition-colors text-cyan-400"
              >
                Aerial View
              </button>
              <button
                onClick={() => {
                  setCurrentTab('map');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="hover:text-white transition-colors"
              >
                Live Map
              </button>
              <button
                onClick={() => {
                  setCurrentTab('dashboard');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="hover:text-white transition-colors"
              >
                Rescue Dashboard
              </button>
              <button
                onClick={() => {
                  setCurrentTab('track');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="hover:text-white transition-colors"
              >
                Status Tracking
              </button>
              <button
                onClick={() => {
                  setCurrentTab('about');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="hover:text-white transition-colors"
              >
                About & Guidelines
              </button>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500">
            <div>
              &copy; {new Date().getFullYear()} RESQNET Disaster Response Project. OpenStreetMap &amp; OSRM data &copy; contributors.
            </div>
            <div className="flex items-center gap-2">
              <span>Demonstration Prototype — Not connected to live 911 dispatch.</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
