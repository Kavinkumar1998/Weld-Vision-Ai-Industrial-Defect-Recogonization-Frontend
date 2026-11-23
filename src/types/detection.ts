export type WeldVerdict = 'GOOD' | 'DEFECTIVE' | 'NO_WELD_DETECTED' | 'UNKNOWN';

export interface BoundingBox {
  x_min: number;
  y_min: number;
  x_max: number;
  y_max: number;
}

export interface DetectedDefect {
  id: string;
  class_id: number;
  class_name: string;
  confidence: number;
  box: BoundingBox;
  is_defective: boolean;
  color_hex: string;
}

export interface ImageDetectionResponse {
  success: boolean;
  verdict: WeldVerdict;
  verdict_confidence: number;
  total_detections: number;
  defect_count: number;
  good_weld_count: number;
  processing_time_ms: number;
  detections: DetectedDefect[];
  annotated_image_base64?: string;
  image_width: number;
  image_height: number;
  timestamp: string;
}

export interface InspectionRecord {
  id: string;
  timestamp: string;
  filename: string;
  verdict: WeldVerdict;
  verdict_confidence: number;
  total_detections: number;
  defect_count: number;
  good_weld_count: number;
  latency_ms: number;
  thumbnail_b64?: string;
}

export interface SystemHealth {
  status: string;
  service: string;
  version: string;
  uptime_seconds: number;
  model_loaded: boolean;
  device: string;
  cuda_available: boolean;
  classes: Record<string, string>;
}
