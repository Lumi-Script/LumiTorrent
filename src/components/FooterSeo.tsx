import React, { useState } from 'react';
import { Film, Zap, Shield, Sparkles, ChevronDown, ChevronUp, ExternalLink, HelpCircle } from 'lucide-react';

export function FooterSeo() {
  const [isFaqOpen, setIsFaqOpen] = useState(true);

  return (
    <section className="w-full mt-16 border-t border-neutral-800/80 bg-neutral-950/80 text-neutral-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
        {/* Value Proposition & Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-5 rounded-2xl bg-neutral-900/40 border border-neutral-800/80 space-y-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-3">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-neutral-100">Live Torbox Debrid Cache</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Detects pre-cached torrents directly across Torbox debrid cloud servers in real time.
              Enjoy instant high-speed streaming without waiting for peer torrent downloads.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-neutral-900/40 border border-neutral-800/80 space-y-2">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-3">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-neutral-100">4K UHD &amp; x265 HEVC Encodings</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Identify 720p HD, 1080p Full HD, and 2160p 4K Ultra HD releases with high-efficiency
              x265 video compression badges for compact file sizes and cinema-grade clarity.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-neutral-900/40 border border-neutral-800/80 space-y-2">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-3">
              <Shield className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-neutral-100">Client-Side Zero-Log Privacy</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Your Torbox API key and search history reside exclusively in your browser&apos;s local
              storage sandbox. No credentials or logs are ever saved on external servers.
            </p>
          </div>
        </div>

        {/* Detailed FAQ Section */}
        <div className="rounded-2xl border border-neutral-800/80 bg-neutral-900/20 overflow-hidden">
          <button
            onClick={() => setIsFaqOpen((prev) => !prev)}
            className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-neutral-900/40 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <HelpCircle className="w-4 h-4 text-emerald-400" />
              <h2 className="text-sm font-semibold text-neutral-200">
                Frequently Asked Questions (FAQ) &amp; User Guide
              </h2>
            </div>
            {isFaqOpen ? (
              <ChevronUp className="w-4 h-4 text-neutral-500" />
            ) : (
              <ChevronDown className="w-4 h-4 text-neutral-500" />
            )}
          </button>

          {isFaqOpen && (
            <div className="px-6 pb-6 pt-2 space-y-4 text-xs text-neutral-400 border-t border-neutral-800/60 divide-y divide-neutral-800/40">
              <div className="pt-3">
                <h4 className="font-semibold text-neutral-200 text-xs mb-1">
                  What is LumiTorrent?
                </h4>
                <p className="leading-relaxed">
                  LumiTorrent is a fast, responsive movie catalog browser designed to streamline discovering
                  high-quality movie releases. Powered by the public YTS metadata API and Torbox cloud debrid API,
                  it allows users to search, filter by resolution or genre, and instantly see which torrents are already
                  cached on high-speed debrid servers.
                </p>
              </div>

              <div className="pt-3">
                <h4 className="font-semibold text-neutral-200 text-xs mb-1">
                  How does Torbox instant cache detection work?
                </h4>
                <p className="leading-relaxed">
                  Torbox is a premium debrid and torrent cloud download service. When you provide your Torbox API token
                  in Settings, LumiTorrent checks release info hashes against Torbox&apos;s cache database. A green &quot;Instant Cache&quot;
                  badge indicates the file is already downloaded to the cloud, allowing immediate unthrottled streaming or downloading.
                </p>
              </div>

              <div className="pt-3">
                <h4 className="font-semibold text-neutral-200 text-xs mb-1">
                  What is the difference between x264 and x265 (HEVC)?
                </h4>
                <p className="leading-relaxed">
                  x265 (High Efficiency Video Coding) provides comparable or superior visual quality to x264 at up to 50%
                  reduced file size. LumiTorrent highlights x265 badges so you can save storage and bandwidth while enjoying
                  pristine 1080p and 4K UHD picture quality.
                </p>
              </div>

              <div className="pt-3">
                <h4 className="font-semibold text-neutral-200 text-xs mb-1">
                  Are my credentials and personal searches private?
                </h4>
                <p className="leading-relaxed">
                  Yes, 100%. LumiTorrent operates entirely client-side in your web browser. All API requests to YTS and Torbox
                  are executed directly from your browser session or through a lightweight transparent proxy gateway. Your Torbox API key
                  is saved solely in browser local storage and is never transmitted to any third-party database.
                </p>
              </div>

              <div className="pt-3">
                <h4 className="font-semibold text-neutral-200 text-xs mb-1">
                  How do I download or play cached movies?
                </h4>
                <p className="leading-relaxed">
                  Click on any movie card to view its available releases. If a release is cached in Torbox, click &quot;Open Torbox Download&quot;
                  or &quot;Add to Torbox&quot; to push it directly into your Torbox dashboard for immediate streaming via your favorite video player.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* DMCA & Legal Compliance Notice */}
        <div className="p-4 rounded-xl bg-neutral-900/30 border border-neutral-800/60 text-[11px] text-neutral-400 space-y-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h3 className="font-medium text-neutral-300">DMCA, Copyright &amp; Fair Use Policy</h3>
            <a
              href="https://yts.mx/dmca"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 underline font-medium transition-colors"
            >
              <span>Submit Takedown Notice (YTS DMCA)</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          <p className="leading-relaxed">
            LumiTorrent does not host, upload, scrape, or store any media files, video streams, or torrent binaries on its servers.
            LumiTorrent functions purely as a client-side interface that queries publicly available third-party metadata APIs (YTS and Torbox).
            Torbox debrid caching and cloud storage interactions are performed strictly through user-supplied credentials.
            All users are responsible for complying with the digital copyright and intellectual property laws of their respective jurisdictions.
          </p>
          <p className="leading-relaxed text-neutral-500">
            Because all indexed movie titles, torrent hashes, and metadata originate directly from the public YTS catalog, copyright holders and authorized representatives requesting removal of content or notification of claimed infringement should submit requests directly to the source index via the{' '}
            <a
              href="https://yts.mx/dmca"
              target="_blank"
              rel="noopener noreferrer"
              className="text-neutral-300 hover:text-emerald-400 underline font-medium"
            >
              Official YTS DMCA Takedown Portal (yts.mx/dmca)
            </a>
            .
          </p>
        </div>

        {/* Quick Links & Footer Credits */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-neutral-800/80 text-xs text-neutral-400">
          <div className="flex items-center gap-2">
            <Film className="w-4 h-4 text-emerald-400" />
            <span className="font-semibold text-neutral-200">LumiTorrent</span>
            <span>· High Performance YTS &amp; Torbox Debrid Hub</span>
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            <a
              href="https://yts.mx/dmca"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-emerald-400 transition-colors inline-flex items-center gap-1 text-neutral-300 font-medium"
            >
              <span>YTS DMCA</span>
              <ExternalLink className="w-3 h-3 text-neutral-500" />
            </a>
            <a
              href="/sitemap.xml"
              className="hover:text-emerald-400 transition-colors inline-flex items-center gap-1"
            >
              <span>Sitemap</span>
              <ExternalLink className="w-3 h-3 text-neutral-500" />
            </a>
            <a
              href="/robots.txt"
              className="hover:text-emerald-400 transition-colors inline-flex items-center gap-1"
            >
              <span>Robots.txt</span>
              <ExternalLink className="w-3 h-3 text-neutral-500" />
            </a>
            <a
              href="https://torbox.app"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-emerald-400 transition-colors inline-flex items-center gap-1"
            >
              <span>Torbox App</span>
              <ExternalLink className="w-3 h-3 text-neutral-500" />
            </a>
            <a
              href="https://yts.gg/api"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-emerald-400 transition-colors inline-flex items-center gap-1"
            >
              <span>YTS API</span>
              <ExternalLink className="w-3 h-3 text-neutral-500" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
