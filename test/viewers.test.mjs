import test from 'node:test';
import assert from 'node:assert/strict';
import {
  cleanChannelName,
  fetchTwitchViewers,
  fetchKickViewers,
  fetchYouTubeViewers,
  fetchAllViewerStats,
} from '../src/utils/viewers.ts';

test('cleanChannelName sanitizes channel names from various input formats', () => {
  assert.equal(cleanChannelName(''), '');
  assert.equal(cleanChannelName('   '), '');
  assert.equal(cleanChannelName('@samo2105'), 'samo2105');
  assert.equal(cleanChannelName('@@@zannito'), 'zannito');
  assert.equal(cleanChannelName('https://twitch.tv/samo2105'), 'samo2105');
  assert.equal(cleanChannelName('https://www.twitch.tv/samo2105/chat'), 'samo2105');
  assert.equal(cleanChannelName('https://kick.com/samo2105'), 'samo2105');
  assert.equal(cleanChannelName('https://www.youtube.com/@zannito'), 'zannito');
});

test('fetchTwitchViewers handles empty channel input gracefully', async () => {
  const result = await fetchTwitchViewers('');
  assert.equal(result.isLive, false);
  assert.equal(result.viewers, 0);

  const whitespaceResult = await fetchTwitchViewers('   ');
  assert.equal(whitespaceResult.isLive, false);
  assert.equal(whitespaceResult.viewers, 0);
});

test('fetchTwitchViewers queries official GQL endpoint without 429 rate limits', async () => {
  const result = await fetchTwitchViewers('samo2105');
  assert.equal(typeof result.isLive, 'boolean');
  assert.equal(typeof result.viewers, 'number');
  assert.ok(result.viewers >= 0);
});

test('fetchKickViewers handles empty channel input gracefully', async () => {
  const result = await fetchKickViewers('');
  assert.equal(result.isLive, false);
  assert.equal(result.viewers, 0);
});

test('fetchYouTubeViewers handles empty inputs gracefully', async () => {
  const result = await fetchYouTubeViewers('');
  assert.equal(result.isLive, false);
  assert.equal(result.viewers, 0);
});

test('fetchYouTubeViewers extracts video ID from different YouTube URL structures', async () => {
  const r1 = await fetchYouTubeViewers('https://www.youtube.com/watch?v=SwjSwFWmxl0');
  assert.equal(r1.videoId, 'SwjSwFWmxl0');

  const r2 = await fetchYouTubeViewers('https://youtu.be/SwjSwFWmxl0?si=123');
  assert.equal(r2.videoId, 'SwjSwFWmxl0');

  const r3 = await fetchYouTubeViewers('https://www.youtube.com/live/SwjSwFWmxl0');
  assert.equal(r3.videoId, 'SwjSwFWmxl0');
});

test('fetchYouTubeViewers correctly differentiates active live broadcast from finished VOD', async () => {
  // SwjSwFWmxl0 is a concluded VOD (height 113 in oEmbed)
  const vodResult = await fetchYouTubeViewers('SwjSwFWmxl0');
  assert.equal(vodResult.isLive, false);
  assert.equal(vodResult.videoId, 'SwjSwFWmxl0');

  // 7aijN13K2nI is an active live stream (height 150 in oEmbed)
  const liveResult = await fetchYouTubeViewers('7aijN13K2nI');
  assert.equal(liveResult.isLive, true);
  assert.equal(liveResult.videoId, '7aijN13K2nI');
});

test('fetchYouTubeViewers resolves latest stream when handle is provided', async () => {
  const result = await fetchYouTubeViewers('SwjSwFWmxl0', undefined, 'zannito');
  assert.equal(result.videoId, '7aijN13K2nI');
  assert.equal(result.isLive, true);
});

test('fetchAllViewerStats aggregates multiplatform channels concurrently', async () => {
  const channels = {
    twitch: 'samo2105',
    kick: '',
    youtube: '7aijN13K2nI',
    youtubeHandle: 'zannito',
  };

  const stats = await fetchAllViewerStats(channels);
  assert.ok(stats.twitch);
  assert.ok(stats.kick);
  assert.ok(stats.youtube);
  assert.equal(stats.youtube.isLive, true);
  assert.equal(stats.youtube.videoId, '7aijN13K2nI');
  assert.ok(stats.lastUpdated);
});
