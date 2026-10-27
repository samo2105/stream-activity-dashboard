import type { HealthRating, ServiceEndpoint, ServiceTestResult, StreamHealthSummary } from '../types/streamHealth';
import type { ViewerStats } from '../types/widget';

export const HEALTH_SERVICES: ServiceEndpoint[] = [
  {
    id: 'cloudflare',
    name: 'Red Global & CDN (Cloudflare)',
    category: 'cdn',
    url: 'https://1.1.1.1/cdn-cgi/trace',
    description: 'Verifica la estabilidad y velocidad general de salida a internet.',
  },
  {
    id: 'youtube',
    name: 'YouTube Ingest & Playback',
    category: 'youtube',
    url: 'https://www.youtube.com/generate_204',
    description: 'Comprueba la conexión con los centros de datos de YouTube y Google Edge.',
  },
  {
    id: 'twitch',
    name: 'Twitch Edge & Ingest CDN',
    category: 'twitch',
    url: 'https://static-cdn.jtvnw.net/emoticons/v2/25/default/light/1.0',
    description: 'Mide la latencia con la red perimetral y servidores de chat de Twitch.',
  },
  {
    id: 'kick',
    name: 'Kick Live Ingest & CDN',
    category: 'kick',
    url: 'https://kick.com/favicon.ico',
    description: 'Evalúa la conexión con la infraestructura de streaming de Kick.',
  },
  {
    id: 'streamlabs',
    name: 'Streamlabs Ingest & Widgets',
    category: 'streamlabs',
    url: 'https://cdn.streamlabs.com/static/imgs/streamlabs-logos/favicon/favicon.svg',
    description: 'Comprueba la respuesta con los servidores de eventos y alertas de Streamlabs.',
  },
];

/**
 * Pings a specific streaming service endpoint measuring real-world Round-Trip Time (RTT).
 */
export async function pingServiceEndpoint(
  service: ServiceEndpoint,
  timeoutMs: number = 4000
): Promise<ServiceTestResult> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  const cacheBuster = `_t=${Date.now()}_${Math.random().toString(36).substring(7)}`;
  const urlWithCacheBuster = service.url.includes('?') 
    ? `${service.url}&${cacheBuster}` 
    : `${service.url}?${cacheBuster}`;

  const startTime = typeof performance !== 'undefined' ? performance.now() : Date.now();

  try {
    // mode: 'no-cors' allows browser to measure TCP/TLS roundtrip to cross-origin endpoints without CORS errors
    const fetchOptions: RequestInit = {
      method: 'GET',
      mode: 'no-cors',
      cache: 'no-store',
      signal: controller.signal,
    };

    await fetch(urlWithCacheBuster, fetchOptions);
    clearTimeout(timeoutId);

    const endTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
    const latency = Math.max(1, Math.round(endTime - startTime));

    let status: HealthRating = 'good';
    if (latency < 70) {
      status = 'excellent';
    } else if (latency < 140) {
      status = 'good';
    } else if (latency < 250) {
      status = 'fair';
    } else {
      status = 'poor';
    }

    return {
      id: service.id,
      name: service.name,
      category: service.category,
      targetUrl: service.url,
      latencyMs: latency,
      status,
      success: true,
      timestamp: Date.now(),
    };
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    const isTimeout = err instanceof Error && (err.name === 'AbortError' || err.message.includes('abort'));
    const errorMessage = isTimeout ? `Tiempo de espera agotado (> ${timeoutMs}ms)` : 'Error de conexión o microcorte';

    return {
      id: service.id,
      name: service.name,
      category: service.category,
      targetUrl: service.url,
      latencyMs: timeoutMs,
      status: 'offline',
      success: false,
      error: errorMessage,
      timestamp: Date.now(),
    };
  }
}

/**
 * Calculates standard deviation / jitter across a series of latency numbers.
 */
export function calculateJitter(latencies: number[]): number {
  if (latencies.length < 2) return 0;
  const mean = latencies.reduce((sum, val) => sum + val, 0) / latencies.length;
  const variance = latencies.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / latencies.length;
  return Math.round(Math.sqrt(variance));
}

/**
 * Generates an actionable streamer diagnosis and recommendation based on network metrics.
 */
export function getStreamRecommendation(
  rating: HealthRating,
  avgLatency: number,
  jitter: number,
  lossPercent: number
): string {
  if (rating === 'offline') {
    return 'Sin conexión con los servicios de streaming. Revisa tu router o adaptador de red.';
  }
  if (rating === 'poor' || lossPercent > 20) {
    return `Conexión deficiente (${avgLatency} ms, ${lossPercent}% pérdidas). Alto riesgo de cuadros perdidos y cortes.`;
  }
  if (rating === 'fair' || jitter > 35) {
    return `Conexión fluctuante (Jitter ±${jitter} ms). Recomendado limitar a 720p60 o 4500 kbps para evitar lag.`;
  }
  if (rating === 'excellent') {
    return `Conexión excelente (${avgLatency} ms, Jitter ±${jitter} ms). Óptima para 1080p60 a 6000+ kbps sin pérdida de cuadros.`;
  }
  return `Conexión estable (${avgLatency} ms). Adecuada para streaming en directo estándar.`;
}

/**
 * Runs a complete diagnostic test across all streaming services.
 */
export async function runFullHealthDiagnostics(
  services: ServiceEndpoint[] = HEALTH_SERVICES
): Promise<StreamHealthSummary> {
  const results = await Promise.all(
    services.map((service) => pingServiceEndpoint(service))
  );

  const successfulResults = results.filter((r) => r.success);
  const total = results.length;
  const failedCount = total - successfulResults.length;
  const packetLossPercent = Math.round((failedCount / total) * 100);

  const latencies = successfulResults.map((r) => r.latencyMs);
  const avgLatency = latencies.length > 0
    ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length)
    : 999;
  const jitter = calculateJitter(latencies);

  let overallRating: HealthRating = 'good';
  if (failedCount === total) {
    overallRating = 'offline';
  } else if (failedCount > 1 || avgLatency > 250 || packetLossPercent >= 40) {
    overallRating = 'poor';
  } else if (failedCount > 0 || avgLatency > 140 || jitter > 35) {
    overallRating = 'fair';
  } else if (avgLatency < 75 && jitter < 20) {
    overallRating = 'excellent';
  } else {
    overallRating = 'good';
  }

  const recommendation = getStreamRecommendation(overallRating, avgLatency, jitter, packetLossPercent);

  return {
    overallRating,
    averageLatencyMs: avgLatency,
    jitterMs: jitter,
    packetLossPercent,
    lastChecked: Date.now(),
    services: results,
    recommendation,
  };
}

/**
 * Compares past and current viewer stats to detect unexpected stream disconnects/drops.
 */
export function detectStreamDrops(
  previousStats: ViewerStats | null,
  currentStats: ViewerStats
): string[] {
  if (!previousStats) return [];
  const alerts: string[] = [];

  if (previousStats.twitch.isLive && !currentStats.twitch.isLive && currentStats.twitch.channel) {
    alerts.push(`Twitch: La transmisión de ${currentStats.twitch.channel} se ha detenido o desconectado.`);
  }
  if (previousStats.kick.isLive && !currentStats.kick.isLive && currentStats.kick.channel) {
    alerts.push(`Kick: La transmisión de ${currentStats.kick.channel} se ha detenido o desconectado.`);
  }
  if (previousStats.youtube.isLive && !currentStats.youtube.isLive && currentStats.youtube.channel) {
    alerts.push(`YouTube: La transmisión en directo ha finalizado o se ha desconectado.`);
  }

  return alerts;
}
