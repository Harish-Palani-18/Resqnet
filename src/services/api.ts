import { EmergencyRequest, RescueTeam, IncidentUpdate, RouteResult, ReverseGeocodeResult } from '../types';

export async function fetchRequests(filters?: {
  type?: string;
  severity?: string;
  status?: string;
  search?: string;
}): Promise<EmergencyRequest[]> {
  const params = new URLSearchParams();
  if (filters?.type && filters.type !== 'all') params.set('type', filters.type);
  if (filters?.severity && filters.severity !== 'all') params.set('severity', filters.severity);
  if (filters?.status && filters.status !== 'all') params.set('status', filters.status);
  if (filters?.search) params.set('search', filters.search);

  const res = await fetch(`/api/requests?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch emergency requests');
  const data = await res.json();
  return data.requests || [];
}

export async function fetchRequestByIdOrCode(idOrCode: string): Promise<{ request: EmergencyRequest; updates: IncidentUpdate[] }> {
  const res = await fetch(`/api/requests/${encodeURIComponent(idOrCode)}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Request not found');
  }
  return res.json();
}

export async function createEmergencyRequest(payload: Partial<EmergencyRequest>): Promise<EmergencyRequest> {
  const res = await fetch('/api/requests', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to submit emergency request');
  }
  const data = await res.json();
  return data.request;
}

export async function updateRequestStatus(
  id: string,
  status: string,
  note?: string,
  operatorName?: string
): Promise<EmergencyRequest> {
  const res = await fetch(`/api/requests/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, note, operatorName }),
  });
  if (!res.ok) throw new Error('Failed to update request');
  const data = await res.json();
  return data.request;
}

export async function fetchRescueTeams(requestLat?: number, requestLng?: number, emergencyType?: string): Promise<RescueTeam[]> {
  const params = new URLSearchParams();
  if (requestLat !== undefined && requestLng !== undefined) {
    params.set('requestLat', String(requestLat));
    params.set('requestLng', String(requestLng));
  }
  if (emergencyType) {
    params.set('emergencyType', emergencyType);
  }

  const res = await fetch(`/api/teams?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch rescue teams');
  const data = await res.json();
  return data.teams || [];
}

export async function assignRescueTeam(
  requestId: string,
  teamId: string,
  notes?: string,
  operatorName?: string
): Promise<{ request: EmergencyRequest; team: RescueTeam }> {
  const res = await fetch('/api/assignments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ requestId, teamId, notes, operatorName }),
  });
  if (!res.ok) throw new Error('Failed to assign rescue team');
  return res.json();
}

export async function fetchRoute(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number
): Promise<RouteResult> {
  const params = new URLSearchParams({
    fromLat: String(fromLat),
    fromLng: String(fromLng),
    toLat: String(toLat),
    toLng: String(toLng),
  });

  const res = await fetch(`/api/route?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to calculate road route');
  const data = await res.json();
  return data.route;
}

export async function reverseGeocode(lat: number, lng: number): Promise<ReverseGeocodeResult> {
  const params = new URLSearchParams({ lat: String(lat), lng: String(lng) });
  const res = await fetch(`/api/geocode/reverse?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to reverse geocode');
  return res.json();
}

export async function resetDemoData(): Promise<void> {
  const res = await fetch('/api/reset-demo', { method: 'POST' });
  if (!res.ok) throw new Error('Failed to reset demo scenario');
}

export async function checkSupabaseStatus(): Promise<{
  connected: boolean;
  tableReady: boolean;
  projectId: string;
  message: string;
}> {
  try {
    const res = await fetch('/api/supabase/status');
    if (!res.ok) throw new Error('Failed to fetch status');
    return res.json();
  } catch (err: any) {
    return {
      connected: false,
      tableReady: false,
      projectId: 'bmiiicushacrzneumtkf',
      message: err.message || 'Unable to query Supabase status',
    };
  }
}

