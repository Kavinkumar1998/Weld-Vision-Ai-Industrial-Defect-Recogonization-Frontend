import React from 'react';
import { Clock, AlertOctagon, CheckCircle, Target, Layers } from 'lucide-react';
import { DetectedDefect } from '../../types/detection';

interface MetricsPanelProps {
  latencyMs: number;
  defectCount: number;
  goodCount: number;
  totalDetections: number;
  detections: DetectedDefect[];
  fps?: number;
}

export const MetricsPanel: React.FC<MetricsPanelProps> = ({
  latencyMs,
  defectCount,
  goodCount,
  totalDetections,
  detections,
  fps
}) => {
  return (
    <div className="space-y-4">
      {/* 4 Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-xl">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium">Inference Latency</span>
            <Clock className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <div className="text-xl font-bold font-mono text-white">
            {latencyMs.toFixed(1)} <span className="text-xs font-normal text-slate-400">ms</span>
          </div>
          {fps !== undefined && (
            <div className="text-[11px] text-slate-500 mt-0.5">Stream FPS: {fps.toFixed(1)}</div>
          )}
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-xl">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium">Defects Found</span>
            <AlertOctagon className="w-3.5 h-3.5 text-rose-400" />
          </div>
          <div className={`text-xl font-bold font-mono ${defectCount > 0 ? 'text-rose-400' : 'text-slate-200'}`}>
            {defectCount}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Class 0 & 2</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-xl">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium">Good Welds</span>
            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-xl font-bold font-mono text-emerald-400">
            {goodCount}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Class 1 (Standard)</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-xl">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium">Total Bounding Boxes</span>
            <Target className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-xl font-bold font-mono text-white">
            {totalDetections}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Filtered by conf</div>
        </div>
      </div>

      {/* Detections List */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
            <Layers className="w-4 h-4 text-blue-400" />
            Detected Regions & Coordinates
          </div>
          <span className="text-xs text-slate-400">{detections.length} entities</span>
        </div>

        {detections.length === 0 ? (
          <div className="text-center py-6 text-xs text-slate-500">
            No weld features detected above the confidence threshold.
          </div>
        ) : (
          <div className="overflow-x-auto max-h-56 overflow-y-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-2 px-3">Class</th>
                  <th className="py-2 px-3">Confidence</th>
                  <th className="py-2 px-3">Type</th>
                  <th className="py-2 px-3 font-mono">Box [X1, Y1, X2, Y2]</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {detections.map((det) => (
                  <tr key={det.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-2 px-3 font-semibold text-slate-100 flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-sm"
                        style={{ backgroundColor: det.color_hex }}
                      />
                      {det.class_name}
                    </td>
                    <td className="py-2 px-3">
                      {(det.confidence * 100).toFixed(1)}%
                    </td>
                    <td className="py-2 px-3 font-sans">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          det.is_defective
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        }`}
                      >
                        {det.is_defective ? 'DEFECT' : 'PASSED'}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-slate-400 text-[11px]">
                      [{Math.round(det.box.x_min)}, {Math.round(det.box.y_min)}, {Math.round(det.box.x_max)}, {Math.round(det.box.y_max)}]
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
