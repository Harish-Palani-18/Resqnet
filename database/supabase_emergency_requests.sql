-- ====================================================================
-- RESQNET: Supabase Emergency Rescue Requests Table Schema
-- Ready to run directly in the Supabase SQL Editor
-- ====================================================================

-- 1. Enable pgcrypto / uuid-ossp for automatic UUID primary keys
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Create the emergency_requests table
CREATE TABLE IF NOT EXISTS public.emergency_requests (
    -- 1. Primary Key ID & Public Tracking Code
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_code VARCHAR(32) NOT NULL UNIQUE,

    -- 2. Disaster / Emergency Type
    disaster_type VARCHAR(64) NOT NULL CHECK (
        disaster_type IN (
            'Flood',
            'Medical Emergency',
            'Building Collapse',
            'Fire',
            'Landslide',
            'Trapped Person',
            'Earthquake',
            'Other'
        )
    ),

    -- 3. Urgency & Severity Level
    severity_level VARCHAR(32) NOT NULL CHECK (
        severity_level IN ('Critical', 'High Priority', 'Medium')
    ),

    -- 4. Precise Location Coordinates (GPS)
    latitude NUMERIC(10, 6) NOT NULL,
    longitude NUMERIC(10, 6) NOT NULL,

    -- 5. Address & Local Landmark
    street_address TEXT NOT NULL,
    landmark TEXT,

    -- 6. Contact Phone & Reporter Name
    contact_phone VARCHAR(32) NOT NULL,
    reporter_name VARCHAR(255) DEFAULT 'Anonymous Citizen',

    -- 7. Victims Requiring Rescue
    people_affected INT NOT NULL DEFAULT 1 CHECK (people_affected >= 1),

    -- 8. Situation Description & Optional Photo
    description TEXT NOT NULL,
    image_url TEXT,

    -- 9. Status & Chronological Timestamps
    status VARCHAR(32) NOT NULL DEFAULT 'Pending Verification' CHECK (
        status IN (
            'Pending Verification',
            'Verified',
            'Team Assigned',
            'Rescue In Progress',
            'Resolved',
            'Rejected as Invalid'
        )
    ),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ====================================================================
-- Performance Indexes (Geospatial, Status, and Code Lookups)
-- ====================================================================
CREATE INDEX IF NOT EXISTS idx_emergency_requests_code 
    ON public.emergency_requests (request_code);

CREATE INDEX IF NOT EXISTS idx_emergency_requests_status 
    ON public.emergency_requests (status);

CREATE INDEX IF NOT EXISTS idx_emergency_requests_severity 
    ON public.emergency_requests (severity_level);

CREATE INDEX IF NOT EXISTS idx_emergency_requests_coords 
    ON public.emergency_requests (latitude, longitude);

CREATE INDEX IF NOT EXISTS idx_emergency_requests_created_at 
    ON public.emergency_requests (created_at DESC);

-- ====================================================================
-- Automated Trigger to Keep 'updated_at' Synchronized
-- ====================================================================
CREATE OR REPLACE FUNCTION public.handle_emergency_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_emergency_requests_updated_at ON public.emergency_requests;
CREATE TRIGGER trigger_emergency_requests_updated_at
    BEFORE UPDATE ON public.emergency_requests
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_emergency_requests_updated_at();

-- ====================================================================
-- Supabase Row Level Security (RLS) Configuration
-- ====================================================================
ALTER TABLE public.emergency_requests ENABLE ROW LEVEL SECURITY;

-- Allow ANY citizen to submit an emergency request without logging in
CREATE POLICY "Allow public emergency submissions" 
    ON public.emergency_requests
    FOR INSERT 
    TO anon, authenticated
    WITH CHECK (true);

-- Allow public citizens to track requests by Request Code or ID
CREATE POLICY "Allow public status tracking" 
    ON public.emergency_requests
    FOR SELECT 
    TO anon, authenticated
    USING (true);

-- Allow authenticated dispatch operators to update triage and status
CREATE POLICY "Allow authenticated dispatch operators to update status" 
    ON public.emergency_requests
    FOR UPDATE 
    TO authenticated
    USING (true)
    WITH CHECK (true);
