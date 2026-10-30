import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeUrl } from './normalizer';

test('normalizes standard website urls with www and trailing slash', () => {
  assert.equal(normalizeUrl('http://www.Example.COM/feed/'), 'https://example.com/feed');
  assert.equal(normalizeUrl('https://www.example.com/'), 'https://example.com');
  assert.equal(normalizeUrl('example.com/rss.xml'), 'https://example.com/rss.xml');
});

test('strips default ports 80 and 443', () => {
  assert.equal(normalizeUrl('http://example.com:80/feed'), 'https://example.com/feed');
  assert.equal(normalizeUrl('https://example.com:443/feed'), 'https://example.com/feed');
  assert.equal(normalizeUrl('https://example.com:8080/feed'), 'https://example.com:8080/feed');
});

test('removes fragments and tracking parameters', () => {
  const urlWithTrackers = 'https://overreacted.io/my-post/?utm_source=twitter&utm_medium=social&utm_campaign=launch&fbclid=123#comments';
  assert.equal(normalizeUrl(urlWithTrackers), 'https://overreacted.io/my-post');
});

test('preserves legitimate non-tracking query parameters', () => {
  const url = 'https://hnrss.org/frontpage?points=100';
  assert.equal(normalizeUrl(url), 'https://hnrss.org/frontpage?points=100');
});
