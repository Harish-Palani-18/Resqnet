-- ========================================================
-- RESQNET Database Schema & Bangalore Disaster Sector Seed
-- PostgreSQL / Supabase Schema for Disaster Rescue Management
-- ========================================================

-- Enable UUID extension if available
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if re-creating
DROP TABLE IF EXISTS incidents CASCADE;
DROP TABLE IF EXISTS sar_units CASCADE;

-- --------------------------------------------------------
-- 1. SAR Units Table (Search & Rescue Teams)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS sar_units (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    callsign VARCHAR(64) NOT NULL UNIQUE,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    base_location VARCHAR(255) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'assigned', 'responding', 'unavailable')),
    vehicle_type VARCHAR(255) NOT NULL,
    contact_number VARCHAR(64) NOT NULL,
    personnel_count INT NOT NULL DEFAULT 4,
    supported_disaster_types TEXT[] NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- --------------------------------------------------------
-- 2. Incidents Table (Emergency Rescue Requests)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS incidents (
    id VARCHAR(64) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    severity VARCHAR(32) NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'low')),
    status VARCHAR(32) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'assigned', 'in_progress', 'resolved', 'rejected')),
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    address TEXT NOT NULL,
    landmark TEXT,
    disaster_type VARCHAR(64) NOT NULL CHECK (disaster_type IN ('flood', 'earthquake', 'fire', 'landslide', 'medical', 'trapped', 'collapse', 'other')),
    people_affected INT NOT NULL DEFAULT 1,
    contact_phone VARCHAR(64) NOT NULL,
    reporter_name VARCHAR(255),
    assigned_sar_unit_id VARCHAR(64) REFERENCES sar_units(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- High-performance geospatial and status indexing
CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status);
CREATE INDEX IF NOT EXISTS idx_incidents_severity ON incidents(severity);
CREATE INDEX IF NOT EXISTS idx_incidents_disaster_type ON incidents(disaster_type);
CREATE INDEX IF NOT EXISTS idx_incidents_location ON incidents(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_incidents_timestamp ON incidents(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_sar_units_status ON sar_units(status);
CREATE INDEX IF NOT EXISTS idx_sar_units_location ON sar_units(latitude, longitude);

-- ========================================================
-- INSERT STATEMENTS: BANGALORE (BENGALURU) SAR UNITS
-- ========================================================

INSERT INTO sar_units (
    id,
    name,
    callsign,
    latitude,
    longitude,
    base_location,
    status,
    vehicle_type,
    contact_number,
    personnel_count,
    supported_disaster_types
) VALUES 
(
    'unit-bbmp-01',
    'BBMP Rapid Flood & Inundation Unit',
    'RESCUE-01',
    12.935200,
    77.624500,
    'Koramangala 80ft Road Disaster Outpost, Ward 151',
    'available',
    'Inflatable Swiftwater Rescue Boats & High-Axle De-watering Rig',
    '+91 80 2266 0000',
    6,
    ARRAY['flood', 'medical', 'trapped']
),
(
    'unit-ndrf-02',
    'NDRF 10th Bn — Urban Search & Extrication',
    'NDRF-02',
    13.018000,
    77.589000,
    'Hebbal Disaster Response Facility, Bellary Road',
    'available',
    'Heavy Structural Extrication Rig, Hydraulic Cutters & Crane Unit',
    '+91 80 2297 1500',
    8,
    ARRAY['collapse', 'earthquake', 'landslide', 'trapped']
),
(
    'unit-kfes-03',
    'Karnataka Fire & Emergency Services (KFES)',
    'FIRE-03',
    12.983000,
    77.615000,
    'Ulsoor Central Fire Station, Kensington Road',
    'responding',
    'Water Bowser Engine, Foam Tender & Aerial Ladder Platform',
    '+91 80 2297 1522',
    5,
    ARRAY['fire', 'trapped', 'medical']
),
(
    'unit-sdrf-04',
    'SDRF Karnataka — Tactical Mountain & Terrain SAR',
    'SDRF-04',
    12.960200,
    77.575000,
    'South Bengaluru Emergency Outpost, Chamarajpet',
    'available',
    'All-Terrain Winch Response Carrier & Trench Rescue Unit',
    '+91 80 2297 1600',
    7,
    ARRAY['landslide', 'collapse', 'medical', 'other']
),
(
    'unit-emri-05',
    '108 GVK-EMRI Critical Care Triage Unit',
    'MEDIC-01',
    12.965000,
    77.598000,
    'Central Bengaluru Emergency Trauma Hub, Bowring Corridor',
    'available',
    'Advanced Cardiac Life Support (ACLS) High-Clearance Ambulance',
    '+91 80 2222 2222',
    4,
    ARRAY['medical', 'flood', 'collapse', 'fire']
)
ON CONFLICT (id) DO UPDATE SET
    status = EXCLUDED.status,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude;

-- ========================================================
-- INSERT STATEMENTS: BANGALORE (BENGALURU) ACTIVE INCIDENTS
-- ========================================================

INSERT INTO incidents (
    id,
    title,
    description,
    latitude,
    longitude,
    severity,
    status,
    timestamp,
    address,
    landmark,
    disaster_type,
    people_affected,
    contact_phone,
    reporter_name,
    assigned_sar_unit_id
) VALUES 
(
    'RQ-8841',
    'Urban Flash Flooding & Stranded Residents at EcoSpace Underpass',
    'Torrential cloudburst overflowed storm drains along Outer Ring Road. Ground-floor apartment and underpass flooded over 4.5 feet deep. Elderly residents and 1 child stranded on balcony near EcoSpace.',
    12.926000,
    77.676200,
    'critical',
    'in_progress',
    CURRENT_TIMESTAMP - INTERVAL '45 minutes',
    'Outer Ring Road (ORR) near EcoSpace, Bellandur, Bengaluru, Karnataka 560103',
    'Opposite EcoSpace Tech Park Underpass, Bellandur Lake corridor',
    'flood',
    5,
    '+91 98450 21988',
    'Pooja Krishnamurthy',
    'unit-bbmp-01'
),
(
    'RQ-8842',
    'Retaining Wall Embankment Collapse near Hebbal Flyover',
    'Heavy torrential downpour triggered retaining wall collapse and mudslide along service road embankment. Debris crushed perimeter garage with 2 individuals pinned beneath concrete slab.',
    13.035800,
    77.597000,
    'critical',
    'verified',
    CURRENT_TIMESTAMP - INTERVAL '30 minutes',
    'Bellary Road Service Lane near Hebbal Flyover, Bengaluru, Karnataka 560024',
    'North descent ramp of Hebbal Flyover toward Airport Corridor',
    'landslide',
    3,
    '+91 98801 34520',
    'Suresh Gowda',
    'unit-ndrf-02'
),
(
    'RQ-8843',
    'Heritage Tree Fall & Commercial Awning Collapse on 100ft Road',
    'Centuries-old heritage Gulmohar tree and commercial building facade collapsed across 100 Feet Road during monsoon squall. High-voltage power line snapped, trapping commuters and shop workers inside.',
    12.978400,
    77.640800,
    'high',
    'pending',
    CURRENT_TIMESTAMP - INTERVAL '18 minutes',
    '100 Feet Road, HAL 2nd Stage, Indiranagar, Bengaluru, Karnataka 560038',
    'Near CMH Road Metro Junction & 12th Main Corner',
    'collapse',
    6,
    '+91 97412 88419',
    'Ananya Nambiar',
    NULL
),
(
    'RQ-8844',
    'Monsoon Zero-Visibility Road Collision & Medical Trauma on MG Road',
    'Multi-vehicle monsoon collision amidst zero-visibility waterlogging. Driver sustained thoracic trauma and severe respiratory distress. Heavy gridlock blocking regular traffic.',
    12.974500,
    77.609500,
    'high',
    'pending',
    CURRENT_TIMESTAMP - INTERVAL '12 minutes',
    'MG Road near Brigade Road Junction, Bengaluru, Karnataka 560001',
    'Opposite Trinity Metro Station approach',
    'medical',
    2,
    '+91 99002 44771',
    'Vikramaditya Rao',
    NULL
),
(
    'RQ-8845',
    'Electrical Transformer Fire Hazard at Silk Board Junction',
    'Electrical distribution transformer sparked and caught fire following water ingress near commercial complex. Smoke spreading into upper floor offices.',
    12.917200,
    77.622800,
    'medium',
    'resolved',
    CURRENT_TIMESTAMP - INTERVAL '120 minutes',
    'Hosur Road near Central Silk Board Junction, Bengaluru, Karnataka 560068',
    'Silk Board Flyover Loop near BTM 1st Stage entry',
    'fire',
    3,
    '+91 94480 55123',
    'Kavitha Sundaram',
    'unit-kfes-03'
)
ON CONFLICT (id) DO UPDATE SET
    status = EXCLUDED.status,
    assigned_sar_unit_id = EXCLUDED.assigned_sar_unit_id,
    updated_at = CURRENT_TIMESTAMP;
