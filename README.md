# LumiTorrent

LumiTorrent is a modern, responsive web application for managing and discovering torrents. Built with React, Vite, and Tailwind CSS, it offers a seamless interface for browsing movies, viewing details, and managing your Torbox downloads.

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/Lumi-Script/LumiTorrent)

## 🚀 Features

- **Movie Discovery:** Browse movies with an intuitive interface, complete with pagination and filtering. Backed by the YTS API.
- **Detailed Views:** View comprehensive movie details in a responsive modal.
- **Torbox Integration:** Seamlessly interacts with the Torbox API for torrent management, including instant-add and instant-download.
- **Modern Tech Stack:** Powered by React 19, Vite, and Tailwind CSS v4 for blazing-fast performance.
- **Cloudflare Ready:** Pre-configured for easy deployment to Cloudflare Workers/Pages.

## 🛠️ Development

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the development server:**
   ```bash
   npm run dev
   ```
   *The dev server automatically proxies Torbox API requests via a custom Vite plugin.*

3. **Build for production:**
   ```bash
   npm run build
   ```

## 🌐 Deployment

You can deploy your own instance of LumiTorrent in one click using the button at the top of this README, or manually via Wrangler:

```bash
npm install -g wrangler
npm run build
wrangler deploy
```

## 📄 License

This project is open-source. Please check the repository for license details.
