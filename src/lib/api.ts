import { YTSListResponse, Movie, CacheMap } from '../types/movie';
import { saveFileIdFromCacheCheck, saveDownloadedTorrent } from './db';

const YTS_BASE_URL = 'https://movies-api.accel.li/api/v2';

/**
 * Fetch movies list directly from the frontend (accel.li supports CORS with Access-Control-Allow-Origin: *)
 */
export async function fetchMoviesFromFrontend(params: {
  page: number;
  limit?: number;
  queryTerm?: string;
  genre?: string;
  year?: string;
  sortBy?: string;
  orderBy?: string;
  minimumRating?: string;
}): Promise<YTSListResponse> {
  const queryParams = new URLSearchParams({
    page: String(params.page || 1),
    limit: String(params.limit || 20),
    sort_by: params.sortBy || 'date_added',
    order_by: params.orderBy || 'desc',
  });

  let effectiveQuery = (params.queryTerm || '').trim();
  if (params.year && params.year !== 'All Years') {
    effectiveQuery = effectiveQuery ? `${effectiveQuery} ${params.year}` : params.year;
  }

  if (effectiveQuery) {
    queryParams.set('query_term', effectiveQuery);
  }
  if (params.genre && params.genre !== 'All Genres') {
    queryParams.set('genre', params.genre);
  }
  if (params.minimumRating && params.minimumRating !== '0') {
    queryParams.set('minimum_rating', params.minimumRating);
  }

  const directUrl = `${YTS_BASE_URL}/list_movies.json?${queryParams.toString()}`;

  const res = await fetch(directUrl, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
  });

  if (!res.ok) {
    throw new Error(`YTS request failed with status ${res.status}`);
  }

  return await res.json();
}

/**
 * Fetch movie details directly from the frontend
 */
export async function fetchMovieDetailsFromFrontend(movieId: number): Promise<Movie | null> {
  const directUrl = `${YTS_BASE_URL}/movie_details.json?movie_id=${movieId}&with_images=true&with_cast=true`;

  try {
    const res = await fetch(directUrl, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });

    if (res.ok) {
      const json = await res.json();
      return json.data?.movie || null;
    }
  } catch (err) {
    console.warn('Direct frontend YTS details call failed:', err);
  }

  return null;
}

/**
 * Check Torbox cache status
 * Calls /api/torbox/checkcached which Vite dev server reroutes to https://api.torbox.app/v1/api/torrents/checkcached
 * (and Cloudflare entrypoint reroutes when deployed).
 */
export async function checkTorboxCacheApi(
  apiKey: string,
  hashes: string[]
): Promise<{ success: boolean; cached: CacheMap; error?: string; detail?: string }> {
  if (!apiKey.trim() || hashes.length === 0) {
    return { success: false, cached: {} };
  }

  const cleanHashes = hashes.map((h) => h.trim().toLowerCase()).filter((h) => h.length >= 32);
  const commaSeparated = cleanHashes.join(',');
  const proxyUrl = `/api/torbox/checkcached?hash=${encodeURIComponent(commaSeparated)}&format=object&list_files=true`;

  try {
    const res = await fetch(proxyUrl, {
      method: 'GET',
      credentials: 'include',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: 'application/json',
      },
    });

    // Check if redirected by preview host
    if (res.redirected || (res.headers.get('content-type')?.includes('text/html'))) {
      throw new Error('Host redirected request. Please ensure session cookies are enabled.');
    }

    const data = await res.json();

    if (res.ok) {
      const result: CacheMap = {};
      // Initialize all requested hashes to uncached by default
      for (const h of cleanHashes) {
        result[h] = { cached: false };
      }

      // Torbox returns data as an object of cached hashes or list of cached objects
      if (data?.data && typeof data.data === 'object' && !Array.isArray(data.data)) {
        for (const [hashKey, val] of Object.entries(data.data)) {
          const lowerKey = hashKey.toLowerCase();
          const isCached = Boolean(
            val === true ||
            (typeof val === 'object' && val !== null && (val as { name?: string; files?: unknown[] }).name) ||
            (typeof val === 'object' && val !== null && Array.isArray((val as { files?: unknown[] }).files))
          );
          result[lowerKey] = { cached: isCached };

          // Extract largest file and store its file_id in IndexedDB
          if (typeof val === 'object' && val !== null) {
            const files = (val as { files?: Array<{ id?: number; file_id?: number; name?: string; size?: number; size_bytes?: number }> }).files;
            if (Array.isArray(files) && files.length > 0) {
              let largest = files[0];
              for (const f of files) {
                const fSize = f.size ?? f.size_bytes ?? 0;
                const lSize = largest.size ?? largest.size_bytes ?? 0;
                if (fSize > lSize) {
                  largest = f;
                }
              }
              const fileId = largest.id ?? largest.file_id;
              if (typeof fileId === 'number' && !isNaN(fileId)) {
                saveFileIdFromCacheCheck(lowerKey, fileId, {
                  fileName: largest.name,
                  fileSize: largest.size ?? largest.size_bytes,
                  name: (val as { name?: string }).name,
                });
              }
            }
          }
        }
      } else if (data?.data && Array.isArray(data.data)) {
        for (const item of data.data) {
          if (typeof item === 'string') {
            result[item.toLowerCase()] = { cached: true };
          } else if (item && typeof item === 'object') {
            const h = ((item as any).hash || (item as any).torrent_hash || '').toLowerCase();
            if (h) {
              result[h] = { cached: true };
              const files = (item as any).files;
              if (Array.isArray(files) && files.length > 0) {
                let largest = files[0];
                for (const f of files) {
                  const fSize = f.size ?? f.size_bytes ?? 0;
                  const lSize = largest.size ?? largest.size_bytes ?? 0;
                  if (fSize > lSize) {
                    largest = f;
                  }
                }
                const fileId = largest.id ?? largest.file_id;
                if (typeof fileId === 'number' && !isNaN(fileId)) {
                  saveFileIdFromCacheCheck(h, fileId, {
                    fileName: largest.name,
                    fileSize: largest.size ?? largest.size_bytes,
                    name: (item as any).name,
                  });
                }
              }
            }
          }
        }
      }

      return { success: true, cached: result, detail: data?.detail };
    }

    if (data?.error === 'BAD_TOKEN') {
      return { success: false, cached: {}, error: 'BAD_TOKEN' };
    }

    return { success: false, cached: {}, error: data?.detail || 'Cache check failed' };
  } catch (err) {
    return {
      success: false,
      cached: {},
      error: err instanceof Error ? err.message : 'Failed to reach Torbox cache API',
    };
  }
}

