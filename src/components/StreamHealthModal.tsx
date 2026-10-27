import React, { useState } from 'react';
import { 
  X, 
  Activity, 
  RotateCw, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Copy, 
  Check, 
  Zap,
  Radio
} from 'lucide-react';
import { StreamHealthSummary, HealthRating } from '../types/streamHealth';
import { HEALTH_SERVICES } from '../utils/streamHealth';

interface StreamHealthModalProps {
  isOpen: boolean;
  onClose: () => void;
  healthSummary: StreamHealthSummary | null;
  onRefreshHealth: () => Promise<void>;
  streamAlerts?: string[];
}

export const StreamHealthModal: React.FC<StreamHealthModalProps> = ({
  isOpen,
  onClose,
  healthSummary,
  onRefreshHealth,
  streamAlerts = [],
}) => {
  const [isRunningTest, setIsRunningTest] = useState<boolean>(false);
  const [copiedReport, setCopiedReport] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleRunDiagnostics = async () => {
    setIsRunningTest(true);
    try {
      await onRefreshHealth();
    } finally {
      setIsRunningTest(false);
    }
  };

  const handleCopyReport = () => {
    if (!healthSummary) return;
    const reportText = [
      `=== REPORTE DE SALUD DE STREAM - STREAMPULSE ===`,
      `Fecha: ${new Date(healthSummary.lastChecked).toLocaleString()}`,
      `Estado General: ${healthSummary.overallRating.toUpperCase()}`,
      `Latencia Promedio: ${healthSummary.averageLatencyMs} ms`,
      `Jitter (Fluctuación): ±${healthSummary.jitterMs} ms`,
      `Pérdida de Paquetes: ${healthSummary.packetLossPercent}%`,
      `Diagnóstico: ${healthSummary.recommendation}`,
      ``,
      `--- SERVICIOS TESTEADOS ---`,
      ...healthSummary.services.map(
        (s) => `• ${s.name}: ${s.success ? `${s.latencyMs} ms (${s.status})` : `ERROR: ${s.error}`}`
      ),
      ``,
      streamAlerts.length > 0 
        ? `Alertas de Caídas: ${streamAlerts.join(' | ')}` 
        : `Alertas de Caídas: Ninguna caída detectada.`,
    ].join('\n');

    navigator.clipboard.writeText(reportText);
    setCopiedReport(true);
    setTimeout(() => setCopiedReport(false), 2500);
  };

  const getRatingBadge = (rating: HealthRating) => {
    switch (rating) {
      case 'excellent':
        return {
          label: 'Excelente',
          bg: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400',
          dot: 'bg-emerald-400',
          icon: CheckCircle2,
        };
      case 'good':
        return {
          label: 'Buena / Estable',
          bg: 'bg-teal-500/15 border-teal-500/30 text-teal-400',
          dot: 'bg-teal-400',
          icon: CheckCircle2,
        };
      case 'fair':
        return {
          label: 'Aceptable / Fluctuante',
          bg: 'bg-amber-500/15 border-amber-500/30 text-amber-400',
          dot: 'bg-amber-400',
          icon: AlertTriangle,
        };
      case 'poor':
        return {
          label: 'Deficiente / Inestable',
          bg: 'bg-rose-500/15 border-rose-500/30 text-rose-400',
          dot: 'bg-rose-400',
          icon: AlertTriangle,
        };
      case 'offline':
      default:
        return {
          label: 'Sin Conexión',
          bg: 'bg-red-500/20 border-red-500/40 text-red-400',
          dot: 'bg-red-500',
          icon: XCircle,
        };
    }
  };

  const overallBadge = healthSummary ? getRatingBadge(healthSummary.overallRating) : getRatingBadge('good');
  const OverallIcon = overallBadge.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-950/70">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-400">
              <Activity className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Estado del Stream & Conexión de Red
              </h2>
              <p className="text-xs text-zinc-400">
                Monitoreo en tiempo real de latencia, estabilidad y caídas de emisión
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

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto">
          {/* Stream Drops / Disconnect Alerts */}
          {streamAlerts.length > 0 && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
              <Radio className="w-4 h-4 text-rose-400 shrink-0 mt-0.5 animate-pulse" />
              <div>
                <span className="font-bold block text-rose-200 mb-1">¡Alerta de Caída de Emisión!</span>
                <ul className="list-disc list-inside space-y-0.5 text-rose-300/90">
                  {streamAlerts.map((alert, idx) => (
                    <li key={idx}>{alert}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Main Health Overview Card */}
          <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800/90 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold ${overallBadge.bg}`}>
                  <span className={`w-2 h-2 rounded-full ${overallBadge.dot} animate-pulse`} />
                  <OverallIcon className="w-3.5 h-3.5" />
                  <span>Estado: {overallBadge.label}</span>
                </span>
                {healthSummary && (
                  <span className="text-[11px] text-zinc-500">
                    Último test: {new Date(healthSummary.lastChecked).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                )}
              </div>

              {/* Action Button: Run Test */}
              <button
                type="button"
                onClick={handleRunDiagnostics}
                disabled={isRunningTest}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white shadow-md shadow-purple-600/20 transition-all disabled:opacity-50"
              >
                <RotateCw className={`w-3.5 h-3.5 ${isRunningTest ? 'animate-spin' : ''}`} />
                <span>{isRunningTest ? 'Midiendo Conexión...' : 'Ejecutar Test Completo'}</span>
              </button>
            </div>

            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-3 gap-3 pt-1">
              <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-center">
                <span className="text-[11px] text-zinc-400 block mb-0.5">Latencia Promedio</span>
                <span className="text-xl font-black text-white">
                  {healthSummary ? `${healthSummary.averageLatencyMs} ms` : '--'}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-center">
                <span className="text-[11px] text-zinc-400 block mb-0.5">Jitter (Estabilidad)</span>
                <span className="text-xl font-black text-amber-300">
                  {healthSummary ? `±${healthSummary.jitterMs} ms` : '--'}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-center">
                <span className="text-[11px] text-zinc-400 block mb-0.5">Pérdida de Señal</span>
                <span className="text-xl font-black text-emerald-400">
                  {healthSummary ? `${healthSummary.packetLossPercent}%` : '0%'}
                </span>
              </div>
            </div>

            {/* Diagnosis / Recommendation */}
            {healthSummary && (
              <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs text-purple-200 flex items-start gap-2">
                <Zap className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                <span>{healthSummary.recommendation}</span>
              </div>
            )}
          </div>

          {/* Service By Service Diagnostic Breakdown */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center justify-between">
              <span>Desglose por Servicio & Ingest</span>
              <span className="text-[11px] font-normal text-zinc-500">
                {healthSummary ? `${healthSummary.services.length} servicios monitorizados` : ''}
              </span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {(healthSummary?.services || HEALTH_SERVICES.map(s => ({
                id: s.id,
                name: s.name,
                category: s.category,
                targetUrl: s.url,
                latencyMs: 0,
                status: 'good' as HealthRating,
                success: true,
                timestamp: Date.now()
              }))).map((service) => {
                const badge = getRatingBadge(service.status);
                return (
                  <div
                    key={service.id}
                    className="p-3 rounded-xl bg-zinc-950 border border-zinc-800/80 flex items-center justify-between gap-3 hover:border-zinc-700 transition-colors"
                  >
                    <div className="min-w-0 flex items-center gap-2.5">
                      <div className={`w-2 h-2 rounded-full ${service.success ? badge.dot : 'bg-rose-500'} shrink-0`} />
                      <div className="min-w-0">
                        <span className="text-xs font-semibold text-zinc-200 block truncate">
                          {service.name}
                        </span>
                        <span className="text-[10px] text-zinc-500 block truncate" title={service.targetUrl}>
                          {service.targetUrl.replace(/^https?:\/\//, '').split('/')[0]}
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      {service.success ? (
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-black text-white">{service.latencyMs} ms</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded border font-semibold ${badge.bg}`}>
                            {badge.label.split(' ')[0]}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 font-medium">
                          Fallo de red
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-800 bg-zinc-950/70">
          <button
            type="button"
            onClick={handleCopyReport}
            disabled={!healthSummary}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors disabled:opacity-40"
          >
            {copiedReport ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Reporte Copiado</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copiar Reporte</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white rounded-xl shadow transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
