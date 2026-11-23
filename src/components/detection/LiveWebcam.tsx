import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Camera, CameraOff, Volume2, VolumeX, Activity, Sliders } from 'lucide-react';
import { getStreamWebSocketUrl } from '../../services/api';
import { StreamFrameMessage } from '../../types/websocket';
import { VerdictBadge } from './VerdictBadge';
import { MetricsPanel } from './MetricsPanel';

export const LiveWebcam: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const captureCanvasRef = useRef<HTMLCanvasElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const streamIntervalRef = useRef<number | null>(null);

  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [audioAlert, setAudioAlert] = useState<boolean>(true);
  const [confidence, setConfidence] = useState<number>(0.40);
  const [iou, setIou] = useState<number>(0.45);
  const [targetFps, setTargetFps] = useState<number>(15);
  const [latestFrame, setLatestFrame] = useState<StreamFrameMessage | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Play alert beep for defect
  const playAlertSound = useCallback(() => {
    if (!audioAlert) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(440, audioCtx.currentTime); // 440 Hz
      gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.25);
    } catch {
      // AudioContext might be blocked until user gesture
    }
  }, [audioAlert]);

  // Connect WebSocket
  const startStream = async () => {
    setError(null);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'environment' },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();
      }

      const wsUrl = getStreamWebSocketUrl();
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsStreaming(true);
        // Send initial config
        ws.send(JSON.stringify({ event: 'CONFIG', confidence, iou }));

        // Start frame capture loop
        const intervalMs = Math.round(1000 / targetFps);
        streamIntervalRef.current = window.setInterval(captureAndSendFrame, intervalMs);
      };

      ws.onmessage = (event) => {
        try {
          const data: StreamFrameMessage = JSON.parse(event.data);
          if (data.type === 'FRAME_RESULT') {
            setLatestFrame(data);
            drawOverlay(data);
            if (data.verdict === 'DEFECTIVE') {
              playAlertSound();
            }
          }
        } catch (e) {
          console.error('Failed to parse frame message', e);
        }
      };

      ws.onerror = (e) => {
        console.error('WebSocket error', e);
        setError('WebSocket stream connection error. Ensure backend is running.');
      };

      ws.onclose = () => {
        stopStream();
      };
    } catch (err: any) {
      setError(err.message || 'Failed to access camera.');
      stopStream();
    }
  };

  const stopStream = () => {
    if (streamIntervalRef.current) {
      clearInterval(streamIntervalRef.current);
      streamIntervalRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }

    // Clear overlay
    if (overlayCanvasRef.current) {
      const ctx = overlayCanvasRef.current.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, overlayCanvasRef.current.width, overlayCanvasRef.current.height);
    }

    setIsStreaming(false);
  };

  const captureAndSendFrame = () => {
    if (!videoRef.current || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

    const video = videoRef.current;
    if (video.videoWidth === 0 || video.videoHeight === 0) return;

    const canvas = captureCanvasRef.current || document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert to JPEG blob and send as binary for minimal overhead
    canvas.toBlob(
      (blob) => {
        if (blob && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          blob.arrayBuffer().then((buf) => {
            if (wsRef.current?.readyState === WebSocket.OPEN) {
              wsRef.current.send(buf);
            }
          });
        }
      },
      'image/jpeg',
      0.80
    );
  };

  const drawOverlay = (result: StreamFrameMessage) => {
    const canvas = overlayCanvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    canvas.width = video.clientWidth;
    canvas.height = video.clientHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const scaleX = canvas.width / (video.videoWidth || 640);
    const scaleY = canvas.height / (video.videoHeight || 480);

    result.detections.forEach((det) => {
      const x1 = det.box.x_min * scaleX;
      const y1 = det.box.y_min * scaleY;
      const w = (det.box.x_max - det.box.x_min) * scaleX;
      const h = (det.box.y_max - det.box.y_min) * scaleY;

      const color = det.is_defective ? '#EF4444' : '#10B981';

      // Draw bounding box
      ctx.lineWidth = 3;
      ctx.strokeStyle = color;
      ctx.strokeRect(x1, y1, w, h);

      // Label background
      const label = `${det.class_name} ${(det.confidence * 100).toFixed(0)}%`;
      ctx.font = 'bold 12px sans-serif';
      const textWidth = ctx.measureText(label).width;

      ctx.fillStyle = color;
      ctx.fillRect(x1, Math.max(0, y1 - 20), textWidth + 10, 20);

      // Label text
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(label, x1 + 5, Math.max(14, y1 - 5));
    });
  };

  useEffect(() => {
    return () => {
      stopStream();
    };
  }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      {/* Video & Canvas Column (8 Cols) */}
      <div className="lg:col-span-8 space-y-4">
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4">
          
          {/* Top Status */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Live Video Feed
              </span>
              {latestFrame && isStreaming && (
                <VerdictBadge
                  verdict={latestFrame.verdict}
                  confidence={latestFrame.verdict_confidence}
                  size="sm"
                />
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setAudioAlert(!audioAlert)}
                className={`p-2 rounded-lg border text-xs flex items-center gap-1.5 transition-colors ${
                  audioAlert
                    ? 'bg-blue-500/10 border-blue-500/30 text-blue-400'
                    : 'bg-slate-800 border-slate-700 text-slate-500'
                }`}
                title="Toggle Defect Sound Alert"
              >
                {audioAlert ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                <span className="hidden sm:inline">Defect Audio</span>
              </button>

              <button
                onClick={isStreaming ? stopStream : startStream}
                className={`px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 shadow-lg transition-all ${
                  isStreaming
                    ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
                }`}
              >
                {isStreaming ? (
                  <>
                    <CameraOff className="w-4 h-4" />
                    Stop Stream
                  </>
                ) : (
                  <>
                    <Camera className="w-4 h-4" />
                    Start Camera
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Viewport: Video + Hardware Overlay Canvas */}
          <div className="relative bg-black rounded-xl overflow-hidden aspect-[4/3] flex items-center justify-center border border-slate-800">
            <video
              ref={videoRef}
              playsInline
              muted
              className={`w-full h-full object-contain ${!isStreaming ? 'hidden' : ''}`}
            />
            
            <canvas
              ref={overlayCanvasRef}
              className={`absolute inset-0 pointer-events-none w-full h-full object-contain ${
                !isStreaming ? 'hidden' : ''
              }`}
            />

            {!isStreaming && (
              <div className="text-center p-8 text-slate-500">
                <Camera className="w-16 h-16 mx-auto mb-3 opacity-30" />
                <p className="text-sm font-medium text-slate-300">Camera Inactive</p>
                <p className="text-xs text-slate-500 mt-1">
                  Click 'Start Camera' to initiate low-latency WebSocket inference
                </p>
              </div>
            )}

            {/* Hidden canvas for extraction */}
            <canvas ref={captureCanvasRef} className="hidden" />
          </div>

          {error && (
            <div className="mt-3 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-400">
              {error}
            </div>
          )}
        </div>
      </div>

      {/* Control & Live Telemetry Column (4 Cols) */}
      <div className="lg:col-span-4 space-y-4">
        
        {/* Stream Settings */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-200 border-b border-slate-800 pb-3">
            <Sliders className="w-4 h-4 text-blue-400" />
            Stream Configuration
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-slate-400">Confidence Threshold</span>
              <span className="font-mono font-bold text-blue-400">{(confidence * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0.10"
              max="0.95"
              step="0.05"
              value={confidence}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                setConfidence(val);
                if (wsRef.current?.readyState === WebSocket.OPEN) {
                  wsRef.current.send(JSON.stringify({ event: 'CONFIG', confidence: val, iou }));
                }
              }}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-slate-400">Target Transmission FPS</span>
              <span className="font-mono font-bold text-blue-400">{targetFps} FPS</span>
            </div>
            <input
              type="range"
              min="5"
              max="25"
              step="1"
              value={targetFps}
              onChange={(e) => setTargetFps(parseInt(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
          </div>
        </div>

        {/* Live Metrics */}
        {latestFrame ? (
          <MetricsPanel
            latencyMs={latestFrame.latency_ms}
            defectCount={latestFrame.defect_count}
            goodCount={latestFrame.good_weld_count}
            totalDetections={latestFrame.total_detections}
            detections={latestFrame.detections}
            fps={latestFrame.fps}
          />
        ) : (
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 text-center text-xs text-slate-500">
            <Activity className="w-8 h-8 mx-auto mb-2 opacity-30 animate-pulse text-blue-400" />
            Awaiting active video feed frames...
          </div>
        )}

      </div>

    </div>
  );
};
