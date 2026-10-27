import type { ObsConfig, ObsConnectionStatus, ObsStreamStats } from '../types/obs.ts';

export const DEFAULT_OBS_CONFIG: ObsConfig = {
  enabled: false,
  host: 'localhost',
  port: 4455,
  password: '',
  autoConnect: false,
};

export const INITIAL_OBS_STATS: ObsStreamStats = {
  outputActive: false,
  outputReconnecting: false,
  outputTimecode: '00:00:00',
  outputDuration: 0,
  outputBytes: 0,
  outputSkippedFrames: 0,
  outputTotalFrames: 0,
  outputCongestion: 0,
  fps: 0,
  cpuUsage: 0,
  memoryUsage: 0,
  renderSkippedFrames: 0,
  renderTotalFrames: 0,
  isRecording: false,
  recordTimecode: '00:00:00',
  recordDuration: 0,
};

/**
 * Computes OBS WebSocket v5 challenge-response authentication.
 * Algorithm: base64(sha256(base64(sha256(password + salt)) + challenge))
 */
export async function computeObsAuth(password: string, salt: string, challenge: string): Promise<string> {
  const enc = new TextEncoder();
  const subtleCrypto = (typeof window !== 'undefined' && window.crypto?.subtle) 
    ? window.crypto.subtle 
    : (typeof globalThis !== 'undefined' && globalThis.crypto?.subtle)
    ? globalThis.crypto.subtle
    : null;

  if (!subtleCrypto) {
    throw new Error('Web Crypto API no está disponible en este entorno.');
  }

  // Step 1: sha256(password + salt) -> base64 string
  const hash1Buffer = await subtleCrypto.digest('SHA-256', enc.encode(password + salt));
  const hash1Bytes = new Uint8Array(hash1Buffer);
  let binary1 = '';
  for (let i = 0; i < hash1Bytes.byteLength; i++) {
    binary1 += String.fromCharCode(hash1Bytes[i]);
  }
  const secret = btoa(binary1);

  // Step 2: sha256(secret + challenge) -> base64 string
  const hash2Buffer = await subtleCrypto.digest('SHA-256', enc.encode(secret + challenge));
  const hash2Bytes = new Uint8Array(hash2Buffer);
  let binary2 = '';
  for (let i = 0; i < hash2Bytes.byteLength; i++) {
    binary2 += String.fromCharCode(hash2Bytes[i]);
  }
  return btoa(binary2);
}

/**
 * Formats milliseconds into HH:MM:SS timecode.
 */
export function formatObsTimecode(ms: number): string {
  if (!ms || ms <= 0) return '00:00:00';
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

/**
 * Formats byte counts into human-readable MB / GB.
 */
export function formatObsBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return '0 MB';
  const mb = bytes / (1024 * 1024);
  if (mb >= 1024) {
    return `${(mb / 1024).toFixed(2)} GB`;
  }
  return `${mb.toFixed(1)} MB`;
}

/**
 * Calculates dropped frames percentage.
 */
export function calculateObsDropRate(skipped: number, total: number): number {
  if (!total || total <= 0) return 0;
  return Number(((skipped / total) * 100).toFixed(2));
}

type StatusCallback = (status: ObsConnectionStatus, errorMsg?: string) => void;
type StatsCallback = (stats: ObsStreamStats) => void;

/**
 * OBS WebSocket v5 Client
 * Lightweight, zero-dependency browser client for OBS Studio 28+
 */
export class ObsWebSocketClient {
  private ws: WebSocket | null = null;
  private config: ObsConfig;
  private status: ObsConnectionStatus = 'disconnected';
  private stats: ObsStreamStats = { ...INITIAL_OBS_STATS };
  private statusListeners: Set<StatusCallback> = new Set();
  private statsListeners: Set<StatsCallback> = new Set();
  private pollInterval: ReturnType<typeof setInterval> | null = null;
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  private requestIdCounter = 1;
  private pendingRequests: Map<string, { resolve: (data: any) => void; reject: (err: any) => void }> = new Map();
  private isIntentionalDisconnect = false;

  constructor(config: ObsConfig) {
    this.config = config;
  }

  public updateConfig(newConfig: ObsConfig) {
    const shouldReconnect = this.isConnected() && (
      this.config.host !== newConfig.host || 
      this.config.port !== newConfig.port || 
      this.config.password !== newConfig.password
    );
    this.config = newConfig;
    if (shouldReconnect) {
      this.disconnect();
      this.connect();
    }
  }

