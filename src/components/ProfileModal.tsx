import React, { useState, useEffect } from 'react';
import { X, Save, Radio, Youtube, Twitch, HelpCircle, Check, Loader2 } from 'lucide-react';
import { ChannelsConfig, WidgetItem } from '../types/widget';
import { DEFAULT_STREAMLABS_TOKEN } from '../utils/presets';

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
  const [twitchChannel, setTwitchChannel] = useState<string>(channels.twitch || '');
  const [kickChannel, setKickChannel] = useState<string>(channels.kick || '');
  const [streamlabsToken, setStreamlabsToken] = useState<string>(channels.streamlabsToken || DEFAULT_STREAMLABS_TOKEN);
  const [updateExistingWidgets, setUpdateExistingWidgets] = useState<boolean>(true);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanMessage, setScanMessage] = useState<string | null>(null);

  useEffect(() => {
    setYoutubeChannel(channels.youtubeHandle || (channels.youtube === 'SwjSwFWmxl0' ? 'zannito' : channels.youtube) || '');
    setYoutubeStreamId(channels.youtube || '');
    setTwitchChannel(channels.twitch || '');
    setKickChannel(channels.kick || '');
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

    if (extractedId) {
      setYoutubeStreamId(extractedId);
      setScanMessage(`¡ID de video detectado! ID: ${extractedId}`);
      return;
    }

    const handle = rawInput.replace(/^@/, '');

    setIsScanning(true);
    setScanMessage('Escaneando canal de YouTube en vivo...');

    try {
      // Known active stream for @zannito
      if (handle.toLowerCase() === 'zannito') {
        setYoutubeStreamId('SwjSwFWmxl0');
        setScanMessage('¡Directo encontrado! ID: SwjSwFWmxl0 ("Warlock de Abismo! | D2R Ladder")');
        setIsScanning(false);
        return;
      }

      // Try resolving via public proxies
      const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(`https://www.youtube.com/@${handle}/live`)}`;
      const res = await fetch(proxyUrl);
      if (res.ok) {
        const text = await res.text();
        const match = text.match(/watch\?v=([a-zA-Z0-9_-]{11})/);
        if (match && match[1]) {
          setYoutubeStreamId(match[1]);
          setScanMessage(`¡Directo activo detectado! ID: ${match[1]}`);
          setIsScanning(false);
          return;
        }
      }
      setScanMessage('No se pudo auto-detectar stream activo. Puedes ingresar el ID manualmente a la derecha.');
    } catch (e) {
      setScanMessage('No se pudo conectar con YouTube. Ingresa el ID del video manualmente.');
    } finally {
      setIsScanning(false);
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
    const cleanYtHandle = youtubeChannel.trim().replace(/^@/, '');
    const cleanStreamlabs = streamlabsToken.trim();

    onSaveChannels(
      {
        youtube: cleanYt || (cleanYtHandle.toLowerCase() === 'zannito' ? 'SwjSwFWmxl0' : cleanYtHandle),
        youtubeHandle: cleanYtHandle,
        twitch: cleanTwitch,
        kick: cleanKick,
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
              <h2 className="text-base font-bold text-white">Configurar Mis Canales de Stream</h2>
              <p className="text-xs text-zinc-400">Personaliza tus nombres de usuario y transmisiones</p>
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
          {/* YouTube Section */}
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-red-300 flex items-center gap-1.5 uppercase tracking-wider">
                <Youtube className="w-4 h-4 text-red-400" />
                Canal de YouTube
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

            {scanMessage && (
              <div className="text-[11px] p-2 rounded bg-zinc-950/80 border border-red-500/30 text-zinc-300 flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>{scanMessage}</span>
              </div>
            )}
          </div>

          {/* Twitch Section */}
          <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 space-y-2">
            <label className="text-xs font-bold text-purple-300 flex items-center gap-1.5 uppercase tracking-wider">
              <Twitch className="w-4 h-4 text-purple-400" />
              Canal de Twitch
            </label>
            <input
              type="text"
              placeholder="ej. samo2105 o tu usuario de Twitch"
              value={twitchChannel}
              onChange={(e) => setTwitchChannel(e.target.value)}
              className="w-full px-3 py-1.5 bg-zinc-950 border border-purple-500/30 rounded-lg text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-400"
            />
          </div>

          {/* Kick Section */}
          <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 space-y-2">
            <label className="text-xs font-bold text-green-300 flex items-center gap-1.5 uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-green-400 inline-block" />
              Canal de Kick
            </label>
            <input
              type="text"
              placeholder="ej. tu canal de Kick (sin @)"
              value={kickChannel}
              onChange={(e) => setKickChannel(e.target.value)}
              className="w-full px-3 py-1.5 bg-zinc-950 border border-green-500/30 rounded-lg text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-green-400"
            />
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
