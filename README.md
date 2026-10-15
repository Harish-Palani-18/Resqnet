# RESQNET — Smart Disaster Rescue and Emergency Response Platform

> **"Every Second Matters. Every Life Counts."**

RESQNET is a complete, modern, responsive disaster rescue web platform that connects citizens stranded during floods, earthquakes, landslides, fires, and other crises with authorized emergency response dispatchers and field search-and-rescue (SAR) units.

---

## 🌟 Key Features

1. **Emergency Rescue Request Form**:
   - Zero login friction for high-stress situations.
   - Browser Geolocation API ("Use My Current Location") with permission handling and fallback.
   - Interactive Leaflet.js / OpenStreetMap map location picker (click or drag pin).
   - Reverse geocoding via OpenStreetMap Nominatim.
   - Unique tracking Request ID (e.g., `RQ-8841`) generated upon submission.
   - Initial status: *Pending Verification*.

2. **Interactive Live Map**:
   - Leaflet.js with standard OpenStreetMap raster tiles (zero paid API keys required).
   - Real-time incident markers color-coded by severity:
     - 🔴 **Red**: Critical / Immediate Peril
     - 🟠 **Orange**: High Priority
     - 🟡 **Amber**: Medium Priority
     - 🟢 **Green**: Resolved Incident
     - 🔵 **Blue**: Deployed SAR Units
   - Detailed interactive popups with victim info and route options.
   - Filter by disaster type, severity, and toggle teams / resolved incidents.

3. **Smart Rescue Route Optimization**:
   - Proxies OSRM (Open Source Routing Machine) public engine to compute realistic driving corridors on road networks.
   - Displays estimated road distance (km) and estimated travel time (min).
   - Includes critical disaster disclaimer: road routing does not account for live flood inundation or collapsed bridges without real-time telemetry.
   - Provides "Open Navigation" external link for turn-by-turn navigation in Google Maps or OpenStreetMap.

4. **Rescue Dispatcher Command Center**:
   - Restricted operator mode with a clear 1-click **Demo Dispatcher Authentication** toggle for hackathon evaluations.
   - Live KPI metrics strip: Total Requests, Critical Alerts, Pending Verification, In Progress / Active SAR, and Resolved.
   - High-density searchable and filterable incident table.
   - Smart SAR team assignment ranking (considers proximity, readiness, vehicle type, and emergency specialty).
   - Status transitions (*Verify Request*, *Mark In Progress*, *Mark Resolved*, *Reject as Invalid* with confirmation modals).

5. **Citizen Request Tracking**:
   - Victims and family members can enter their Request Code (`RQ-XXXX`) to track live verification and dispatch status.
   - Chronological status timeline and dispatcher updates without compromising other victims' private details.

---

## 🛠️ Technology Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Lucide Icons, Leaflet.js
- **Backend**: Node.js, Express, TypeScript (`server.ts`)
- **Mapping & Routing**: OpenStreetMap tiles, Leaflet, OSRM road routing engine, Nominatim reverse geocoder
- **Database Schema**: PostgreSQL / Supabase schema (`database/schema.sql`)

---

## 🚀 Development & Build Commands

```bash
# Install dependencies
npm install

# Start development server (Full-stack Express + Vite)
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Typecheck / Lint
npm run lint
```

---

## 🗄️ Database Schema

The database schema is provided in `database/schema.sql` covering:
- `emergency_requests`: Incident reports, GPS coordinates, severity, and victim counts.
- `rescue_teams`: Deployed SAR units, equipment capabilities, and base coordinates.
- `rescue_assignments`: Incident-to-team assignments with timestamps.
- `incident_updates`: Chronological dispatch logs and audit trails.

---

## ⚠️ Emergency Notice

*RESQNET is an educational prototype and demonstration platform. It is not directly linked to official municipal 911/112 emergency services. In a real life-threatening emergency, call local emergency numbers directly.*
