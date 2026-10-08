/**
 * Cloudflare Pages & Workers entrypoint for CineTorrent
 * Reroutes Torbox API calls (/api/torbox/*) to https://api.torbox.app/v1/api/*
 * Serves static assets for everything else.
 */
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Removed wildcard CORS preflight

    // 2. Torbox API Gateway Reroute
    if (url.pathname.startsWith('/api/torbox')) {
      let targetPath = url.pathname.replace(/^\/api\/torbox/, '');

      // Map shortcuts to canonical Torbox endpoints
      if (targetPath === '/checkcached') {
        targetPath = '/torrents/checkcached';
      } else if (targetPath === '/createtorrent') {
        targetPath = '/torrents/createtorrent';
      } else if (targetPath === '/user' || targetPath === '/user/me') {
        targetPath = '/user/me';
      }

      const targetUrl = `https://api.torbox.app/v1/api${targetPath}${url.search}`;

      // Clone and sanitize headers
      const headers = new Headers();
      for (const [key, val] of request.headers.entries()) {
        const lower = key.toLowerCase();
        if (!['host', 'origin', 'referer', 'cf-ray', 'cf-connecting-ip', 'cf-ipcountry'].includes(lower)) {
          headers.set(key, val);
        }
      }

      try {
        const torboxResponse = await fetch(targetUrl, {
          method: request.method,
          headers,
          body: ['GET', 'HEAD'].includes(request.method) ? undefined : request.body,
        });

        const responseHeaders = new Headers(torboxResponse.headers);

        return new Response(torboxResponse.body, {
          status: torboxResponse.status,
          headers: responseHeaders,
        });
      } catch (err) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Cloudflare Torbox gateway error',
            detail: err.message,
          }),
          {
            status: 502,
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );
      }
    }

    // 3. Optional YTS API Reroute fallback
    if (url.pathname.startsWith('/api/yts/')) {
      const ytsPath = url.pathname.replace(/^\/api\/yts\//, '');
      const mapped = ytsPath === 'list' ? 'list_movies.json' : 'movie_details.json';
      const targetUrl = `https://movies-api.accel.li/api/v2/${mapped}${url.search}`;

      const res = await fetch(targetUrl, {
        headers: { Accept: 'application/json' },
      });
      const resHeaders = new Headers(res.headers);

      return new Response(res.body, {
        status: res.status,
        headers: resHeaders,
      });
    }

    // 4. Default: Serve static SPA assets from Cloudflare
    if (env.ASSETS && typeof env.ASSETS.fetch === 'function') {
      return env.ASSETS.fetch(request);
    }

    return new Response('Not Found', { status: 404 });
  },
};
