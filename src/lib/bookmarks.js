const bookmarkSlugPattern = /^mona-[0-9A-Za-z]{4}$/;
const explicitSchemePattern = /^([a-zA-Z][a-zA-Z\d+.-]*):/;
const explicitHttpUrlPattern = /^https?:\/\//i;
const hostPortPattern = /^[^:/?#]+:\d+(?:[/?#]|$)/;

export function normalizeUrl(value) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error('Enter a valid HTTP or HTTPS URL.');
  }

  const input = value.trim();
  if (/[\u0000-\u001f\u007f]/.test(input)) {
    throw new Error('Enter a valid HTTP or HTTPS URL.');
  }

  const schemeMatch = input.match(explicitSchemePattern);
  let candidate = input;
  if (schemeMatch && /^https?$/i.test(schemeMatch[1])) {
    if (!explicitHttpUrlPattern.test(input)) {
      throw new Error('Include the full http:// or https:// protocol, or omit the protocol.');
    }
  } else if (schemeMatch && !hostPortPattern.test(input)) {
    throw new Error('Only HTTP and HTTPS URLs are allowed.');
  } else if (!schemeMatch || hostPortPattern.test(input)) {
    candidate = `https://${input}`;
  }

  let parsed;
  try {
    parsed = new URL(candidate);
  } catch {
    throw new Error('Enter a valid HTTP or HTTPS URL.');
  }

  if ((parsed.protocol !== 'http:' && parsed.protocol !== 'https:') || !parsed.hostname) {
    throw new Error('Only HTTP and HTTPS URLs are allowed.');
  }
  if (parsed.username || parsed.password) {
    throw new Error('URLs containing a username or password are not allowed.');
  }

  return parsed.pathname === '/' && !parsed.search && !parsed.hash
    ? parsed.origin
    : parsed.href;
}

export function parseStoredBookmarks(rawValue) {
  if (typeof rawValue !== 'string' || rawValue.trim() === '') return [];

  let parsed;
  try {
    parsed = JSON.parse(rawValue);
  } catch {
    return [];
  }
  if (!Array.isArray(parsed)) return [];

  return parsed.flatMap((record) => {
    if (record === null || typeof record !== 'object' || Array.isArray(record)) return [];
    if (typeof record.url !== 'string' || typeof record.slug !== 'string' || !bookmarkSlugPattern.test(record.slug)) {
      return [];
    }

    try {
      return [{ url: normalizeUrl(record.url), slug: record.slug }];
    } catch {
      return [];
    }
  });
}

export function formatBookmark(bookmark) {
  return `${bookmark.url} :: ${bookmark.slug}`;
}
