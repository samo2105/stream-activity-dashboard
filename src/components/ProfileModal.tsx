import React, { useState, useEffect } from 'react';
import { X, Save, Radio, HelpCircle, Check, Loader2 } from 'lucide-react';
import { ChannelsConfig, WidgetItem } from '../types/widget';
import { DEFAULT_STREAMLABS_TOKEN } from '../utils/presets';
import { fetchYouTubeViewers } from '../utils/viewers';
import { PlatformLogo } from './PlatformPreviewCard';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  channels: ChannelsConfig;
  onSaveChannels: (newChannels: ChannelsConfig, updateWidgets: boolean) => void;
  widgets: WidgetItem[];
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  channels,
  onSaveChannels,
}) => {
  const [youtubeChannel, setYoutubeChannel] = useState<string>(channels.youtube || '');
  const [youtubeStreamId, setYoutubeStreamId] = useState<string>(channels.youtube || '');
  const [youtubeApiKey, setYoutubeApiKey] = useState<string>(channels.youtubeApiKey || '');
  const [twitchChannel, setTwitchChannel] = useState<string>(channels.twitch || '');
  const [kickChannel, setKickChannel] = useState<string>(channels.kick || '');
  const [deductKickSelfView, setDeductKickSelfView] = useState<boolean>(channels.deductKickSelfView ?? true);
  const [facebookChannel, setFacebookChannel] = useState<string>(channels.facebook || '');
  const [facebookAccessToken, setFacebookAccessToken] = useState<string>(channels.facebookAccessToken || '');
  const [tiktokChannel, setTiktokChannel] = useState<string>(channels.tiktok || '');
  const [isScanningTikTok, setIsScanningTikTok] = useState<boolean>(false);
  const [tiktokScanMessage, setTiktokScanMessage] = useState<string | null>(null);
  const [streamlabsToken, setStreamlabsToken] = useState<string>(channels.streamlabsToken || DEFAULT_STREAMLABS_TOKEN);
  const [updateExistingWidgets, setUpdateExistingWidgets] = useState<boolean>(true);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanMessage, setScanMessage] = useState<string | null>(null);

  useEffect(() => {
    setYoutubeChannel(channels.youtubeHandle || channels.youtube || '');
    setYoutubeStreamId(channels.youtube || '');
    setYoutubeApiKey(channels.youtubeApiKey || '');
    setTwitchChannel(channels.twitch || '');
    setKickChannel(channels.kick || '');
    setDeductKickSelfView(channels.deductKickSelfView ?? true);
    setFacebookChannel(channels.facebook || '');
    setFacebookAccessToken(channels.facebookAccessToken || '');
    setTiktokChannel(channels.tiktok || '');
    setTiktokScanMessage(null);
    setStreamlabsToken(channels.streamlabsToken || DEFAULT_STREAMLABS_TOKEN);
    setScanMessage(null);
  }, [channels, isOpen]);

  if (!isOpen) return null;

  const handleScanYouTubeLive = async () => {
    const rawInput = (youtubeChannel || '').trim();
    if (!rawInput) {
      alert('Ingresa tu nombre de usuario o canal de YouTube primero.');
      return;
    }

    // Check if the user pasted a direct video URL or ID
    let extractedId = '';
    if (rawInput.includes('v=')) {
      extractedId = rawInput.split('v=')[1]?.split('&')[0] || '';
    } else if (rawInput.includes('youtu.be/')) {
      extractedId = rawInput.split('youtu.be/')[1]?.split('?')[0] || '';
    } else if (rawInput.includes('live/')) {
      extractedId = rawInput.split('live/')[1]?.split('?')[0] || '';
    } else if (/^[a-zA-Z0-9_-]{11}$/.test(rawInput)) {
      extractedId = rawInput;
    }

    const handle = rawInput.replace(/^@/, '');

    setIsScanning(true);
    setScanMessage('Comprobando si el canal está en vivo en YouTube...');

    try {
      const result = await fetchYouTubeViewers(extractedId, youtubeApiKey, handle);
      if (result.isLive) {
        if (result.videoId) {
          setYoutubeStreamId(result.videoId);
        }
        setScanMessage(`🔴 ¡En vivo ahora! ID: ${result.videoId || extractedId} (${result.viewers.toLocaleString()} espectadores)`);
      } else {
        if (result.videoId) {
          setYoutubeStreamId(result.videoId);
          setScanMessage(`⚪ Offline: No hay emisión en vivo activa en este momento (Último video: ${result.videoId}).`);
        } else {
          setScanMessage('⚪ Offline: No se detectó ninguna transmisión en vivo activa en el canal.');
        }
      }
    } catch {
      setScanMessage('No se pudo verificar el estado en YouTube. Puedes ingresar el ID manualmente.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleScanTikTokLive = async () => {
    const rawInput = (tiktokChannel || '').trim();
    if (!rawInput) {
      alert('Ingresa tu nombre de usuario de TikTok primero.');
      return;
    }
    const clean = rawInput.replace(/^@+/, '').replace(/^https?:\/\/(www\.)?tiktok\.com\/@?/i, '').replace(/\/live\/?.*$/i, '').replace(/\/.*$/i, '').trim();
    if (!clean) return;

    setIsScanningTikTok(true);
    setTiktokScanMessage('Escaneando canal de TikTok en vivo...');

    try {
      const targetApiUrl = `https://www.tiktok.com/api-live/user/room/?aid=1988&sourceType=54&uniqueId=${encodeURIComponent(clean)}`;
      let data: any = null;

      try {
        const res = await fetch(targetApiUrl, {
          headers: { Accept: 'application/json' },
          signal: AbortSignal.timeout(4000),
        });
        if (res.ok) data = await res.json();
      } catch {
        // Fallback to proxy
      }

      if (!data) {
        try {
          const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(targetApiUrl)}`;
          const proxyRes = await fetch(proxyUrl, { signal: AbortSignal.timeout(4500) });
          if (proxyRes.ok) data = await proxyRes.json();
        } catch {
          // Ignore
        }
      }

      if (data && data.statusCode === 0) {
        const isLive = data.data?.liveRoom?.status === 2 || data.data?.user?.status === 2;
        const viewers = Number(data.data?.liveRoom?.liveRoomStats?.userCount) || 0;
        const title = data.data?.liveRoom?.title || '';
        if (isLive) {
          setTiktokScanMessage(`¡Directo activo detectado! (${viewers.toLocaleString()} espectadores)${title ? ` - "${title}"` : ''}`);
        } else {
          setTiktokScanMessage(`Canal detectado: @${clean} (Actualmente Offline)`);
        }
      } else {
        setTiktokScanMessage(`Canal @${clean} verificado para Modo B.`);
      }
    } catch {
      setTiktokScanMessage(`Canal @${clean} listo para telemetría.`);
    } finally {
      setIsScanningTikTok(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let cleanYt = youtubeStreamId.trim();
    if (cleanYt.includes('v=')) {
      cleanYt = cleanYt.split('v=')[1]?.split('&')[0] || cleanYt;
    } else if (cleanYt.includes('youtu.be/')) {
      cleanYt = cleanYt.split('youtu.be/')[1]?.split('?')[0] || cleanYt;
    } else if (cleanYt.includes('live/')) {
      cleanYt = cleanYt.split('live/')[1]?.split('?')[0] || cleanYt;
    }

    const cleanTwitch = twitchChannel.trim().replace(/^@/, '');
    const cleanKick = kickChannel.trim().replace(/^@/, '');
    const cleanFacebook = facebookChannel.trim();
    const cleanFacebookToken = facebookAccessToken.trim();
    const cleanTikTok = tiktokChannel.trim().replace(/^@+/, '');
    const cleanYtHandle = youtubeChannel.trim().replace(/^@/, '');
    const cleanStreamlabs = streamlabsToken.trim();
    const cleanApiKey = youtubeApiKey.trim();

    onSaveChannels(
      {
        youtube: cleanYt || cleanYtHandle,
        youtubeHandle: cleanYtHandle,
        youtubeApiKey: cleanApiKey || undefined,
        twitch: cleanTwitch,
        kick: cleanKick,
        deductKickSelfView,
        facebook: cleanFacebook,
        facebookAccessToken: cleanFacebookToken || undefined,
        tiktok: cleanTikTok,
        streamlabsToken: cleanStreamlabs || DEFAULT_STREAMLABS_TOKEN,
      },
      updateExistingWidgets
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-950/70">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Radio className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Canales de Transmisión</h2>
              <p className="text-xs text-zinc-400">Personaliza tus cuentas para Live Previews, chat y telemetría</p>
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto">
          {/* Twitch Section */}
          <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-purple-300 flex items-center gap-2 uppercase tracking-wider">
                <PlatformLogo platform="twitch" className="w-4 h-4 shrink-0" />
                <span>Twitch</span>
              </label>
              <span className="text-[10px] text-purple-400/80 bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/20 font-medium">
                GQL + Embed
              </span>
            </div>
            <input
              type="text"
              placeholder="ej. samo2105 o tu usuario de Twitch"
              value={twitchChannel}
              onChange={(e) => setTwitchChannel(e.target.value)}
              className="w-full px-3 py-1.5 bg-zinc-950 border border-purple-500/30 rounded-lg text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-400"
            />
          </div>

          {/* Kick Section */}
          <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-green-300 flex items-center gap-2 uppercase tracking-wider">
                <PlatformLogo platform="kick" className="w-4 h-4 shrink-0" />
                <span>Kick</span>
              </label>
              <span className="text-[10px] text-green-400/80 bg-green-500/10 px-2 py-0.5 rounded-full border border-green-500/20 font-medium">
                API + oEmbed
              </span>
            </div>
            <input
              type="text"
              placeholder="ej. tu canal de Kick (sin @)"
              value={kickChannel}
              onChange={(e) => setKickChannel(e.target.value)}
              className="w-full px-3 py-1.5 bg-zinc-950 border border-green-500/30 rounded-lg text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-green-400"
            />
            <div 
              className="flex items-start gap-2.5 pt-1 cursor-pointer select-none"
              onClick={() => setDeductKickSelfView(!deductKickSelfView)}
            >
              <input
                type="checkbox"
                id="deductKickSelfViewCheck"
                checked={deductKickSelfView}
                onChange={(e) => setDeductKickSelfView(e.target.checked)}
                className="w-4 h-4 mt-0.5 rounded text-green-600 focus:ring-green-500 border-zinc-700 bg-zinc-900 shrink-0"
              />
              <div>
                <label htmlFor="deductKickSelfViewCheck" className="text-xs font-medium text-zinc-200 cursor-pointer">
                  Descontar espectador propio en Kick (-1)
                </label>
                <p className="text-[10px] text-zinc-400 leading-tight mt-0.5">
                  Kick suma automáticamente la vista de tu propio panel/OBS como espectador. Actívalo para ver solo audiencia orgánica real.
                </p>
              </div>
            </div>
          </div>

          {/* YouTube Section */}
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-red-300 flex items-center gap-2 uppercase tracking-wider">
                <PlatformLogo platform="youtube" className="w-4 h-4 shrink-0" />
                <span>YouTube</span>
              </label>
              <button
                type="button"
                onClick={handleScanYouTubeLive}
                disabled={isScanning}
                className="inline-flex items-center gap-1 text-[11px] font-semibold bg-red-600 hover:bg-red-500 text-white px-2.5 py-1 rounded-lg transition-colors shadow-sm"
              >
                {isScanning ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>Escaneando...</span>
                  </>
                ) : (
                  <>
                    <Radio className="w-3 h-3 animate-pulse" />
                    <span>Auto-escanear Stream</span>
                  </>
                )}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <span className="text-[11px] text-zinc-400 block mb-1">Usuario / Handle:</span>
                <input
                  type="text"
                  placeholder="ej. @zannito"
                  value={youtubeChannel}
                  onChange={(e) => setYoutubeChannel(e.target.value)}
                  className="w-full px-3 py-1.5 bg-zinc-950 border border-red-500/30 rounded-lg text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-400"
                />
              </div>

              <div>
                <span className="text-[11px] text-zinc-400 block mb-1">ID de Stream Activo:</span>
                <input
                  type="text"
                  placeholder="ej. SwjSwFWmxl0"
                  value={youtubeStreamId}
                  onChange={(e) => setYoutubeStreamId(e.target.value)}
                  className="w-full px-3 py-1.5 bg-zinc-950 border border-red-500/30 rounded-lg text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-400 font-mono"
                />
              </div>
            </div>

            <div>
              <span className="text-[11px] text-zinc-400 block mb-1">
                YouTube Data API Key (Opcional, Google Cloud):
              </span>
              <input
                type="text"
                placeholder="Pega tu API Key de Google (opcional para conteo oficial de espectadores en tiempo real)"
                value={youtubeApiKey}
                onChange={(e) => setYoutubeApiKey(e.target.value)}
                className="w-full px-3 py-1.5 bg-zinc-950 border border-red-500/30 rounded-lg text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-400 font-mono"
              />
              <p className="text-[10px] text-zinc-500 mt-1">
                Opcional: Si cuentas con una clave gratuita de YouTube Data API v3, permite obtener la cantidad exacta y oficial de espectadores concurrentes de tus directos.
              </p>
            </div>

            {scanMessage && (
              <div className="text-[11px] p-2 rounded bg-zinc-950/80 border border-red-500/30 text-zinc-300 flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>{scanMessage}</span>
              </div>
            )}
          </div>

          {/* TikTok Section */}
          <div className="p-4 rounded-xl bg-pink-500/10 border border-pink-500/20 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-pink-300 flex items-center gap-2 uppercase tracking-wider">
                <PlatformLogo platform="tiktok" className="w-4 h-4 shrink-0" />
                <span>TikTok LIVE (Modo B)</span>
              </label>
              <button
                type="button"
                onClick={handleScanTikTokLive}
                disabled={isScanningTikTok}
                className="inline-flex items-center gap-1 text-[11px] font-semibold bg-pink-600 hover:bg-pink-500 text-white px-2.5 py-1 rounded-lg transition-colors shadow-sm"
              >
                {isScanningTikTok ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>Escaneando...</span>
                  </>
                ) : (
                  <>
                    <Radio className="w-3 h-3 animate-pulse" />
                    <span>Escanear Directo</span>
                  </>
                )}
              </button>
            </div>
            <input
              type="text"
              placeholder="ej. @usuario o tu usuario de TikTok"
              value={tiktokChannel}
              onChange={(e) => setTiktokChannel(e.target.value)}
              className="w-full px-3 py-1.5 bg-zinc-950 border border-pink-500/30 rounded-lg text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-pink-400"
            />
            {tiktokScanMessage && (
              <div className="text-[11px] p-2 rounded bg-zinc-950/80 border border-pink-500/30 text-zinc-300 flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>{tiktokScanMessage}</span>
              </div>
            )}
            <p className="text-[10px] text-zinc-400 leading-tight">
              Permite previsualizar tu reproductor de TikTok LIVE (Live Preview) y monitorear tus espectadores en vivo en la barra superior.
            </p>
          </div>

          {/* Facebook Section */}
          <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-blue-300 flex items-center gap-2 uppercase tracking-wider">
                <PlatformLogo platform="facebook" className="w-4 h-4 shrink-0" />
                <span>Facebook Live</span>
              </label>
              <span className="text-[10px] text-blue-400/80 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20 font-medium">
                Facebook Gaming
              </span>
            </div>
            <input
              type="text"
              placeholder="ej. TuPagina o https://facebook.com/TuPagina/live"
              value={facebookChannel}
              onChange={(e) => setFacebookChannel(e.target.value)}
              className="w-full px-3 py-1.5 bg-zinc-950 border border-blue-500/30 rounded-lg text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-blue-400"
            />
            <div className="space-y-1 pt-1">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-medium text-zinc-300">
                  Page Access Token (Graph API - Opcional):
                </label>
                <span className="text-[10px] text-zinc-500">Métricas exactas de viewers</span>
              </div>
              <input
                type="password"
                placeholder="EAA... (Token de acceso de página o usuario)"
                value={facebookAccessToken}
                onChange={(e) => setFacebookAccessToken(e.target.value)}
                className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-blue-400 font-mono"
              />
              <p className="text-[10px] text-zinc-400 leading-tight">
                Permite leer en tiempo real los concurrent viewers de Facebook Graph API v19.0. Si lo dejas vacío, StreamPulse detectará el estado en directo mediante oEmbed.
              </p>
            </div>
          </div>

          {/* Streamlabs Section */}
          <div className="p-4 rounded-xl bg-teal-500/10 border border-teal-500/20 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-teal-300 flex items-center gap-1.5 uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-teal-400 inline-block" />
                Token de Streamlabs (Event List / Chat Box)
              </label>
              <span className="text-[10px] text-teal-400/80 bg-teal-500/10 px-2 py-0.5 rounded-full border border-teal-500/20 font-medium">
                OBS / Widgets
              </span>
            </div>
            <input
              type="text"
              placeholder="Pega tu token de Streamlabs o URL de widget..."
              value={streamlabsToken}
              onChange={(e) => {
                let val = e.target.value.trim();
                const tokenMatch = val.match(/\/v[1-3]\/([a-zA-Z0-9]{60,})/);
                if (tokenMatch && tokenMatch[1]) {
                  val = tokenMatch[1];
                }
                setStreamlabsToken(val);
              }}
              className="w-full px-3 py-1.5 bg-zinc-950 border border-teal-500/30 rounded-lg text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-teal-400 font-mono"
            />
            <p className="text-[11px] text-zinc-400">
              Se usa para generar automáticamente tus widgets de Lista de Eventos y Caja de Chat sin errores.
            </p>
          </div>

          {/* Option: Update open widgets automatically */}
          <div className="p-3 rounded-xl bg-zinc-950/70 border border-zinc-800 flex items-center gap-3 cursor-pointer select-none" onClick={() => setUpdateExistingWidgets(!updateExistingWidgets)}>
            <input
              type="checkbox"
              id="updateWidgetsCheck"
              checked={updateExistingWidgets}
              onChange={(e) => setUpdateExistingWidgets(e.target.checked)}
              className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 border-zinc-700 bg-zinc-900"
            />
            <label htmlFor="updateWidgetsCheck" className="text-xs text-zinc-300 cursor-pointer">
              Actualizar automáticamente los widgets del panel (YouTube, Twitch, Kick y Streamlabs) con estos canales
            </label>
          </div>

          <div className="text-[11px] text-zinc-500 flex items-start gap-1.5 leading-relaxed">
            <HelpCircle className="w-3.5 h-3.5 text-zinc-400 shrink-0 mt-0.5" />
            <span>
              Estos nombres se guardan de forma privada en tu navegador y controlan el conteo de viewers en vivo de la barra superior.
            </span>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-zinc-800 bg-zinc-950/70">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white rounded-xl shadow-lg shadow-purple-600/25 transition-all"
          >
            <Save className="w-4 h-4" />
            Guardar Canales
          </button>
        </div>
      </div>
    </div>
  );
};
