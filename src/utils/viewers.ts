import { ChannelsConfig, ViewerStats } from '../types/widget';

export async function fetchTwitchViewers(channel: string): Promise<{ viewers: number; isLive: boolean; error?: string }> {
  if (!channel.trim()) {
    return { viewers: 0, isLive: false };
  }
  try {
    const cleanChannel = channel.trim().toLowerCase();
    const res = await fetch(`https://decapi.me/twitch/viewercount/${cleanChannel}`);
    if (!res.ok) {
      return { viewers: 0, isLive: false, error: 'No se pudo consultar Twitch' };
    }
    const text = (await res.text()).trim();
    if (text.includes('offline') || text.includes('not found') || text.includes('User not found')) {
      return { viewers: 0, isLive: false };
    }
    const count = parseInt(text.replace(/,/g, ''), 10);
    if (!isNaN(count)) {
      return { viewers: count, isLive: true };
    }
    return { viewers: 0, isLive: false };
  } catch (err) {
    return { viewers: 0, isLive: false, error: 'Error de conexión con Twitch' };
  }
}

export async function fetchKickViewers(channel: string): Promise<{ viewers: number; isLive: boolean; error?: string }> {
  if (!channel.trim()) {
    return { viewers: 0, isLive: false };
  }
  const cleanChannel = channel.trim().toLowerCase();

  // Try direct Kick API first
  try {
    const res = await fetch(`https://kick.com/api/v2/channels/${cleanChannel}`, {
      headers: {
        Accept: 'application/json',
      },
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.livestream && data.livestream.is_live) {
        return {
          viewers: Number(data.livestream.viewer_count) || 0,
          isLive: true,
        };
      }
      return { viewers: 0, isLive: false };
    }
  } catch (directErr) {
    // If direct fails (CORS or network), fallback to proxy
  }

  // Fallback via CORS-friendly mirror proxy
  try {
    const proxyRes = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(`https://kick.com/api/v2/channels/${cleanChannel}`)}`);
    if (proxyRes.ok) {
      const data = await proxyRes.json();
      if (data && data.livestream && data.livestream.is_live) {
        return {
          viewers: Number(data.livestream.viewer_count) || 0,
          isLive: true,
        };
      }
    }
    return { viewers: 0, isLive: false };
  } catch (proxyErr) {
    return { viewers: 0, isLive: false, error: 'Kick no disponible' };
  }
}

export async function fetchYouTubeViewers(videoIdOrChannel: string): Promise<{ viewers: number; isLive: boolean; error?: string }> {
  if (!videoIdOrChannel.trim()) {
    return { viewers: 0, isLive: false };
  }
  let id = videoIdOrChannel.trim();
  if (id.includes('v=')) {
    id = id.split('v=')[1]?.split('&')[0] || id;
  } else if (id.includes('youtu.be/')) {
    id = id.split('youtu.be/')[1]?.split('?')[0] || id;
  } else if (id.includes('live/')) {
    id = id.split('live/')[1]?.split('?')[0] || id;
  }

  try {
    // Check if video is live using YouTube oEmbed / public stream data
    const res = await fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${id}`);
    if (res.ok) {
      const data = await res.json();
      if (data && data.title) {
        // Stream exists and is active
        return { viewers: 1, isLive: true };
      }
    }
  } catch (err) {
    // Ignore error
  }

  return { viewers: 0, isLive: false };
}

export async function fetchAllViewerStats(channels: ChannelsConfig): Promise<ViewerStats> {
  type FetchRes = { viewers: number; isLive: boolean; error?: string };
  const [twitchRes, kickRes, ytRes] = await Promise.all([
    channels.twitch ? fetchTwitchViewers(channels.twitch) : Promise.resolve<FetchRes>({ viewers: 0, isLive: false }),
    channels.kick ? fetchKickViewers(channels.kick) : Promise.resolve<FetchRes>({ viewers: 0, isLive: false }),
    channels.youtube ? fetchYouTubeViewers(channels.youtube) : Promise.resolve<FetchRes>({ viewers: 0, isLive: false }),
  ]);

  const total = (twitchRes.isLive ? twitchRes.viewers : 0) +
                (kickRes.isLive ? kickRes.viewers : 0) +
                (ytRes.isLive ? ytRes.viewers : 0);

  return {
    twitch: {
      channel: channels.twitch,
      viewers: twitchRes.viewers,
      isLive: twitchRes.isLive,
      loading: false,
      error: twitchRes.error,
    },
    kick: {
      channel: channels.kick,
      viewers: kickRes.viewers,
      isLive: kickRes.isLive,
      loading: false,
      error: kickRes.error,
    },
    youtube: {
      channel: channels.youtube,
      viewers: ytRes.viewers,
      isLive: ytRes.isLive,
      loading: false,
      error: ytRes.error,
    },
    total,
    lastUpdated: Date.now(),
  };
}