/**
 * Add torrent to Torbox account
 * Calls /api/torbox/createtorrent which Vite dev server reroutes to https://api.torbox.app/v1/api/torrents/createtorrent
 * (and Cloudflare entrypoint reroutes when deployed).
 */
export async function addTorrentToTorboxApi(
  apiKey: string,
  hash: string,
  movieTitle: string
): Promise<{ success: boolean; detail?: string; error?: string; torrentID?: number }> {
  const cleanHash = hash.trim().toUpperCase();
  const magnet = `magnet:?xt=urn:btih:${cleanHash}&dn=${encodeURIComponent(movieTitle)}`;

  try {
    const formData = new FormData();
    formData.append('magnet', magnet);
    formData.append('name', movieTitle);

    const res = await fetch('/api/torbox/createtorrent', {
      method: 'POST',
      credentials: 'include',
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: formData,
    });

    if (res.redirected || (res.headers.get('content-type')?.includes('text/html'))) {
      throw new Error('Host redirected request. Please reload and ensure session cookies are accepted.');
    }

    const data = await res.json();
    if (res.ok && data.success) {
      // Extract torrent_id and store in IndexedDB
      const torrentId =
        data?.data?.torrent_id ??
        data?.data?.torrentId ??
        data?.torrent_id ??
        data?.torrentId ??
        data?.data?.id ??
        data?.id;

      const numId = typeof torrentId === 'number' ? torrentId : Number(torrentId);
      if (!isNaN(numId) && numId > 0) {
        await saveDownloadedTorrent(cleanHash.toLowerCase(), numId, movieTitle);
      }

      return {
        success: true,
        torrentID: !isNaN(numId) && numId > 0 ? numId : undefined,
        detail: data.detail || 'Torrent added to Torbox successfully!',
      };
    }

    return {
      success: false,
      detail: data.detail || 'Failed to add torrent to Torbox.',
    };
  } catch (err) {
    return {
      success: false,
      detail: err instanceof Error ? err.message : 'Failed to reach Torbox service.',
    };
  }
}

/**
 * Test Torbox API key
 * Calls /api/torbox/user which Vite dev server reroutes to https://api.torbox.app/v1/api/user/me
 * (and Cloudflare entrypoint reroutes when deployed).
 */
export async function testTorboxKeyApi(apiKey: string): Promise<{
  success: boolean;
  message: string;
  email?: string;
  plan?: string | number;
}> {
  try {
    const res = await fetch('/api/torbox/user', {
      method: 'GET',
      credentials: 'include',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: 'application/json',
      },
    });

    if (res.redirected || (res.headers.get('content-type')?.includes('text/html'))) {
      throw new Error('Host redirected request.');
    }

    const data = await res.json();
    if (res.ok && data.success) {
      return {
        success: true,
        message: 'Connection successful! Torbox authenticated.',
        email: data.data?.email,
        plan: data.data?.plan,
      };
    }

    return {
      success: false,
      message: data.detail || 'Invalid Torbox API key.',
    };
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : 'Network failure reaching Torbox.',
    };
  }
}
