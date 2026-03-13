export function extractStravaCallback(): { code: string; scope: string } | null {
  const params = new URLSearchParams(window.location.search);
  const code = params.get('code');
  const scope = params.get('scope');

  if (code && scope?.includes('activity')) {
    return { code, scope };
  }

  return null;
}