import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// ----------------------------------------------------
// SUPABASE CLIENT INITIALIZATION
// Project ID: bmiiicushacrzneumtkf
// ----------------------------------------------------
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://bmiiicushacrzneumtkf.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'sb_publishable_jzk4vnUB9ntUWLkcGGmAqw_VZEMoQxq';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ----------------------------------------------------
// DEMO SEED DATA
// Centered around Bengaluru (Bangalore), Karnataka, India disaster response sector
// Real road network coordinates ensures OSRM returns realistic road routes
// ----------------------------------------------------

interface RequestItem {
  id: string;
  requestCode: string;
  reporterName?: string;
  contactPhone: string;
  emergencyType: string;
  severity: string;
  peopleAffected: number;
  description: string;
  latitude: number;
  longitude: number;
  address: string;
  landmark?: string;
  imageUrl?: string;
  status: string;
  assignedTeamId?: string;
  assignedTeamName?: string;
  createdAt: string;
  updatedAt: string;
}

interface TeamItem {
  id: string;
  name: string;
  callsign: string;
  latitude: number;
  longitude: number;
  baseLocation: string;
  status: 'available' | 'assigned' | 'responding' | 'unavailable';
  supportedEmergencyTypes: string[];
  personnelCount: number;
  vehicleType: string;
  contactNumber: string;
}

interface UpdateItem {
  id: string;
  requestId: string;
  status: string;
  message: string;
  author: string;
  createdAt: string;
}

interface AssignmentItem {
  id: string;
  requestId: string;
  teamId: string;
  assignedAt: string;
  status: 'active' | 'completed' | 'cancelled';
  notes?: string;
}

function getInitialTeams(): TeamItem[] {
  return [
    {
      id: 'team-alpha',
      name: 'BBMP Rapid Flood & Inundation Unit',
      callsign: 'RESCUE-01',
      latitude: 12.9352,
      longitude: 77.6245,
      baseLocation: 'Koramangala 80ft Road Disaster Outpost',
      status: 'available',
      supportedEmergencyTypes: ['flood', 'medical', 'trapped'],
      personnelCount: 6,
      vehicleType: 'Inflatable Swiftwater Rescue Boats & High-Axle De-watering Rig',
      contactNumber: '+91 80 2266 0000',
    },
    {
      id: 'team-bravo',
      name: 'NDRF 10th Bn — Urban Search & Heavy Extrication',
      callsign: 'NDRF-02',
      latitude: 13.0180,
      longitude: 77.5890,
      baseLocation: 'Hebbal Disaster Response Facility',
      status: 'available',
      supportedEmergencyTypes: ['earthquake', 'collapse', 'trapped', 'landslide'],
      personnelCount: 8,
      vehicleType: 'Heavy Structural Extrication Rig, Hydraulic Cutters & Crane Unit',
      contactNumber: '+91 80 2297 1500',
    },
    {
      id: 'team-charlie',
      name: 'Karnataka Fire & Emergency Services (KFES)',
      callsign: 'FIRE-03',
      latitude: 12.9830,
      longitude: 77.6150,
      baseLocation: 'Ulsoor Central Fire Station',
      status: 'responding',
      supportedEmergencyTypes: ['fire', 'trapped', 'medical'],
      personnelCount: 5,
      vehicleType: 'Water Bowser Engine, Foam Tender & Aerial Ladder Platform',
      contactNumber: '+91 80 2297 1522',
    },
    {
      id: 'team-delta',
      name: 'SDRF Karnataka — Tactical Mountain & Terrain SAR',
      callsign: 'SDRF-04',
      latitude: 12.9602,
      longitude: 77.5750,
      baseLocation: 'South Bengaluru Emergency Outpost',
      status: 'available',
      supportedEmergencyTypes: ['landslide', 'earthquake', 'medical', 'other'],
      personnelCount: 7,
      vehicleType: 'All-Terrain Winch Response Carrier & Trench Rescue Unit',
      contactNumber: '+91 80 2297 1600',
    },
    {
      id: 'team-echo',
      name: '108 GVK-EMRI Critical Care Triage Unit',
      callsign: 'MEDIC-01',
      latitude: 12.9650,
      longitude: 77.5980,
      baseLocation: 'Central Bengaluru Emergency Trauma Hub',
      status: 'available',
      supportedEmergencyTypes: ['medical', 'flood', 'earthquake', 'fire', 'collapse'],
      personnelCount: 4,
      vehicleType: 'Advanced Cardiac Life Support (ACLS) High-Clearance Ambulance',
      contactNumber: '+91 80 2222 2222',
    },
  ];
}

