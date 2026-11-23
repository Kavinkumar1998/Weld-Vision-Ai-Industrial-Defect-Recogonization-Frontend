import { ImageDetectionResponse, SystemHealth, InspectionRecord } from '../types/detection';

const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

export async function checkSystemHealth(): Promise<SystemHealth> {
  const res = await fetch(`${API_BASE}/api/v1/health`);
  if (!res.ok) {
    throw new Error(`Health check failed: ${res.statusText}`);
  }
  return res.json();
}

export async function detectImageApi(
  file: File,
  confidence: number = 0.40,
  iou: number = 0.45,
  returnAnnotated: boolean = true
): Promise<ImageDetectionResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const query = new URLSearchParams({
    confidence: confidence.toString(),
    iou_threshold: iou.toString(),
    return_annotated_image: returnAnnotated.toString(),
  });

  const res = await fetch(`${API_BASE}/api/v1/detect/image?${query.toString()}`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    let errorDetail = 'Inference failed';
    try {
      const errJson = await res.json();
      errorDetail = errJson.detail || errorDetail;
    } catch {
      errorDetail = await res.text();
    }
    throw new Error(errorDetail);
  }

  return res.json();
}

export async function fetchInspectionHistory(limit: number = 30): Promise<{ records: InspectionRecord[] }> {
  const res = await fetch(`${API_BASE}/api/v1/history?limit=${limit}`);
  if (!res.ok) {
    throw new Error('Failed to fetch history');
  }
  return res.json();
}

export async function clearInspectionHistoryApi(): Promise<void> {
  await fetch(`${API_BASE}/api/v1/history`, { method: 'DELETE' });
}

export function getStreamWebSocketUrl(): string {
  const wsBase = API_BASE.replace(/^http/, 'ws');
  return `${wsBase}/api/v1/detect/stream`;
}
