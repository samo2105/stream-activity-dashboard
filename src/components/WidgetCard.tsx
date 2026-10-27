import React, { useState, useEffect } from 'react';
import { 
  RotateCw, 
  Maximize2, 
  Minimize2, 
  ExternalLink, 
  Trash2, 
  Edit3, 
  ArrowLeftRight,
  AlertCircle,
  HelpCircle,
  MessageSquare,
  Monitor,
  Moon,
  Sun,
  Play,
  WifiOff
} from 'lucide-react';
import { WidgetItem, ThemeMode } from '../types/widget';
import { PLATFORM_PRESETS } from '../utils/presets';
import { sanitizeStreamUrl } from '../utils/urlHelper';

interface WidgetCardProps {
  widget: WidgetItem;
  dashboardTheme?: ThemeMode;
  dashboardFontScale?: number;
  isStreamActive?: boolean;
  onDelete: (id: string) => void;
  onEdit: (widget: WidgetItem) => void;
  onToggleSpan: (id: string) => void;
  onCycleTheme: (id: string) => void;
  onUpdateFontScale?: (id: string, scale: number) => void;
}

const FONT_SCALES = [0.75, 0.85, 1.0, 1.15, 1.3, 1.5, 1.75, 2.0];

export const WidgetCard: React.FC<WidgetCardProps> = ({
  widget,
  dashboardTheme,
  dashboardFontScale,
  isStreamActive = false,
  onDelete,
  onEdit,
  onToggleSpan,
  onCycleTheme,
  onUpdateFontScale,
}) => {
  const [reloadKey, setReloadKey] = useState<number>(0);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [forcePreview, setForcePreview] = useState<boolean>(false);

  // Active theme mode: 'normal' (default), 'dark' (high contrast OLED), or 'light' (clean white)
  const currentTheme: ThemeMode = widget.themeMode || (widget.highContrast ? 'dark' : (dashboardTheme || 'normal'));
  const isDark = currentTheme === 'dark';
  const isLight = currentTheme === 'light';
  const isNormal = currentTheme === 'normal';

  const preset = PLATFORM_PRESETS[widget.platform] || PLATFORM_PRESETS.custom;
  const isPlaceholder = widget.url === 'about:blank' || widget.url.includes('TU_TOKEN') || widget.url.includes('TU_CANAL');
  const isTwitch = widget.platform === 'twitch' || widget.url.includes('twitch.tv');
  const isChatbox = widget.platform === 'chatbox' || widget.url.includes('streamlabs.com/widgets/chat-box') || widget.url.includes('botrix.live/widgets/chat');
  const isStreamlabs = widget.platform === 'streamlabs' || widget.url.includes('streamlabs.com');

  // Automatically sanitize and adapt URLs for iframes
  let effectiveUrl = sanitizeStreamUrl(widget.url, widget.platform);

  // Adapt YouTube theme according to current mode
  if (effectiveUrl.includes('youtube.com/live_chat')) {
    if (isLight) {
      effectiveUrl = effectiveUrl.replace(/([?&])dark_theme=1/g, '$1dark_theme=0');
      if (!effectiveUrl.includes('dark_theme=')) {
        effectiveUrl += `${effectiveUrl.includes('?') ? '&' : '?'}dark_theme=0`;
      }
    } else {
      effectiveUrl = effectiveUrl.replace(/([?&])dark_theme=0/g, '$1dark_theme=1');
      if (!effectiveUrl.includes('dark_theme=')) {
        effectiveUrl += `${effectiveUrl.includes('?') ? '&' : '?'}dark_theme=1`;
      }
    }
  }

  // Trigger loading spinner whenever the widget URL, platform, or theme mode changes
  useEffect(() => {
    setIsLoading(true);
  }, [widget.url, widget.platform, currentTheme]);

  const handleReload = () => {
    setIsLoading(true);
    setReloadKey((prev) => prev + 1);
  };

  const handleToggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const handleThemeClick = () => {
    onCycleTheme(widget.id);
  };

  // Font scale calculation and handlers
  const currentFontScale = widget.fontScale ?? dashboardFontScale ?? 1.0;

  const handleDecreaseFont = () => {
    if (!onUpdateFontScale) return;
    const currentIdx = FONT_SCALES.findIndex(s => Math.abs(s - currentFontScale) < 0.05);
    const validIdx = currentIdx !== -1 ? currentIdx : 2;
    const newIdx = validIdx > 0 ? validIdx - 1 : 0;
    onUpdateFontScale(widget.id, FONT_SCALES[newIdx]);
  };

  const handleIncreaseFont = () => {
    if (!onUpdateFontScale) return;
    const currentIdx = FONT_SCALES.findIndex(s => Math.abs(s - currentFontScale) < 0.05);
    const validIdx = currentIdx !== -1 ? currentIdx : 2;
    const newIdx = validIdx < FONT_SCALES.length - 1 ? validIdx + 1 : FONT_SCALES.length - 1;
    onUpdateFontScale(widget.id, FONT_SCALES[newIdx]);
  };

  const handleResetFont = () => {
    if (onUpdateFontScale) {
      onUpdateFontScale(widget.id, 1.0);
    }
  };

  return (
    <div
      className={`group flex flex-col rounded-xl border shadow-md transition-all duration-200 overflow-hidden ${
        isDark 
          ? 'border-amber-500/60 shadow-xl shadow-black/80 ring-1 ring-amber-500/20 bg-black' 
          : isLight
          ? 'border-zinc-300 shadow-md ring-1 ring-zinc-200/80 bg-white text-zinc-900'
          : `bg-zinc-900/90 ${preset.borderColor}`
      } ${
        widget.columnSpan === 2 ? 'md:col-span-2' : 'col-span-1'
      } ${
        isFullscreen
          ? 'fixed inset-3 z-50 shadow-2xl bg-zinc-950 border-purple-500/60'
          : 'relative min-h-[460px] h-[520px]'
      }`}
    >
      {/* Card Header */}
      <div className={`flex items-center justify-between px-3.5 py-2.5 border-b gap-2 select-none transition-colors ${
        isLight
          ? 'bg-zinc-100/95 border-zinc-200 text-zinc-800'
          : isDark
          ? 'bg-black border-zinc-800/90 text-zinc-100'
          : 'bg-zinc-950/70 border-zinc-800/80 text-zinc-200'
      }`}>
        <div className="flex items-center gap-2 min-w-0">
          {/* Platform Badge */}
          <span
            className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${preset.badgeBg}`}
          >
            {preset.badgeText}
          </span>

          {/* Title and Connection Status */}
          <div className="flex items-center gap-1.5 min-w-0">
            <h2
              className={`text-xs font-semibold truncate cursor-pointer transition-colors ${
                isLight ? 'text-zinc-800 hover:text-black' : 'text-zinc-200 hover:text-white'
              }`}
              onClick={() => onEdit(widget)}
              title="Haz clic para editar título o URL"
            >
              {widget.title}
            </h2>
            {!isPlaceholder && (
              isStreamActive ? (
                <span className="text-[10px] text-emerald-400 font-semibold px-1.5 py-0.2 rounded bg-emerald-500/10 border border-emerald-500/30 shrink-0 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  en vivo
                </span>
              ) : (
                <span className="text-[10px] text-zinc-400 font-normal px-1.5 py-0.2 rounded bg-zinc-800/80 border border-zinc-700/60 shrink-0">
                  (no conectado)
                </span>
              )
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Font Scaling Controls (A- / 100% / A+) */}
          <div className={`flex items-center rounded border px-1 py-0.5 text-xs select-none ${
            isLight ? 'bg-zinc-200/80 border-zinc-300' : 'bg-zinc-900 border-zinc-800'
          }`}>
            <button
              type="button"
              onClick={handleDecreaseFont}
              className={`px-1 py-0.5 rounded text-[10px] font-bold transition-colors ${
                isLight ? 'text-zinc-600 hover:text-black hover:bg-zinc-300' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
              title="Disminuir tamaño de fuente/zoom del frame (A-)"
            >
              A-
            </button>
            <button
              type="button"
              onClick={handleResetFont}
              className={`px-1 text-[10px] font-mono font-medium transition-colors ${
                currentFontScale !== 1.0 
                  ? 'text-purple-400 font-bold' 
                  : isLight ? 'text-zinc-600' : 'text-zinc-400'
              }`}
              title={`Tamaño de fuente: ${Math.round(currentFontScale * 100)}% (clic para restablecer)`}
            >
              {Math.round(currentFontScale * 100)}%
            </button>
            <button
              type="button"
              onClick={handleIncreaseFont}
              className={`px-1 py-0.5 rounded text-[10px] font-bold transition-colors ${
                isLight ? 'text-zinc-600 hover:text-black hover:bg-zinc-300' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
              title="Aumentar tamaño de fuente/zoom del frame (A+)"
            >
              A+
            </button>
          </div>

          {/* 3-Mode Theme Cycle Toggle (Normal -> Oscuro -> Claro -> Normal) */}
          <button
            type="button"
            onClick={handleThemeClick}
            className={`p-1.5 rounded text-xs transition-all ${
              isDark
                ? 'text-amber-400 bg-amber-400/20 border border-amber-400/50 shadow-sm shadow-amber-400/20'
                : isLight
                ? 'text-amber-600 bg-amber-100 border border-amber-300 shadow-sm'
                : isLight
                ? 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200 border border-transparent'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 border border-transparent'
            }`}
            title={
              isNormal
                ? 'Modo actual: Normal (por defecto). Haz clic para cambiar a Modo Oscuro.'
                : isDark
                ? 'Modo actual: Modo Oscuro (fondo negro puro #000000). Haz clic para cambiar a Modo Claro.'
                : 'Modo actual: Modo Claro (fondo blanco #ffffff). Haz clic para cambiar a Modo Normal.'
            }
          >
            {isNormal && <Monitor className="w-3.5 h-3.5 text-zinc-400" />}
            {isDark && <Moon className="w-3.5 h-3.5 text-amber-400" />}
            {isLight && <Sun className="w-3.5 h-3.5 text-amber-600" />}
          </button>

          {/* Span toggle (1 col vs 2 col) */}
          <button
            type="button"
            onClick={() => onToggleSpan(widget.id)}
            className={`p-1.5 rounded text-xs transition-colors ${
              widget.columnSpan === 2
                ? 'text-purple-500 bg-purple-500/15'
                : isLight
                ? 'text-zinc-500 hover:text-zinc-800 hover:bg-zinc-200'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
            }`}
            title={widget.columnSpan === 2 ? 'Reducir a 1 columna' : 'Expandir a 2 columnas'}
          >
            <ArrowLeftRight className="w-3.5 h-3.5" />
          </button>

          {/* Reload Iframe */}
          <button
            type="button"
            onClick={handleReload}
            className={`p-1.5 rounded transition-colors ${
              isLight ? 'text-zinc-500 hover:text-zinc-800 hover:bg-zinc-200' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
            }`}
            title="Recargar widget"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>

          {/* Fullscreen Card */}
          <button
            type="button"
            onClick={handleToggleFullscreen}
            className={`p-1.5 rounded transition-colors ${
              isLight ? 'text-zinc-500 hover:text-zinc-800 hover:bg-zinc-200' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
            }`}
            title={isFullscreen ? 'Salir de pantalla completa' : 'Maximizar tarjeta'}
          >
            {isFullscreen ? (
              <Minimize2 className="w-3.5 h-3.5 text-amber-400" />
            ) : (
              <Maximize2 className="w-3.5 h-3.5" />
            )}
          </button>

          {/* External Link */}
          {!isPlaceholder && (
            <a
              href={effectiveUrl}
              target="_blank"
              rel="noreferrer"
              className={`p-1.5 rounded transition-colors ${
                isLight ? 'text-zinc-500 hover:text-zinc-800 hover:bg-zinc-200' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
              }`}
              title="Abrir en pestaña nueva"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}

          {/* Edit */}
          <button
            type="button"
            onClick={() => onEdit(widget)}
            className={`p-1.5 rounded transition-colors ${
              isLight ? 'text-zinc-500 hover:text-zinc-800 hover:bg-zinc-200' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
            }`}
            title="Configurar widget"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>

          {/* Delete */}
          <button
            type="button"
            onClick={() => onDelete(widget.id)}
            className={`p-1.5 rounded transition-colors ${
              isLight ? 'text-zinc-400 hover:text-rose-600 hover:bg-rose-50' : 'text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10'
            }`}
            title="Eliminar widget"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Twitch Special Helper Hint */}
      {isTwitch && (
        <div className={`px-3 py-1 flex items-center justify-between text-[11px] border-b ${
          isLight 
            ? 'bg-purple-50/90 border-purple-200 text-purple-900' 
            : 'bg-purple-950/40 border-purple-500/20 text-purple-300'
        }`}>
          <span className="truncate">
            Modo Twitch Embed activo.
          </span>
          <a
            href={effectiveUrl.replace('/embed/', '/popout/')}
            target="_blank"
            rel="noreferrer"
            className="shrink-0 ml-2 inline-flex items-center gap-1 text-[10px] bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 px-1.5 py-0.5 rounded transition-colors"
          >
            <ExternalLink className="w-2.5 h-2.5" />
            Popout Externo
          </a>
        </div>
      )}

      {/* Streamlabs Status Note */}
      {isStreamlabs && !isPlaceholder && (
        <div className={`px-3 py-1 flex items-center justify-between text-[11px] border-b ${
          isLight
            ? 'bg-teal-50/90 border-teal-200 text-teal-900'
            : 'bg-teal-950/30 border-teal-500/20 text-teal-300'
        }`}>
          <span className="truncate flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse shrink-0" />
            <span className="truncate">
              {isChatbox 
                ? 'Streamlabs Chat Box (recibe chats de tus directos en tiempo real).'
                : 'Streamlabs Event List (recibe follows, subs y alertas del stream).'}
            </span>
          </span>
          <a
            href="https://streamlabs.com/dashboard#/widgets"
            target="_blank"
            rel="noreferrer"
            className="shrink-0 text-[10px] text-teal-300 hover:text-white px-2 py-0.5 rounded bg-teal-500/20 hover:bg-teal-500/40 border border-teal-500/30 transition-colors ml-2"
            title="Abre tu panel de Streamlabs para lanzar una alerta o mensaje de prueba"
          >
            Lanzar Prueba
          </a>
        </div>
      )}

      {/* Card Body / Iframe Area */}
      <div 
        className={`relative flex-1 overflow-hidden flex flex-col items-center justify-center transition-colors duration-200 ${
          isDark ? 'bg-black' : isLight ? 'bg-white' : 'bg-zinc-950'
        }`} 
        style={{ backgroundColor: isDark ? '#000000' : isLight ? '#ffffff' : '#09090b' }}
      >
        {isPlaceholder ? (
          /* Placeholder Guide Card */
          <div className="p-6 text-center max-w-sm flex flex-col items-center gap-3">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              isLight ? 'bg-purple-100 border border-purple-200 text-purple-600' : 'bg-purple-500/10 border border-purple-500/20 text-purple-400'
            }`}>
              {widget.platform === 'chatbox' ? (
                <MessageSquare className="w-6 h-6" />
              ) : (
                <HelpCircle className="w-6 h-6" />
              )}
            </div>
            <div>
              <h3 className={`text-sm font-semibold ${isLight ? 'text-zinc-800' : 'text-zinc-200'}`}>
                Configura tu URL de {preset.badgeText}
              </h3>
              <p className={`text-xs mt-1 leading-relaxed ${isLight ? 'text-zinc-600' : 'text-zinc-400'}`}>
                {preset.guideText}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onEdit(widget)}
              className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-purple-600 hover:bg-purple-500 text-white shadow transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5" />
              Pegar URL del Widget
            </button>
          </div>
        ) : !isStreamActive && !forcePreview ? (
          /* Standby Screen: Stream is offline, no iframe pull */
          <div className="p-6 text-center max-w-sm flex flex-col items-center gap-3 animate-fadeIn">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border transition-all ${
              isLight 
                ? 'bg-zinc-100 border-zinc-200 text-zinc-400' 
                : isDark 
                ? 'bg-zinc-900/60 border-zinc-800 text-zinc-500' 
                : 'bg-zinc-900 border-zinc-800 text-zinc-500'
            }`}>
              <WifiOff className="w-6 h-6 opacity-60" />
            </div>

            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-zinc-800/80 border border-zinc-700/80 text-zinc-400 mb-2">
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-500" />
                <span>(no conectado)</span>
              </div>
              <h3 className={`text-sm font-semibold ${isLight ? 'text-zinc-800' : 'text-zinc-200'}`}>
                Stream Inactivo
              </h3>
              <p className={`text-xs mt-1 leading-relaxed ${isLight ? 'text-zinc-600' : 'text-zinc-400'}`}>
                El widget se cargará automáticamente al detectar una conexión de stream activa.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setForcePreview(true)}
              className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white border border-zinc-700 shadow-sm transition-all"
              title="Cargar el widget ahora para probarlo o previsualizarlo"
            >
              <Play className="w-3.5 h-3.5 text-purple-400 fill-current" />
              <span>Cargar de todos modos (Vista previa)</span>
            </button>
          </div>
        ) : (
          /* Real Iframe View with Unrestricted Stream Capabilities */
          <>
            {isLoading && (
              <div className={`absolute inset-0 z-10 flex flex-col items-center justify-center backdrop-blur-sm pointer-events-none ${
                isLight ? 'bg-white/80' : 'bg-zinc-950/80'
              }`}>
                <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mb-2" />
                <span className={`text-xs ${isLight ? 'text-zinc-600' : 'text-zinc-400'}`}>Cargando {preset.badgeText}...</span>
              </div>
            )}
            <iframe
              key={`${widget.id}-${effectiveUrl}-${widget.platform}-${currentTheme}-${currentFontScale}-${reloadKey}`}
              src={effectiveUrl}
              title={widget.title}
              onLoad={() => setIsLoading(false)}
              className="border-0"
              referrerPolicy="no-referrer"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: `${(100 / currentFontScale).toFixed(3)}%`,
                height: `${(100 / currentFontScale).toFixed(3)}%`,
                transform: `scale(${currentFontScale})`,
                transformOrigin: '0 0',
                backgroundColor: isDark ? '#000000' : isLight ? '#ffffff' : '#09090b',
              }}
              allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share; fullscreen"
              allowTransparency={true}
            />
          </>
        )}
      </div>

      {/* Card Footer: Security / URL indicator */}
      <div className={`px-3 py-1.5 border-t flex items-center justify-between text-[11px] transition-colors ${
        isLight 
          ? 'bg-zinc-100/90 border-zinc-200 text-zinc-600' 
          : isDark 
          ? 'bg-black border-zinc-800 text-zinc-400' 
          : 'bg-zinc-950/60 border-zinc-800/60 text-zinc-500'
      }`}>
        <span className="truncate max-w-[260px]" title={effectiveUrl}>
          {isPlaceholder ? 'Pendiente de configurar URL' : effectiveUrl.replace(/^https?:\/\//, '')}
        </span>
        <div className="flex items-center gap-2 shrink-0">
          {forcePreview && !isStreamActive && (
            <button
              type="button"
              onClick={() => setForcePreview(false)}
              className="text-[10px] text-amber-400 hover:underline cursor-pointer"
              title="Volver al modo en espera (no conectado)"
            >
              Pausar vista previa
            </button>
          )}
          <span className={`flex items-center gap-1 text-[10px] ${
            !isStreamActive && !forcePreview 
              ? 'text-zinc-500' 
              : isStreamActive 
              ? 'text-emerald-400 font-medium' 
              : 'text-amber-400'
          }`}>
            <AlertCircle className={`w-3 h-3 ${!isStreamActive && !forcePreview ? 'text-zinc-500' : isStreamActive ? 'text-emerald-500' : 'text-amber-500'}`} />
            {!isStreamActive && !forcePreview ? 'En espera (no conectado)' : isStreamActive ? 'En vivo' : 'Vista previa'}
          </span>
        </div>
      </div>
    </div>
  );
};
