'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Star,
  Clock,
  Globe,
  ExternalLink,
  Zap,
  Download,
  Copy,
  Check,
  Loader2,
  Film,
  Users,
  Play,
} from 'lucide-react';
import { Movie, Torrent, CacheMap } from '../types/movie';
import { StoredTorrentRecord } from '../lib/db';
import { fetchMovieDetailsFromFrontend } from '../lib/api';
import { useToast } from './Toast';

interface MovieDetailsModalProps {
  movie: Movie | null;
  isOpen: boolean;
  onClose: () => void;
  cacheMap: CacheMap;
  downloadedMap: Record<string, StoredTorrentRecord>;
  hasApiKey: boolean;
  onAddToTorbox: (torrent: Torrent, movieTitle: string) => Promise<void>;
  onOpenDownload: (torrent: Torrent) => void;
  onOpenSettings: () => void;
}

export function MovieDetailsModal({
  movie,
  isOpen,
  onClose,
  cacheMap,
  downloadedMap = {},
  hasApiKey,
  onAddToTorbox,
  onOpenDownload,
  onOpenSettings,
}: MovieDetailsModalProps) {
  const { toast } = useToast();
  const [details, setDetails] = useState<Movie | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  const [addingHash, setAddingHash] = useState<string | null>(null);
  const [showTrailer, setShowTrailer] = useState(false);

  useEffect(() => {
    if (!movie || !isOpen) {
      setDetails(null);
      setShowTrailer(false);
      return;
    }

    setDetails(movie);

    // Fetch extended details (cast, high-res screenshots, full plot) directly from frontend
    const fetchExtra = async () => {
      setIsLoadingDetails(true);
      try {
        const extra = await fetchMovieDetailsFromFrontend(movie.id);
        if (extra) {
          setDetails({
            ...movie,
            ...extra,
            // Strictly preserve authentic movie.torrents from main page (never overwrite with details placeholder hashes)
            torrents: movie.torrents && movie.torrents.length > 0 ? movie.torrents : (extra.torrents || []),
          });
        }
      } catch {
        // Fall back to original movie object
      } finally {
        setIsLoadingDetails(false);
      }
    };

    fetchExtra();
  }, [movie, isOpen]);

  // Deduplicate torrents and ensure authentic list from main movie
  const currentTorrents = React.useMemo(() => {
    if (!movie) return [];
    const source = movie.torrents && movie.torrents.length > 0 ? movie.torrents : (details?.torrents || []);
    const seen = new Set<string>();
    return source.filter((t) => {
      const key = `${t.hash}-${t.quality}-${t.type}`.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [movie, details?.torrents]);

  if (!isOpen || !movie) return null;

  const currentMovie = details || movie;

  const formatTorrentLabel = (t: Torrent) => {
    const isX265 =
      t.video_codec?.toLowerCase().includes('x265') ||
      t.video_codec?.toLowerCase().includes('hevc') ||
      t.quality === '2160p';

    const base = `${t.quality || '1080p'}.${t.type || 'web'}`.toLowerCase();
    return isX265 ? `${base}.x265` : base;
  };

  const handleCopyMagnet = (torrent: Torrent) => {
    const magnet = `magnet:?xt=urn:btih:${torrent.hash.toUpperCase()}&dn=${encodeURIComponent(
      currentMovie.title
    )}`;
    navigator.clipboard.writeText(magnet);
    setCopiedHash(torrent.hash);
    toast({
      type: 'info',
      title: 'Magnet Link Copied',
      description: 'Trackerless magnet link copied to clipboard.',
      duration: 3000,
    });
    setTimeout(() => setCopiedHash(null), 2500);
  };

  const handleTorbox = async (torrent: Torrent) => {
    if (!hasApiKey) {
      onOpenSettings();
      return;
    }
    setAddingHash(torrent.hash);
    try {
      await onAddToTorbox(torrent, currentMovie.title);
    } finally {
      setAddingHash(null);
    }
  };

  const hours = Math.floor(currentMovie.runtime / 60);
  const minutes = currentMovie.runtime % 60;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/85 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-4xl max-h-[92vh] bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col my-auto z-10 text-neutral-100"
        >
          {/* Header Backdrop Banner */}
          <div className="relative h-44 sm:h-64 w-full bg-neutral-950 overflow-hidden shrink-0">
            {currentMovie.background_image_original || currentMovie.background_image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={currentMovie.background_image_original || currentMovie.background_image}
                alt={currentMovie.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover object-center filter blur-[1px] brightness-50"
              />
            ) : (
              <div className="w-full h-full bg-neutral-950" />
            )}

            {/* Gradient Scrim */}
            <div className="absolute inset-0 bg-gradient-to-t from-neutral-900 via-neutral-900/60 to-transparent" />

            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-20 p-2 rounded-full bg-neutral-950/80 hover:bg-neutral-800 border border-neutral-700 text-neutral-300 hover:text-white transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Backdrop Title Overlay on Mobile/Tablet */}
            <div className="absolute bottom-4 left-6 right-6 flex items-end justify-between">
              <div>
                <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {currentMovie.year}
                </span>
                <h1 className="text-xl sm:text-3xl font-bold text-white mt-1.5 drop-shadow-md">
                  {currentMovie.title}
                </h1>
              </div>

              {currentMovie.yt_trailer_code && (
                <button
                  type="button"
                  onClick={() => setShowTrailer(!showTrailer)}
                  className="px-3 py-1.5 bg-rose-600/90 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-lg backdrop-blur-sm transition-colors"
                >
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>{showTrailer ? 'Hide Trailer' : 'Trailer'}</span>
                </button>
              )}
            </div>
          </div>

          {/* YouTube Trailer Section if toggled */}
          {showTrailer && currentMovie.yt_trailer_code && (
            <div className="bg-neutral-950 p-4 border-b border-neutral-800">
              <div className="relative aspect-video max-w-2xl mx-auto rounded-xl overflow-hidden border border-neutral-800 shadow-2xl">
                <iframe
                  src={`https://www.youtube.com/embed/${currentMovie.yt_trailer_code}?autoplay=1`}
                  title={`${currentMovie.title} Trailer`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full"
                />
              </div>
            </div>
          )}

          {/* Scrollable Body Content */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
            {/* Top Info Layout: Poster + Metadata */}
            <div className="flex flex-col sm:flex-row gap-6">
              {/* Poster Column */}
              <div className="w-36 sm:w-44 shrink-0 mx-auto sm:mx-0">
                <div className="aspect-[2/3] rounded-xl overflow-hidden shadow-xl border border-neutral-800 bg-neutral-950">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={
                      currentMovie.large_cover_image ||
                      currentMovie.medium_cover_image ||
                      currentMovie.small_cover_image
                    }
                    alt={currentMovie.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              {/* Details Column */}
              <div className="flex-1 space-y-4">
                {/* Key metadata grid */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-neutral-300">
                  {/* Rating */}
                  <div className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-md text-amber-300 font-medium">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span className="font-mono tabular-nums text-sm font-bold">
                      {currentMovie.rating ? currentMovie.rating.toFixed(1) : 'N/A'}
                    </span>
                    <span className="text-neutral-400 text-[11px]">/ 10</span>
                  </div>

                  {/* Runtime */}
                  {currentMovie.runtime > 0 && (
                    <div className="flex items-center gap-1.5 bg-neutral-800/60 border border-neutral-700/60 px-2.5 py-1 rounded-md">
                      <Clock className="w-3.5 h-3.5 text-neutral-400" />
                      <span className="font-mono">
                        {hours > 0 ? `${hours}h ` : ''}
                        {minutes}m
                      </span>
                    </div>
                  )}

                  {/* MPA Rating */}
                  {currentMovie.mpa_rating && (
                    <div className="bg-neutral-800/60 border border-neutral-700/60 px-2.5 py-1 rounded-md font-mono uppercase font-medium">
                      {currentMovie.mpa_rating}
                    </div>
                  )}

                  {/* Language */}
                  {currentMovie.language && (
                    <div className="flex items-center gap-1 bg-neutral-800/60 border border-neutral-700/60 px-2.5 py-1 rounded-md uppercase font-mono">
                      <Globe className="w-3.5 h-3.5 text-neutral-400" />
                      <span>{currentMovie.language}</span>
                    </div>
                  )}

                  {/* IMDb External Link */}
                  {currentMovie.imdb_code && (
                    <a
                      href={`https://www.imdb.com/title/${currentMovie.imdb_code}/`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-500/20 border border-amber-500/30 text-amber-200 hover:bg-amber-500/30 transition-colors"
                    >
                      <span>IMDb: {currentMovie.imdb_code}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>

                {/* Genres */}
                {currentMovie.genres && currentMovie.genres.length > 0 && (
                  <div className="flex items-center gap-2 text-xs text-neutral-400">
                    <Film className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{currentMovie.genres.join(' · ')}</span>
                  </div>
                )}

                {/* Summary / Plot */}
                <div className="space-y-1.5 pt-1">
                  <h2 className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">
                    Plot Synopsis
                  </h2>
                  <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed max-w-2xl">
                    {currentMovie.description_full ||
                      currentMovie.summary ||
                      currentMovie.synopsis ||
                      'No plot synopsis provided for this title.'}
                  </p>
                </div>

                {/* Cast Members if loaded */}
                {currentMovie.cast && currentMovie.cast.length > 0 && (
                  <div className="pt-2">
                    <h3 className="text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-neutral-400" />
                      Key Cast
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      {currentMovie.cast.slice(0, 4).map((c, i) => (
                        <div
                          key={i}
                          className="p-2 rounded-lg bg-neutral-950/60 border border-neutral-800"
                        >
                          <p className="font-medium text-neutral-200 truncate">{c.name}</p>
                          <p className="text-[11px] text-neutral-400 truncate">
                            as {c.character_name || 'Cast'}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Torrents & Download Section */}
            <div className="space-y-3 pt-3 border-t border-neutral-800">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    Available Download Formats & Torbox Cloud
                  </h3>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    Click Instant / Torbox to cache directly to your debrid cloud without local client
                  </p>
                </div>

                {!hasApiKey && (
                  <button
                    onClick={onOpenSettings}
                    className="text-xs text-emerald-400 hover:text-emerald-300 hover:underline flex items-center gap-1"
                  >
                    Configure Torbox Key <ExternalLink className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Torrents Table */}
              <div className="overflow-x-auto rounded-xl border border-neutral-800 bg-neutral-950/60">
                <table className="w-full text-left text-xs">
                  <thead className="bg-neutral-900/80 border-b border-neutral-800 text-neutral-400">
                    <tr>
                      <th className="py-2.5 px-3.5 font-medium">Format / Quality</th>
                      <th className="py-2.5 px-3 font-medium">Size</th>
                      <th className="py-2.5 px-3 font-medium hidden sm:table-cell">Seeds / Peers</th>
                      <th className="py-2.5 px-3 font-medium">Torbox Cache</th>
                      <th className="py-2.5 px-3.5 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800/60 font-mono">
                    {currentTorrents && currentTorrents.length > 0 ? (
                      currentTorrents.map((t, idx) => {
                        const lowerHash = (t.hash || '').trim().toLowerCase();
                        const cacheInfo = cacheMap[lowerHash] || cacheMap[t.hash];
                        const isCached = cacheInfo?.cached === true;
                        const label = formatTorrentLabel(t);
                        const isAdding = addingHash === t.hash;
                        const uniqueKey = `${t.hash || 'tor'}-${t.quality}-${t.type}-${idx}`;

                        const downloadedRecord = downloadedMap[lowerHash];
                        const isDownloaded = Boolean(downloadedRecord?.id);

                        return (
                          <tr key={uniqueKey} className="hover:bg-neutral-900/50 transition-colors">
                            {/* Quality */}
                            <td className="py-3 px-3.5 font-medium text-neutral-200">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs text-emerald-400">{label}</span>
                                {t.type && (
                                  <span className="text-[10px] text-neutral-500 uppercase px-1 rounded bg-neutral-800">
                                    {t.type}
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Size */}
                            <td className="py-3 px-3 text-neutral-300 tabular-nums">{t.size}</td>

                            {/* Seeds / Peers */}
                            <td className="py-3 px-3 text-neutral-400 tabular-nums hidden sm:table-cell">
                              <span className="text-emerald-400 font-semibold">{t.seeds}</span> /{' '}
                              <span className="text-neutral-500">{t.peers}</span>
                            </td>

                            {/* Torbox Cache Indicator */}
                            <td className="py-3 px-3">
                              {hasApiKey ? (
                                <div
                                  className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-sans font-medium border ${
                                    isCached
                                      ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                                      : 'bg-rose-950/40 border-rose-500/30 text-rose-300'
                                  }`}
                                >
                                  <span
                                    className={`w-2 h-2 rounded-full ${
                                      isCached
                                        ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]'
                                        : 'bg-rose-500'
                                    }`}
                                  />
                                  <span>{isCached ? 'Cached ⚡' : 'Uncached'}</span>
                                </div>
                              ) : (
                                <span className="text-[11px] font-sans text-neutral-500">
                                  No API key
                                </span>
                              )}
                            </td>

                            {/* Action Buttons */}
                            <td className="py-3 px-3.5 text-right font-sans">
                              <div className="flex items-center justify-end gap-2">
                                {/* Copy Magnet Button (with indicator feedback) */}
                                <button
                                  type="button"
                                  onClick={() => handleCopyMagnet(t)}
                                  className="p-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white transition-colors flex items-center gap-1 text-xs"
                                  title="Copy trackerless magnet link"
                                >
                                  {copiedHash === t.hash ? (
                                    <>
                                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                                      <span className="text-[11px] text-emerald-400 font-medium">Copied</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="w-3.5 h-3.5" />
                                      <span className="text-[11px] hidden sm:inline">Magnet</span>
                                    </>
                                  )}
                                </button>

                                {/* Instant Download Button / Stream Button */}
                                {isDownloaded ? (
                                  <button
                                    type="button"
                                    onClick={() => onOpenDownload(t)}
                                    className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm bg-sky-600 hover:bg-sky-500 text-white shadow-sky-950/60"
                                    title={`⚡ Download / Stream directly (Torbox ID #${downloadedRecord?.id}${downloadedRecord?.fileID !== undefined ? `, File #${downloadedRecord.fileID}` : ''})`}
                                  >
                                    <Download className="w-3.5 h-3.5 text-white" />
                                    <span>Download</span>
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => handleTorbox(t)}
                                    disabled={isAdding}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm ${
                                      isCached
                                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/50'
                                        : hasApiKey
                                        ? 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700/60'
                                        : 'bg-neutral-800/90 hover:bg-neutral-700 text-neutral-300 border border-neutral-700/50'
                                    }`}
                                    title={
                                      isCached
                                        ? `⚡ Instant cloud debrid download for ${label}`
                                        : hasApiKey
                                        ? `Add and cache ${label} to Torbox account`
                                        : 'Configure Torbox API key in Settings'
                                    }
                                  >
                                    {isAdding ? (
                                      <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                                    ) : (
                                      <Zap className={`w-3.5 h-3.5 ${isCached ? 'fill-white text-white' : 'text-emerald-400'}`} />
                                    )}
                                    <span>Instant</span>
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-6 text-center text-neutral-500">
                          No downloadable torrent releases found for this movie.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="p-4 bg-neutral-950 border-t border-neutral-800 flex items-center justify-between text-xs text-neutral-400">
            <span className="font-mono">
              YTS Movie ID: #{currentMovie.id}
            </span>
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg transition-colors font-medium"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
