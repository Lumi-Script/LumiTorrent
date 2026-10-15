/**
 * Cloudflare Pages & Workers entrypoint for LumiTorrent
 * - Handles SEO crawler endpoints (/robots.txt, /sitemap.xml)
 * - Injects dynamic canonical URL and origin-aware metadata for Googlebot
 * - Reroutes Torbox API calls (/api/torbox/*) to https://api.torbox.app/v1/api/*
 * - Serves static SPA assets
 */
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // 1. Dynamic robots.txt ensuring canonical sitemap host matches current domain
    if (url.pathname === '/robots.txt') {
      const robotsContent = `User-agent: *
Allow: /
Disallow: /api/

User-agent: Googlebot
Allow: /
Disallow: /api/

User-agent: Googlebot-Image
Allow: /
Allow: /og-image.jpg

User-agent: Bingbot
Allow: /
Disallow: /api/

Sitemap: ${url.origin}/sitemap.xml
`;
      return new Response(robotsContent, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'public, max-age=86400',
        },
      });
    }

    // 2. Dynamic sitemap.xml with live origin and current date
    if (url.pathname === '/sitemap.xml') {
      const today = new Date().toISOString().split('T')[0];
      const sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${url.origin}/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`;
      return new Response(sitemapContent, {
        headers: {
          'Content-Type': 'application/xml; charset=utf-8',
          'Cache-Control': 'public, max-age=86400',
        },
      });
    }

    // 3. Torbox API Gateway Reroute
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

    // 4. Optional YTS API Reroute fallback
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

    // 5. Default: Serve static SPA assets from Cloudflare with dynamic SEO rewriting
    if (env.ASSETS && typeof env.ASSETS.fetch === 'function') {
      const assetRes = await env.ASSETS.fetch(request);
      const contentType = assetRes.headers.get('content-type') || '';

      // If serving the HTML document, inject origin-accurate canonical & meta references
      if (contentType.includes('text/html')) {
        let html = await assetRes.text();
        if (url.origin) {
          html = html.replaceAll('https://lumitorrent.pages.dev', url.origin);
        }

        const headers = new Headers(assetRes.headers);
        headers.set('X-Robots-Tag', 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');
        headers.set('Link', `<${url.origin}/>; rel="canonical"`);
        headers.set('X-Content-Type-Options', 'nosniff');
        headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

        return new Response(html, {
          status: assetRes.status,
          headers,
        });
      }

      return assetRes;
    }

    return new Response('Not Found', { status: 404 });
  },
};