function getInitialRequests(): RequestItem[] {
  const now = Date.now();
  return [
    {
      id: 'req-1',
      requestCode: 'RQ-8841',
      reporterName: 'Pooja Krishnamurthy',
      contactPhone: '+91 98450 21988',
      emergencyType: 'flood',
      severity: 'critical',
      peopleAffected: 5,
      description: 'Torrential cloudburst overflowed storm drains along Outer Ring Road. Ground-floor apartment and underpass flooded over 4.5 feet deep. Elderly residents and 1 child stranded on balcony near EcoSpace.',
      latitude: 12.9260,
      longitude: 77.6762,
      address: 'Outer Ring Road (ORR) near EcoSpace, Bellandur, Bengaluru',
      landmark: 'Opposite EcoSpace Tech Park Underpass, Bellandur Lake corridor',
      status: 'in_progress',
      assignedTeamId: 'team-alpha',
      assignedTeamName: 'BBMP Rapid Flood & Inundation Unit',
      createdAt: new Date(now - 45 * 60 * 1000).toISOString(),
      updatedAt: new Date(now - 15 * 60 * 1000).toISOString(),
    },
    {
      id: 'req-2',
      requestCode: 'RQ-8842',
      reporterName: 'Suresh Gowda',
      contactPhone: '+91 98801 34520',
      emergencyType: 'landslide',
      severity: 'critical',
      peopleAffected: 3,
      description: 'Heavy torrential downpour triggered retaining wall collapse and mudslide along service road embankment. Debris crushed perimeter garage with 2 individuals pinned beneath concrete slab.',
      latitude: 13.0358,
      longitude: 77.5970,
      address: 'Bellary Road Service Lane near Hebbal Flyover, Bengaluru',
      landmark: 'North descent ramp of Hebbal Flyover toward Airport Corridor',
      status: 'verified',
      createdAt: new Date(now - 30 * 60 * 1000).toISOString(),
      updatedAt: new Date(now - 10 * 60 * 1000).toISOString(),
    },
    {
      id: 'req-3',
      requestCode: 'RQ-8843',
      reporterName: 'Ananya Nambiar',
      contactPhone: '+91 97412 88419',
      emergencyType: 'collapse',
      severity: 'high',
      peopleAffected: 6,
      description: 'Centuries-old heritage Gulmohar tree and commercial building facade collapsed across 100 Feet Road during monsoon squall. High-voltage power line snapped, trapping commuters and shop workers inside.',
      latitude: 12.9784,
      longitude: 77.6408,
      address: '100 Feet Road, HAL 2nd Stage, Indiranagar, Bengaluru',
      landmark: 'Near CMH Road Metro Junction & 12th Main Corner',
      status: 'pending',
      createdAt: new Date(now - 18 * 60 * 1000).toISOString(),
      updatedAt: new Date(now - 18 * 60 * 1000).toISOString(),
    },
    {
      id: 'req-4',
      requestCode: 'RQ-8844',
      reporterName: 'Vikramaditya Rao',
      contactPhone: '+91 99002 44771',
      emergencyType: 'medical',
      severity: 'high',
      peopleAffected: 2,
      description: 'Multi-vehicle monsoon collision amidst zero-visibility waterlogging. Driver sustained thoracic trauma and severe respiratory distress. Heavy gridlock blocking regular traffic.',
      latitude: 12.9745,
      longitude: 77.6095,
      address: 'MG Road near Brigade Road Junction, Bengaluru',
      landmark: 'Opposite Trinity Metro Station approach',
      status: 'pending',
      createdAt: new Date(now - 12 * 60 * 1000).toISOString(),
      updatedAt: new Date(now - 12 * 60 * 1000).toISOString(),
    },
    {
      id: 'req-5',
      requestCode: 'RQ-8845',
      reporterName: 'Kavitha Sundaram',
      contactPhone: '+91 94480 55123',
      emergencyType: 'fire',
      severity: 'medium',
      peopleAffected: 3,
      description: 'Electrical distribution transformer sparked and caught fire following water ingress near commercial complex. Smoke spreading into upper floor offices.',
      latitude: 12.9172,
      longitude: 77.6228,
      address: 'Hosur Road near Central Silk Board Junction, Bengaluru',
      landmark: 'Silk Board Flyover Loop near BTM 1st Stage entry',
      status: 'resolved',
      createdAt: new Date(now - 120 * 60 * 1000).toISOString(),
      updatedAt: new Date(now - 25 * 60 * 1000).toISOString(),
    },
  ];
}

