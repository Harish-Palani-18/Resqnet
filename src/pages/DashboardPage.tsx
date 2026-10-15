import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Search,
  Filter,
  CheckCircle,
  Clock,
  MapPin,
  Users,
  Route,
  UserCheck,
  XCircle,
  AlertTriangle,
  Lock,
  Unlock,
  ChevronRight,
  ExternalLink,
  RefreshCw,
  ArrowUpDown,
} from 'lucide-react';
import { EmergencyRequest, RescueTeam, RouteResult, RequestStatus } from '../types';
import { LeafletMap } from '../components/LeafletMap';
import { updateRequestStatus, assignRescueTeam, fetchRoute, resetDemoData } from '../services/api';

interface DashboardPageProps {
  requests: EmergencyRequest[];
  teams: RescueTeam[];
  isOperator: boolean;
  onLoginOperator: () => void;
  onRefreshData: () => void;
  preSelectedRequest?: EmergencyRequest | null;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  requests,
  teams,
  isOperator,
  onLoginOperator,
  onRefreshData,
  preSelectedRequest,
}) => {
  const [selectedRequest, setSelectedRequest] = useState<EmergencyRequest | null>(
    preSelectedRequest || null
  );
  const [activeTab, setActiveTab] = useState<'details' | 'route' | 'timeline'>('details');

  // Search & filters
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  // Route calculation in panel
  const [panelRoute, setPanelRoute] = useState<RouteResult | null>(null);
  const [calculatingRoute, setCalculatingRoute] = useState(false);
  const [selectedAssignTeamId, setSelectedAssignTeamId] = useState<string>('');

  // Confirmation modals
  const [confirmAction, setConfirmAction] = useState<{
    type: 'resolve' | 'reject';
    requestId: string;
  } | null>(null);

  // Sync pre-selected request
  useEffect(() => {
    if (preSelectedRequest) {
      setSelectedRequest(preSelectedRequest);
    }
  }, [preSelectedRequest]);

  // Sync selected request with updated requests list
  useEffect(() => {
    if (selectedRequest) {
      const refreshed = requests.find((r) => r.id === selectedRequest.id);
      if (refreshed) {
        setSelectedRequest(refreshed);
      }
    }
  }, [requests]);

  // Compute stats
  const totalCount = requests.length;
  const criticalCount = requests.filter((r) => r.severity === 'critical' && r.status !== 'resolved').length;
  const pendingCount = requests.filter((r) => r.status === 'pending').length;
  const handlingCount = requests.filter((r) => r.status === 'assigned' || r.status === 'in_progress').length;
  const resolvedCount = requests.filter((r) => r.status === 'resolved').length;

  // Filter requests
  const filteredRequests = requests.filter((r) => {
    if (filterType !== 'all' && r.emergencyType !== filterType) return false;
    if (filterSeverity !== 'all' && r.severity !== filterSeverity) return false;
    if (filterStatus !== 'all' && r.status !== filterStatus) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const match =
        r.requestCode.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        r.address.toLowerCase().includes(q) ||
        (r.reporterName && r.reporterName.toLowerCase().includes(q));
      if (!match) return false;
    }
    return true;
  });

  // Action handlers
  const handleVerify = async (req: EmergencyRequest) => {
    try {
      await updateRequestStatus(req.id, 'verified', 'Request verified with incident reporting data.', 'Dispatcher Chief');
      onRefreshData();
    } catch (err: any) {
      alert(err.message || 'Failed to update request');
    }
  };

  const handleMarkInProgress = async (req: EmergencyRequest) => {
    try {
      await updateRequestStatus(req.id, 'in_progress', 'Rescue unit actively engaged at scene.', 'Field Commander');
      onRefreshData();
    } catch (err: any) {
      alert(err.message || 'Failed to update request');
    }
  };

  const handleConfirmResolve = async () => {
    if (!confirmAction) return;
    try {
      await updateRequestStatus(confirmAction.requestId, 'resolved', 'Rescue operation completed. Citizens evacuated to safety.', 'Field Commander');
      setConfirmAction(null);
      onRefreshData();
    } catch (err: any) {
      alert(err.message || 'Failed to resolve request');
    }
  };

  const handleConfirmReject = async () => {
    if (!confirmAction) return;
    try {
      await updateRequestStatus(confirmAction.requestId, 'rejected', 'Flagged as duplicate or unverified report.', 'Dispatcher Chief');
      setConfirmAction(null);
      onRefreshData();
    } catch (err: any) {
      alert(err.message || 'Failed to reject request');
    }
  };

  const handleAssignTeam = async (req: EmergencyRequest, teamId: string) => {
    if (!teamId) return;
    try {
      await assignRescueTeam(req.id, teamId, 'Dispatched via Rescue Operator Console', 'Dispatcher Chief');
      onRefreshData();
    } catch (err: any) {
      alert(err.message || 'Failed to assign team');
    }
  };

  const handleCalculateRouteForTeam = async (team: RescueTeam, req: EmergencyRequest) => {
    setCalculatingRoute(true);
    setPanelRoute(null);
    try {
      const res = await fetchRoute(team.latitude, team.longitude, req.latitude, req.longitude);
      setPanelRoute(res);
      setActiveTab('route');
    } catch (err: any) {
      alert('Routing service unavailable. Displaying straight-line navigational corridor.');
    } finally {
      setCalculatingRoute(false);
    }
  };

  const handleResetScenario = async () => {
    if (confirm('Reset demonstration data to the active Bengaluru (Bangalore) disaster sector baseline?')) {
      await resetDemoData();
      onRefreshData();
      setSelectedRequest(null);
      setPanelRoute(null);
    }
  };

  // If user is not authenticated as operator, show friendly Demo Gate
  if (!isOperator) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 mx-auto">
          <Lock className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Rescue Dispatcher Console
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            Restricted access to authorized emergency dispatchers and field search and rescue personnel to protect victim privacy.
          </p>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 text-left text-xs space-y-3">
          <div className="font-bold text-slate-900 uppercase tracking-wide">
            Hackathon / Evaluation Demo Authentication
          </div>
          <p className="text-slate-600 leading-relaxed">
            For demonstration and reviewing purposes, you can immediately access the full dispatcher suite in <strong>Demonstration Mode</strong> without configuring production LDAP/OAuth credentials.
          </p>
          <div className="text-[11px] text-slate-500">
            • View all incoming emergency requests & coordinates<br />
            • Perform smart multi-criteria SAR team assignments<br />
            • Calculate OSRM road routes with distance & travel times<br />
            • Update incident statuses and audit trails
          </div>
        </div>

        <button
          onClick={onLoginOperator}
          className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white text-sm font-bold uppercase tracking-wider rounded-xl shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2"
        >
          <Unlock className="w-4 h-4" />
          <span>Enter as Demo Dispatch Operator</span>
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Console Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-blue-700 uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-blue-600"></span>
            <span>Authorized Dispatcher Console</span>
            <span className="text-slate-300">·</span>
            <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-[10px] font-mono normal-case">
              Supabase Connected: bmiiicushacrzneumtkf
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-0.5">
            Emergency Rescue Command Center
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onRefreshData}
            className="px-3 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5"
            title="Refresh requests"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
          <button
            onClick={handleResetScenario}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg border border-slate-300"
            title="Reset demonstration data"
          >
            Reset Demo Data
          </button>
        </div>
      </div>

      {/* KPI Metric Summary Strip (Required by prompt) */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {/* Total */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Total Requests
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono tabular-nums mt-1">
            {totalCount}
          </div>
        </div>

        {/* Critical */}
        <div className="bg-white p-4 rounded-xl border border-red-200 shadow-sm bg-gradient-to-br from-white to-red-50/30">
          <span className="text-[11px] font-semibold text-red-700 uppercase tracking-wider">
            Critical Alerts
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold text-red-600 font-mono tabular-nums mt-1">
            {criticalCount}
          </div>
        </div>

        {/* Pending */}
        <div className="bg-white p-4 rounded-xl border border-amber-200 shadow-sm bg-gradient-to-br from-white to-amber-50/30">
          <span className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider">
            Pending Verify
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold text-amber-600 font-mono tabular-nums mt-1">
            {pendingCount}
          </div>
        </div>

        {/* Handling */}
        <div className="bg-white p-4 rounded-xl border border-blue-200 shadow-sm bg-gradient-to-br from-white to-blue-50/30">
          <span className="text-[11px] font-semibold text-blue-700 uppercase tracking-wider">
            In Progress / SAR
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold text-blue-600 font-mono tabular-nums mt-1">
            {handlingCount}
          </div>
        </div>

        {/* Resolved */}
        <div className="col-span-2 sm:col-span-1 bg-white p-4 rounded-xl border border-emerald-200 shadow-sm bg-gradient-to-br from-white to-emerald-50/30">
          <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider">
            Resolved
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 font-mono tabular-nums mt-1">
            {resolvedCount}
          </div>
        </div>
      </div>

      {/* Search and Filters Toolbar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search Request Code, address, description, or reporter..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:bg-white"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-2 font-medium"
          >
            <option value="all">All Emergency Types</option>
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
            className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-2 font-medium"
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-2 font-medium"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="verified">Verified</option>
            <option value="assigned">Assigned</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Main Grid: Data Table + Detail Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Requests Table */}
        <div className={`space-y-4 ${selectedRequest ? 'lg:col-span-7' : 'lg:col-span-12'}`}>
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-3">Request ID</th>
                    <th className="py-3 px-3">Type</th>
                    <th className="py-3 px-3">Severity</th>
                    <th className="py-3 px-2 text-center">People</th>
                    <th className="py-3 px-3">Location & Coordinates</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3">Assigned SAR Unit</th>
                    <th className="py-3 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredRequests.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        No emergency requests match the current filters.
                      </td>
                    </tr>
                  ) : (
                    filteredRequests.map((req) => {
                      const isSelected = selectedRequest?.id === req.id;
                      return (
                        <tr
                          key={req.id}
                          onClick={() => setSelectedRequest(req)}
                          className={`cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-blue-50/80 font-medium'
                              : 'hover:bg-slate-50'
                          }`}
                        >
                          <td className="py-3 px-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                            {req.requestCode}
                          </td>
                          <td className="py-3 px-3 capitalize whitespace-nowrap font-medium">
                            {req.emergencyType}
                          </td>
                          <td className="py-3 px-3 whitespace-nowrap">
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
                          </td>
                          <td className="py-3 px-2 text-center font-mono font-bold">
                            {req.peopleAffected}
                          </td>
                          <td className="py-3 px-3 max-w-[200px]">
                            <div className="truncate font-medium text-slate-900">{req.address}</div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              {req.latitude.toFixed(4)}, {req.longitude.toFixed(4)}
                            </div>
                          </td>
                          <td className="py-3 px-3 whitespace-nowrap">
                            <span
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${
                                req.status === 'in_progress'
                                  ? 'bg-blue-100 text-blue-800'
                                  : req.status === 'verified'
                                  ? 'bg-amber-100 text-amber-800'
                                  : req.status === 'resolved'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : req.status === 'rejected'
                                  ? 'bg-slate-200 text-slate-700'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {req.status.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-slate-600 truncate max-w-[140px]">
                            {req.assignedTeamName || (
                              <span className="text-slate-400 italic">Unassigned</span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-right whitespace-nowrap">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedRequest(req);
                              }}
                              className="text-xs font-semibold px-2.5 py-1 bg-slate-900 text-white rounded hover:bg-slate-800 transition-colors"
                            >
                              Inspect
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Detailed Incident & Route Drawer */}
        {selectedRequest && (
          <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 shadow-md p-5 space-y-5 sticky top-20">
            {/* Drawer Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-extrabold text-base text-slate-900">
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
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 capitalize">
                    {selectedRequest.status.replace('_', ' ')}
                  </span>
                </div>
                <h3 className="font-bold text-lg text-slate-900 capitalize mt-1">
                  {selectedRequest.emergencyType} Incident Details
                </h3>
              </div>

              <button
                onClick={() => setSelectedRequest(null)}
                className="text-slate-400 hover:text-slate-600 p-1 text-xs font-bold"
              >
                ✕ Close
              </button>
            </div>

            {/* Sub-tabs: Details vs Route Map */}
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
              <button
                onClick={() => setActiveTab('details')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                  activeTab === 'details'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Victim & Incident Details
              </button>
              <button
                onClick={() => setActiveTab('route')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                  activeTab === 'route'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Smart Route & Map
              </button>
            </div>

            {/* TAB 1: DETAILS */}
            {activeTab === 'details' && (
              <div className="space-y-4 text-xs">
                {/* Victim Description */}
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">
                    Reported Situation:
                  </span>
                  <p className="text-slate-800 text-xs leading-relaxed font-normal">
                    "{selectedRequest.description}"
                  </p>
                </div>

                {/* Info Fields Grid */}
                <div className="grid grid-cols-2 gap-3 text-slate-600">
                  <div>
                    <span className="block text-[10px] font-bold text-slate-400 uppercase">Contact Phone</span>
                    <span className="font-mono font-bold text-slate-900 text-sm">
                      {selectedRequest.contactPhone}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold text-slate-400 uppercase">Reporter</span>
                    <span className="font-bold text-slate-900">
                      {selectedRequest.reporterName || 'Anonymous Citizen'}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold text-slate-400 uppercase">People Trapped / Affected</span>
                    <span className="font-mono font-bold text-slate-900">
                      {selectedRequest.peopleAffected} individuals
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold text-slate-400 uppercase">Reported Timestamp</span>
                    <span className="font-mono text-slate-700">
                      {new Date(selectedRequest.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="block text-[10px] font-bold text-slate-400 uppercase">Address / Location</span>
                    <span className="font-bold text-slate-900">{selectedRequest.address}</span>
                    {selectedRequest.landmark && (
                      <span className="block text-[11px] text-slate-500 mt-0.5">
                        Landmark: {selectedRequest.landmark}
                      </span>
                    )}
                  </div>
                  <div className="col-span-2">
                    <span className="block text-[10px] font-bold text-slate-400 uppercase">Geographic Coordinates</span>
                    <span className="font-mono text-slate-800">
                      Lat {selectedRequest.latitude.toFixed(5)}, Lng {selectedRequest.longitude.toFixed(5)}
                    </span>
                  </div>
                </div>

                {/* Optional Photo */}
                {selectedRequest.imageUrl && (
                  <div>
                    <span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                      Uploaded Field Image
                    </span>
                    <img
                      src={selectedRequest.imageUrl}
                      alt="Incident scene"
                      className="w-full h-36 object-cover rounded-lg border border-slate-200"
                    />
                  </div>
                )}

                {/* Incident Status Action Toolbar */}
                <div className="pt-3 border-t border-slate-100 space-y-2">
                  <span className="block text-[11px] font-bold text-slate-800 uppercase tracking-wider">
                    Operator Workflow Actions:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {selectedRequest.status === 'pending' && (
                      <button
                        onClick={() => handleVerify(selectedRequest)}
                        className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg transition-colors flex items-center gap-1"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Verify Request</span>
                      </button>
                    )}

                    {selectedRequest.status !== 'in_progress' && selectedRequest.status !== 'resolved' && (
                      <button
                        onClick={() => handleMarkInProgress(selectedRequest)}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors flex items-center gap-1"
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span>Mark In Progress</span>
                      </button>
                    )}

                    {selectedRequest.status !== 'resolved' && (
                      <button
                        onClick={() => setConfirmAction({ type: 'resolve', requestId: selectedRequest.id })}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-colors flex items-center gap-1"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Mark Resolved</span>
                      </button>
                    )}

                    {selectedRequest.status !== 'rejected' && (
                      <button
                        onClick={() => setConfirmAction({ type: 'reject', requestId: selectedRequest.id })}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-red-50 text-slate-700 hover:text-red-700 font-bold rounded-lg border border-slate-200 transition-colors flex items-center gap-1"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Reject as Invalid</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Smart Rescue Team Assignment Section */}
                <div className="pt-3 border-t border-slate-100 space-y-3">
                  <span className="block text-[11px] font-bold text-slate-800 uppercase tracking-wider">
                    Smart SAR Team Assignment & Ranking:
                  </span>
                  <div className="space-y-2">
                    {teams.map((t) => {
                      const isAssignedToThis = selectedRequest.assignedTeamId === t.id;
                      return (
                        <div
                          key={t.id}
                          className={`p-2.5 rounded-lg border transition-all ${
                            isAssignedToThis
                              ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500'
                              : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50'
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
                          <div className="text-[11px] text-slate-600 mt-0.5">
                            {t.matchReason || t.vehicleType}
                          </div>
                          <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-200/60">
                            <button
                              type="button"
                              onClick={() => handleAssignTeam(selectedRequest, t.id)}
                              disabled={isAssignedToThis}
                              className={`px-2.5 py-1 rounded text-xs font-bold transition-colors ${
                                isAssignedToThis
                                  ? 'bg-blue-600 text-white cursor-default'
                                  : 'bg-slate-900 hover:bg-slate-800 text-white'
                              }`}
                            >
                              {isAssignedToThis ? 'Assigned' : 'Dispatch Team'}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleCalculateRouteForTeam(t, selectedRequest)}
                              className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded text-xs font-semibold flex items-center gap-1"
                            >
                              <Route className="w-3 h-3 text-blue-600" />
                              <span>Route Map</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: ROUTE & MAP */}
            {activeTab === 'route' && (
              <div className="space-y-4">
                <div className="h-64 rounded-xl overflow-hidden border border-slate-200">
                  <LeafletMap
                    center={[selectedRequest.latitude, selectedRequest.longitude]}
                    zoom={13}
                    requests={[selectedRequest]}
                    teams={teams}
                    activeRoute={panelRoute}
                    height="100%"
                  />
                </div>

                {panelRoute ? (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs space-y-2">
                    <div className="grid grid-cols-2 gap-2 text-center">
                      <div className="bg-white p-2 rounded-lg border border-blue-100">
                        <span className="block text-[10px] text-slate-500 font-bold uppercase">Estimated Distance</span>
                        <span className="text-base font-extrabold text-blue-900 font-mono">
                          {panelRoute.distanceKm} km
                        </span>
                      </div>
                      <div className="bg-white p-2 rounded-lg border border-blue-100">
                        <span className="block text-[10px] text-slate-500 font-bold uppercase">Estimated Road Travel Time</span>
                        <span className="text-base font-extrabold text-blue-900 font-mono">
                          ~{panelRoute.durationMin} min
                        </span>
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-700">
                      <strong>Corridor Summary:</strong> {panelRoute.summary}
                    </div>

                    <div className="text-[10px] text-amber-900 bg-amber-100/70 p-2 rounded border border-amber-200 flex items-start gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
                      <span>{panelRoute.warning}</span>
                    </div>

                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${selectedRequest.latitude},${selectedRequest.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <span>Open in External Navigation App</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                ) : (
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center text-xs space-y-2">
                    <p className="text-slate-600">
                      Select a rescue team below to calculate and render the road navigation route to this incident.
                    </p>
                    <div className="flex flex-wrap justify-center gap-2">
                      {teams.map((t) => (
                        <button
                          key={t.id}
                          onClick={() => handleCalculateRouteForTeam(t, selectedRequest)}
                          disabled={calculatingRoute}
                          className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 font-semibold rounded-lg text-xs"
                        >
                          Route from {t.callsign}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Confirmation Modal for Resolve / Reject */}
      {confirmAction && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  confirmAction.type === 'resolve' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'
                }`}
              >
                {confirmAction.type === 'resolve' ? (
                  <CheckCircle className="w-6 h-6" />
                ) : (
                  <AlertTriangle className="w-6 h-6" />
                )}
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  {confirmAction.type === 'resolve'
                    ? 'Confirm Incident Resolution'
                    : 'Confirm Rejection as Invalid'}
                </h3>
                <p className="text-xs text-slate-500">
                  {confirmAction.type === 'resolve'
                    ? 'Mark this emergency request as fully rescued/resolved.'
                    : 'Mark this report as invalid or duplicate.'}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600">
              This action will update the public tracking status timeline for this request.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setConfirmAction(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={confirmAction.type === 'resolve' ? handleConfirmResolve : handleConfirmReject}
                className={`px-4 py-2 text-white rounded-lg text-xs font-bold ${
                  confirmAction.type === 'resolve'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                Yes, Proceed
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
