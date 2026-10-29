import { DashboardConfig, WidgetItem } from '../types/widget';
import { INITIAL_DEFAULT_WIDGETS, DEFAULT_STREAMLABS_TOKEN } from './presets';
import { DEFAULT_OBS_CONFIG } from './obsWebSocket';

const STORAGE_KEY = 'streampulse_dashboard_config_v4';

export const DEFAULT_CONFIG: DashboardConfig = {
  columns: 3,
  autoRefreshInterval: 0,
  themeMode: 'normal',
  counterSize: 'md',
  globalFontScale: 1.0,
  obs: DEFAULT_OBS_CONFIG,
  channels: {
    twitch: 'zannito21',
    kick: 'zannito21',
    youtube: '7aijN13K2nI',
    youtubeHandle: 'zannito',
    facebook: '',
    facebookAccessToken: '',
    streamlabsToken: DEFAULT_STREAMLABS_TOKEN,
    deductKickSelfView: true,
  },
  widgets: INITIAL_DEFAULT_WIDGETS,
};

export function loadDashboardConfig(): DashboardConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // Check legacy keys to migrate
      const legacy = localStorage.getItem('streampulse_dashboard_config_v3') || 
                     localStorage.getItem('streampulse_dashboard_config_v2') || 
                     localStorage.getItem('streampulse_dashboard_config_v1');
      if (legacy) {
        const parsedLegacy = JSON.parse(legacy);
        return {
          columns: parsedLegacy.columns || 3,
          autoRefreshInterval: parsedLegacy.autoRefreshInterval || 0,
          themeMode: parsedLegacy.themeMode || 'normal',
          counterSize: parsedLegacy.counterSize || 'md',
          channels: {
            twitch: parsedLegacy.channels?.twitch === 'samo2105' || !parsedLegacy.channels?.twitch ? 'zannito21' : parsedLegacy.channels.twitch,
            kick: parsedLegacy.channels?.kick || 'zannito21',
            youtube: parsedLegacy.channels?.youtube === 'SwjSwFWmxl0' || !parsedLegacy.channels?.youtube ? '7aijN13K2nI' : parsedLegacy.channels.youtube,
            youtubeHandle: parsedLegacy.channels?.youtubeHandle || 'zannito',
            facebook: parsedLegacy.channels?.facebook || '',
            facebookAccessToken: parsedLegacy.channels?.facebookAccessToken || '',
            streamlabsToken: parsedLegacy.channels?.streamlabsToken || DEFAULT_STREAMLABS_TOKEN,
            deductKickSelfView: parsedLegacy.channels?.deductKickSelfView ?? true,
          },
          widgets: DEFAULT_CONFIG.widgets,
        };
      }
      return DEFAULT_CONFIG;
    }
    const parsed = JSON.parse(raw);
    const resolvedToken = parsed.channels?.streamlabsToken || DEFAULT_STREAMLABS_TOKEN;

    return {
      columns: parsed.columns || 3,
      autoRefreshInterval: parsed.autoRefreshInterval || 0,
      themeMode: parsed.themeMode || 'normal',
      counterSize: parsed.counterSize || 'md',
      globalFontScale: typeof parsed.globalFontScale === 'number' ? parsed.globalFontScale : 1.0,
      obs: parsed.obs || DEFAULT_OBS_CONFIG,
      channels: {
        twitch: parsed.channels?.twitch === 'samo2105' || !parsed.channels?.twitch ? 'zannito21' : parsed.channels.twitch,
        kick: !parsed.channels?.kick || parsed.channels?.kick === 'samo2105' ? 'zannito21' : parsed.channels.kick,
        youtube: parsed.channels?.youtube === 'SwjSwFWmxl0' || !parsed.channels?.youtube ? '7aijN13K2nI' : parsed.channels.youtube,
        youtubeHandle: parsed.channels?.youtubeHandle || 'zannito',
        youtubeApiKey: parsed.channels?.youtubeApiKey || undefined,
        facebook: parsed.channels?.facebook || '',
        facebookPageId: parsed.channels?.facebookPageId || undefined,
        facebookAccessToken: parsed.channels?.facebookAccessToken || undefined,
        streamlabsToken: resolvedToken,
        deductKickSelfView: parsed.channels?.deductKickSelfView ?? true,
      },
      widgets: Array.isArray(parsed.widgets) 
        ? parsed.widgets.map((w: WidgetItem) => {
            // Fix broken 404 kick demo
            if (w.url?.includes('kick.com/popout/samo2105/chat')) {
              return { ...w, url: 'https://kick.com/popout/zannito21/chat' };
            }
            // Upgrade legacy YouTube video ID to active live stream ID
            if (w.url?.includes('youtube.com/live_chat') && w.url?.includes('v=SwjSwFWmxl0')) {
              w = { ...w, url: w.url.replace('v=SwjSwFWmxl0', 'v=7aijN13K2nI') };
            }
            // Automatically upgrade legacy broken popout URLs to embed
            if (w.url?.includes('twitch.tv/popout/')) {
              return {
                ...w,
                url: w.url.replace('/popout/', '/embed/').concat('&parent=samo2105.github.io'),
              };
            }
            // Automatically ensure YouTube live chat has dark_theme=1
            if (w.url?.includes('youtube.com/live_chat')) {
              let updatedUrl = w.url;
              if (!updatedUrl.includes('dark_theme=1')) {
                updatedUrl += `${updatedUrl.includes('?') ? '&' : '?'}dark_theme=1`;
              }
              return { ...w, url: updatedUrl };
            }
            // Auto-upgrade empty demo-eventlist or about:blank eventlist to user's Streamlabs Event List
            if (w.platform === 'eventlist' && (w.url === 'about:blank' || !w.url || w.url.includes('TU_TOKEN'))) {
              return {
                ...w,
                title: 'Streamlabs Event List',
                url: `https://streamlabs.com/widgets/event-list/v1/${resolvedToken}`,
              };
            }
            if ((w.platform === 'chatbox' || (w.platform === 'streamlabs' && w.url?.includes('chat-box'))) && (w.url === 'about:blank' || !w.url || w.url.includes('TU_TOKEN'))) {
              return {
                ...w,
                title: 'Streamlabs Chat Box',
                url: `https://streamlabs.com/widgets/chat-box/v1/${resolvedToken}`,
              };
            }
            return {
              ...w,
              fontScale: typeof w.fontScale === 'number' ? w.fontScale : undefined,
              themeMode: w.themeMode || (w.highContrast ? 'dark' : 'normal'),
            };
          })
        : DEFAULT_CONFIG.widgets,
    };
  } catch (error) {
    console.error('Error al cargar la configuración de localStorage:', error);
    return DEFAULT_CONFIG;
  }
}

export function saveDashboardConfig(config: DashboardConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (error) {
    console.error('Error al guardar en localStorage:', error);
  }
}

export function exportConfigToFile(config: DashboardConfig): void {
  const json = JSON.stringify(config, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `streampulse-backup-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function parseConfigFile(jsonString: string): DashboardConfig | null {
  try {
    const data = JSON.parse(jsonString);
    if (data && Array.isArray(data.widgets)) {
      return {
        columns: [1, 2, 3, 4].includes(data.columns) ? data.columns : 3,
        autoRefreshInterval: typeof data.autoRefreshInterval === 'number' ? data.autoRefreshInterval : 0,
        channels: {
          twitch: data.channels?.twitch || '',
          kick: data.channels?.kick || '',
          youtube: data.channels?.youtube || '',
          youtubeHandle: data.channels?.youtubeHandle || '',
          youtubeApiKey: data.channels?.youtubeApiKey || undefined,
          streamlabsToken: data.channels?.streamlabsToken || DEFAULT_STREAMLABS_TOKEN,
        },
        widgets: data.widgets,
      };
    }
  } catch (e) {
    console.error('Archivo de configuración inválido:', e);
  }
  return null;
}
