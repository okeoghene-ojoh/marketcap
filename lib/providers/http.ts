/**
 * Fetch JSON on the server with Next.js' shared data cache, so many visitors
 * asking for the same thing cost one upstream API call per `revalidate` window.
 */
export async function getJSON<T>(url: string, revalidate: number): Promise<T> {
  const res = await fetch(url, { next: { revalidate } });
  if (!res.ok) {
    // Report only the host: the full URL can contain an API key.
    throw new Error(`HTTP ${res.status} from ${new URL(url).host}`);
  }
  return res.json() as Promise<T>;
}
