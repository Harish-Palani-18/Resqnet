import React, { useState } from 'react';
import {
  ShieldAlert,
  MapPin,
  Navigation,
  AlertTriangle,
  Upload,
  CheckCircle2,
  Copy,
  ArrowRight,
  Phone,
  Users,
  Info,
} from 'lucide-react';
import { LeafletMap } from '../components/LeafletMap';
import { EmergencyType, SeverityLevel, EmergencyRequest } from '../types';
import { createEmergencyRequest, reverseGeocode } from '../services/api';

interface RequestRescuePageProps {
  onSuccess: (requestCode: string) => void;
  onNavigate: (tab: string) => void;
}

const EMERGENCY_TYPES: { id: EmergencyType; label: string; icon: string }[] = [
  { id: 'flood', label: 'Flood / Rising Water', icon: '🌊' },
  { id: 'earthquake', label: 'Earthquake Damage', icon: '🏚️' },
  { id: 'fire', label: 'Fire / Wildfire Smoke', icon: '🔥' },
  { id: 'landslide', label: 'Landslide / Mudflow', icon: '⛰️' },
  { id: 'medical', label: 'Medical Emergency', icon: '🚑' },
  { id: 'trapped', label: 'Trapped Person(s)', icon: '🆘' },
  { id: 'collapse', label: 'Building Collapse', icon: '🏢' },
  { id: 'other', label: 'Other Critical Danger', icon: '⚠️' },
];

const SEVERITIES: { id: SeverityLevel; label: string; desc: string; color: string }[] = [
  {
    id: 'critical',
    label: 'Critical (Life Threatening)',
    desc: 'Immediate peril, rising water level, trapped, or severe bleeding/unconsciousness.',
    color: 'border-red-500 bg-red-50 text-red-900',
  },
  {
    id: 'high',
    label: 'High Priority',
    desc: 'Severe structural damage, power/oxygen loss, injured but conscious.',
    color: 'border-orange-500 bg-orange-50 text-orange-900',
  },
  {
    id: 'medium',
    label: 'Medium (Urgent Assistance)',
    desc: 'Stranded without immediate structural danger, supplies or medical check needed.',
    color: 'border-amber-500 bg-amber-50 text-amber-900',
  },
];

