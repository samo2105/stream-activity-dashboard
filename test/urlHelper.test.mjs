import test from 'node:test';
import assert from 'node:assert/strict';
import {
  extractCleanUrl,
  validateWidgetUrl,
  sanitizeStreamUrl,
  generateFacebookEmbedUrl,
  generateTikTokEmbedUrl,
  generateTwitchPlayerEmbedUrl,
  generateYouTubePlayerEmbedUrl,
  generateKickPlayerEmbedUrl,
  generateFacebookPlayerEmbedUrl,
  generateTikTokPlayerEmbedUrl,
} from '../src/utils/urlHelper.ts';

test('extractCleanUrl extracts valid URLs from messy user input', () => {
  assert.equal(extractCleanUrl(''), '');
  assert.equal(extractCleanUrl('  https://facebook.com/mypage/live  '), 'https://facebook.com/mypage/live');
  assert.equal(
    extractCleanUrl('<iframe src="https://www.facebook.com/plugins/video.php?href=test"></iframe>'),
    'https://www.facebook.com/plugins/video.php?href=test'
  );
  assert.equal(
    extractCleanUrl('[Facebook Stream](https://facebook.com/mypage/live)'),
    'https://facebook.com/mypage/live'
  );
});

test('validateWidgetUrl flags administrative / creator studio URLs', () => {
  const fbProducer = validateWidgetUrl('https://www.facebook.com/live/producer/12345');
  assert.equal(fbProducer.isValid, false);
  assert.match(fbProducer.warning || '', /Live Producer/i);

  const fbCreator = validateWidgetUrl('https://business.facebook.com/creatorstudio/home');
  assert.equal(fbCreator.isValid, false);
  assert.match(fbCreator.warning || '', /Creator Studio/i);

  const validFb = validateWidgetUrl('https://www.facebook.com/mypage/live');
  assert.equal(validFb.isValid, true);
});

test('generateFacebookEmbedUrl formats player and comments embed URLs correctly', () => {
  const player = generateFacebookEmbedUrl('https://www.facebook.com/mypage/live', 'player');
  assert.ok(player.startsWith('https://www.facebook.com/plugins/video.php?href='));
  assert.ok(player.includes('autoplay=true'));

  const chat = generateFacebookEmbedUrl('https://www.facebook.com/mypage/live', 'chat');
  assert.ok(chat.startsWith('https://www.facebook.com/plugins/comments.php?href='));
  assert.ok(chat.includes('numposts=15'));

  const fromHandle = generateFacebookEmbedUrl('mygamingchannel', 'player');
  assert.ok(fromHandle.includes('facebook.com%2Fmygamingchannel%2Flive'));
});

test('sanitizeStreamUrl formats Facebook URLs into official responsive iframes', () => {
  const sanitizedPlayer = sanitizeStreamUrl('https://www.facebook.com/mypage/videos/987654321/', 'facebook');
  assert.ok(sanitizedPlayer.includes('/plugins/video.php?href='));

  const sanitizedComments = sanitizeStreamUrl('https://www.facebook.com/mypage/live/comments', 'facebook');
  assert.ok(sanitizedComments.includes('/plugins/comments.php?href='));

  const alreadyEmbed = 'https://www.facebook.com/plugins/video.php?href=test';
  assert.equal(sanitizeStreamUrl(alreadyEmbed, 'facebook'), alreadyEmbed);
});

test('generateTikTokEmbedUrl correctly formats handles and preserves third-party widgets', () => {
  assert.equal(generateTikTokEmbedUrl(''), '');
  assert.equal(
    generateTikTokEmbedUrl('@streamerpro', 'player'),
    'https://www.tiktok.com/@streamerpro/live'
  );
  assert.equal(
    generateTikTokEmbedUrl('https://www.tiktok.com/@streamerpro/live', 'chat'),
    'https://www.tiktok.com/@streamerpro/live#chat'
  );

  const tikfinityUrl = 'https://tikfinity.zerody.one/widget/chat?id=12345';
  assert.equal(generateTikTokEmbedUrl(tikfinityUrl), tikfinityUrl);
});