function getInitialUpdates(): UpdateItem[] {
  const now = Date.now();
  return [
    {
      id: 'up-1',
      requestId: 'req-1',
      status: 'pending',
      message: 'Emergency request submitted via RESQNET portal. Severity flagged as Critical urban flooding.',
      author: 'Automated Dispatch System',
      createdAt: new Date(now - 45 * 60 * 1000).toISOString(),
    },
    {
      id: 'up-2',
      requestId: 'req-1',
      status: 'verified',
      message: 'BBMP Disaster Control verified waterlogging depth (>4.5 ft) near EcoSpace underpass.',
      author: 'Dispatcher Rajesh K. (#D-104)',
      createdAt: new Date(now - 35 * 60 * 1000).toISOString(),
    },
    {
      id: 'up-3',
      requestId: 'req-1',
      status: 'assigned',
      message: 'Assigned to BBMP Rapid Flood & Inundation Unit. Inflatable rescue boats en route via Sarjapur Road.',
      author: 'Operations Chief Rao',
      createdAt: new Date(now - 25 * 60 * 1000).toISOString(),
    },
    {
      id: 'up-4',
      requestId: 'req-1',
      status: 'in_progress',
      message: 'Rescue unit arrived at Bellandur lake feeder canal. Boat deployed to extract residents from balcony.',
      author: 'Capt. S. Patil (BBMP SAR)',
      createdAt: new Date(now - 15 * 60 * 1000).toISOString(),
    },
    {
      id: 'up-5',
      requestId: 'req-2',
      status: 'pending',
      message: 'Emergency request submitted. Retaining wall and mudslide reported on Hebbal Flyover service road.',
      author: 'Automated Dispatch System',
      createdAt: new Date(now - 30 * 60 * 1000).toISOString(),
    },
    {
      id: 'up-6',
      requestId: 'req-2',
      status: 'verified',
      message: 'NDRF Hebbal command deployed structural assessment team and hydraulic cutters to site.',
      author: 'Dispatcher Meera N. (#D-112)',
      createdAt: new Date(now - 10 * 60 * 1000).toISOString(),
    },
    {
      id: 'up-7',
      requestId: 'req-5',
      status: 'resolved',
      message: 'Silk Board transformer blaze extinguished by KFES Engine. Bescom isolated high-voltage feeder line.',
      author: 'KFES Ulsoor Incident Command',
      createdAt: new Date(now - 25 * 60 * 1000).toISOString(),
    },
  ];
}

// In-Memory Database store with persistent runtime state
let requests: RequestItem[] = getInitialRequests();
let teams: TeamItem[] = getInitialTeams();
let updates: UpdateItem[] = getInitialUpdates();
let assignments: AssignmentItem[] = [
  {
    id: 'asg-1',
    requestId: 'req-1',
    teamId: 'team-alpha',
    assignedAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    status: 'active',
    notes: 'Inflatable boat needed for flooded Bellandur underpass access.',
  },
];

