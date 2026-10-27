import { WidgetPlatform, WidgetItem } from '../types/widget';

export interface PlatformPreset {
  platform: WidgetPlatform;
  name: string;
  badgeBg: string;
  badgeText: string;
  borderColor: string;
  placeholderUrl: string;
  guideText: string;
  defaultTitle: string;
}

export const PLATFORM_PRESETS: Record<WidgetPlatform, PlatformPreset> = {
  eventlist: {
    platform: 'eventlist',
    name: 'Event List (URL Directa)',
    badgeBg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    badgeText: 'Event List',
    borderColor: 'border-emerald-500/40',
    placeholderUrl: 'https://streamlabs.com/widgets/event-list/v1/... o https://streamelements.com/overlay/...',
    guideText: 'Pega la URL de tu fuente de navegador para Lista de Eventos (Streamlabs Event List, StreamElements Activity Feed, etc.). Muestra follows, subs, bits y donaciones en tiempo real.',
    defaultTitle: 'Lista de Eventos (Event List)',
  },
  chatbox: {
    platform: 'chatbox',
    name: 'Chat Box (URL Directa)',
    badgeBg: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    badgeText: 'Chat Box',
    borderColor: 'border-purple-500/40',
    placeholderUrl: 'https://streamlabs.com/widgets/chat-box/v1/... o https://botrix.live/widgets/chat/...',
    guideText: 'Pega la URL de tu widget de Caja de Chat (Streamlabs Chatbox, StreamElements Chatbox, BotRix o chat unificado). Ideal para incrustar sin restricciones de iframe.',
    defaultTitle: 'Caja de Chat (Chat Box)',
  },
  streamlabs: {
    platform: 'streamlabs',
    name: 'Streamlabs (Eventos / Alertas)',
    badgeBg: 'bg-teal-500/20 text-teal-400 border-teal-500/30',
    badgeText: 'Streamlabs',
    borderColor: 'border-teal-500/40',
    placeholderUrl: 'https://streamlabs.com/widgets/event-list/v1/TU_TOKEN_AQUI',
    guideText: 'Ve a tu Streamlabs Dashboard -> Widgets -> Event List o Chat Box -> Copia la "URL de la fuente del navegador".',
    defaultTitle: 'Streamlabs Event List',
  },
  streamelements: {
    platform: 'streamelements',
    name: 'StreamElements (Activity Feed)',
    badgeBg: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    badgeText: 'StreamElements',
    borderColor: 'border-blue-500/40',
    placeholderUrl: 'https://streamelements.com/overlay/TU_OVERLAY_ID/activity-feed',
    guideText: 'Ve a StreamElements -> Herramientas de streaming -> Overlays o Activity Feed -> Copia la URL del Overlay.',
    defaultTitle: 'StreamElements Feed',
  },
  twitch: {
    platform: 'twitch',
    name: 'Twitch (Embed Chat Oficial)',
    badgeBg: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    badgeText: 'Twitch',
    borderColor: 'border-purple-500/40',
    placeholderUrl: 'https://www.twitch.tv/embed/TU_CANAL/chat?parent=DOMINIO&darkpopout',
    guideText: 'Twitch exige que el parámetro "parent" coincida con el dominio del panel (ej. samo2105.github.io). Nuestro generador lo configura automáticamente.',
    defaultTitle: 'Twitch Chat',
  },
  kick: {
    platform: 'kick',
    name: 'Kick (Chat Popout)',
    badgeBg: 'bg-green-500/20 text-green-400 border-green-500/30',
    badgeText: 'Kick',
    borderColor: 'border-green-500/40',
    placeholderUrl: 'https://kick.com/popout/TU_CANAL/chat',
    guideText: 'Escribe tu usuario de Kick para incrustar la ventana emergente de chat directo.',
    defaultTitle: 'Kick Chat',
  },
  youtube: {
    platform: 'youtube',
    name: 'YouTube Live (Chat)',
    badgeBg: 'bg-red-500/20 text-red-400 border-red-500/30',
    badgeText: 'YouTube',
    borderColor: 'border-red-500/40',
    placeholderUrl: 'https://www.youtube.com/live_chat?v=ID_VIDEO&embed_domain=DOMINIO',
    guideText: 'Introduce el ID de tu transmisión en vivo de YouTube (el parámetro "v" de la URL del stream).',
    defaultTitle: 'YouTube Live Chat',
  },
  botrix: {
    platform: 'botrix',
    name: 'BotRix (Widgets / Chat Unificado)',
    badgeBg: 'bg-violet-500/20 text-violet-400 border-violet-500/30',
    badgeText: 'BotRix',
    borderColor: 'border-violet-500/40',
    placeholderUrl: 'https://botrix.live/widgets/TU_WIDGET_ID',
    guideText: 'Copia la URL del widget de chat o alertas creada en BotRix para Kick/Twitch/YouTube.',
    defaultTitle: 'BotRix Chat / Alerts',
  },
  tiktok: {
    platform: 'tiktok',
    name: 'TikTok Live (Web Fuente)',
    badgeBg: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
    badgeText: 'TikTok',
    borderColor: 'border-pink-500/40',
    placeholderUrl: 'https://tikfinity.zerody.one/widget/...',
    guideText: 'Utiliza la URL de widget de eventos generada por TikFinity u otra herramienta de navegador para TikTok Live.',
    defaultTitle: 'TikTok Live Feed',
  },
  custom: {
    platform: 'custom',
    name: 'URL Personalizada / OBS Browser Source',
    badgeBg: 'bg-zinc-700/40 text-zinc-300 border-zinc-600',
    badgeText: 'Custom Web',
    borderColor: 'border-zinc-700',
    placeholderUrl: 'https://...',
    guideText: 'Pega cualquier URL HTTPS de un widget de navegador, contador de metas, alertas o página web compatible.',
    defaultTitle: 'Widget Personalizado',
  },
};

export const DEFAULT_STREAMLABS_TOKEN = '36D393A46BDD70CA895A67745E9C82D3A50BC2EE7899917F637E9BFC43EF2F8097BBFFF6E8ADC7A03BD3A0481B4C4F666FD00AA70A3940B03D38B9ECF8FE937B4360AF61A7D409D8F9F2571A3468C8B9F13789968F5EA92478B4EF968A1081BAE9618AAEC3FD38D3524A3509880D54DCFA5A9A931779B0F3ED37A6E9BE';

export const INITIAL_DEFAULT_WIDGETS: WidgetItem[] = [
  {
    id: 'user-streamlabs-chatbox',
    title: 'Streamlabs Chat Box',
    platform: 'chatbox',
    url: `https://streamlabs.com/widgets/chat-box/v1/${DEFAULT_STREAMLABS_TOKEN}`,
    columnSpan: 1,
    createdAt: Date.now() - 3000,
  },
  {
    id: 'user-youtube-live-chat',
    title: 'YouTube Live Chat (@zannito)',
    platform: 'youtube',
    url: 'https://www.youtube.com/live_chat?v=SwjSwFWmxl0&embed_domain=samo2105.github.io&dark_theme=1',
    columnSpan: 1,
    createdAt: Date.now() - 2000,
  },
  {
    id: 'user-streamlabs-eventlist',
    title: 'Streamlabs Event List',
    platform: 'eventlist',
    url: `https://streamlabs.com/widgets/event-list/v1/${DEFAULT_STREAMLABS_TOKEN}`,
    columnSpan: 1,
    createdAt: Date.now() - 1000,
  },
];
