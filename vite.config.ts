import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

/**
 * Vite plugin to reroute Torbox API requests in dev server
 * Maps /api/torbox/* to https://api.torbox.app/v1/api/*
 */
function torboxDevReroutePlugin() {
  return {
    name: 'torbox-dev-reroute',
    configureServer(server: any) {
      server.middlewares.use(async (req: any, res: any, next: any) => {
        if (!req.url?.startsWith('/api/torbox')) {
          return next();
        }

        // Removed wildcard CORS preflight

        const url = new URL(req.url, 'http://localhost:3000');
        let targetPath = url.pathname.replace(/^\/api\/torbox/, '');

        // Map convenient shortcuts to canonical Torbox endpoints
        if (targetPath === '/checkcached') {
          targetPath = '/torrents/checkcached';
        } else if (targetPath === '/createtorrent') {
          targetPath = '/torrents/createtorrent';
        } else if (targetPath === '/user' || targetPath === '/user/me') {
          targetPath = '/user/me';
        }

        const targetUrl = `https://api.torbox.app/v1/api${targetPath}${url.search}`;

        try {
          // Read request body if method is POST/PUT
          let bodyBuffer: Buffer | undefined;
          if (req.method !== 'GET' && req.method !== 'HEAD') {
            const chunks: Buffer[] = [];
            for await (const chunk of req) {
              chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
            }
            bodyBuffer = Buffer.concat(chunks);
          }

          const headers: Record<string, string> = {};
          for (const [key, val] of Object.entries(req.headers)) {
            const lowerKey = key.toLowerCase();
            if (val && !['host', 'connection', 'content-length', 'origin', 'referer'].includes(lowerKey)) {
              headers[key] = Array.isArray(val) ? val.join(', ') : (val as string);
            }
          }

          const response = await fetch(targetUrl, {
            method: req.method,
            headers,
            body: bodyBuffer,
          });

          res.statusCode = response.status;
          response.headers.forEach((v, k) => {
            const lower = k.toLowerCase();
            if (!['content-encoding', 'content-length', 'transfer-encoding'].includes(lower)) {
              res.setHeader(k, v);
            }
          });

          const resData = await response.arrayBuffer();
          res.end(Buffer.from(resData));
        } catch (err: any) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ success: false, error: err?.message || 'Torbox proxy error' }));
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    torboxDevReroutePlugin(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    host: true,
    hmr: process.env.DISABLE_HMR === 'true' ? false : true,
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});
