import { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { ViewerBar } from './components/ViewerBar';
import { WidgetGrid } from './components/WidgetGrid';
import { AddWidgetModal } from './components/AddWidgetModal';
import { PresetsModal } from './components/PresetsModal';
import { SettingsModal } from './components/SettingsModal';
import { ProfileModal } from './components/ProfileModal';
import { DashboardConfig, WidgetItem, GridColumns, ChannelsConfig } from './types/widget';
import { loadDashboardConfig, saveDashboardConfig, DEFAULT_CONFIG } from './utils/storage';
import { ShieldCheck, Sparkles, Layers } from 'lucide-react';

export function App() {
  const [config, setConfig] = useState<DashboardConfig>(() => loadDashboardConfig());
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isPresetsModalOpen, setIsPresetsModalOpen] = useState<boolean>(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);
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
    <div className="min-h-screen flex flex-col bg-zinc-950 text-zinc-100">
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
      />

      {/* Live Viewers Bar */}
      <ViewerBar
        channels={config.channels}
        onUpdateChannels={handleUpdateChannels}
        onOpenProfileModal={() => setIsProfileModalOpen(true)}
      />

      {/* Main Stream Activity Grid */}
      <main className="flex-1 max-w-[1920px] w-full mx-auto p-4 sm:p-5">
        <WidgetGrid
          widgets={config.widgets}
          columns={config.columns}
          onDeleteWidget={handleDeleteWidget}
          onEditWidget={handleEditWidget}
          onToggleSpan={handleToggleSpan}
          onOpenAddModal={handleOpenAdd}
          onOpenPresetsModal={() => setIsPresetsModalOpen(true)}
        />
      </main>

      {/* Footer Info Bar */}
      <footer className="border-t border-zinc-900 bg-zinc-950/80 px-4 py-2.5 text-xs text-zinc-500">
        <div className="max-w-[1920px] mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-zinc-400">
              <Layers className="w-3.5 h-3.5 text-purple-400" />
              <span>{config.widgets.length} widgets activos</span>
            </span>
            <span className="text-zinc-700">•</span>
            <span className="flex items-center gap-1.5 text-zinc-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Privacidad LocalStorage Activa</span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsPresetsModalOpen(true)}
              className="hover:text-purple-400 transition-colors flex items-center gap-1"
            >
              <Sparkles className="w-3 h-3 text-amber-400" />
              Plantillas Rápidas
            </button>
            <span className="text-zinc-700">•</span>
            <a
              href="https://github.com/samo2105/stream-activity-dashboard"
              target="_blank"
              rel="noreferrer"
              className="hover:text-zinc-300 transition-colors"
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
      />
    </div>
  );
}

export default App;
