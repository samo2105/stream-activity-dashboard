import React from 'react';
import { 
  Columns, 
  Plus, 
  Settings, 
  Sparkles, 
  Github, 
  Tv2,
  Radio,
  Monitor,
  Moon,
  Sun
} from 'lucide-react';
import { GridColumns, ChannelsConfig, ThemeMode } from '../types/widget';

interface NavbarProps {
  columns: GridColumns;
  onColumnsChange: (cols: GridColumns) => void;
  onOpenAddModal: () => void;
  onOpenSettingsModal: () => void;
  onOpenPresetsModal: () => void;
  onOpenProfileModal: () => void;
  channels: ChannelsConfig;
  totalWidgets: number;
  themeMode: ThemeMode;
  onThemeChange: (theme: ThemeMode) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  columns,
  onColumnsChange,
  onOpenAddModal,
  onOpenSettingsModal,
  onOpenPresetsModal,
  onOpenProfileModal,
  channels,
  totalWidgets,
  themeMode,
  onThemeChange,
}) => {
  const isLight = themeMode === 'light';
  const isDark = themeMode === 'dark';

  return (
    <header className={`sticky top-0 z-30 border-b backdrop-blur-md px-4 py-3 transition-colors ${
      isLight 
        ? 'bg-white/95 border-zinc-200 text-zinc-900 shadow-sm' 
        : isDark 
        ? 'bg-black/95 border-zinc-800 text-zinc-100' 
        : 'bg-zinc-950/85 border-zinc-800 text-zinc-100'
    }`}>
      <div className="max-w-[1920px] mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Logo & Live Status */}
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-purple-600/20">
            <Tv2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className={`font-bold text-base tracking-tight flex items-center gap-1.5 ${isLight ? 'text-zinc-900' : 'text-white'}`}>
                StreamPulse
                <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live Hub
                </span>
              </h1>
            </div>
            <p className={`text-xs hidden sm:block ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>
              Actividad, alertas y chats multiplataforma
            </p>
          </div>
        </div>

        {/* Center / Layout & Theme Controls */}
        <div className="flex items-center gap-2">
          {/* Columns selector */}
          <div className={`flex items-center border rounded-lg p-1 text-xs ${
            isLight ? 'bg-zinc-100 border-zinc-200' : 'bg-zinc-900 border-zinc-800'
          }`}>
            <span className={`px-2 flex items-center gap-1 hidden md:flex ${isLight ? 'text-zinc-500' : 'text-zinc-500'}`}>
              <Columns className="w-3.5 h-3.5" />
              Columnas:
            </span>
            {([1, 2, 3, 4] as GridColumns[]).map((col) => (
              <button
                key={col}
                type="button"
                onClick={() => onColumnsChange(col)}
                className={`px-2.5 py-1 rounded font-medium transition-all ${
                  columns === col
                    ? 'bg-purple-600 text-white shadow'
                    : isLight
                    ? 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                }`}
                title={`Ver en ${col} columna${col > 1 ? 's' : ''}`}
              >
                {col}
              </button>
            ))}
          </div>

          {/* Quick Presets button */}
          <button
            type="button"
            onClick={onOpenPresetsModal}
            className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border rounded-lg transition-colors ${
              isLight
                ? 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700 hover:text-zinc-900 border-zinc-200'
                : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border-zinc-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Plantillas
          </button>

          {/* 3-Way Theme Selector: Normal (por defecto) | Oscuro | Claro */}
          <div className={`flex items-center border rounded-lg p-0.5 text-xs ${
            isLight ? 'bg-zinc-100 border-zinc-200' : isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-zinc-900 border-zinc-800'
          }`}>
            <button
              type="button"
              onClick={() => onThemeChange('normal')}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded font-medium transition-all ${
                themeMode === 'normal'
                  ? 'bg-purple-600/20 text-purple-300 border border-purple-500/40 shadow-sm'
                  : isLight
                  ? 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/60'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
              }`}
              title="Modo Normal (Por defecto: oscuro balanceado #09090b)"
            >
              <Monitor className={`w-3.5 h-3.5 ${themeMode === 'normal' ? 'text-purple-400' : ''}`} />
              <span className="hidden md:inline">Normal</span>
            </button>
            <button
              type="button"
              onClick={() => onThemeChange('dark')}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded font-medium transition-all ${
                themeMode === 'dark'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                  : isLight
                  ? 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/60'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
              }`}
              title="Modo Oscuro (Fondo negro puro #000000 y alto contraste)"
            >
              <Moon className={`w-3.5 h-3.5 ${themeMode === 'dark' ? 'text-amber-400' : ''}`} />
              <span className="hidden md:inline">Oscuro</span>
            </button>
            <button
              type="button"
              onClick={() => onThemeChange('light')}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded font-medium transition-all ${
                themeMode === 'light'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : isLight
                  ? 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/60'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
              }`}
              title="Modo Claro (Fondo blanco #ffffff y máxima luminosidad)"
            >
              <Sun className={`w-3.5 h-3.5 ${themeMode === 'light' ? 'text-amber-300' : ''}`} />
              <span className="hidden md:inline">Claro</span>
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Configure Channels / Profile Button */}
          <button
            type="button"
            onClick={onOpenProfileModal}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all shadow-sm ${
              isLight 
                ? 'bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border border-purple-300' 
                : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:text-white border border-purple-500/30'
            }`}
            title="Configurar nombres de usuario y canales de stream"
          >
            <Radio className="w-3.5 h-3.5 text-purple-400" />
            <span className={`hidden md:inline font-normal ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>Canal:</span>
            <span className={`font-medium truncate max-w-[120px] ${isLight ? 'text-purple-700' : 'text-purple-300'}`}>
              {channels.youtubeHandle ? `@${channels.youtubeHandle.replace(/^@/, '')}` : channels.twitch || channels.kick || channels.facebook || 'Mis Canales'}
            </span>
          </button>

          {/* Add Widget Button */}
          <button
            type="button"
            onClick={onOpenAddModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white rounded-lg shadow-md shadow-purple-600/20 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Añadir Widget</span>
            {totalWidgets > 0 && (
              <span className="ml-0.5 px-1.5 py-0.2 rounded-full bg-purple-800/80 text-[10px]">
                {totalWidgets}
              </span>
            )}
          </button>

          {/* Settings / Backup */}
          <button
            type="button"
            onClick={onOpenSettingsModal}
            className={`p-2 rounded-lg transition-colors ${
              isLight 
                ? 'text-zinc-600 hover:text-zinc-900 bg-zinc-100 hover:bg-zinc-200 border border-zinc-200' 
                : 'text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-800'
            }`}
            title="Configuración y Copia de Seguridad"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* GitHub Link */}
          <a
            href="https://github.com/samo2105/stream-activity-dashboard"
            target="_blank"
            rel="noreferrer"
            className={`p-2 rounded-lg transition-colors ${
              isLight 
                ? 'text-zinc-600 hover:text-zinc-900 bg-zinc-100 hover:bg-zinc-200 border border-zinc-200' 
                : 'text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-800'
            }`}
            title="Ver repositorio en GitHub"
          >
            <Github className="w-4 h-4" />
          </a>
        </div>
      </div>
    </header>
  );
};
