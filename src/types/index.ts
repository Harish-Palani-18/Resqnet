export type EmergencyType =
  | 'flood'
  | 'earthquake'
  | 'fire'
  | 'landslide'
  | 'medical'
  | 'trapped'
  | 'collapse'
  | 'aerial'
  | 'other';

export type SeverityLevel = 'critical' | 'high' | 'medium';

export type RequestStatus =
  | 'pending'
  | 'verified'
  | 'assigned'
  | 'in_progress'
  | 'resolved'
  | 'rejected';

export interface EmergencyRequest {
  id: string;
  requestCode: string;
  reporterName?: string;
  contactPhone: string;
  emergencyType: EmergencyType;
  severity: SeverityLevel;
  peopleAffected: number;
  description: string;
  latitude: number;
  longitude: number;
  address: string;
  landmark?: string;
  imageUrl?: string;
  status: RequestStatus;
  assignedTeamId?: string;
  assignedTeamName?: string;
  createdAt: string;
  updatedAt: string;
}

export type TeamStatus = 'available' | 'assigned' | 'responding' | 'unavailable';

export interface RescueTeam {
  id: string;
  name: string;
  callsign: string;
  latitude: number;
  longitude: number;
  baseLocation: string;
  status: TeamStatus;
  supportedEmergencyTypes: EmergencyType[];
  personnelCount: number;
  vehicleType: string;
  contactNumber: string;
  distanceKm?: number;
  durationMin?: number;
  matchScore?: number;
  matchReason?: string;
}

export interface RescueAssignment {
  id: string;
  emergencyRequestId: string;
  rescueTeamId: string;
  assignedAt: string;
  assignmentStatus: 'active' | 'completed' | 'cancelled';
  notes?: string;
}

export interface IncidentUpdate {
  id: string;
  emergencyRequestId: string;
  status: RequestStatus;
  message: string;
  author: string;
  createdAt: string;
}

export interface RouteResult {
  coordinates: [number, number][]; // [lat, lng] array
  distanceKm: number;
  durationMin: number;
  summary: string;
  geometryType: 'road' | 'direct';
  warning?: string;
  alternatives?: {
    coordinates: [number, number][];
    distanceKm: number;
    durationMin: number;
    summary: string;
  }[];
}

export interface ReverseGeocodeResult {
  address: string;
  displayName: string;
  neighbourhood?: string;
  city?: string;
  state?: string;
}