// Helper: Haversine distance in km
function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(2));
}

// ----------------------------------------------------
// API ROUTES
// ----------------------------------------------------

// 1. Get all emergency requests (from Supabase with in-memory fallback)
app.get('/api/requests', async (req: Request, res: Response) => {
  const { type, severity, status, search } = req.query;
  let allRequests = [...requests];

  // Fetch live records from Supabase if table exists
  try {
    const { data: sbData, error: sbErr } = await supabase
      .from('emergency_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (!sbErr && sbData && sbData.length > 0) {
      const mappedSbRequests: RequestItem[] = sbData.map((row: any) => ({
        id: row.id || `sb-${row.request_code}`,
        requestCode: row.request_code,
        reporterName: row.reporter_name || 'Anonymous Citizen',
        contactPhone: row.contact_phone,
        emergencyType: (row.disaster_type || 'other').toLowerCase(),
        severity: (row.severity_level || 'medium').toLowerCase(),
        peopleAffected: Number(row.people_affected) || 1,
        description: row.description || '',
        latitude: Number(row.latitude),
        longitude: Number(row.longitude),
        address: row.street_address || row.address || '',
        landmark: row.landmark || undefined,
        imageUrl: row.image_url || undefined,
        status: (row.status || 'pending').toLowerCase().replace(/\s+/g, '_'),
        createdAt: row.created_at,
        updatedAt: row.updated_at || row.created_at,
      }));

      // Merge: avoid duplicates by requestCode (Supabase live rows take precedence)
      const existingCodes = new Set(mappedSbRequests.map((r) => r.requestCode));
      allRequests = [...mappedSbRequests, ...allRequests.filter((r) => !existingCodes.has(r.requestCode))];
    }
  } catch (err: any) {
    // If Supabase table isn't created yet or network hiccup, fallback to memory
    console.warn('[Supabase Sync Notice]: Using memory store while table is prepared');
  }

  let filtered = [...allRequests];

  if (type && type !== 'all') {
    filtered = filtered.filter((r) => r.emergencyType === type);
  }
  if (severity && severity !== 'all') {
    filtered = filtered.filter((r) => r.severity === severity);
  }
  if (status && status !== 'all') {
    filtered = filtered.filter((r) => r.status === status);
  }
  if (search && typeof search === 'string') {
    const q = search.toLowerCase();
    filtered = filtered.filter(
      (r) =>
        r.requestCode.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        r.address.toLowerCase().includes(q) ||
        (r.landmark && r.landmark.toLowerCase().includes(q)) ||
        (r.reporterName && r.reporterName.toLowerCase().includes(q))
    );
  }

  // Sort: Critical first, then newest
  filtered.sort((a, b) => {
    const sevOrder: Record<string, number> = { critical: 3, high: 2, medium: 1 };
    const sevDiff = (sevOrder[b.severity] || 0) - (sevOrder[a.severity] || 0);
    if (sevDiff !== 0) return sevDiff;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  res.json({ success: true, count: filtered.length, requests: filtered });
});

// 2. Get single emergency request
app.get('/api/requests/:idOrCode', (req: Request, res: Response) => {
  const { idOrCode } = req.params;
  const request = requests.find(
    (r) => r.id === idOrCode || r.requestCode.toUpperCase() === idOrCode.toUpperCase()
  );

  if (!request) {
    return res.status(404).json({ success: false, error: 'Emergency request not found' });
  }

  const reqUpdates = updates
    .filter((u) => u.requestId === request.id)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  res.json({ success: true, request, updates: reqUpdates });
});

// 3. Create new emergency request (Persists to Supabase and in-memory store)
app.post('/api/requests', async (req: Request, res: Response) => {
  const {
    reporterName,
    contactPhone,
    emergencyType,
    severity,
    peopleAffected,
    description,
    latitude,
    longitude,
    address,
    landmark,
    imageUrl,
  } = req.body;

  if (!contactPhone || !emergencyType || !severity || !description || latitude === undefined || longitude === undefined || !address) {
    return res.status(400).json({
      success: false,
      error: 'Missing required emergency details. Contact phone, type, severity, description, location coordinates, and address are required.',
    });
  }

  const newId = `req-${Date.now()}`;
  const randomCode = Math.floor(1000 + Math.random() * 9000);
  const requestCode = `RQ-${randomCode}`;
  const nowIso = new Date().toISOString();

  const newRequest: RequestItem = {
    id: newId,
    requestCode,
    reporterName: reporterName ? String(reporterName).trim() : 'Anonymous Citizen',
    contactPhone: String(contactPhone).trim(),
    emergencyType,
    severity,
    peopleAffected: Number(peopleAffected) || 1,
    description: String(description).trim(),
    latitude: Number(latitude),
    longitude: Number(longitude),
    address: String(address).trim(),
    landmark: landmark ? String(landmark).trim() : undefined,
    imageUrl: imageUrl || undefined,
    status: 'pending',
    createdAt: nowIso,
    updatedAt: nowIso,
  };

  requests.unshift(newRequest);

  // Add initial update log
  updates.push({
    id: `up-${Date.now()}`,
    requestId: newId,
    status: 'pending',
    message: `Emergency request ${requestCode} registered. Status: Pending Verification.`,
    author: 'Citizen Web Portal',
    createdAt: nowIso,
  });

  // Automatically sync to Supabase database (bmiiicushacrzneumtkf)
  let supabaseSynced = false;
  let supabaseMessage = '';

  try {
    // Format values for Supabase emergency_requests table
    const formattedDisasterType =
      emergencyType === 'aerial' || emergencyType.toLowerCase().includes('aerial')
        ? 'Aerial Reconnaissance Alert'
        : emergencyType === 'medical'
        ? 'Medical Emergency'
        : emergencyType === 'collapse'
        ? 'Building Collapse'
        : emergencyType === 'trapped'
        ? 'Trapped Person'
        : emergencyType.charAt(0).toUpperCase() + emergencyType.slice(1);

    const formattedSeverity =
      severity === 'critical'
        ? 'Critical'
        : severity === 'high'
        ? 'High Priority'
        : 'Medium';

    const { error: sbErr } = await supabase.from('emergency_requests').insert([
      {
        request_code: requestCode,
        disaster_type: formattedDisasterType,
        severity_level: formattedSeverity,
        latitude: Number(latitude),
        longitude: Number(longitude),
        street_address: String(address).trim(),
        landmark: landmark ? String(landmark).trim() : null,
        contact_phone: String(contactPhone).trim(),
        reporter_name: reporterName ? String(reporterName).trim() : 'Anonymous Citizen',
        people_affected: Number(peopleAffected) || 1,
        description: String(description).trim(),
        image_url: imageUrl || null,
        status: emergencyType === 'aerial' ? 'Pending' : 'Pending Verification',
      },
    ]);

    if (!sbErr) {
      supabaseSynced = true;
      supabaseMessage = 'Saved directly to Supabase table "emergency_requests"';
      console.log(`[Supabase Success] Inserted ${requestCode} into project bmiiicushacrzneumtkf`);
    } else {
      console.warn(`[Supabase Notice] ${sbErr.message}`);
      supabaseMessage = sbErr.message;
    }
  } catch (err: any) {
    console.warn(`[Supabase Sync Warning] ${err.message}`);
    supabaseMessage = err.message;
  }

  res.status(201).json({
    success: true,
    message: 'Rescue request created successfully',
    request: newRequest,
    supabase: {
      synced: supabaseSynced,
      projectId: 'bmiiicushacrzneumtkf',
      message: supabaseMessage,
    },
  });
});

// 3b. Supabase Connection Status Healthcheck
app.get('/api/supabase-status', async (_req: Request, res: Response) => {
  try {
    const { error } = await supabase.from('emergency_requests').select('id').limit(1);
    const tableFound = !error || error.code !== 'PGRST205';
    res.json({
      connected: true,
      projectId: 'bmiiicushacrzneumtkf',
      tableFound,
      statusMessage: tableFound
        ? 'Connected to Supabase project bmiiicushacrzneumtkf. Live table "emergency_requests" is active.'
        : 'Connected to Supabase project bmiiicushacrzneumtkf. Table "emergency_requests" needs to be created in SQL Editor.',
      error: error?.message,
    });
  } catch (err: any) {
    res.json({
      connected: false,
      projectId: 'bmiiicushacrzneumtkf',
      tableFound: false,
      statusMessage: 'Connection failed',
      error: err.message,
    });
  }
});

// 4. Update request status or fields
app.patch('/api/requests/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, note, operatorName } = req.body;

  const reqIndex = requests.findIndex((r) => r.id === id);
  if (reqIndex === -1) {
    return res.status(404).json({ success: false, error: 'Request not found' });
  }

  const targetReq = requests[reqIndex];
  const nowIso = new Date().toISOString();

  if (status && status !== targetReq.status) {
    targetReq.status = status;
    targetReq.updatedAt = nowIso;

    // Log update
    updates.push({
      id: `up-${Date.now()}`,
      requestId: id,
      status,
      message: note || `Status updated to ${status.replace('_', ' ').toUpperCase()}`,
      author: operatorName || 'Rescue Dispatcher',
      createdAt: nowIso,
    });
  }

  res.json({ success: true, request: targetReq });
});

// 5. Get rescue teams with smart recommendation ranking
app.get('/api/teams', (req: Request, res: Response) => {
  const { requestLat, requestLng, emergencyType } = req.query;

  let rankedTeams = teams.map((team) => {
    let distanceKm: number | undefined;
    let durationMin: number | undefined;
    let matchScore = 0;
    let matchReason = '';

    if (requestLat && requestLng) {
      const lat = parseFloat(String(requestLat));
      const lng = parseFloat(String(requestLng));
      if (!isNaN(lat) && !isNaN(lng)) {
        distanceKm = calculateDistanceKm(team.latitude, team.longitude, lat, lng);
        // Estimate approx 45 km/h emergency response driving in disaster conditions
        durationMin = Math.max(3, Math.round((distanceKm / 45) * 60));
      }
    }

    // Availability score
    if (team.status === 'available') matchScore += 50;
    else if (team.status === 'assigned') matchScore += 20;
    else if (team.status === 'responding') matchScore += 10;
    else matchScore -= 100;

    // Emergency type capability match
    const supportsType = emergencyType ? team.supportedEmergencyTypes.includes(String(emergencyType)) : true;
    if (supportsType) {
      matchScore += 40;
    }

    // Distance factor (closer is better)
    if (distanceKm !== undefined) {
      const distancePenalty = Math.min(30, distanceKm * 2);
      matchScore -= distancePenalty;
    }

    if (team.status === 'available' && supportsType && distanceKm !== undefined) {
      matchReason = `Specialized in ${emergencyType || 'this type'}, available now (${distanceKm} km, ~${durationMin} min)`;
    } else if (team.status === 'available') {
      matchReason = `Available backup unit (${distanceKm ? distanceKm + ' km' : 'stationed'})`;
    } else {
      matchReason = `Currently ${team.status}`;
    }

    return {
      ...team,
      distanceKm,
      durationMin,
      matchScore,
      matchReason,
    };
  });

  // Sort by match score descending
  rankedTeams.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));

  res.json({ success: true, count: rankedTeams.length, teams: rankedTeams });
});

