import React from 'react';
import { 
  Settings, 
  Github, 
  Tv2,
  Layers,
  Video
} from 'lucide-react';
import { ThemeMode, ActiveView } from '../types/widget';

interface NavbarProps {
  totalWidgets: number;
  onOpenSettingsModal: () => void;
  themeMode?: ThemeMode;
  activeView: ActiveView;
  onViewChange: (view: ActiveView) => void;
  livePlatformsCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  totalWidgets,
  onOpenSettingsModal,
  themeMode = 'normal',
  activeView,
  onViewChange,
  livePlatformsCount = 0,
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
        {/* Logo & View Switcher */}
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-2.5">
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
              <p className={`text-xs hidden lg:block ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>
                Actividad, alertas y chats multiplataforma
              </p>
            </div>
          </div>

          {/* Segmented Control: Dashboard vs Live Previews Studio */}
          <div className={`flex items-center rounded-xl p-0.5 border text-xs font-medium shadow-inner ${
            isLight ? 'bg-zinc-100/90 border-zinc-200' : isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-zinc-900 border-zinc-800'
          }`}>
            <button
              type="button"
              onClick={() => onViewChange('dashboard')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                activeView === 'dashboard'
                  ? isLight
                    ? 'bg-white text-purple-700 shadow-sm font-semibold'
                    : 'bg-purple-600 text-white shadow-sm font-semibold'
                  : isLight
                  ? 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/50'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
              }`}
              title="Ver cuadrícula de widgets y chats"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Widgets</span>
              {totalWidgets > 0 && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  activeView === 'dashboard'
                    ? isLight ? 'bg-purple-100 text-purple-700 font-bold' : 'bg-purple-800/80 text-purple-200 font-bold'
                    : isLight ? 'bg-zinc-200 text-zinc-600' : 'bg-zinc-800 text-zinc-400'
                }`}>
                  {totalWidgets}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => onViewChange('previews')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                activeView === 'previews'
                  ? isLight
                    ? 'bg-white text-purple-700 shadow-sm font-semibold'
                    : 'bg-purple-600 text-white shadow-sm font-semibold'
                  : isLight
                  ? 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/50'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
              }`}
              title="Ver reproductores en vivo y configurar transmisiones"
            >
              <Video className="w-3.5 h-3.5" />
              <span>Live Studio</span>
              {livePlatformsCount > 0 ? (
                <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-[10px] animate-pulse border border-emerald-500/30">
                  🔴 {livePlatformsCount} Live
                </span>
              ) : (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  isLight ? 'bg-zinc-200 text-zinc-600' : 'bg-zinc-800 text-zinc-400'
                }`}>
                  Previews
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
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
