import React from 'react';
import { Activity, Cpu, ShieldCheck, Video, Image as ImageIcon, History } from 'lucide-react';
import { SystemHealth } from '../../types/detection';

interface HeaderProps {
  health: SystemHealth | null;
  activeTab: 'image' | 'webcam' | 'history';
  onTabChange: (tab: 'image' | 'webcam' | 'history') => void;
}

export const Header: React.FC<HeaderProps> = ({ health, activeTab, onTabChange }) => {
  return (
    <header className="bg-slate-900/90 border-b border-slate-800 backdrop-blur sticky top-0 z-50 px-6 py-3.5">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-white tracking-tight">WeldVision AI</h1>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                YOLOv8 Production
              </span>
            </div>
            <p className="text-xs text-slate-400">Automated Quality Inspection & Defect Classification</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1.5 bg-slate-950/70 p-1.5 rounded-xl border border-slate-800/80">
          <button
            onClick={() => onTabChange('image')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'image'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            Image Inspection
          </button>

          <button
            onClick={() => onTabChange('webcam')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'webcam'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Video className="w-4 h-4" />
            Live Stream (WS)
          </button>

          <button
            onClick={() => onTabChange('history')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'history'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <History className="w-4 h-4" />
            Audit History
          </button>
        </nav>

        {/* System Telemetry Badges */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700/60 text-xs text-slate-300">
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            <span>{health ? health.device : 'Detecting...'}</span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700/60 text-xs">
            <span className={`w-2 h-2 rounded-full ${health?.model_loaded ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`} />
            <span className={health?.model_loaded ? 'text-emerald-400 font-medium' : 'text-rose-400'}>
              {health?.model_loaded ? 'Engine Online' : 'Engine Offline'}
            </span>
          </div>
        </div>

      </div>
    </header>
  );
};
