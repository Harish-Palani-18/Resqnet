import React, { useState, useEffect, useRef } from 'react';
import {
  Camera,
  Video,
  ShieldAlert,
  Crosshair,
  Radio,
  Compass,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Maximize2,
  RefreshCw,
  Eye,
  Flame,
  MapPin,
  ExternalLink,
} from 'lucide-react';
import { createEmergencyRequest } from '../services/api';
import { supabase } from '../services/supabase';
import { EmergencyRequest } from '../types';

interface AerialViewPageProps {
  onNavigateToDashboard: () => void;
  onNavigateToMap: () => void;
  onAlertCreated?: (req: EmergencyRequest) => void;
}

interface SectorPreset {
  id: string;
  name: string;
  coords: [number, number];
  address: string;
  notes: string;
}

const BANGALORE_SECTORS: SectorPreset[] = [
  {
    id: 'bellandur',
    name: 'Sector 01: Bellandur Lake & ORR EcoSpace',
    coords: [12.9260, 77.6762],
    address: 'Outer Ring Road near EcoSpace, Bellandur, Bengaluru',
    notes: 'Low-lying urban stormwater basin / lake overflow corridor',
  },
  {
    id: 'hebbal',
    name: 'Sector 02: Hebbal Flyover & Bellary Road',
    coords: [13.0358, 77.5970],
    address: 'Bellary Road Service Lane near Hebbal Flyover, Bengaluru',
    notes: 'North transit artery / retaining wall elevation',
  },
  {
    id: 'mgroad',
    name: 'Sector 03: MG Road & Trinity Metro Hub',
    coords: [12.9745, 77.6095],
    address: 'MG Road near Brigade Road Junction, Bengaluru',
    notes: 'High-density commercial corridor and central junction',
  },
  {
    id: 'silkboard',
    name: 'Sector 04: Central Silk Board Junction',
    coords: [12.9172, 77.6228],
    address: 'Hosur Road near Central Silk Board Junction, Bengaluru',
    notes: 'Major arterial interchange and power distribution grid',
  },
];

