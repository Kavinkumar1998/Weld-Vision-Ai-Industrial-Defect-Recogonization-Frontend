import React, { useState, useEffect } from 'react';
import { RefreshCw, Trash2, Calendar, FileText, CheckCircle, AlertTriangle } from 'lucide-react';
import { fetchInspectionHistory, clearInspectionHistoryApi } from '../../services/api';
import { InspectionRecord } from '../../types/detection';
import { VerdictBadge } from './VerdictBadge';

export const HistoryTable: React.FC = () => {
  const [records, setRecords] = useState<InspectionRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [previewThumbnail, setPreviewThumbnail] = useState<string | null>(null);

  const loadHistory = async () => {
    setIsLoading(true);
    try {
      const data = await fetchInspectionHistory(50);
      setRecords(data.records || []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = async () => {
    if (window.confirm('Clear all inspection audit records?')) {
      await clearInspectionHistoryApi();
      setRecords([]);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div>
          <h2 className="text-base font-bold text-white">Inspection Audit History</h2>
          <p className="text-xs text-slate-400">Chronological ledger of single-image weld inspections</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadHistory}
            disabled={isLoading}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Refresh logs"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          {records.length > 0 && (
            <button
              onClick={handleClear}
              className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors"
              title="Clear history"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {records.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          <FileText className="w-12 h-12 mx-auto mb-2 opacity-30" />
          <p className="text-sm">No inspection records logged yet.</p>
          <p className="text-xs opacity-70 mt-1">Run an image inspection to populate the audit ledger.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Thumbnail</th>
                <th className="py-2.5 px-3">ID / Timestamp</th>
                <th className="py-2.5 px-3">Filename</th>
                <th className="py-2.5 px-3">Verdict</th>
                <th className="py-2.5 px-3">Confidence</th>
                <th className="py-2.5 px-3">Defects</th>
                <th className="py-2.5 px-3">Latency</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {records.map((rec) => (
                <tr key={rec.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-2 px-3">
                    {rec.thumbnail_b64 ? (
                      <img
                        src={rec.thumbnail_b64}
                        alt="thumbnail"
                        onClick={() => setPreviewThumbnail(rec.thumbnail_b64 || null)}
                        className="w-10 h-10 object-cover rounded-lg cursor-pointer border border-slate-700 hover:scale-110 transition-transform"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-slate-500 text-[10px]">
                        N/A
                      </div>
                    )}
                  </td>
                  <td className="py-2 px-3 text-slate-400 font-sans">
                    <div className="font-mono text-slate-200 text-xs">{rec.id}</div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                      <Calendar className="w-3 h-3" />
                      {new Date(rec.timestamp).toLocaleTimeString()}
                    </div>
                  </td>
                  <td className="py-2 px-3 font-sans text-slate-200 max-w-[160px] truncate" title={rec.filename}>
                    {rec.filename}
                  </td>
                  <td className="py-2 px-3 font-sans">
                    <VerdictBadge verdict={rec.verdict} confidence={0} size="sm" />
                  </td>
                  <td className="py-2 px-3">
                    {(rec.verdict_confidence * 100).toFixed(1)}%
                  </td>
                  <td className="py-2 px-3">
                    <span className={rec.defect_count > 0 ? 'text-rose-400 font-bold' : 'text-slate-400'}>
                      {rec.defect_count}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-slate-400">
                    {rec.latency_ms.toFixed(0)} ms
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal for previewing thumbnail */}
      {previewThumbnail && (
        <div
          onClick={() => setPreviewThumbnail(null)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer"
        >
          <div className="max-w-2xl max-h-[80vh] bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden p-2">
            <img
              src={previewThumbnail}
              alt="Expanded preview"
              className="max-h-[75vh] w-auto object-contain rounded-xl"
            />
          </div>
        </div>
      )}
    </div>
  );
};