// 6. Assign rescue team to emergency request
app.post('/api/assignments', (req: Request, res: Response) => {
  const { requestId, teamId, notes, operatorName } = req.body;

  const targetReq = requests.find((r) => r.id === requestId);
  const targetTeam = teams.find((t) => t.id === teamId);

  if (!targetReq || !targetTeam) {
    return res.status(404).json({ success: false, error: 'Request or Team not found' });
  }

  const nowIso = new Date().toISOString();

  // Update request
  targetReq.status = 'assigned';
  targetReq.assignedTeamId = targetTeam.id;
  targetReq.assignedTeamName = targetTeam.name;
  targetReq.updatedAt = nowIso;

  // Update team status
  targetTeam.status = 'assigned';

  // Create assignment record
  const assignment: AssignmentItem = {
    id: `asg-${Date.now()}`,
    requestId,
    teamId,
    assignedAt: nowIso,
    status: 'active',
    notes,
  };
  assignments.push(assignment);

  // Add incident update
  updates.push({
    id: `up-${Date.now()}`,
    requestId,
    status: 'assigned',
    message: `Team dispatched: ${targetTeam.name} (${targetTeam.callsign}). ${notes ? 'Note: ' + notes : 'En route to incident location.'}`,
    author: operatorName || 'Rescue Dispatcher',
    createdAt: nowIso,
  });

  res.json({
    success: true,
    message: 'Rescue team assigned successfully',
    request: targetReq,
    team: targetTeam,
    assignment,
  });
});

