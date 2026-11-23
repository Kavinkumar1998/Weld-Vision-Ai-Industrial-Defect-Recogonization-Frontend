import React, { useState, useEffect } from 'react';
import { Header } from './components/layout/Header';
import { ImageUploader } from './components/detection/ImageUploader';
import { LiveWebcam } from './components/detection/LiveWebcam';
import { HistoryTable } from './components/detection/HistoryTable';
import { checkSystemHealth } from './services/api';
import { SystemHealth } from './types/detection';
import { AlertCircle } from 'lucide-react';

export function App() {
  const [activeTab, setActiveTab] = useState<'image' | 'webcam' | 'history'>('image');
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const pollHealth = async () => {
    try {
      const data = await checkSystemHealth();
      setHealth(data);
      setConnectionError(null);
    } catch (err: any) {
      setConnectionError('Unable to connect to FastAPI backend at https://weld-vision-ai-industrial-defect.onrender.com');
    }
  };

  useEffect(() => {
    pollHealth();
    const interval = setInterval(pollHealth, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col">
      {/* Header */}
      <Header
        health={health}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Backend Connection Warning Banner */}
      {connectionError && (
        <div className="bg-rose-500/15 border-b border-rose-500/30 text-rose-300 px-6 py-2.5 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2 max-w-7xl mx-auto w-full">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>
              <strong>Backend Disconnected:</strong> {connectionError}. Make sure the FastAPI backend is running via <code className="bg-rose-950/60 px-1.5 py-0.5 rounded text-rose-200">python -m uvicorn backend.app.main:app --reload</code>.
            </span>
          </div>
        </div>
      )}

      {/* Main View Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6">
        {activeTab === 'image' && <ImageUploader />}
        {activeTab === 'webcam' && <LiveWebcam />}
        {activeTab === 'history' && <HistoryTable />}
      </main>

      {/* Industrial Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/60 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>WeldVision AI — High-Speed Automated Weld Quality Assurance</span>
          <span>Ultralytics YOLOv8 • FastAPI Asynchronous Engine • Vite React</span>
        </div>
      </footer>
    </div>
  );
}

export default App;
