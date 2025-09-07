export function normalizeUrl(url?: string | null): string | undefined {
  if (!url) return undefined;
  try {
    const u = new URL(url);
    // Remove common tracking params
    const toDelete = [
      'utm_source','utm_medium','utm_campaign','utm_term','utm_content',
      'gclid','fbclid','mc_cid','mc_eid','ref','igshid'
    ];
    toDelete.forEach(k => u.searchParams.delete(k));
    // Force https where possible
    if (u.protocol === 'http:') u.protocol = 'https:';
    // Remove empty query
    if ([...u.searchParams.keys()].length === 0) u.search = '';
    return u.toString();
  } catch {
    return url || undefined;
  }
}