// 7. Get incident updates for a request
app.get('/api/updates/:requestId', (req: Request, res: Response) => {
  const { requestId } = req.params;
  const list = updates
    .filter((u) => u.requestId === requestId)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  res.json({ success: true, count: list.length, updates: list });
});

// 8. Add update note to an incident
app.post('/api/updates', (req: Request, res: Response) => {
  const { requestId, status, message, author } = req.body;
  if (!requestId || !message) {
    return res.status(400).json({ success: false, error: 'Request ID and message are required' });
  }

  const nowIso = new Date().toISOString();
  const newUpdate: UpdateItem = {
    id: `up-${Date.now()}`,
    requestId,
    status: status || 'in_progress',
    message: String(message).trim(),
    author: author || 'Rescue Dispatcher',
    createdAt: nowIso,
  };

  updates.push(newUpdate);
  res.status(201).json({ success: true, update: newUpdate });
});

// 9. Smart Road Route Optimization (Proxy to OSRM public service with robust fallback)
app.get('/api/route', async (req: Request, res: Response) => {
  const { fromLat, fromLng, toLat, toLng } = req.query;

  const fLat = parseFloat(String(fromLat));
  const fLng = parseFloat(String(fromLng));
  const tLat = parseFloat(String(toLat));
  const tLng = parseFloat(String(toLng));

  if (isNaN(fLat) || isNaN(fLng) || isNaN(tLat) || isNaN(tLng)) {
    return res.status(400).json({ success: false, error: 'Valid fromLat, fromLng, toLat, toLng are required' });
  }

  const crowDistanceKm = calculateDistanceKm(fLat, fLng, tLat, tLng);

  try {
    // Attempt OSRM public routing service with 3.5s timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${fLng},${fLat};${tLng},${tLat}?overview=full&geometries=geojson&alternatives=true`;
    
    const osrmRes = await fetch(osrmUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'RESQNET-DisasterResponse/1.0',
      },
    });

    clearTimeout(timeoutId);

    if (osrmRes.ok) {
      const data = await osrmRes.json();
      if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
        const primary = data.routes[0];
        // OSRM returns coordinates as [lon, lat], Leaflet expects [lat, lon]
        const primaryCoords: [number, number][] = primary.geometry.coordinates.map(
          ([lon, lat]: [number, number]) => [lat, lon]
        );

        const alternatives = (data.routes.slice(1) || []).map((alt: any) => ({
          coordinates: alt.geometry.coordinates.map(([lon, lat]: [number, number]) => [lat, lon]),
          distanceKm: parseFloat((alt.distance / 1000).toFixed(1)),
          durationMin: Math.max(1, Math.round(alt.duration / 60)),
          summary: alt.legs?.[0]?.summary || 'Alternative Road Route',
        }));

        return res.json({
          success: true,
          route: {
            coordinates: primaryCoords,
            distanceKm: parseFloat((primary.distance / 1000).toFixed(1)),
            durationMin: Math.max(1, Math.round(primary.duration / 60)),
            summary: primary.legs?.[0]?.summary || 'Road corridor via OSRM',
            geometryType: 'road',
            warning: 'Estimated route based on standard road network. CAUTION: Does not reflect real-time flood inundation, bridge collapses, or active debris.',
            alternatives,
          },
        });
      }
    }
  } catch (err) {
    // OSRM service error or timeout - fall through to fallback
  }

  // Graceful fallback: Curved emergency straight-line path with intermediate waypoints
  const midLat = (fLat + tLat) / 2 + (Math.random() - 0.5) * 0.005;
  const midLng = (fLng + tLng) / 2 + (Math.random() - 0.5) * 0.005;
  const fallbackCoords: [number, number][] = [
    [fLat, fLng],
    [midLat, midLng],
    [tLat, tLng],
  ];

  const estimatedRoadKm = parseFloat((crowDistanceKm * 1.25).toFixed(1));
  const estimatedMin = Math.max(3, Math.round((estimatedRoadKm / 40) * 60));

  res.json({
    success: true,
    route: {
      coordinates: fallbackCoords,
      distanceKm: estimatedRoadKm,
      durationMin: estimatedMin,
      summary: 'Direct GPS corridor (OSRM routing service unavailable)',
      geometryType: 'direct',
      warning: 'Public road routing service was unavailable or throttled. Displaying direct navigational corridor.',
      alternatives: [],
    },
  });
});

