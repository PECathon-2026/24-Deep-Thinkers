import test from 'node:test';
import assert from 'node:assert/strict';
import { autodiscoverFeedUrlFromHtml, stripHtmlToText } from './parser';

test('stripHtmlToText cleans scripts, tags, and collapses spaces', () => {
  const html = '<p>Hello <strong>world</strong>! <script>alert(1)</script> Here is a   link.</p>';
  assert.equal(stripHtmlToText(html), 'Hello world! Here is a link.');
});

test('autodiscoverFeedUrlFromHtml finds application/rss+xml link tag', () => {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>My Cool Blog</title>
        <link rel="alternate" type="application/rss+xml" title="RSS" href="/rss.xml" />
      </head>
      <body><h1>Welcome</h1></body>
    </html>
  `;
  const feedUrl = autodiscoverFeedUrlFromHtml(html, 'https://example.com');
  assert.equal(feedUrl, 'https://example.com/rss.xml');
});

test('autodiscoverFeedUrlFromHtml finds application/atom+xml link tag', () => {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <link rel="alternate" type="application/atom+xml" title="Atom Feed" href="https://example.com/atom.xml" />
      </head>
    </html>
  `;
  const feedUrl = autodiscoverFeedUrlFromHtml(html, 'https://example.com');
  assert.equal(feedUrl, 'https://example.com/atom.xml');
});

test('autodiscoverFeedUrlFromHtml returns null when no feed link exists', () => {
  const html = '<html><head><title>No feeds</title></head></html>';
  assert.equal(autodiscoverFeedUrlFromHtml(html, 'https://example.com'), null);
});
