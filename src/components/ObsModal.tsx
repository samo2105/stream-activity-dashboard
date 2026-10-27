import React, { useState, useEffect } from 'react';
import { 
  X, 
  Tv2, 
  Radio, 
  Disc, 
  Cpu, 
  Gauge, 
  AlertTriangle, 
  CheckCircle2, 
  HelpCircle, 
  Eye, 
  EyeOff, 
  Play, 
  Square, 
  RefreshCw,
  Power
} from 'lucide-react';
import type { ObsConfig, ObsConnectionStatus, ObsStreamStats } from '../types/obs';
import { formatObsBytes, calculateObsDropRate } from '../utils/obsWebSocket';

interface ObsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: ObsConfig;
  status: ObsConnectionStatus;
  stats: ObsStreamStats;
  errorMessage?: string;
  onConnect: () => void;
  onDisconnect: () => void;
  onSaveConfig: (newConfig: ObsConfig) => void;
  onToggleStream: () => Promise<void>;
  onToggleRecord: () => Promise<void>;
}

export const ObsModal: React.FC<ObsModalProps> = ({
  isOpen,
  onClose,
  config,
  status,
  stats,
  errorMessage,
  onConnect,
  onDisconnect,
  onSaveConfig,
  onToggleStream,
  onToggleRecord,
}) => {
  const [host, setHost] = useState<string>(config.host || 'localhost');
  const [port, setPort] = useState<number>(config.port || 4455);
  const [password, setPassword] = useState<string>(config.password || '');
  const [autoConnect, setAutoConnect] = useState<boolean>(config.autoConnect || false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isActionLoading, setIsActionLoading] = useState<boolean>(false);

  useEffect(() => {
    setHost(config.host || 'localhost');
    setPort(config.port || 4455);
    setPassword(config.password || '');
    setAutoConnect(config.autoConnect || false);
  }, [config]);

  if (!isOpen) return null;

  const isConnected = status === 'connected';
  const isConnecting = status === 'connecting';
  const dropRate = calculateObsDropRate(stats.outputSkippedFrames, stats.outputTotalFrames);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const newConfig: ObsConfig = {
      enabled: true,
      host: host.trim() || 'localhost',
      port: Number(port) || 4455,
      password,
      autoConnect,
    };
    onSaveConfig(newConfig);
  };

  const handleToggleStreamClick = async () => {
    setIsActionLoading(true);
    try {
      await onToggleStream();
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleToggleRecordClick = async () => {
    setIsActionLoading(true);
    try {
      await onToggleRecord();
    } finally {
      setIsActionLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-950/70">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl border ${
              isConnected 
                ? 'bg-purple-600/20 border-purple-500/40 text-purple-400' 
                : 'bg-zinc-800/60 border-zinc-700/60 text-zinc-400'
            }`}>
              <Tv2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">Conexión OBS Studio</h2>
                {isConnected ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/20 border border-emerald-500/40 text-emerald-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Conectado (ws://{config.host || 'localhost'}:{config.port || 4455})
                  </span>
                ) : isConnecting ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/20 border border-amber-500/40 text-amber-400">
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    Conectando...
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-zinc-800 text-zinc-400 border border-zinc-700">
                    <Power className="w-3 h-3" />
                    Desconectado
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Métricas de emisión en vivo, control de stream y rendimiento de cuadros (dropped frames).
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Connected Live Stream Telemetry Grid */}
          {isConnected && (
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                <Radio className="w-4 h-4 text-purple-400" />
                Telemetría en Vivo de OBS
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {/* Live Status Card */}
                <div className={`p-3.5 rounded-xl border flex flex-col justify-between ${
                  stats.outputActive 
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                    : 'bg-zinc-950 border-zinc-800 text-zinc-400'
                }`}>
                  <span className="text-[10px] uppercase font-semibold text-zinc-400">Estado de Emisión</span>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${
                      stats.outputActive ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-600'
                    }`} />
                    <span className="text-sm font-bold text-white">
                      {stats.outputActive ? 'EN VIVO' : 'DETENIDO'}
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-zinc-400 mt-1">
                    {stats.outputTimecode || '00:00:00'}
                  </span>
                </div>

                {/* Dropped Frames (Skipped) Card */}
                <div className={`p-3.5 rounded-xl border flex flex-col justify-between ${
                  dropRate > 3
                    ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                    : dropRate > 1
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                    : 'bg-zinc-950 border-zinc-800 text-emerald-400'
                }`}>
                  <span className="text-[10px] uppercase font-semibold text-zinc-400">Cuadros Perdidos</span>
                  <div className="flex items-baseline gap-1 mt-2">
                    <span className="text-lg font-bold text-white">{dropRate}%</span>
                    <span className="text-[10px] text-zinc-500">
                      ({stats.outputSkippedFrames.toLocaleString()})
                    </span>
                  </div>
                  <span className="text-[10px] text-zinc-400 mt-1">
                    Total: {stats.outputTotalFrames.toLocaleString()} frames
                  </span>
                </div>

                {/* OBS FPS & Render Time */}
                <div className="p-3.5 rounded-xl border bg-zinc-950 border-zinc-800 flex flex-col justify-between">
                  <span className="text-[10px] uppercase font-semibold text-zinc-400 flex items-center gap-1">
                    <Gauge className="w-3 h-3 text-cyan-400" />
                    FPS & Rendimiento
                  </span>
                  <div className="flex items-baseline gap-1.5 mt-2">
                    <span className="text-lg font-bold text-cyan-400">{stats.fps || 60}</span>
                    <span className="text-xs text-zinc-400">FPS</span>
                  </div>
                  <span className="text-[10px] text-zinc-400 mt-1">
                    Congestión: {Math.round(stats.outputCongestion * 100)}%
                  </span>
                </div>

                {/* CPU & Memory Card */}
                <div className="p-3.5 rounded-xl border bg-zinc-950 border-zinc-800 flex flex-col justify-between">
                  <span className="text-[10px] uppercase font-semibold text-zinc-400 flex items-center gap-1">
                    <Cpu className="w-3 h-3 text-purple-400" />
                    Uso de CPU / RAM
                  </span>
                  <div className="flex items-baseline gap-1.5 mt-2">
                    <span className="text-lg font-bold text-purple-400">{stats.cpuUsage}%</span>
                    <span className="text-xs text-zinc-400">CPU</span>
                  </div>
                  <span className="text-[10px] text-zinc-400 mt-1">
                    {stats.memoryUsage ? `${stats.memoryUsage} MB RAM` : formatObsBytes(stats.outputBytes)}
                  </span>
                </div>
              </div>

              {/* OBS Quick Actions: Stream & Record Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleToggleStreamClick}
                  disabled={isActionLoading}
                  className={`flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all ${
                    stats.outputActive
                      ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
                  }`}
                >
                  {stats.outputActive ? <Square className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                  <span>{stats.outputActive ? 'Detener Transmisión en OBS' : 'Iniciar Transmisión en OBS'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleToggleRecordClick}
                  disabled={isActionLoading}
                  className={`flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs border transition-all ${
                    stats.isRecording
                      ? 'bg-rose-500/20 border-rose-500/40 text-rose-300 hover:bg-rose-500/30'
                      : 'bg-zinc-800 border-zinc-700 text-zinc-200 hover:bg-zinc-750'
                  }`}
                >
                  <Disc className={`w-4 h-4 ${stats.isRecording ? 'text-rose-400 animate-pulse' : 'text-zinc-400'}`} />
                  <span>
                    {stats.isRecording 
                      ? `Grabando (${stats.recordTimecode || '00:00:00'}) - Detener` 
                      : 'Iniciar Grabación Local'}
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* Connection Settings Form */}
          <form onSubmit={handleSave} className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                Configuración del Servidor WebSocket
              </h3>
              <div className="flex items-center gap-2">
                {isConnected ? (
                  <button
                    type="button"
                    onClick={onDisconnect}
                    className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-rose-400 border border-zinc-700 rounded-lg text-xs font-semibold transition-colors"
                  >
                    Desconectar
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={onConnect}
                    disabled={isConnecting}
                    className="px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-semibold shadow transition-colors flex items-center gap-1.5"
                  >
                    {isConnecting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                    <span>Conectar Ahora</span>
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-medium text-zinc-300 mb-1">
                  Dirección Host (IP o localhost):
                </label>
                <input
                  type="text"
                  placeholder="localhost o 127.0.0.1"
                  value={host}
                  onChange={(e) => setHost(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-zinc-300 mb-1">
                  Puerto del Servidor:
                </label>
                <input
                  type="number"
                  placeholder="4455"
                  value={port}
                  onChange={(e) => setPort(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-zinc-300 mb-1">
                Contraseña de OBS WebSocket (Opcional si no la configuraste):
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Contraseña configurada en OBS"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 pr-10 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200 p-1"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={autoConnect}
                  onChange={(e) => setAutoConnect(e.target.checked)}
                  className="w-4 h-4 rounded border-zinc-700 bg-zinc-950 text-purple-600 focus:ring-purple-500 focus:ring-offset-zinc-900"
                />
                <span className="text-xs text-zinc-300">
                  Conectar automáticamente al abrir el dashboard
                </span>
              </label>

              <button
                type="submit"
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold shadow transition-colors"
              >
                Guardar Configuración
              </button>
            </div>
          </form>

          {/* Quick Guide Card */}
          <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 space-y-2">
            <div className="flex items-center gap-2 text-purple-300 font-semibold text-xs">
              <HelpCircle className="w-4 h-4" />
              <span>¿Cómo activar OBS WebSocket en tu OBS Studio?</span>
            </div>
            <ol className="text-xs text-zinc-400 space-y-1 list-decimal list-inside leading-relaxed">
              <li>Abre <strong>OBS Studio</strong> (versión 28 o superior ya lo incluye integrado).</li>
              <li>Ve al menú superior: <strong>Herramientas (Tools) → Configuración del servidor WebSocket</strong>.</li>
              <li>Marca la casilla <strong>Habilitar servidor WebSocket</strong>.</li>
              <li>Asegúrate de que el puerto sea <strong>4455</strong>. Si tienes contraseña configurada, cópiala en el campo de arriba.</li>
              <li>Haz clic en <strong>Conectar Ahora</strong> en este panel.</li>
            </ol>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-800 bg-zinc-950/70">
          <span className="text-xs text-zinc-500 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />
            Protocolo OBS WebSocket v5 nativo
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
