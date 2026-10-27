import { ChannelsConfig, ViewerStats } from '../types/widget';

export async function fetchTwitchViewers(channel: string): Promise<{ viewers: number; isLive: boolean; error?: string }> {
  if (!channel.trim()) {
    return { viewers: 0, isLive: false };
  }
  try {
    const cleanChannel = channel.trim().toLowerCase().replace(/^@/, '');
    const res = await fetch(`https://decapi.me/twitch/viewercount/${cleanChannel}?_t=${Date.now()}`);
    if (!res.ok) {
      return { viewers: 0, isLive: false, error: 'No se pudo consultar Twitch' };
    }
    const text = (await res.text()).trim();
    if (text.includes('offline') || text.includes('not found') || text.includes('User not found') || text.includes('error')) {
      return { viewers: 0, isLive: false };
    }
    const count = parseInt(text.replace(/,/g, ''), 10);
    if (!isNaN(count) && count >= 0) {
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
  const cleanChannel = channel.trim().toLowerCase().replace(/^@/, '');

  // Direct Kick API (supports CORS natively for client requests)
  try {
    const res = await fetch(`https://kick.com/api/v2/channels/${cleanChannel}?_t=${Date.now()}`, {
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
    // If blocked by browser adblock or strict network policy
  }

  return { viewers: 0, isLive: false };
}

export async function fetchYouTubeViewers(
  videoIdOrChannel: string,
  apiKey?: string,
  handle?: string
): Promise<{ viewers: number; isLive: boolean; error?: string }> {
  if (!videoIdOrChannel.trim() && !handle?.trim()) {
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

  // If handle provided without a video ID, try resolving the latest video ID from DecAPI
  if ((!id || id.startsWith('@')) && handle) {
    try {
      const cleanH = handle.replace(/^@/, '');
      const decRes = await fetch(`https://decapi.me/youtube/latest_video?handle=${cleanH}&format=%7Bid%7D&_t=${Date.now()}`);
      if (decRes.ok) {
        const resolvedId = (await decRes.text()).trim();
        if (/^[a-zA-Z0-9_-]{11}$/.test(resolvedId)) {
          id = resolvedId;
        }
      }
    } catch {
      // Ignore resolution error
    }
  }

  // 1. Official YouTube Data API v3 (if apiKey is configured by user in Profile Settings)
  if (apiKey && id && /^[a-zA-Z0-9_-]{11}$/.test(id)) {
    try {
      const url = `https://www.googleapis.com/youtube/v3/videos?part=liveStreamingDetails,snippet&id=${id}&key=${apiKey}&_t=${Date.now()}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        const item = data?.items?.[0];
        if (item) {
          const ls = item.liveStreamingDetails;
          if (ls && ls.concurrentViewers && !ls.actualEndTime) {
            return {
              viewers: parseInt(ls.concurrentViewers, 10) || 0,
              isLive: true,
            };
          }
          // Video exists but stream is offline/ended/VOD
          return { viewers: 0, isLive: false };
        }
      }
    } catch (apiErr) {
      console.warn('Error al consultar YouTube Data API:', apiErr);
    }
  }

  // 2. Fallback check: verify if video/stream exists via oEmbed
  if (id && /^[a-zA-Z0-9_-]{11}$/.test(id)) {
    try {
      const res = await fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${id}&_t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.title) {
          // Stream exists. Without API key, YouTube does not expose concurrent viewers without quota.
          // We return offline (0 viewers) so we don't display a fake static 1 viewer.
          return { viewers: 0, isLive: false };
        }
      }
    } catch {
      // Ignore
    }
  }

  return { viewers: 0, isLive: false };
}

export async function fetchAllViewerStats(channels: ChannelsConfig): Promise<ViewerStats> {
  type FetchRes = { viewers: number; isLive: boolean; error?: string };
  const [twitchRes, kickRes, ytRes] = await Promise.all([
    channels.twitch 
      ? fetchTwitchViewers(channels.twitch) 
      : Promise.resolve<FetchRes>({ viewers: 0, isLive: false }),
    channels.kick 
      ? fetchKickViewers(channels.kick) 
      : Promise.resolve<FetchRes>({ viewers: 0, isLive: false }),
    channels.youtube || channels.youtubeHandle
      ? fetchYouTubeViewers(channels.youtube, channels.youtubeApiKey, channels.youtubeHandle)
      : Promise.resolve<FetchRes>({ viewers: 0, isLive: false }),
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
