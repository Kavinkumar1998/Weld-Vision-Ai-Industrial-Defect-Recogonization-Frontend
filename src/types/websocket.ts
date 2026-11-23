import { WeldVerdict, DetectedDefect } from './detection';

export interface StreamFrameMessage {
  type: 'FRAME_RESULT';
  verdict: WeldVerdict;
  verdict_confidence: number;
  total_detections: number;
  defect_count: number;
  good_weld_count: number;
  latency_ms: number;
  fps: number;
  detections: DetectedDefect[];
  frame_timestamp?: number;
}
