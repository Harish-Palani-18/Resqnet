import React from 'react';
import { AlertTriangle, Phone } from 'lucide-react';

export const EmergencyBanner: React.FC = () => {
  return (
    <div className="bg-amber-500 text-slate-950 px-4 py-2 text-xs md:text-sm font-medium border-b border-amber-600/20">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-center sm:text-left">
          <AlertTriangle className="w-4 h-4 shrink-0 text-slate-950 font-bold" />
          <span>
            <strong>PROTOTYPE DEMONSTRATION ONLY:</strong> This platform is an educational emergency dispatch prototype and is <strong>not connected to official 911/112 emergency services</strong>.
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0 bg-amber-600/20 px-2.5 py-1 rounded-md text-xs font-bold">
          <Phone className="w-3.5 h-3.5" />
          <span>Real Emergency: Call 911 / 112 directly</span>
        </div>
      </div>
    </div>
  );
};