test('generateTwitchPlayerEmbedUrl builds official twitch player with parent domain and muted state', () => {
  assert.equal(generateTwitchPlayerEmbedUrl(''), '');

  const defaultMuted = generateTwitchPlayerEmbedUrl('zannito21', true, 'localhost');
  assert.ok(defaultMuted.includes('player.twitch.tv/?channel=zannito21'));
  assert.ok(defaultMuted.includes('parent=localhost'));
  assert.ok(defaultMuted.includes('parent=samo2105.github.io'));
  assert.ok(defaultMuted.includes('muted=true'));
  assert.ok(defaultMuted.includes('autoplay=true'));

  const unmuted = generateTwitchPlayerEmbedUrl('https://twitch.tv/zannito21', false, 'example.com');
  assert.ok(unmuted.includes('channel=zannito21'));
  assert.ok(unmuted.includes('parent=example.com'));
  assert.ok(unmuted.includes('muted=false'));
});

test('generateYouTubePlayerEmbedUrl handles direct IDs, full URLs, and muted flag', () => {
  assert.equal(generateYouTubePlayerEmbedUrl(''), '');

  const fromId = generateYouTubePlayerEmbedUrl('7aijN13K2nI', true);
  assert.equal(
    fromId,
    'https://www.youtube.com/embed/7aijN13K2nI?autoplay=1&mute=1&enablejsapi=1&rel=0'
  );

  const fromWatchUrl = generateYouTubePlayerEmbedUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ', false);
  assert.equal(
    fromWatchUrl,
    'https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1&mute=0&enablejsapi=1&rel=0'
  );

  const fromShortUrl = generateYouTubePlayerEmbedUrl('https://youtu.be/dQw4w9WgXcQ', true);
  assert.equal(
    fromShortUrl,
    'https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1&mute=1&enablejsapi=1&rel=0'
  );

  const fromDirtyId = generateYouTubePlayerEmbedUrl('7aijN13K2nI?si=tracking123&t=10', true);
  assert.equal(
    fromDirtyId,
    'https://www.youtube.com/embed/7aijN13K2nI?autoplay=1&mute=1&enablejsapi=1&rel=0'
  );

  const fromSlashUrl = generateYouTubePlayerEmbedUrl('https://www.youtube.com/live/7aijN13K2nI/', false);
  assert.equal(
    fromSlashUrl,
    'https://www.youtube.com/embed/7aijN13K2nI?autoplay=1&mute=0&enablejsapi=1&rel=0'
  );
});

test('generateKickPlayerEmbedUrl generates kick player with clean channel and mute state', () => {
  assert.equal(generateKickPlayerEmbedUrl(''), '');

  const kickMuted = generateKickPlayerEmbedUrl('zannito21', true);
  assert.equal(kickMuted, 'https://player.kick.com/zannito21?autoplay=true&muted=true');

  const kickUnmuted = generateKickPlayerEmbedUrl('https://kick.com/zannito21', false);
  assert.equal(kickUnmuted, 'https://player.kick.com/zannito21?autoplay=true&muted=false');

  const kickWithAt = generateKickPlayerEmbedUrl('@zannito21', true);
  assert.equal(kickWithAt, 'https://player.kick.com/zannito21?autoplay=true&muted=true');
});

test('generateFacebookPlayerEmbedUrl generates plugin video iframe URL with mute flag', () => {
  assert.equal(generateFacebookPlayerEmbedUrl(''), '');

  const fbMuted = generateFacebookPlayerEmbedUrl('mygamingchannel', true);
  assert.ok(fbMuted.startsWith('https://www.facebook.com/plugins/video.php?href='));
  assert.ok(fbMuted.includes('mute=1'));
  assert.ok(fbMuted.includes('facebook.com%2Fmygamingchannel%2Flive'));

  const fbUnmuted = generateFacebookPlayerEmbedUrl('https://www.facebook.com/mygamingchannel/live', false);
  assert.ok(fbUnmuted.includes('mute=0'));
});

test('generateTikTokPlayerEmbedUrl formats handles and preserves direct URLs', () => {
  assert.equal(generateTikTokPlayerEmbedUrl(''), '');
  assert.equal(generateTikTokPlayerEmbedUrl('@zannito'), 'https://www.tiktok.com/@zannito/live');
  assert.equal(generateTikTokPlayerEmbedUrl('zannito'), 'https://www.tiktok.com/@zannito/live');
  assert.equal(
    generateTikTokPlayerEmbedUrl('https://www.tiktok.com/@zannito/live'),
    'https://www.tiktok.com/@zannito/live'
  );
});