export const RequestRescuePage: React.FC<RequestRescuePageProps> = ({
  onSuccess,
  onNavigate,
}) => {
  // Form state
  const [reporterName, setReporterName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [emergencyType, setEmergencyType] = useState<EmergencyType>('flood');
  const [severity, setSeverity] = useState<SeverityLevel>('critical');
  const [peopleAffected, setPeopleAffected] = useState<number>(1);
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('Outer Ring Road near EcoSpace, Bellandur, Bengaluru');
  const [landmark, setLandmark] = useState('');
  const [selectedCoords, setSelectedCoords] = useState<[number, number]>([12.9260, 77.6762]);
  const [userDeviceLocation, setUserDeviceLocation] = useState<[number, number] | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Status flags
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Success state
  const [submittedRequest, setSubmittedRequest] = useState<EmergencyRequest | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  // Default Bangalore fallback location (Bellandur / EcoSpace corridor)
  const BANGALORE_FALLBACK_COORDS: [number, number] = [12.9260, 77.6762];
  const BANGALORE_FALLBACK_ADDRESS = 'Outer Ring Road near EcoSpace, Bellandur, Bengaluru';

  // Handle browser Geolocation with improved timeout, accuracy, and graceful fallback
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setSelectedCoords(BANGALORE_FALLBACK_COORDS);
      setAddress(BANGALORE_FALLBACK_ADDRESS);
      setGpsError('Geolocation is not supported by your browser. We have positioned the pin in Bangalore. Tap on the map or drag the pin to set your location.');
      return;
    }

    setGpsLoading(true);
    setGpsError(null);

    const onGeoSuccess = async (pos: GeolocationPosition) => {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      setSelectedCoords([lat, lng]);
      setUserDeviceLocation([lat, lng]);
      setGpsLoading(false);
      setGpsError(null);

      // Attempt reverse geocode
      try {
        const res = await reverseGeocode(lat, lng);
        if (res?.address) {
          setAddress(res.address);
        }
      } catch {
        setAddress(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
      }
    };

    const applyGpsFallback = (err: GeolocationPositionError) => {
      setGpsLoading(false);
      // Automatically center the map on default Bangalore location
      setSelectedCoords(BANGALORE_FALLBACK_COORDS);
      if (!address || address.includes('Mill Pond') || address.includes('428')) {
        setAddress(BANGALORE_FALLBACK_ADDRESS);
      }

      let guidanceMsg = '';
      if (err.code === err.PERMISSION_DENIED) {
        guidanceMsg = 'Location permission was denied. We have centered the map on Bangalore. Please tap directly on the map or drag the red pin to set your location.';
      } else if (err.code === err.POSITION_UNAVAILABLE) {
        guidanceMsg = 'GPS hardware position unavailable on this device. We have centered on Bangalore. Tap on the map or drag the red pin to set your location.';
      } else {
        guidanceMsg = 'GPS lookup timed out on this device. We have placed your pin at Bellandur / Outer Ring Road, Bangalore. Please tap anywhere on the map or drag the red pin to pinpoint your exact spot.';
      }

      setGpsError(guidanceMsg);
    };

    const onGeoError = (err: GeolocationPositionError) => {
      // If high-accuracy timed out, try once with low accuracy (WiFi/cellular IP lookup)
      if (err.code === err.TIMEOUT) {
        navigator.geolocation.getCurrentPosition(
          onGeoSuccess,
          (fallbackErr) => {
            applyGpsFallback(fallbackErr);
          },
          { timeout: 8000, enableHighAccuracy: false, maximumAge: 30000 }
        );
        return;
      }
      applyGpsFallback(err);
    };

    // Primary GPS request with 15000ms timeout and enableHighAccuracy
    navigator.geolocation.getCurrentPosition(
      onGeoSuccess,
      onGeoError,
      { timeout: 15000, enableHighAccuracy: true, maximumAge: 10000 }
    );
  };

  // Handle map click: resets any previous GPS error state cleanly
  const handleMapLocationPicked = async (lat: number, lng: number) => {
    setSelectedCoords([lat, lng]);
    setGpsError(null); // Cleanly clears error when user selects manually

    try {
      const res = await reverseGeocode(lat, lng);
      if (res?.address) {
        setAddress(res.address);
      }
    } catch {
      setAddress(`Sector ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
    }
  };

  // Handle photo upload preview
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Please choose an image under 5MB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Validation
    if (!contactPhone.trim()) {
      setFormError('Contact phone number is required so rescue teams can reach you or verify your status.');
      return;
    }
    if (!description.trim() || description.trim().length < 10) {
      setFormError('Please provide a brief description of the situation (at least 10 characters).');
      return;
    }
    if (!address.trim()) {
      setFormError('Please provide a street address, area name, or confirm your coordinates.');
      return;
    }

    setSubmitting(true);

    try {
      const created = await createEmergencyRequest({
        reporterName: reporterName.trim() || undefined,
        contactPhone: contactPhone.trim(),
        emergencyType,
        severity,
        peopleAffected: Number(peopleAffected) || 1,
        description: description.trim(),
        latitude: selectedCoords[0],
        longitude: selectedCoords[1],
        address: address.trim(),
        landmark: landmark.trim() || undefined,
        imageUrl: imagePreview || undefined,
      });

      setSubmittedRequest(created);
    } catch (err: any) {
      setFormError(err.message || 'Failed to submit rescue request. Please verify connection and retry.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyCode = () => {
    if (submittedRequest) {
      navigator.clipboard.writeText(submittedRequest.requestCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  // Confirmation view upon successful submission
  if (submittedRequest) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
          <div className="bg-emerald-600 px-6 py-8 text-white text-center space-y-2">
            <CheckCircle2 className="w-14 h-14 mx-auto text-emerald-100" />
            <h2 className="text-2xl sm:text-3xl font-extrabold">Emergency Request Submitted</h2>
            <p className="text-sm text-emerald-100 max-w-md mx-auto">
              Your rescue request has been logged into the RESQNET dispatch coordination system.
            </p>
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            {/* Request Code Box */}
            <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl p-5 text-center space-y-2">
              <span className="text-xs uppercase font-bold text-slate-500 tracking-wider">
                Your Unique Tracking Request ID
              </span>
              <div className="flex items-center justify-center gap-3">
                <span className="text-3xl sm:text-4xl font-extrabold font-mono text-red-600">
                  {submittedRequest.requestCode}
                </span>
                <button
                  onClick={handleCopyCode}
                  className="p-2 text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg shadow-sm transition-all"
                  title="Copy Request Code"
                >
                  <Copy className="w-5 h-5" />
                </button>
              </div>
              {copiedCode && <p className="text-xs font-semibold text-emerald-600">Copied to clipboard!</p>}
              <p className="text-xs text-slate-500">
                Save this code. You can use it anytime on the tracking page to check verification and dispatch updates.
              </p>
            </div>

            {/* Submitted Summary */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3 text-xs sm:text-sm">
              <h4 className="font-bold text-slate-900 border-b border-slate-200 pb-2">
                Recorded Incident Summary
              </h4>
              <div className="grid grid-cols-2 gap-2 text-slate-600">
                <div><strong>Status:</strong> <span className="text-amber-600 font-bold">Pending Verification</span></div>
                <div><strong>Disaster Type:</strong> <span className="capitalize">{submittedRequest.emergencyType}</span></div>
                <div><strong>Severity:</strong> <span className="capitalize font-bold text-red-600">{submittedRequest.severity}</span></div>
                <div><strong>People Affected:</strong> {submittedRequest.peopleAffected}</div>
                <div className="col-span-2"><strong>Location:</strong> {submittedRequest.address}</div>
                <div className="col-span-2"><strong>Coordinates:</strong> {submittedRequest.latitude.toFixed(5)}, {submittedRequest.longitude.toFixed(5)}</div>
                {submittedRequest.landmark && (
                  <div className="col-span-2"><strong>Landmark:</strong> {submittedRequest.landmark}</div>
                )}
                <div className="col-span-2 pt-2 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Backend Database:</span>
                  <span className="font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-semibold">
                    Supabase: bmiiicushacrzneumtkf
                  </span>
                </div>
              </div>
            </div>

            {/* Urgent Safety Instructions */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs sm:text-sm text-amber-900 space-y-2">
              <div className="flex items-center gap-2 font-bold">
                <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
                <span>Next Immediate Steps While Waiting:</span>
              </div>
              <ul className="list-disc pl-5 space-y-1 text-amber-800 text-xs">
                <li>Keep your phone line open and preserve your device battery.</li>
                <li>If safe to do so, signal your presence with a bright cloth, whistle, or flashlight.</li>
                <li>Do not attempt to walk through moving flood currents or unstable rubble.</li>
                <li>If conditions rapidly deteriorate, immediately call local emergency services (911 / 112).</li>
              </ul>
            </div>

            {/* Navigation buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={() => onSuccess(submittedRequest.requestCode)}
                className="flex-1 py-3 px-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-md text-sm transition-colors flex items-center justify-center gap-2"
              >
                <span>Track Request Status Now</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => onNavigate('map')}
                className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-xl border border-slate-300 text-sm transition-colors"
              >
                View on Live Map
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Title & Emergency Header */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-red-600 uppercase tracking-wider">
          <ShieldAlert className="w-4 h-4" />
          <span>Priority Emergency Intake</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Request Emergency Rescue
        </h1>
        <p className="text-sm sm:text-base text-slate-600">
          Provide your situation details and location so available rescue personnel can verify and route assistance.
        </p>
      </div>

      {/* Emergency Disclaimer Banner */}
      <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 flex items-start gap-3 text-red-950">
        <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
        <div className="text-xs sm:text-sm space-y-1">
          <p className="font-bold">
            IMPORTANT EMERGENCY NOTICE:
          </p>
          <p className="text-red-900 leading-relaxed">
            If this is a real emergency, contact your local emergency services directly (dial 911 / 112). Submitting this demo form does not guarantee rescue assistance.
          </p>
        </div>
      </div>

      {/* Form Error Notification */}
      {formError && (
        <div className="bg-red-100 border border-red-300 rounded-xl p-4 text-xs sm:text-sm text-red-900 font-medium">
          {formError}
        </div>
      )}

      {/* Main Request Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-8">
        {/* Step 1: Emergency Type */}
        <div className="space-y-3">
          <label className="block text-sm font-bold text-slate-900">
            1. Select Disaster / Emergency Type <span className="text-red-600">*</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {EMERGENCY_TYPES.map((type) => {
              const isSelected = emergencyType === type.id;
              return (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => setEmergencyType(type.id)}
                  className={`p-3 rounded-xl border text-left transition-all flex flex-col gap-1.5 ${
                    isSelected
                      ? 'border-red-600 bg-red-50 text-red-950 font-bold shadow-sm ring-1 ring-red-600'
                      : 'border-slate-200 hover:border-slate-300 bg-slate-50/50 text-slate-700'
                  }`}
                >
                  <span className="text-2xl">{type.icon}</span>
                  <span className="text-xs leading-snug">{type.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 2: Severity Level */}
        <div className="space-y-3">
          <label className="block text-sm font-bold text-slate-900">
            2. Urgency & Severity Level <span className="text-red-600">*</span>
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {SEVERITIES.map((s) => {
              const isSelected = severity === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSeverity(s.id)}
                  className={`p-4 rounded-xl border-2 text-left transition-all space-y-1 ${
                    isSelected
                      ? `${s.color} shadow-sm ring-1 ring-offset-1`
                      : 'border-slate-200 bg-slate-50/50 hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <div className="font-bold text-sm">{s.label}</div>
                  <p className="text-xs text-slate-600 leading-relaxed">{s.desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 3: Location Selection & Map */}
        <div className="space-y-4 pt-4 border-t border-slate-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <label className="block text-sm font-bold text-slate-900">
                3. Incident Location & Coordinates <span className="text-red-600">*</span>
              </label>
              <p className="text-xs text-slate-500">
                Tap on the map or drag the pin to set the exact incident position.
              </p>
            </div>

            <button
              type="button"
              onClick={handleUseCurrentLocation}
              disabled={gpsLoading}
              className="px-3.5 py-2 bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 rounded-lg text-xs font-bold transition-colors flex items-center gap-2 self-start sm:self-auto shrink-0"
            >
              <Navigation className={`w-3.5 h-3.5 ${gpsLoading ? 'animate-spin' : ''}`} />
              <span>{gpsLoading ? 'Acquiring GPS...' : 'Use My Current Location'}</span>
            </button>
          </div>

          {gpsError && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-start justify-between gap-3 shadow-xs">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                <span className="leading-relaxed">{gpsError}</span>
              </div>
              <button
                type="button"
                onClick={() => setGpsError(null)}
                className="text-amber-700 hover:text-amber-950 font-bold text-xs shrink-0 px-1.5 py-0.5 rounded hover:bg-amber-100"
                title="Dismiss message"
              >
                ✕
              </button>
            </div>
          )}

          {/* Interactive Leaflet Location Picker */}
          <div className="space-y-2">
            <LeafletMap
              center={selectedCoords}
              zoom={14}
              pickLocationMode={true}
              pickedLocation={selectedCoords}
              onLocationPicked={handleMapLocationPicked}
              userLocation={userDeviceLocation}
              height="280px"
            />
            <div className="flex items-center justify-between text-xs text-slate-500 font-mono">
              <span>Selected Coordinates:</span>
              <span className="font-bold text-slate-800">
                {selectedCoords[0].toFixed(5)}, {selectedCoords[1].toFixed(5)}
              </span>
            </div>
          </div>

          {/* Street Address & Landmark Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Street Address / Area Name <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. Outer Ring Road near EcoSpace, Bellandur, Bengaluru"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:bg-white"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nearby Landmark / Distinctive Features (Optional)
              </label>
              <input
                type="text"
                value={landmark}
                onChange={(e) => setLandmark(e.target.value)}
                placeholder="e.g. Near EcoSpace underpass, Opposite Bellandur lake canal"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:bg-white"
              />
            </div>
          </div>
        </div>

        {/* Step 4: Contact & Affected Count */}
        <div className="space-y-4 pt-4 border-t border-slate-200">
          <label className="block text-sm font-bold text-slate-900">
            4. Contact & Victim Details
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Contact Phone Number <span className="text-red-600">*</span>
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="+91 98450 00000"
                  className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:bg-white font-mono"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Your Name / Reporter (Optional)
              </label>
              <input
                type="text"
                value={reporterName}
                onChange={(e) => setReporterName(e.target.value)}
                placeholder="e.g. Rajesh Kumar or Family"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                People Requiring Rescue <span className="text-red-600">*</span>
              </label>
              <div className="relative">
                <Users className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={peopleAffected}
                  onChange={(e) => setPeopleAffected(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:bg-white font-mono"
                  required
                />
              </div>
            </div>
          </div>
        </div>

        {/* Step 5: Description & Photo */}
        <div className="space-y-4 pt-4 border-t border-slate-200">
          <div>
            <label className="block text-sm font-bold text-slate-900 mb-1">
              5. Situation Description <span className="text-red-600">*</span>
            </label>
            <p className="text-xs text-slate-500 mb-2">
              Mention hazards (live wires, deep current, toxic fumes, collapsed walls) or medical conditions.
            </p>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Water is waist-deep inside apartment along Outer Ring Road. Power is cut. Elderly family member in wheelchair on upper floor. Inflatable rescue boat needed."
              className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:bg-white"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Optional Image Upload (Help teams assess conditions)
            </label>
            <div className="flex items-center gap-4">
              <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg border border-slate-300 text-xs font-semibold transition-colors">
                <Upload className="w-4 h-4" />
                <span>Upload Situation Photo</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </label>
              {imagePreview && (
                <div className="flex items-center gap-2">
                  <img
                    src={imagePreview}
                    alt="Uploaded preview"
                    className="w-12 h-12 object-cover rounded-lg border border-slate-300"
                  />
                  <button
                    type="button"
                    onClick={() => setImagePreview(null)}
                    className="text-xs text-red-600 hover:underline font-semibold"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-slate-500 text-center sm:text-left">
            Request will be marked as <strong className="text-amber-700">Pending Verification</strong> in the dispatch queue.
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full sm:w-auto px-8 py-3.5 bg-red-600 hover:bg-red-700 active:scale-[0.98] text-white text-sm font-extrabold uppercase tracking-wider rounded-xl shadow-lg shadow-red-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <ShieldAlert className="w-4 h-4" />
            <span>{submitting ? 'Transmitting Request...' : 'Submit Rescue Request'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