  public getStatus(): ObsConnectionStatus {
    return this.status;
  }

  public getStats(): ObsStreamStats {
    return this.stats;
  }

  public isConnected(): boolean {
    return this.status === 'connected';
  }

  public onStatusChange(cb: StatusCallback): () => void {
    this.statusListeners.add(cb);
    cb(this.status);
    return () => this.statusListeners.delete(cb);
  }

  public onStatsUpdate(cb: StatsCallback): () => void {
    this.statsListeners.add(cb);
    cb(this.stats);
    return () => this.statsListeners.delete(cb);
  }

  private setStatus(newStatus: ObsConnectionStatus, errorMsg?: string) {
    this.status = newStatus;
    this.statusListeners.forEach((cb) => cb(newStatus, errorMsg));
  }

  private updateStats(partial: Partial<ObsStreamStats>) {
    this.stats = {
      ...this.stats,
      ...partial,
      lastUpdated: Date.now(),
    };
    this.statsListeners.forEach((cb) => cb(this.stats));
  }

  public connect(): void {
    if (this.ws && (this.ws.readyState === WebSocket.CONNECTING || this.ws.readyState === WebSocket.OPEN)) {
      return;
    }

    this.isIntentionalDisconnect = false;
    this.setStatus('connecting');

    const cleanHost = this.config.host ? this.config.host.trim().replace(/^wss?:\/\//, '') : 'localhost';
    const port = this.config.port || 4455;
    const wsUrl = `ws://${cleanHost}:${port}`;

    try {
      this.ws = new WebSocket(wsUrl);
    } catch (err: any) {
      this.setStatus('error', err?.message || 'Error al iniciar conexión WebSocket');
      return;
    }

    this.ws.onopen = () => {
      // Waiting for Hello (Op 0) from server
    };

    this.ws.onmessage = async (event: MessageEvent) => {
      try {
        const msg = JSON.parse(event.data);
        await this.handleMessage(msg);
      } catch (e) {
        console.error('Error al procesar mensaje de OBS:', e);
      }
    };

    this.ws.onerror = () => {
      this.setStatus('error', 'No se pudo conectar a OBS WebSocket en ' + wsUrl);
    };

    this.ws.onclose = (event: CloseEvent) => {
      this.stopPolling();
      this.ws = null;
      if (!this.isIntentionalDisconnect) {
        if (event.code === 4009) {
          this.setStatus('auth_failed', 'Contraseña de OBS WebSocket incorrecta.');
        } else {
          this.setStatus('disconnected', 'Conexión cerrada.');
        }
      } else {
        this.setStatus('disconnected');
      }
    };
  }

  public disconnect(): void {
    this.isIntentionalDisconnect = true;
    this.stopPolling();
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.setStatus('disconnected');
  }

  private async handleMessage(msg: { op: number; d: any }) {
    switch (msg.op) {
      case 0: // Hello
        await this.handleHello(msg.d);
        break;

      case 2: // Identified
        this.setStatus('connected');
        this.startPolling();
        await this.fetchInitialData();
        break;

      case 5: // Event
        this.handleEvent(msg.d);
        break;

      case 7: // RequestResponse
        this.handleRequestResponse(msg.d);
        break;

      default:
        break;
    }
  }

  private async handleHello(data: { obsWebSocketVersion: string; rpcVersion: number; authentication?: { challenge: string; salt: string } }) {
    let authString: string | undefined = undefined;

    if (data.authentication) {
      const password = this.config.password || '';
      if (!password) {
        this.setStatus('auth_failed', 'OBS requiere contraseña para identificarse.');
        this.disconnect();
        return;
      }
      try {
        authString = await computeObsAuth(password, data.authentication.salt, data.authentication.challenge);
      } catch (err: any) {
        this.setStatus('error', `Error al generar autenticación SHA-256: ${err?.message}`);
        this.disconnect();
        return;
      }
    }

    // Send Identify (Op 1)
    // Subscription flag: General (1) | Outputs (64) = 65
    this.send(1, {
      rpcVersion: 1,
      authentication: authString,
      eventSubscriptions: 65,
    });
  }

  private handleEvent(data: { eventType: string; eventData: any }) {
    const { eventType, eventData } = data;

    if (eventType === 'StreamStateChanged') {
      this.updateStats({
        outputActive: !!eventData.outputActive,
        outputReconnecting: !!eventData.outputState?.includes('RECONNECTING'),
      });
      // Fetch fresh stats immediately on state change
      this.fetchStreamStatus();
    } else if (eventType === 'RecordStateChanged') {
      this.updateStats({
        isRecording: !!eventData.outputActive,
      });
      this.fetchRecordStatus();
    }
  }

  private handleRequestResponse(data: { requestId: string; requestType: string; requestStatus: { result: boolean; code: number }; responseData?: any }) {
    const pending = this.pendingRequests.get(data.requestId);
    if (pending) {
      this.pendingRequests.delete(data.requestId);
      if (data.requestStatus.result) {
        pending.resolve(data.responseData);
      } else {
        pending.reject(new Error(`OBS request error: ${data.requestType} code ${data.requestStatus.code}`));
      }
    }
  }

  private send(op: number, d: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ op, d }));
    }
  }

  public call(requestType: string, requestData?: any): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.isConnected() && requestType !== 'Identify') {
        return reject(new Error('OBS no está conectado'));
      }
      const requestId = `req-${this.requestIdCounter++}`;
      this.pendingRequests.set(requestId, { resolve, reject });

      this.send(6, {
        requestType,
        requestId,
        requestData: requestData || {},
      });

      // Timeout request after 5000ms
      setTimeout(() => {
        if (this.pendingRequests.has(requestId)) {
          this.pendingRequests.delete(requestId);
          reject(new Error(`Timeout esperando respuesta de OBS (${requestType})`));
        }
      }, 5000);
    });
  }

  public async fetchStreamStatus(): Promise<void> {
    try {
      const data = await this.call('GetStreamStatus');
      if (data) {
        this.updateStats({
          outputActive: !!data.outputActive,
          outputReconnecting: !!data.outputReconnecting,
          outputTimecode: data.outputTimecode || formatObsTimecode(data.outputDuration || 0),
          outputDuration: data.outputDuration || 0,
          outputBytes: data.outputBytes || 0,
          outputSkippedFrames: data.outputSkippedFrames || 0,
          outputTotalFrames: data.outputTotalFrames || 0,
          outputCongestion: typeof data.outputCongestion === 'number' ? data.outputCongestion : 0,
        });
      }
    } catch {
      // Ignore background fetch errors
    }
  }

  public async fetchRecordStatus(): Promise<void> {
    try {
      const data = await this.call('GetRecordStatus');
      if (data) {
        this.updateStats({
          isRecording: !!data.outputActive,
          recordTimecode: data.outputTimecode || formatObsTimecode(data.outputDuration || 0),
          recordDuration: data.outputDuration || 0,
        });
      }
    } catch {
      // Ignore background fetch errors
    }
  }

  public async fetchGeneralStats(): Promise<void> {
    try {
      const data = await this.call('GetStats');
      if (data) {
        this.updateStats({
          fps: Math.round(data.activeFps || 0),
          cpuUsage: Number((data.cpuUsage || 0).toFixed(1)),
          memoryUsage: Math.round(data.memoryUsage || 0),
          renderSkippedFrames: data.renderSkippedFrames || 0,
          renderTotalFrames: data.renderTotalFrames || 0,
        });
      }
    } catch {
      // Ignore background fetch errors
    }
  }

  private async fetchInitialData() {
    await Promise.allSettled([
      this.fetchStreamStatus(),
      this.fetchRecordStatus(),
      this.fetchGeneralStats(),
    ]);
  }

  private startPolling() {
    this.stopPolling();
    this.pollInterval = setInterval(async () => {
      if (this.isConnected()) {
        await this.fetchStreamStatus();
        await this.fetchGeneralStats();
      }
    }, 1500);
  }

  private stopPolling() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
  }

  // Stream & Recording Controls
  public async toggleStream(): Promise<boolean> {
    const res = await this.call('ToggleStream');
    return !!res?.outputActive;
  }

  public async toggleRecord(): Promise<boolean> {
    const res = await this.call('ToggleRecord');
    return !!res?.outputActive;
  }

  public async startStream(): Promise<void> {
    await this.call('StartStream');
  }

  public async stopStream(): Promise<void> {
    await this.call('StopStream');
  }
}

// Global singleton instance for shared connection across components
let globalClient: ObsWebSocketClient | null = null;

export function getObsClient(config: ObsConfig): ObsWebSocketClient {
  if (!globalClient) {
    globalClient = new ObsWebSocketClient(config);
  } else {
    globalClient.updateConfig(config);
  }
  return globalClient;
}