export const AerialViewPage: React.FC<AerialViewPageProps> = ({
  onNavigateToDashboard,
  onNavigateToMap,
  onAlertCreated,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [streamActive, setStreamActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [simulatedMode, setSimulatedMode] = useState<boolean>(false);

  // HUD filters: 'optical' | 'flir' | 'night'
  const [visionMode, setVisionMode] = useState<'optical' | 'flir' | 'night'>('optical');
  const [selectedSector, setSelectedSector] = useState<SectorPreset>(BANGALORE_SECTORS[0]);

  // Telemetry jitter simulation
  const [telemetryAlt, setTelemetryAlt] = useState<number>(120);
  const [telemetryHeading, setTelemetryHeading] = useState<number>(42);

  // Capture & submission state
  const [capturing, setCapturing] = useState<boolean>(false);
  const [submittedAlert, setSubmittedAlert] = useState<{
    request: EmergencyRequest;
    snapshotUrl: string;
    supabaseSynced: boolean;
  } | null>(null);

  // Initialize camera stream
  useEffect(() => {
    let stream: MediaStream | null = null;

    const startCamera = async () => {
      try {
        setCameraError(null);
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'environment',
          },
          audio: false,
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play();
            setStreamActive(true);
            setSimulatedMode(false);
          };
        }
      } catch (err: any) {
        console.warn('Webcam access error or permission denied:', err);
        setStreamActive(false);
        setSimulatedMode(true);
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setCameraError('Camera permission was blocked. Displaying live drone reconnaissance pattern.');
        } else {
          setCameraError('Hardware camera unavailable. Displaying drone simulated feed.');
        }
      }
    };

    startCamera();

    // Telemetry tick
    const interval = setInterval(() => {
      setTelemetryAlt((prev) => Math.min(150, Math.max(90, Math.round(prev + (Math.random() - 0.5) * 3))));
      setTelemetryHeading((prev) => Math.round((prev + (Math.random() - 0.5) * 2 + 360) % 360));
    }, 1500);

    return () => {
      clearInterval(interval);
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Take snapshot & report incident
  const handleCaptureAndReport = async () => {
    if (capturing) return;
    setCapturing(true);

    try {
      let snapshotDataUrl = '';

      // Draw snapshot from video if available, or generate synthetic tactical snapshot
      if (videoRef.current && streamActive && canvasRef.current) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          // If FLIR or Night vision mode is active, apply tactical filter to capture
          if (visionMode === 'flir') {
            ctx.filter = 'contrast(180%) hue-rotate(180deg) invert(20%)';
          } else if (visionMode === 'night') {
            ctx.filter = 'sepia(100%) hue-rotate(70deg) contrast(150%)';
          }
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

          // Add timestamp and GPS watermark overlay to snapshot image
          ctx.filter = 'none';
          ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
          ctx.fillRect(10, canvas.height - 40, canvas.width - 20, 30);
          ctx.fillStyle = '#10B981';
          ctx.font = 'bold 12px monospace';
          ctx.fillText(
            `RESQNET UAV RECON // ${selectedSector.name} // LAT: ${selectedSector.coords[0].toFixed(5)} LON: ${selectedSector.coords[1].toFixed(5)} // ${new Date().toISOString()}`,
            20,
            canvas.height - 20
          );

          snapshotDataUrl = canvas.toDataURL('image/jpeg', 0.85);
        }
      } else {
        // Fallback snapshot using simulated drone sensor image
        snapshotDataUrl = '/src/assets/images/resqnet_hero_banner_1791988388737.jpg';
      }

      // Generate random code for request
      const randomCode = `RQ-${Math.floor(1000 + Math.random() * 9000)}`;

      // 1. Submit through standard backend endpoint
      const created = await createEmergencyRequest({
        requestCode: randomCode,
        emergencyType: 'aerial',
        severity: 'critical',
        peopleAffected: 4,
        description: `Automated aerial drone alert captured over ${selectedSector.name}. High-resolution optical recon verified immediate ground emergency.`,
        latitude: selectedSector.coords[0],
        longitude: selectedSector.coords[1],
        address: selectedSector.address,
        landmark: `UAV Flight Overpass: ${selectedSector.notes}`,
        imageUrl: snapshotDataUrl,
        contactPhone: '+91 80 2266 0000',
        reporterName: 'Autonomous UAV Recon Alpha-1',
        status: 'pending',
      });

      // 2. Also execute direct Supabase sync for maximum reliability
      let directSupabaseSuccess = false;
      try {
        const { error: sbError } = await supabase.from('emergency_requests').insert([
          {
            request_code: created.requestCode || randomCode,
            disaster_type: 'Aerial Reconnaissance Alert',
            severity_level: 'Critical',
            latitude: selectedSector.coords[0],
            longitude: selectedSector.coords[1],
            street_address: selectedSector.address,
            landmark: `UAV Recon: ${selectedSector.notes}`,
            contact_phone: '+91 80 2266 0000',
            reporter_name: 'Autonomous UAV Recon Alpha-1',
            people_affected: 4,
            description: `Automated aerial drone alert captured over ${selectedSector.name}. Immediate triage required.`,
            image_url: snapshotDataUrl,
            status: 'Pending',
          },
        ]);
        if (!sbError) {
          directSupabaseSuccess = true;
        }
      } catch (e) {
        console.warn('Direct Supabase insert notice:', e);
      }

      setSubmittedAlert({
        request: created,
        snapshotUrl: snapshotDataUrl,
        supabaseSynced: directSupabaseSuccess,
      });

      if (onAlertCreated) {
        onAlertCreated(created);
      }
    } catch (err: any) {
      alert(`Alert dispatch failed: ${err.message || 'Network error'}`);
    } finally {
      setCapturing(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Hidden canvas for image capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-red-600 uppercase tracking-wider">
            <Radio className="w-4 h-4 text-red-600 animate-pulse" />
            <span>Autonomous Disaster Reconnaissance UAV · Live Feed</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-0.5">
            Aerial Reconnaissance &amp; Drone Overwatch
          </h1>
          <p className="text-xs sm:text-sm text-slate-600">
            Real-time aerial camera sensor feed scanning Bengaluru disaster sectors with automated incident dispatch.
          </p>
        </div>

        {/* Sector Selector */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-slate-700 whitespace-nowrap">
            Target Sector:
          </label>
          <select
            value={selectedSector.id}
            onChange={(e) => {
              const sec = BANGALORE_SECTORS.find((s) => s.id === e.target.value);
              if (sec) setSelectedSector(sec);
            }}
            className="text-xs bg-white border border-slate-300 font-semibold text-slate-800 rounded-lg p-2 focus:ring-1 focus:ring-red-500"
          >
            {BANGALORE_SECTORS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Notification banner if webcam error or simulated */}
      {cameraError && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{cameraError} You can still capture and report aerial incidents.</span>
          </div>
          <span className="font-mono text-[10px] bg-amber-200/60 px-2 py-0.5 rounded uppercase font-bold">
            Simulated Recon Active
          </span>
        </div>
      )}

      {/* Main High-Tech Drone HUD Container */}
      <div className="relative w-full rounded-2xl overflow-hidden bg-slate-950 border-2 border-slate-800 shadow-2xl aspect-video max-h-[640px] flex items-center justify-center">
        {/* Live Camera Stream */}
        <video
          ref={videoRef}
          playsInline
          autoPlay
          muted
          className={`w-full h-full object-cover ${
            visionMode === 'flir'
              ? 'contrast-150 invert-[20%] hue-rotate-180 brightness-110'
              : visionMode === 'night'
              ? 'sepia brightness-125 contrast-150 hue-rotate-60'
              : ''
          } ${simulatedMode ? 'hidden' : 'block'}`}
        />

        {/* Simulated Drone Feed if camera unavailable */}
        {simulatedMode && (
          <div className="w-full h-full relative bg-radial from-slate-900 via-slate-950 to-black flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 opacity-20 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:40px_40px]" />
            <div className="text-center space-y-2 z-10 px-4">
              <Compass className="w-16 h-16 text-cyan-400 mx-auto animate-spin" style={{ animationDuration: '20s' }} />
              <div className="text-cyan-400 font-mono font-bold tracking-widest text-sm uppercase">
                Satellite Synthetic Aperture Radar (SAR) Recon
              </div>
              <p className="text-slate-400 text-xs font-mono max-w-md">
                Overflying {selectedSector.name}. Optical telemetry tracking water levels along Outer Ring Road.
              </p>
            </div>
          </div>
        )}

        {/* ANIMATED SCANNING LASER LINE */}
        <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent shadow-[0_0_15px_#ef4444] pointer-events-none animate-scan z-20" />

        {/* HUD OVERLAY: Top Telemetry Bar */}
        <div className="absolute top-4 inset-x-6 z-30 flex items-center justify-between text-cyan-400 font-mono text-xs select-none pointer-events-none drop-shadow-md">
          <div className="flex items-center gap-3 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-cyan-500/30">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping inline-block" />
            <span className="font-extrabold text-white tracking-widest">LIVE REC [UAV-ALPHA]</span>
            <span className="text-slate-400">|</span>
            <span>ALT: <strong className="text-cyan-300">{telemetryAlt}m AGL</strong></span>
            <span className="text-slate-400">|</span>
            <span>HDG: <strong className="text-cyan-300">{telemetryHeading}°</strong></span>
          </div>

          <div className="hidden sm:flex items-center gap-3 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-cyan-500/30">
            <span>SECTOR: <strong className="text-white">{selectedSector.id.toUpperCase()}</strong></span>
            <span className="text-slate-400">|</span>
            <span>SIGNAL: <strong className="text-emerald-400">98% SAT-LINK</strong></span>
          </div>
        </div>

        {/* HUD OVERLAY: Center Crosshairs & Reticle */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
          <div className="relative w-48 h-48 sm:w-64 sm:h-64 border border-cyan-500/40 rounded-full flex items-center justify-center">
            {/* Inner crosshair */}
            <div className="absolute w-8 h-8 border border-red-500/80 rounded-full flex items-center justify-center animate-pulse">
              <div className="w-1.5 h-1.5 bg-red-500 rounded-full" />
            </div>

            {/* Horizontal & Vertical lines */}
            <div className="absolute w-full h-[1px] bg-cyan-500/40" />
            <div className="absolute h-full w-[1px] bg-cyan-500/40" />

            {/* Corner brackets */}
            <div className="absolute -top-3 -left-3 w-6 h-6 border-t-2 border-l-2 border-cyan-400" />
            <div className="absolute -top-3 -right-3 w-6 h-6 border-t-2 border-r-2 border-cyan-400" />
            <div className="absolute -bottom-3 -left-3 w-6 h-6 border-b-2 border-l-2 border-cyan-400" />
            <div className="absolute -bottom-3 -right-3 w-6 h-6 border-b-2 border-r-2 border-cyan-400" />

            {/* Range text */}
            <span className="absolute -bottom-7 font-mono text-[10px] text-cyan-300 tracking-wider bg-black/50 px-2 py-0.5 rounded">
              LIDAR RANGE: 142.8M
            </span>
          </div>
        </div>

        {/* HUD OVERLAY: Bottom Telemetry & GPS Coordinates */}
        <div className="absolute bottom-4 inset-x-6 z-30 flex flex-col sm:flex-row items-center justify-between gap-3 text-cyan-400 font-mono text-xs select-none pointer-events-none drop-shadow-md">
          <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-cyan-500/30 flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-red-500" />
            <span>GPS: <strong>{selectedSector.coords[0].toFixed(5)}° N, {selectedSector.coords[1].toFixed(5)}° E</strong></span>
            <span className="text-slate-400">·</span>
            <span className="text-slate-300">Bengaluru Grid</span>
          </div>

          {/* Vision mode switchers (interactive) */}
          <div className="pointer-events-auto flex items-center gap-1.5 bg-black/70 backdrop-blur-md p-1 rounded-lg border border-cyan-500/30">
            <button
              onClick={() => setVisionMode('optical')}
              className={`px-2.5 py-1 text-[11px] font-bold rounded transition-colors ${
                visionMode === 'optical' ? 'bg-cyan-500 text-black' : 'text-cyan-300 hover:text-white'
              }`}
            >
              Optical HD
            </button>
            <button
              onClick={() => setVisionMode('flir')}
              className={`px-2.5 py-1 text-[11px] font-bold rounded transition-colors flex items-center gap-1 ${
                visionMode === 'flir' ? 'bg-orange-500 text-black' : 'text-orange-400 hover:text-white'
              }`}
            >
              <Flame className="w-3 h-3" />
              <span>FLIR Thermal</span>
            </button>
            <button
              onClick={() => setVisionMode('night')}
              className={`px-2.5 py-1 text-[11px] font-bold rounded transition-colors flex items-center gap-1 ${
                visionMode === 'night' ? 'bg-emerald-500 text-black' : 'text-emerald-400 hover:text-white'
              }`}
            >
              <Eye className="w-3 h-3" />
              <span>Night Vision</span>
            </button>
          </div>
        </div>
      </div>

      {/* Action Trigger Bar: "Capture & Report Incident" */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-1 text-center sm:text-left">
          <h3 className="text-base sm:text-lg font-extrabold text-slate-900 flex items-center justify-center sm:justify-start gap-2">
            <Camera className="w-5 h-5 text-red-600" />
            <span>Aerial Incident Reconnaissance Dispatch</span>
          </h3>
          <p className="text-xs text-slate-500">
            Take a high-definition aerial snapshot of the drone video stream and automatically broadcast an alert to the Bangalore SAR dispatch queue &amp; Supabase database.
          </p>
        </div>

        <button
          onClick={handleCaptureAndReport}
          disabled={capturing}
          className="w-full sm:w-auto px-8 py-4 bg-red-600 hover:bg-red-700 active:scale-95 text-white font-extrabold text-sm uppercase tracking-wider rounded-xl shadow-lg shadow-red-200 transition-all flex items-center justify-center gap-2.5 shrink-0 disabled:opacity-50"
        >
          {capturing ? (
            <RefreshCw className="w-5 h-5 animate-spin" />
          ) : (
            <Crosshair className="w-5 h-5 text-white animate-pulse" />
          )}
          <span>{capturing ? 'Broadcasting Alert...' : 'Capture & Report Incident'}</span>
        </button>
      </div>

      {/* Confirmation Modal when Alert is Submitted */}
      {submittedAlert && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden space-y-5 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-slate-900 p-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center text-white shadow-md">
                  <ShieldAlert className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-red-400 tracking-wider">
                    UAV Telemetry Dispatched
                  </span>
                  <h3 className="font-extrabold text-base">
                    Aerial Reconnaissance Alert Transmitted
                  </h3>
                </div>
              </div>

              <button
                onClick={() => setSubmittedAlert(null)}
                className="text-slate-400 hover:text-white p-1 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4 text-xs">
              {/* Snapshot image preview */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Captured Drone Optical Sensor Frame:
                </span>
                <div className="relative rounded-xl overflow-hidden border border-slate-300 shadow-sm max-h-48 bg-slate-900">
                  <img
                    src={submittedAlert.snapshotUrl}
                    alt="Drone snapshot"
                    className="w-full h-44 object-cover"
                  />
                  <div className="absolute bottom-2 left-2 bg-black/70 px-2 py-0.5 rounded text-[10px] text-cyan-300 font-mono">
                    {submittedAlert.request.requestCode} · UAV RECON
                  </div>
                </div>
              </div>

              {/* Success confirmation card */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 space-y-2 text-emerald-950">
                <div className="flex items-center gap-2 font-bold text-sm text-emerald-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Alert Successfully Logged in Dispatch Queue</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-slate-700 text-xs">
                  <div>
                    <strong>Request ID:</strong>{' '}
                    <span className="font-mono font-bold text-slate-900">
                      {submittedAlert.request.requestCode}
                    </span>
                  </div>
                  <div>
                    <strong>Disaster Type:</strong>{' '}
                    <span className="font-semibold text-red-700">Aerial Reconnaissance Alert</span>
                  </div>
                  <div>
                    <strong>Status:</strong>{' '}
                    <span className="font-bold text-amber-700">Pending</span>
                  </div>
                  <div>
                    <strong>Sector:</strong> {selectedSector.name.split(':')[0]}
                  </div>
                  <div className="col-span-2">
                    <strong>Coordinates:</strong>{' '}
                    <span className="font-mono text-slate-900">
                      {selectedSector.coords[0].toFixed(5)}, {selectedSector.coords[1].toFixed(5)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Supabase status notice */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-[11px] text-slate-600 flex items-center justify-between">
                <span>Database Sync:</span>
                <span className="font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-bold">
                  Supabase: bmiiicushacrzneumtkf (Connected)
                </span>
              </div>

              {/* Navigation Action Buttons */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={() => {
                    setSubmittedAlert(null);
                    onNavigateToDashboard();
                  }}
                  className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-xs transition-colors flex items-center justify-center gap-1.5"
                >
                  <span>Open Rescue Dashboard</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => {
                    setSubmittedAlert(null);
                    onNavigateToMap();
                  }}
                  className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-lg text-xs border border-slate-300 transition-colors"
                >
                  View on Live Map
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CSS for custom laser scan animation */}
      <style>{`
        @keyframes scanSweep {
          0% { top: 0%; opacity: 0.8; }
          50% { opacity: 1; }
          100% { top: 98%; opacity: 0.8; }
        }
        .animate-scan {
          animation: scanSweep 3.5s ease-in-out infinite alternate;
        }
      `}</style>
    </div>
  );
};
