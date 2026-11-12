import assert from 'node:assert/strict';
import test from 'node:test';
import { formatBookmark, normalizeUrl, parseStoredBookmarks } from '../src/lib/bookmarks.js';

test('URLs with and without https normalize to the same value', () => {
  assert.equal(normalizeUrl('www.example.com'), normalizeUrl('https://www.example.com'));
});

test('empty, corrupted, legacy, and non-array storage values recover as an empty list', () => {
  for (const storedValue of ['', 'not json', 'legacy bookmark', '{"url":"https://example.com"}', 'null', '"legacy"']) {
    assert.doesNotThrow(() => parseStoredBookmarks(storedValue));
    assert.deepEqual(parseStoredBookmarks(storedValue), []);
  }
  assert.deepEqual(parseStoredBookmarks(null), []);
});

test('a bookmark uses the exact visible separator', () => {
  assert.equal(
    formatBookmark({ url: 'https://www.example.com', slug: 'mona-7fk2' }),
    'https://www.example.com :: mona-7fk2',
  );
});

test('malformed stored bookmark entries are discarded', () => {
  const valid = { url: 'https://www.example.com', slug: 'mona-7fk2' };
  const storedValue = JSON.stringify([
    valid,
    null,
    [],
    { url: 'javascript:alert(1)', slug: 'mona-ab12' },
    { url: 'https://example.com', slug: 'bad-slug' },
    { url: 42, slug: 'mona-ab12' },
    { url: 'https://example.com' },
  ]);

  assert.deepEqual(parseStoredBookmarks(storedValue), [
    { url: 'https://www.example.com', slug: 'mona-7fk2' },
  ]);
});

test('only valid HTTP and HTTPS URLs are accepted', () => {
  assert.equal(normalizeUrl('http://example.com').startsWith('http:'), true);
  assert.throws(() => normalizeUrl('javascript:alert(1)'), /Only HTTP and HTTPS/);
  assert.throws(() => normalizeUrl('https://'), /valid HTTP or HTTPS/);
});
