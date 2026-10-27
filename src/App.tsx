import { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { ViewerBar } from './components/ViewerBar';
import { WidgetGrid } from './components/WidgetGrid';
import { AddWidgetModal } from './components/AddWidgetModal';
import { PresetsModal } from './components/PresetsModal';
import { SettingsModal } from './components/SettingsModal';
import { ProfileModal } from './components/ProfileModal';
import { DashboardConfig, WidgetItem, GridColumns, ChannelsConfig, ThemeMode, CounterSize } from './types/widget';
import { StreamHealthSummary } from './types/streamHealth';
import { loadDashboardConfig, saveDashboardConfig, DEFAULT_CONFIG } from './utils/storage';
import { runFullHealthDiagnostics } from './utils/streamHealth';
import { StreamHealthModal } from './components/StreamHealthModal';
import { ObsModal } from './components/ObsModal';
import type { ObsConfig, ObsConnectionStatus, ObsStreamStats } from './types/obs';
import { getObsClient, DEFAULT_OBS_CONFIG, INITIAL_OBS_STATS } from './utils/obsWebSocket';
import { ShieldCheck, Sparkles, Layers } from 'lucide-react';

export function App() {
  const [config, setConfig] = useState<DashboardConfig>(() => loadDashboardConfig());
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isPresetsModalOpen, setIsPresetsModalOpen] = useState<boolean>(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);
  const [isHealthModalOpen, setIsHealthModalOpen] = useState<boolean>(false);
  const [isObsModalOpen, setIsObsModalOpen] = useState<boolean>(false);
  const [healthSummary, setHealthSummary] = useState<StreamHealthSummary | null>(null);
  const [streamAlerts, setStreamAlerts] = useState<string[]>([]);
  const [obsStatus, setObsStatus] = useState<ObsConnectionStatus>('disconnected');
  const [obsStats, setObsStats] = useState<ObsStreamStats>(INITIAL_OBS_STATS);
  const [obsErrorMsg, setObsErrorMsg] = useState<string | undefined>();
  const [editingWidget, setEditingWidget] = useState<WidgetItem | null>(null);

  // Sync with localStorage on config changes
  useEffect(() => {
    saveDashboardConfig(config);
  }, [config]);

  // Handle Columns Change
  const handleColumnsChange = (columns: GridColumns) => {
    setConfig((prev) => ({ ...prev, columns }));
  };

  // Handle Channels Change for Viewer Counter
  const handleUpdateChannels = (channels: ChannelsConfig) => {
    setConfig((prev) => ({ ...prev, channels }));
  };

  // Handle Save Channels from ProfileModal (with automatic widget updating)
  const handleSaveChannels = (newChannels: ChannelsConfig, updateWidgets: boolean) => {
    setConfig((prev) => {
      let updatedWidgets = prev.widgets;
      if (updateWidgets) {
        const currentHost = typeof window !== 'undefined' ? (window.location.hostname || 'localhost') : 'localhost';
        updatedWidgets = prev.widgets.map((w) => {
          // Update YouTube live chat widget
          if (w.platform === 'youtube' || w.url.includes('youtube.com/live_chat')) {
            const ytId = newChannels.youtube.replace(/^@/, '');
            const displayTitle = newChannels.youtubeHandle ? `@${newChannels.youtubeHandle.replace(/^@/, '')}` : ytId;
            return {
              ...w,
              title: `YouTube Live Chat (${displayTitle})`,
              url: `https://www.youtube.com/live_chat?v=${encodeURIComponent(ytId)}&embed_domain=${encodeURIComponent(currentHost)}&dark_theme=1`,
            };
          }
          // Update Twitch widget
          if ((w.platform === 'twitch' || w.url.includes('twitch.tv/embed')) && newChannels.twitch) {
            const twitchUser = newChannels.twitch.replace(/^@/, '');
            return {
              ...w,
              title: `Twitch Chat (${twitchUser})`,
              url: `https://www.twitch.tv/embed/${encodeURIComponent(twitchUser)}/chat?parent=${encodeURIComponent(currentHost)}&parent=samo2105.github.io&darkpopout`,
            };
          }
          // Update Kick widget
          if ((w.platform === 'kick' || w.url.includes('kick.com/popout')) && newChannels.kick) {
            const kickUser = newChannels.kick.replace(/^@/, '');
            return {
              ...w,
              title: `Kick Chat (${kickUser})`,
              url: `https://kick.com/popout/${encodeURIComponent(kickUser)}/chat`,
            };
          }
          // Update Streamlabs widgets (Event List / Chat Box)
          if (newChannels.streamlabsToken) {
            if (w.platform === 'eventlist' || w.url.includes('streamlabs.com/widgets/event-list')) {
              return {
                ...w,
                url: `https://streamlabs.com/widgets/event-list/v1/${newChannels.streamlabsToken}`,
              };
            }
            if ((w.platform === 'chatbox' && w.url.includes('streamlabs.com')) || w.url.includes('streamlabs.com/widgets/chat-box')) {
              return {
                ...w,
                url: `https://streamlabs.com/widgets/chat-box/v1/${newChannels.streamlabsToken}`,
              };
            }
          }
          return w;
        });
      }

      return {
        ...prev,
        channels: newChannels,
        widgets: updatedWidgets,
      };
    });
  };

  // Handle Save (Add or Update Widget)
  const handleSaveWidget = (
    widgetData: Omit<WidgetItem, 'id' | 'createdAt'>,
    existingId?: string
  ) => {
    if (existingId) {
      // Edit
      setConfig((prev) => ({
        ...prev,
        widgets: prev.widgets.map((w) =>
          w.id === existingId
            ? { ...w, ...widgetData }
            : w
        ),
      }));
    } else {
      // Add
      const newWidget: WidgetItem = {
        ...widgetData,
        id: `widget-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        createdAt: Date.now(),
      };
      setConfig((prev) => ({
        ...prev,
        widgets: [...prev.widgets, newWidget],
      }));
    }
  };

  // Handle Delete Widget
  const handleDeleteWidget = (id: string) => {
    setConfig((prev) => ({
      ...prev,
      widgets: prev.widgets.filter((w) => w.id !== id),
    }));
  };

  // Handle Edit Trigger
  const handleEditWidget = (widget: WidgetItem) => {
    setEditingWidget(widget);
    setIsAddModalOpen(true);
  };

  // Handle Toggle Column Span (1 vs 2 cols)
  const handleToggleSpan = (id: string) => {
    setConfig((prev) => ({
      ...prev,
      widgets: prev.widgets.map((w) => {
        if (w.id === id) {
          return {
            ...w,
            columnSpan: w.columnSpan === 2 ? 1 : 2,
          };
        }
        return w;
      }),
    }));
  };

  // Handle Toggle Theme Mode per widget: normal -> dark -> light -> normal
  const handleCycleWidgetTheme = (id: string) => {
    setConfig((prev) => ({
      ...prev,
      widgets: prev.widgets.map((w) => {
        if (w.id === id) {
          const currentMode: ThemeMode = w.themeMode || prev.themeMode || 'normal';
          let nextMode: ThemeMode = 'dark';
          if (currentMode === 'normal') nextMode = 'dark';
          else if (currentMode === 'dark') nextMode = 'light';
          else if (currentMode === 'light') nextMode = 'normal';

          return {
            ...w,
            themeMode: nextMode,
            highContrast: nextMode === 'dark',
          };
        }
        return w;
      }),
    }));
  };

  // Handle Global Theme Mode (Normal | Oscuro | Claro)
  const handleGlobalThemeChange = (newTheme: ThemeMode) => {
    setConfig((prev) => ({
      ...prev,
      themeMode: newTheme,
      widgets: prev.widgets.map((w) => ({
        ...w,
        themeMode: newTheme,
        highContrast: newTheme === 'dark',
      })),
    }));
  };

  // Handle Counter Size Change (sm | md | lg | xl)
  const handleUpdateCounterSize = (counterSize: CounterSize) => {
    setConfig((prev) => ({ ...prev, counterSize }));
  };

  // Run Real-Time Stream Health & Network Diagnostics
  const handleRefreshHealth = async () => {
    try {
      const summary = await runFullHealthDiagnostics();
      setHealthSummary(summary);
      if (summary.overallRating === 'poor' || summary.overallRating === 'offline') {
        setStreamAlerts((prev) => Array.from(new Set([...prev, summary.recommendation])));
      }
    } catch (err) {
      console.error('Error al ejecutar diagnósticos de red:', err);
    }
  };

  useEffect(() => {
    handleRefreshHealth();
    const healthInterval = setInterval(handleRefreshHealth, 30000);
    return () => clearInterval(healthInterval);
  }, []);

  // OBS WebSocket Integration Setup
  useEffect(() => {
    const obsConfig = config.obs || DEFAULT_OBS_CONFIG;
    const client = getObsClient(obsConfig);

    const unsubStatus = client.onStatusChange((status, err) => {
      setObsStatus(status);
      setObsErrorMsg(err);
    });

    const unsubStats = client.onStatsUpdate((newStats) => {
      setObsStats(newStats);
    });

    if (obsConfig.autoConnect && obsConfig.enabled) {
      client.connect();
    }

    return () => {
      unsubStatus();
      unsubStats();
    };
  }, [config.obs]);

  const handleConnectObs = () => {
    const client = getObsClient(config.obs || DEFAULT_OBS_CONFIG);
    client.connect();
  };

  const handleDisconnectObs = () => {
    const client = getObsClient(config.obs || DEFAULT_OBS_CONFIG);
    client.disconnect();
  };

  const handleSaveObsConfig = (newObsConfig: ObsConfig) => {
    setConfig((prev) => ({ ...prev, obs: newObsConfig }));
    const client = getObsClient(newObsConfig);
    client.updateConfig(newObsConfig);
    client.connect();
  };

  const handleToggleObsStream = async () => {
    const client = getObsClient(config.obs || DEFAULT_OBS_CONFIG);
    await client.toggleStream();
  };

  const handleToggleObsRecord = async () => {
    const client = getObsClient(config.obs || DEFAULT_OBS_CONFIG);
    await client.toggleRecord();
  };

  const handleUpdateWidgetFontScale = (widgetId: string, scale: number) => {
    setConfig((prev) => ({
      ...prev,
      widgets: prev.widgets.map((w) =>
        w.id === widgetId ? { ...w, fontScale: scale } : w
      ),
    }));
  };

  const currentThemeMode: ThemeMode = config.themeMode || 'normal';
  const isLight = currentThemeMode === 'light';
  const isDark = currentThemeMode === 'dark';

  // Handle Preset Apply
  const handleApplyPreset = (widgets: WidgetItem[], columns: GridColumns) => {
    setConfig((prev) => ({
      ...prev,
      columns,
      widgets,
    }));
  };

  // Reset to default
  const handleResetDefaults = () => {
    setConfig(DEFAULT_CONFIG);
  };

  const handleOpenAdd = () => {
    setEditingWidget(null);
    setIsAddModalOpen(true);
  };

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-200 ${
      isLight 
        ? 'bg-zinc-100 text-zinc-900' 
        : isDark 
        ? 'bg-black text-zinc-100' 
        : 'bg-zinc-950 text-zinc-100'
    }`}>
      {/* Top Navigation */}
      <Navbar
        columns={config.columns}
        onColumnsChange={handleColumnsChange}
        onOpenAddModal={handleOpenAdd}
        onOpenSettingsModal={() => setIsSettingsModalOpen(true)}
        onOpenPresetsModal={() => setIsPresetsModalOpen(true)}
        onOpenProfileModal={() => setIsProfileModalOpen(true)}
        channels={config.channels}
        totalWidgets={config.widgets.length}
        themeMode={currentThemeMode}
        onThemeChange={handleGlobalThemeChange}
      />

      {/* Live Viewers Bar */}
      <ViewerBar
        channels={config.channels}
        themeMode={currentThemeMode}
        counterSize={config.counterSize || 'md'}
        healthSummary={healthSummary}
        streamAlerts={streamAlerts}
        obsStatus={obsStatus}
        obsStats={obsStats}
        onUpdateChannels={handleUpdateChannels}
        onUpdateCounterSize={handleUpdateCounterSize}
        onOpenProfileModal={() => setIsProfileModalOpen(true)}
        onOpenHealthModal={() => setIsHealthModalOpen(true)}
        onOpenObsModal={() => setIsObsModalOpen(true)}
      />

      {/* Main Stream Activity Grid */}
      <main className="flex-1 max-w-[1920px] w-full mx-auto p-4 sm:p-5">
        <WidgetGrid
          widgets={config.widgets}
          columns={config.columns}
          dashboardTheme={currentThemeMode}
          dashboardFontScale={config.globalFontScale || 1.0}
          onDeleteWidget={handleDeleteWidget}
          onEditWidget={handleEditWidget}
          onToggleSpan={handleToggleSpan}
          onCycleTheme={handleCycleWidgetTheme}
          onUpdateFontScale={handleUpdateWidgetFontScale}
          onOpenAddModal={handleOpenAdd}
          onOpenPresetsModal={() => setIsPresetsModalOpen(true)}
        />
      </main>

      {/* Footer Info Bar */}
      <footer className={`border-t px-4 py-2.5 text-xs transition-colors ${
        isLight
          ? 'border-zinc-200 bg-white/90 text-zinc-600'
          : isDark
          ? 'border-zinc-900 bg-black text-zinc-400'
          : 'border-zinc-900 bg-zinc-950/80 text-zinc-500'
      }`}>
        <div className="max-w-[1920px] mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className={`flex items-center gap-1.5 ${isLight ? 'text-zinc-600' : 'text-zinc-400'}`}>
              <Layers className="w-3.5 h-3.5 text-purple-500" />
              <span>{config.widgets.length} widgets activos</span>
            </span>
            <span className={isLight ? 'text-zinc-300' : 'text-zinc-700'}>•</span>
            <span className={`flex items-center gap-1.5 ${isLight ? 'text-zinc-600' : 'text-zinc-400'}`}>
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Privacidad LocalStorage Activa</span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsPresetsModalOpen(true)}
              className="hover:text-purple-500 transition-colors flex items-center gap-1"
            >
              <Sparkles className="w-3 h-3 text-amber-500" />
              Plantillas Rápidas
            </button>
            <span className={isLight ? 'text-zinc-300' : 'text-zinc-700'}>•</span>
            <a
              href="https://github.com/samo2105/stream-activity-dashboard"
              target="_blank"
              rel="noreferrer"
              className={`transition-colors ${isLight ? 'hover:text-zinc-900 text-zinc-500' : 'hover:text-zinc-300 text-zinc-500'}`}
            >
              samo2105/stream-activity-dashboard
            </a>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        channels={config.channels}
        onSaveChannels={handleSaveChannels}
        widgets={config.widgets}
      />

      <AddWidgetModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingWidget(null);
        }}
        onSave={handleSaveWidget}
        editingWidget={editingWidget}
        channels={config.channels}
      />

      <PresetsModal
        isOpen={isPresetsModalOpen}
        onClose={() => setIsPresetsModalOpen(false)}
        onApplyPreset={handleApplyPreset}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        config={config}
        onUpdateConfig={setConfig}
        onResetDefaults={handleResetDefaults}
        onOpenHealthModal={() => {
          setIsSettingsModalOpen(false);
          setIsHealthModalOpen(true);
        }}
        onOpenObsModal={() => {
          setIsSettingsModalOpen(false);
          setIsObsModalOpen(true);
        }}
      />

      <StreamHealthModal
        isOpen={isHealthModalOpen}
        onClose={() => setIsHealthModalOpen(false)}
        healthSummary={healthSummary}
        onRefreshHealth={handleRefreshHealth}
        streamAlerts={streamAlerts}
      />

      <ObsModal
        isOpen={isObsModalOpen}
        onClose={() => setIsObsModalOpen(false)}
        config={config.obs || DEFAULT_OBS_CONFIG}
        status={obsStatus}
        stats={obsStats}
        errorMessage={obsErrorMsg}
        onConnect={handleConnectObs}
        onDisconnect={handleDisconnectObs}
        onSaveConfig={handleSaveObsConfig}
        onToggleStream={handleToggleObsStream}
        onToggleRecord={handleToggleObsRecord}
      />
    </div>
  );
}

export default App;
