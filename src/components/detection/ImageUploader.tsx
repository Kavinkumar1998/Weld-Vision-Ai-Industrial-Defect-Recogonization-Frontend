import React, { useState, useRef } from 'react';
import { UploadCloud, Sliders, RefreshCw, Download, Image as ImageIcon, Sparkles } from 'lucide-react';
import { detectImageApi } from '../../services/api';
import { ImageDetectionResponse } from '../../types/detection';
import { VerdictBadge } from './VerdictBadge';
import { MetricsPanel } from './MetricsPanel';

export const ImageUploader: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [confidence, setConfidence] = useState<number>(0.40);
  const [iou, setIou] = useState<number>(0.45);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [result, setResult] = useState<ImageDetectionResponse | null>(null);
  const [viewMode, setViewMode] = useState<'annotated' | 'original'>('annotated');
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (JPEG, PNG, WebP).');
      return;
    }
    setError(null);
    setSelectedFile(file);
    setResult(null);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleRunInference = async () => {
    if (!selectedFile) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await detectImageApi(selectedFile, confidence, iou, true);
      setResult(response);
      setViewMode('annotated');
    } catch (err: any) {
      setError(err.message || 'Inspection failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      {/* Left Column: Image Dropzone & Controls (5 Cols) */}
      <div className="lg:col-span-5 space-y-5">
        
        {/* Upload Zone */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-slate-700 hover:border-blue-500/60 bg-slate-900/60 hover:bg-slate-900 transition-all rounded-2xl p-6 text-center cursor-pointer group relative overflow-hidden"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
          />

          <div className="flex flex-col items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 group-hover:scale-110 group-hover:bg-blue-500/20 transition-all flex items-center justify-center">
              <UploadCloud className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-200">
                {selectedFile ? selectedFile.name : 'Click or drag weld image here'}
              </p>
              <p className="text-xs text-slate-500 mt-1">Supports JPEG, PNG, WebP (Max 15MB)</p>
            </div>
          </div>
        </div>

        {/* Inference Controls */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
              <Sliders className="w-4 h-4 text-blue-400" />
              Inference Parameters
            </div>
            <button
              onClick={() => { setConfidence(0.40); setIou(0.45); }}
              className="text-xs text-slate-500 hover:text-slate-300 flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" /> Reset
            </button>
          </div>

          {/* Confidence Slider */}
          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-slate-400">Confidence Threshold</span>
              <span className="font-mono font-bold text-blue-400">{(confidence * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0.05"
              max="1.0"
              step="0.05"
              value={confidence}
              onChange={(e) => setConfidence(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
          </div>

          {/* IoU Threshold Slider */}
          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-slate-400">IoU Threshold (NMS)</span>
              <span className="font-mono font-bold text-blue-400">{(iou * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0.10"
              max="0.90"
              step="0.05"
              value={iou}
              onChange={(e) => setIou(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
          </div>

          {/* Run Button */}
          <button
            onClick={handleRunInference}
            disabled={!selectedFile || isLoading}
            className={`w-full py-3 px-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 shadow-lg transition-all ${
              !selectedFile || isLoading
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30'
            }`}
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Analyzing Weld Features...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Run AI Inspection
              </>
            )}
          </button>

          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-400">
              {error}
            </div>
          )}
        </div>

      </div>

      {/* Right Column: Visualizer & Results (7 Cols) */}
      <div className="lg:col-span-7 space-y-5">
        
        {/* Visualizer Card */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 min-h-[420px] flex flex-col justify-between">
          
          {/* Visualizer Top Bar */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-3">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Visual Inspection View
              </span>
              {result && (
                <VerdictBadge
                  verdict={result.verdict}
                  confidence={result.verdict_confidence}
                  size="sm"
                />
              )}
            </div>

            {result?.annotated_image_base64 && (
              <div className="flex items-center gap-2">
                <div className="bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs flex">
                  <button
                    onClick={() => setViewMode('annotated')}
                    className={`px-2.5 py-1 rounded-md transition-all ${
                      viewMode === 'annotated' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Annotated
                  </button>
                  <button
                    onClick={() => setViewMode('original')}
                    className={`px-2.5 py-1 rounded-md transition-all ${
                      viewMode === 'original' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Original
                  </button>
                </div>

                <a
                  href={result.annotated_image_base64}
                  download="annotated_weld.jpg"
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                  title="Download Annotated Image"
                >
                  <Download className="w-4 h-4" />
                </a>
              </div>
            )}
          </div>

          {/* Center Image Display */}
          <div className="flex-1 flex items-center justify-center bg-slate-950/70 rounded-xl overflow-hidden border border-slate-800/60 p-2 min-h-[300px]">
            {result?.annotated_image_base64 && viewMode === 'annotated' ? (
              <img
                src={result.annotated_image_base64}
                alt="Weld Detection"
                className="max-h-[460px] w-auto max-w-full object-contain rounded-lg shadow-xl"
              />
            ) : previewUrl ? (
              <img
                src={previewUrl}
                alt="Original Weld"
                className="max-h-[460px] w-auto max-w-full object-contain rounded-lg shadow-xl"
              />
            ) : (
              <div className="text-center p-8 text-slate-500">
                <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p className="text-sm font-medium">No image loaded</p>
                <p className="text-xs opacity-70 mt-1">Upload an image on the left to start detection</p>
              </div>
            )}
          </div>

          {/* Bottom Bar Details */}
          {result && (
            <div className="mt-4">
              <MetricsPanel
                latencyMs={result.processing_time_ms}
                defectCount={result.defect_count}
                goodCount={result.good_weld_count}
                totalDetections={result.total_detections}
                detections={result.detections}
              />
            </div>
          )}

        </div>

      </div>

    </div>
  );
};
