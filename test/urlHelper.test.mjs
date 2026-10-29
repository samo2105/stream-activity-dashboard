import test from 'node:test';
import assert from 'node:assert/strict';
import {
  extractCleanUrl,
  validateWidgetUrl,
  sanitizeStreamUrl,
  generateFacebookEmbedUrl,
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
