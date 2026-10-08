'use client';

import React, { useState } from 'react';
import { Star, Clock, Zap, Download, Copy, ExternalLink, Loader2, Check } from 'lucide-react';
import { Movie, Torrent, CacheMap } from '../types/movie';
import { StoredTorrentRecord } from '../lib/db';

interface MovieCardProps {
  movie: Movie;
  cacheMap: CacheMap;
  downloadedMap: Record<string, StoredTorrentRecord>;
  isCheckingCache: boolean;
  hasApiKey: boolean;
  onOpenDetails: (movie: Movie) => void;
  onAddToTorbox: (torrent: Torrent, movieTitle: string) => Promise<void>;
  onOpenDownload: (torrent: Torrent) => void;
  onOpenSettings: () => void;
}

export function MovieCard({
  movie,
  cacheMap,
  downloadedMap = {},
  isCheckingCache,
  hasApiKey,
  onOpenDetails,
  onAddToTorbox,
  onOpenDownload,
  onOpenSettings,
}: MovieCardProps) {
  const [addingHash, setAddingHash] = useState<string | null>(null);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Helper to construct quality.type string with x265 indicator
  const formatTorrentLabel = (t: Torrent) => {
    const isX265 =
      t.video_codec?.toLowerCase().includes('x265') ||
      t.video_codec?.toLowerCase().includes('hevc') ||
      t.quality === '2160p';

    const base = `${t.quality || '1080p'}.${t.type || 'web'}`.toLowerCase();
    return isX265 ? `${base}.x265` : base;
  };

  const handleTorboxClick = async (e: React.MouseEvent, torrent: Torrent) => {
    e.stopPropagation();
    if (!hasApiKey) {
      onOpenSettings();
      return;
    }
    setAddingHash(torrent.hash);
    try {
      await onAddToTorbox(torrent, movie.title);
    } finally {
      setAddingHash(null);
    }
  };

  const handleCopyMagnet = (e: React.MouseEvent, torrent: Torrent) => {
    e.stopPropagation();
    const magnet = `magnet:?xt=urn:btih:${torrent.hash.toUpperCase()}&dn=${encodeURIComponent(
      movie.title
    )}`;
    navigator.clipboard.writeText(magnet);
    setCopiedHash(torrent.hash);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const coverUrl =
    movie.large_cover_image || movie.medium_cover_image || movie.small_cover_image;

  return (
    <article
      onClick={() => onOpenDetails(movie)}
      className="group flex flex-col bg-neutral-900 border border-neutral-800/90 hover:border-neutral-700 rounded-xl overflow-hidden transition-all duration-200 hover:shadow-xl hover:shadow-black/50 cursor-pointer"
    >
      {/* Poster Image Container */}
      <div className="relative aspect-[2/3] w-full bg-neutral-950 overflow-hidden">
        {/* Loading shimmer placeholder */}
        {!imageLoaded && !imageError && (
          <div className="absolute inset-0 bg-neutral-900 animate-pulse flex items-center justify-center">
            <span className="text-xs text-neutral-600">Loading poster...</span>
          </div>
        )}

        {/* Fallback container if image fails to load */}
        {imageError ? (
          <div className="absolute inset-0 bg-neutral-900 flex flex-col items-center justify-center p-4 text-center">
            <p className="text-sm font-semibold text-neutral-300">{movie.title}</p>
            <p className="text-xs text-neutral-500 mt-1">{movie.year}</p>
          </div>
        ) : (
          /* Image element with no-referrer for YTS asset loading */
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={coverUrl}
            alt={movie.title}
            referrerPolicy="no-referrer"
            loading="lazy"
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
            className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
          />
        )}

        {/* Measured scrim at top and bottom */}
        <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/80 via-black/30 to-transparent pointer-events-none" />
        <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-neutral-950 via-neutral-950/60 to-transparent pointer-events-none" />

        {/* Top Floating Badges */}
        <div className="absolute top-2.5 inset-x-2.5 flex items-center justify-between text-xs pointer-events-none">
          {/* Year */}
          <span className="bg-neutral-950/80 backdrop-blur-md px-2 py-0.5 rounded text-neutral-200 font-mono text-[11px] font-medium border border-neutral-800">
            {movie.year || 'N/A'}
          </span>

          {/* Rating */}
          <div className="flex items-center gap-1 bg-neutral-950/80 backdrop-blur-md px-2 py-0.5 rounded text-amber-400 font-medium text-[11px] border border-neutral-800">
            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
            <span className="font-mono tabular-nums">{movie.rating ? movie.rating.toFixed(1) : 'N/A'}</span>
          </div>
        </div>

        {/* Quick details trigger hint */}
        <div className="absolute bottom-2.5 right-2.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="flex items-center gap-1 text-[11px] text-neutral-200 bg-neutral-900/90 backdrop-blur-md px-2 py-1 rounded border border-neutral-700">
            Details <ExternalLink className="w-3 h-3 text-emerald-400" />
          </span>
        </div>
      </div>

      {/* Content Section */}
      <div className="flex-1 p-3.5 flex flex-col justify-between space-y-3">
        {/* Title and Metadata */}
        <div>
          <h3
            className="text-sm font-semibold text-neutral-100 group-hover:text-emerald-400 transition-colors line-clamp-1"
            title={movie.title}
          >
            {movie.title}
          </h3>

          {/* Clean unboxed metadata with typographic separators */}
          <div className="flex items-center gap-1.5 text-[11px] text-neutral-400 mt-1 line-clamp-1">
            <span>{movie.genres?.slice(0, 2).join(' / ') || 'Cinema'}</span>
            {movie.runtime > 0 && (
              <>
                <span aria-hidden="true" className="text-neutral-600">·</span>
                <span className="flex items-center gap-0.5 font-mono">
                  <Clock className="w-3 h-3 text-neutral-500" />
                  {Math.floor(movie.runtime / 60)}h {movie.runtime % 60}m
                </span>
              </>
            )}
            {movie.language && (
              <>
                <span aria-hidden="true" className="text-neutral-600">·</span>
                <span className="uppercase">{movie.language}</span>
              </>
            )}
          </div>
        </div>

        {/* Torrents Section with Torbox Cached Status & Download buttons */}
        <div className="pt-2 border-t border-neutral-800/80 space-y-1.5">
          <div className="flex items-center justify-between text-[11px] text-neutral-400">
            <span className="font-medium">Available Releases</span>
            {isCheckingCache && hasApiKey && (
              <span className="flex items-center gap-1 text-emerald-400 text-[10px]">
                <Loader2 className="w-2.5 h-2.5 animate-spin" /> Checking
              </span>
            )}
          </div>

          {/* Torrent Releases List */}
          <div className="flex flex-col gap-1.5">
            {movie.torrents && movie.torrents.length > 0 ? (
              movie.torrents.slice(0, 3).map((torrent, idx) => {
                const lowerHash = (torrent.hash || '').trim().toLowerCase();
                const cacheInfo = cacheMap[lowerHash] || cacheMap[torrent.hash];
                const isCached = cacheInfo?.cached === true;
                const isPending = isCheckingCache && !cacheInfo && hasApiKey;
                const isAdding = addingHash === torrent.hash;
                const label = formatTorrentLabel(torrent);

                const downloadedRecord = downloadedMap[lowerHash];
                const isDownloaded = Boolean(downloadedRecord?.id);

                return (
                  <div
                    key={`${torrent.hash || 'tor'}-${torrent.quality}-${torrent.type}-${idx}`}
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center justify-between gap-2 p-1.5 px-2 rounded-lg bg-neutral-950/70 border border-neutral-800/80 hover:border-neutral-700/80 text-xs transition-colors"
                  >
                    {/* Quality label + Size (never truncated or overlapped) */}
                    <div className="flex items-baseline gap-1.5 min-w-0 overflow-hidden">
                      <span className="font-mono text-[11px] font-semibold text-neutral-200 tracking-tight shrink-0">
                        {label}
                      </span>
                      <span className="text-[10px] text-neutral-500 font-mono shrink-0 truncate">
                        {torrent.size}
                      </span>
                    </div>

                    {/* Right Controls: Cached Status Indicator (where copy was) + Action Button */}
                    <div className="flex items-center gap-2 shrink-0">
                      {/* Cached Status Indicator (where the copy button was) */}
                      {hasApiKey ? (
                        <button
                          type="button"
                          onClick={(e) => handleCopyMagnet(e, torrent)}
                          className={`flex items-center gap-1.5 px-1.5 py-0.5 rounded text-[10px] font-mono transition-colors group/indicator ${
                            isCached
                              ? 'text-emerald-400 hover:bg-emerald-950/40'
                              : isPending
                              ? 'text-neutral-400'
                              : 'text-rose-400 hover:bg-rose-950/30'
                          }`}
                          title={
                            copiedHash === torrent.hash
                              ? 'Magnet link copied!'
                              : isCached
                              ? 'Torbox: Cached in cloud (click to copy magnet)'
                              : isPending
                              ? 'Checking Torbox cache status...'
                              : 'Torbox: Uncached (click to copy magnet)'
                          }
                        >
                          <span
                            className={`w-2 h-2 rounded-full shrink-0 transition-transform group-hover/indicator:scale-125 ${
                              isCached
                                ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]'
                                : isPending
                                ? 'bg-neutral-500 animate-pulse'
                                : 'bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.6)]'
                            }`}
                          />
                          <span className="text-[10px] hidden xs:inline font-medium">
                            {copiedHash === torrent.hash ? 'Copied' : isCached ? 'Cached' : isPending ? '...' : 'Uncached'}
                          </span>
                        </button>
                      ) : null}

                      {/* Download Button (if already downloaded to Torbox) or Instant Button */}
                      {isDownloaded ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenDownload(torrent);
                          }}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all bg-sky-600 hover:bg-sky-500 text-white shadow-sm shadow-sky-950/60"
                          title={`⚡ Download / Stream directly (Torbox ID #${downloadedRecord?.id}${downloadedRecord?.fileID !== undefined ? `, File #${downloadedRecord.fileID}` : ''})`}
                        >
                          <Download className="w-3 h-3 text-white" />
                          <span>Download</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => handleTorboxClick(e, torrent)}
                          disabled={isAdding}
                          className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                            isCached
                              ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm shadow-emerald-950/50'
                              : isPending
                              ? 'bg-neutral-800 text-neutral-400 border border-neutral-700/40'
                              : hasApiKey
                              ? 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700/60'
                              : 'bg-neutral-800/90 hover:bg-neutral-700 text-neutral-300 border border-neutral-700/50'
                          }`}
                          title={
                            isCached
                              ? `⚡ Instant cloud download for ${label}`
                              : hasApiKey
                              ? `Add and cache ${label} to Torbox account`
                              : 'Configure Torbox API key in Settings'
                          }
                        >
                          {isAdding ? (
                            <Loader2 className="w-3 h-3 animate-spin text-white" />
                          ) : (
                            <Zap className={`w-3 h-3 ${isCached ? 'fill-white text-white' : 'text-neutral-400'}`} />
                          )}
                          <span>Instant</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <span className="text-xs text-neutral-500 italic">No torrents available</span>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
