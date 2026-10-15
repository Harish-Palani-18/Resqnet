import React from 'react';
import {
  ShieldAlert,
  MapPin,
  Route,
  Database,
  Waves,
  Mountain,
  Flame,
  HeartPulse,
  Phone,
  Code2,
  CheckCircle,
} from 'lucide-react';

export const AboutPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-12">
      {/* Brand & Mission Banner */}
      <div className="bg-slate-900 text-white rounded-3xl p-8 sm:p-12 text-center space-y-4 shadow-xl">
        <div className="w-16 h-16 rounded-2xl bg-red-600 flex items-center justify-center text-white mx-auto shadow-md shadow-red-900/40">
          <ShieldAlert className="w-9 h-9" />
        </div>
        <div className="space-y-1">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">RESQNET</h1>
          <p className="text-base sm:text-lg text-red-400 font-semibold uppercase tracking-wider">
            "Every Second Matters. Every Life Counts."
          </p>
        </div>
        <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto font-normal leading-relaxed">
          A smart, accessible disaster rescue and emergency response platform built to connect stranded citizens, response dispatchers, and field search & rescue units with real-time geographic coordination.
        </p>
      </div>

      {/* Architecture & Open Stack */}
      <section className="space-y-4">
        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
          System Architecture & Open-Source Stack
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
          <div className="p-5 bg-white border border-slate-200 rounded-xl space-y-2 shadow-xs">
            <div className="flex items-center gap-2 font-bold text-slate-900">
              <MapPin className="w-4 h-4 text-red-600" />
              <span>Interactive Maps via Leaflet & OpenStreetMap</span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              Completely independent of proprietary, paid map APIs. Uses standard OpenStreetMap raster tiles rendered via Leaflet.js with custom incident pin geometry and browser geolocation.
            </p>
          </div>

          <div className="p-5 bg-white border border-slate-200 rounded-xl space-y-2 shadow-xs">
            <div className="flex items-center gap-2 font-bold text-slate-900">
              <Route className="w-4 h-4 text-blue-600" />
              <span>Smart Road Routing with OSRM</span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              Integrates the Open Source Routing Machine (OSRM) to calculate accurate road-network distances, driving duration estimates, and turn-by-turn geometry between SAR stations and victims.
            </p>
          </div>

          <div className="p-5 bg-white border border-slate-200 rounded-xl space-y-2 shadow-xs">
            <div className="flex items-center gap-2 font-bold text-slate-900">
              <Database className="w-4 h-4 text-emerald-600" />
              <span>Multi-Agency Dispatch Data Schema</span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              Production-ready PostgreSQL / Supabase database architecture featuring dedicated tables for emergency requests, rescue units, team assignments, and chronological incident logs.
            </p>
          </div>

          <div className="p-5 bg-white border border-slate-200 rounded-xl space-y-2 shadow-xs">
            <div className="flex items-center gap-2 font-bold text-slate-900">
              <Code2 className="w-4 h-4 text-purple-600" />
              <span>Full-Stack Node.js & React</span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              Engineered with React 19, TypeScript, Tailwind CSS, Express backend proxy services, and mobile-first responsive controls optimized for low latency and high accessibility.
            </p>
          </div>
        </div>
      </section>

      {/* Immediate Disaster Safety Guidelines */}
      <section className="space-y-4">
        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
          Immediate Disaster Safety Guidelines
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Floods */}
          <div className="p-5 bg-white border border-slate-200 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-sm font-bold text-blue-900">
              <Waves className="w-5 h-5 text-blue-600" />
              <span>Floods & Rising Water</span>
            </div>
            <ul className="list-disc pl-5 text-xs text-slate-600 space-y-1">
              <li>Seek higher ground immediately. Do NOT enter attics unless there is an accessible roof exit.</li>
              <li>Never drive or walk into flooded roads: 6 inches of moving water can knock you down.</li>
              <li>Disconnect electricity and main gas if safe before evacuating.</li>
            </ul>
          </div>

          {/* Earthquakes */}
          <div className="p-5 bg-white border border-slate-200 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-sm font-bold text-amber-900">
              <Mountain className="w-5 h-5 text-amber-600" />
              <span>Earthquakes & Structural Collapse</span>
            </div>
            <ul className="list-disc pl-5 text-xs text-slate-600 space-y-1">
              <li><strong>DROP, COVER, AND HOLD ON:</strong> Get under a sturdy desk or interior wall.</li>
              <li>Stay away from glass windows, exterior walls, and heavy overhead lighting.</li>
              <li>If trapped, tap rhythmically on a metal pipe or wall so acoustic search sensors detect you.</li>
            </ul>
          </div>

          {/* Wildfires */}
          <div className="p-5 bg-white border border-slate-200 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-sm font-bold text-orange-900">
              <Flame className="w-5 h-5 text-orange-600" />
              <span>Fires & Wildfire Perimeter</span>
            </div>
            <ul className="list-disc pl-5 text-xs text-slate-600 space-y-1">
              <li>Crawl low under smoke where air is cleaner and cooler.</li>
              <li>Feel closed doors with back of hand before opening; if hot, do not open.</li>
              <li>Cover nose and mouth with damp cloth or certified particulate mask.</li>
            </ul>
          </div>

          {/* Landslides */}
          <div className="p-5 bg-white border border-slate-200 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-sm font-bold text-red-900">
              <HeartPulse className="w-5 h-5 text-red-600" />
              <span>Landslides & Debris Flow</span>
            </div>
            <ul className="list-disc pl-5 text-xs text-slate-600 space-y-1">
              <li>Listen for unusual sounds: cracking trees, rushing water, or sudden river muddying.</li>
              <li>Move quickly out of the path of debris or mudflow across the slope, not down the path.</li>
              <li>Curl into a tight ball and protect your head if escape is not possible.</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Verified Disclaimer Notice */}
      <section className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-xs text-slate-600 space-y-2">
        <h4 className="font-bold text-sm text-slate-900">Platform Demonstration Disclaimer</h4>
        <p className="leading-relaxed">
          RESQNET is built as an educational demonstration of rapid emergency coordination technology. It does not replace certified public safety answering points (PSAPs) or municipal 911/112 emergency services. In all real life-threatening events, contact your national and local emergency dispatch services directly.
        </p>
      </section>
    </div>
  );
};