// 10. Reverse Geocoding Proxy (OpenStreetMap Nominatim with respectful timeout and fallback)
app.get('/api/geocode/reverse', async (req: Request, res: Response) => {
  const { lat, lng } = req.query;
  const nLat = parseFloat(String(lat));
  const nLng = parseFloat(String(lng));

  if (isNaN(nLat) || isNaN(nLng)) {
    return res.status(400).json({ success: false, error: 'Valid lat and lng required' });
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);

    const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${nLat}&lon=${nLng}&zoom=18&addressdetails=1`;
    const response = await fetch(nominatimUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'RESQNET-DisasterResponse/1.0 (Emergency Prototype)',
        'Accept-Language': 'en',
      },
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      const addr = data.address || {};
      const street = addr.road || addr.pedestrian || addr.suburb || '';
      const city = addr.city || addr.town || addr.village || addr.county || '';
      const state = addr.state || '';
      const cleanAddress = [street, city, state].filter(Boolean).join(', ') || data.display_name || `${nLat.toFixed(5)}, ${nLng.toFixed(5)}`;

      return res.json({
        success: true,
        address: cleanAddress,
        displayName: data.display_name || cleanAddress,
        neighbourhood: addr.suburb || addr.neighbourhood,
        city,
        state,
      });
    }
  } catch (err) {
    // Ignore timeout and fallback below
  }

  res.json({
    success: true,
    address: `Sector coordinates: ${nLat.toFixed(4)}, ${nLng.toFixed(4)}`,
    displayName: `Lat: ${nLat.toFixed(5)}, Lng: ${nLng.toFixed(5)}`,
  });
});

// 11. Reset demonstration data
app.post('/api/reset-demo', (_req: Request, res: Response) => {
  requests = getInitialRequests();
  teams = getInitialTeams();
  updates = getInitialUpdates();
  assignments = [
    {
      id: 'asg-1',
      requestId: 'req-1',
      teamId: 'team-alpha',
      assignedAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
      status: 'active',
      notes: 'Swiftwater boat needed for flooded driveway access.',
    },
  ];
  res.json({ success: true, message: 'Demonstration scenario reset to initial disaster sector state' });
});

// ----------------------------------------------------
// FRONTEND STATIC / VITE MIDDLEWARE SERVING
// ----------------------------------------------------
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    // Vite dev server integration
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production build static serving
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[RESQNET Server] Running at http://localhost:${PORT}`);
  });
}

startServer();
