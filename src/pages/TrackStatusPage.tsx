import React, { useState, useEffect } from 'react';
import {
  Search,
  CheckCircle2,
  Clock,
  ShieldAlert,
  AlertTriangle,
  MapPin,
  Users,
  Phone,
  RefreshCw,
  Info,
} from 'lucide-react';
import { EmergencyRequest, IncidentUpdate, RequestStatus } from '../types';
import { fetchRequestByIdOrCode } from '../services/api';

interface TrackStatusPageProps {
  initialCode?: string;
  onNavigateToRequest: () => void;
}

const STATUS_STEPS: { id: RequestStatus; label: string; desc: string }[] = [
  { id: 'pending', label: '1. Request Received', desc: 'Logged into the RESQNET dispatch queue.' },
  { id: 'verified', label: '2. Incident Verified', desc: 'Coordinates & situation verified by dispatcher.' },
  { id: 'assigned', label: '3. Rescue Unit Assigned', desc: 'Specialized SAR team selected & alerted.' },
  { id: 'in_progress', label: '4. Rescue In Progress', desc: 'Rescue unit deployed & actively operating at scene.' },
  { id: 'resolved', label: '5. Rescue Complete', desc: 'Operation concluded; victims evacuated safely.' },
];

export const TrackStatusPage: React.FC<TrackStatusPageProps> = ({
  initialCode = '',
  onNavigateToRequest,
}) => {
  const [requestCode, setRequestCode] = useState(initialCode);
  const [searchedCode, setSearchedCode] = useState(initialCode);
  const [request, setRequest] = useState<EmergencyRequest | null>(null);
  const [updates, setUpdates] = useState<IncidentUpdate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = async (codeToFetch: string) => {
    if (!codeToFetch.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchRequestByIdOrCode(codeToFetch.trim());
      setRequest(data.request);
      setUpdates(data.updates);
      setSearchedCode(codeToFetch.trim().toUpperCase());
    } catch (err: any) {
      setError(err.message || 'No rescue request found with that ID. Please check the code and retry.');
      setRequest(null);
      setUpdates([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialCode) {
      fetchStatus(initialCode);
    }
  }, [initialCode]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchStatus(requestCode);
  };

  const getStepStatus = (stepId: RequestStatus, currentStatus: RequestStatus) => {
    const order: Record<RequestStatus, number> = {
      pending: 1,
      verified: 2,
      assigned: 3,
      in_progress: 4,
      resolved: 5,
      rejected: -1,
    };

    if (currentStatus === 'rejected') {
      return stepId === 'pending' ? 'completed' : 'rejected';
    }

    const currentOrder = order[currentStatus] || 1;
    const stepOrder = order[stepId] || 1;

    if (currentOrder > stepOrder) return 'completed';
    if (currentOrder === stepOrder) return 'current';
    return 'upcoming';
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-bold tracking-wide uppercase border border-blue-200">
          <Clock className="w-3.5 h-3.5" />
          <span>Live Rescue Progress Tracking</span>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Track Your Emergency Request
        </h1>
        <p className="text-sm text-slate-600 max-w-xl mx-auto">
          Enter your unique Request ID to see real-time verification and rescue team response updates.
        </p>
      </div>

      {/* Search Input Box */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6 space-y-4">
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={requestCode}
              onChange={(e) => setRequestCode(e.target.value)}
              placeholder="Enter Request ID (e.g. RQ-8841)"
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-base font-mono font-bold tracking-wider uppercase focus:ring-2 focus:ring-red-500 focus:bg-white"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm rounded-xl transition-colors flex items-center justify-center gap-2 whitespace-nowrap disabled:opacity-50"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            <span>Track Status</span>
          </button>
        </form>

        {/* Quick Demo Sample suggestions */}
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 pt-2 border-t border-slate-100">
          <span>Try sample demo codes:</span>
          {['RQ-8841', 'RQ-8842', 'RQ-8843', 'RQ-8844', 'RQ-8845'].map((code) => (
            <button
              key={code}
              type="button"
              onClick={() => {
                setRequestCode(code);
                fetchStatus(code);
              }}
              className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono font-bold transition-colors"
            >
              {code}
            </button>
          ))}
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-5 text-center space-y-3">
          <AlertTriangle className="w-8 h-8 text-red-600 mx-auto" />
          <div className="text-sm font-bold text-red-900">{error}</div>
          <p className="text-xs text-red-700 max-w-md mx-auto">
            Please make sure you entered the exact Request ID generated when submitting the rescue request.
          </p>
          <button
            onClick={onNavigateToRequest}
            className="inline-block text-xs font-bold px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Submit a New Request
          </button>
        </div>
      )}

      {/* Result Display */}
      {request && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden space-y-6">
          {/* Header Banner */}
          <div className="bg-slate-900 p-6 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-xs uppercase font-bold text-red-400 tracking-wider">
                Rescue Tracking Code
              </span>
              <div className="text-3xl font-extrabold font-mono text-white">
                {request.requestCode}
              </div>
              <div className="text-xs text-slate-300 capitalize">
                {request.emergencyType} Emergency · {request.peopleAffected} People Affected
              </div>
            </div>

            <div className="text-left sm:text-right">
              <span className="text-xs uppercase font-bold text-slate-400 block mb-1">
                Current Status
              </span>
              <span
                className={`inline-block px-3 py-1 rounded-full text-xs font-bold capitalize ${
                  request.status === 'in_progress'
                    ? 'bg-blue-500 text-white animate-pulse'
                    : request.status === 'resolved'
                    ? 'bg-emerald-500 text-white'
                    : request.status === 'verified'
                    ? 'bg-amber-500 text-white'
                    : request.status === 'rejected'
                    ? 'bg-red-500 text-white'
                    : 'bg-slate-700 text-slate-200'
                }`}
              >
                {request.status.replace('_', ' ')}
              </span>
            </div>
          </div>

          <div className="p-6 space-y-8">
            {/* Rejected notification if invalid */}
            {request.status === 'rejected' && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-900 space-y-1">
                <strong>Notice:</strong> This request was marked as invalid or duplicate by dispatch triage. If you still require urgent assistance, please contact emergency numbers directly.
              </div>
            )}

            {/* Status Timeline */}
            <div className="space-y-4">
              <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider">
                Status Progression
              </h3>

              <div className="space-y-4 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-slate-200">
                {STATUS_STEPS.map((step) => {
                  const state = getStepStatus(step.id, request.status);
                  const isCompleted = state === 'completed';
                  const isCurrent = state === 'current';

                  return (
                    <div key={step.id} className="relative flex items-start gap-4 pl-8">
                      <div
                        className={`absolute left-1.5 -translate-x-1/2 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                          isCompleted
                            ? 'bg-emerald-600 text-white'
                            : isCurrent
                            ? 'bg-blue-600 text-white ring-4 ring-blue-100 animate-pulse'
                            : 'bg-slate-200 text-slate-500'
                        }`}
                      >
                        {isCompleted ? '✓' : ''}
                      </div>

                      <div className="space-y-0.5">
                        <div
                          className={`text-sm font-bold ${
                            isCurrent ? 'text-blue-600' : isCompleted ? 'text-slate-900' : 'text-slate-400'
                          }`}
                        >
                          {step.label}
                        </div>
                        <p className="text-xs text-slate-500">{step.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Assigned Team Information */}
            {request.assignedTeamName && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-2">
                <span className="text-[10px] uppercase font-bold text-blue-700 tracking-wider">
                  Assigned Response Unit
                </span>
                <div className="font-bold text-base text-blue-950">
                  {request.assignedTeamName}
                </div>
                <p className="text-xs text-blue-800">
                  This search and rescue team has received your incident coordinates and is en route.
                </p>
              </div>
            )}

            {/* Activity Log / Dispatcher Updates */}
            {updates.length > 0 && (
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider">
                  Incident Log & Dispatch Notes
                </h3>
                <div className="space-y-2">
                  {updates.map((u) => (
                    <div key={u.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
                      <div className="flex items-center justify-between text-slate-500">
                        <span className="font-semibold text-slate-700">{u.author}</span>
                        <span className="font-mono text-[11px]">{new Date(u.createdAt).toLocaleTimeString()}</span>
                      </div>
                      <p className="text-slate-800 font-medium">{u.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Privacy note */}
            <div className="bg-slate-50 rounded-lg p-3 text-[11px] text-slate-500 flex items-start gap-2 border border-slate-200">
              <Info className="w-4 h-4 shrink-0 text-slate-400 mt-0.5" />
              <span>
                To protect victim safety and privacy, detailed phone numbers and confidential dispatcher chatter are not publicly broadcasted.
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
