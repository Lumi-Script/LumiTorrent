import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Film, Zap, AlertCircle, RefreshCw, Layers } from 'lucide-react';
import { Navbar } from './components/Navbar';
import { FilterBar, FilterOptions } from './components/FilterBar';
import { MovieCard } from './components/MovieCard';
import { MovieDetailsModal } from './components/MovieDetailsModal';
import { SettingsModal } from './components/SettingsModal';
import { Pagination } from './components/Pagination';
import { ToastProvider, useToast } from './components/Toast';
import { Movie, Torrent, CacheMap, YTSListResponse } from './types/movie';
import {
  fetchMoviesFromFrontend,
  checkTorboxCacheApi,
  addTorrentToTorboxApi,
} from './lib/api';
import {
  StoredTorrentRecord,
  getTorrentRecords,
  getTorrentRecord,
  openTorboxDownloadLink,
} from './lib/db';

function MainApp() {
  const { toast } = useToast();

  // Storage and credentials state
  const [torboxKey, setTorboxKey] = useState<string>('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Movie list and query state
  const [movies, setMovies] = useState<Movie[]>([]);
  const [totalResults, setTotalResults] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isLoadingMovies, setIsLoadingMovies] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Selected movie for details modal
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Torbox Cache Map & Status & Downloaded DB Map
  const [cacheMap, setCacheMap] = useState<CacheMap>({});
  const [downloadedMap, setDownloadedMap] = useState<Record<string, StoredTorrentRecord>>({});
  const [isCheckingCache, setIsCheckingCache] = useState<boolean>(false);

  // Filter state
  const [filters, setFilters] = useState<FilterOptions>({
    queryTerm: '',
    genre: '',
    year: '',
    sortBy: 'date_added',
    orderBy: 'desc',
    minimumRating: '0',
    cachedOnly: false,
  });

  // Active top navigation category
  const [activeCategory, setActiveCategory] = useState<string>('all');

  // Load Torbox API key from localStorage on mount
  useEffect(() => {
    try {
      const savedKey = localStorage.getItem('torbox_api_key');
      if (savedKey) {
        setTorboxKey(savedKey);
      }
    } catch {
      // Ignore localStorage errors in private browsing
    }
  }, []);

  const saveTorboxKey = (newKey: string) => {
    setTorboxKey(newKey);
    try {
      if (newKey) {
        localStorage.setItem('torbox_api_key', newKey);
      } else {
        localStorage.removeItem('torbox_api_key');
      }
    } catch {
      // Ignore
    }
  };

  // Fetch movies directly from frontend (accel.li supports CORS)
  const fetchMovies = useCallback(async () => {
    setIsLoadingMovies(true);
    setErrorMessage(null);

    try {
      const data: YTSListResponse = await fetchMoviesFromFrontend({
        page: currentPage,
        limit: 20,
        sortBy: filters.sortBy,
        orderBy: filters.orderBy,
        queryTerm: filters.queryTerm,
        genre: filters.genre,
        year: filters.year,
        minimumRating: filters.minimumRating,
        quality: filters.quality,
      });

      if (data.status === 'ok') {
        const fetchedMovies = data.data?.movies || [];
        setMovies(fetchedMovies);
        setTotalResults(data.data?.movie_count || 0);
      } else {
        setMovies([]);
        setTotalResults(0);
        if (data.status_message && data.status_message !== 'No movies found') {
          setErrorMessage(data.status_message);
        }
      }
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Failed to fetch movies from YTS.'
      );
      setMovies([]);
    } finally {
      setIsLoadingMovies(false);
    }
  }, [currentPage, filters.sortBy, filters.orderBy, filters.queryTerm, filters.year, filters.genre, filters.minimumRating, filters.quality]);

  // Trigger movie fetch on filter / page change
  useEffect(() => {
    fetchMovies();
  }, [fetchMovies]);

  // Gather all hashes and check Torbox cache status directly from frontend (with proxy fallback if CORS locked)
  const checkTorboxCache = useCallback(
    async (targetMovies: Movie[]) => {
      if (!torboxKey.trim()) {
        return;
      }

      // Collect all hashes from movies
      const allHashes: string[] = [];
      targetMovies.forEach((m) => {
        if (m.torrents && Array.isArray(m.torrents)) {
          m.torrents.forEach((t) => {
            if (t.hash && t.hash.length >= 32) {
              allHashes.push(t.hash.toLowerCase());
            }
          });
        }
      });

      if (allHashes.length === 0) return;

      setIsCheckingCache(true);
      try {
        const result = await checkTorboxCacheApi(torboxKey, allHashes);

        if (result.success && result.cached) {
          setCacheMap((prev) => ({
            ...prev,
            ...result.cached,
          }));
        } else if (result.error === 'BAD_TOKEN') {
          toast({
            type: 'error',
            title: 'Torbox API Key Error',
            description: 'Torbox token was rejected. Please verify your key in Settings.',
          });
        }
      } catch (err) {
        console.error('Failed to check Torbox cache:', err);
      } finally {
        setIsCheckingCache(false);
      }
    },
    [torboxKey, toast]
  );

  // Trigger cache check and load IndexedDB download records when movies update
  useEffect(() => {
    if (movies.length > 0) {
      const hashes: string[] = [];
      movies.forEach((m) => {
        if (m.torrents && Array.isArray(m.torrents)) {
          m.torrents.forEach((t) => {
            if (t.hash) hashes.push(t.hash);
          });
        }
      });
      getTorrentRecords(hashes).then((records) => {
        setDownloadedMap((prev) => ({ ...prev, ...records }));
      });

      if (torboxKey.trim()) {
        checkTorboxCache(movies);
      }
    }
  }, [movies, torboxKey, checkTorboxCache]);

  // Handle adding torrent to Torbox (direct frontend call with proxy fallback if CORS locked)
  const handleAddToTorbox = useCallback(
    async (torrent: Torrent, movieTitle: string) => {
      if (!torboxKey.trim()) {
        setIsSettingsOpen(true);
        toast({
          type: 'info',
          title: 'Torbox Key Required',
          description: 'Please set your Torbox API key first in Settings.',
        });
        return;
      }

      try {
        const data = await addTorrentToTorboxApi(
          torboxKey,
          torrent.hash,
          `${movieTitle} [${torrent.quality}.${torrent.type}]`
        );

        if (data.success) {
          toast({
            type: 'success',
            title: 'Added to Torbox Cloud!',
            description: data.detail || `${movieTitle} was added to your Torbox account.`,
            duration: 5000,
          });

          // Mark as cached locally so user sees immediate feedback
          setCacheMap((prev) => ({
            ...prev,
            [torrent.hash.toLowerCase()]: { cached: true },
          }));

          // Fetch updated DB record (torrent_id)
          const updatedRecord = await getTorrentRecord(torrent.hash);
          if (updatedRecord) {
            setDownloadedMap((prev) => ({
              ...prev,
              [torrent.hash.toLowerCase()]: updatedRecord,
            }));
          }
        } else {
          toast({
            type: 'error',
            title: 'Torbox Request Failed',
            description: data.detail || 'Could not add torrent to Torbox.',
            duration: 5000,
          });
        }
      } catch (err) {
        toast({
          type: 'error',
          title: 'Network Error',
          description: err instanceof Error ? err.message : 'Failed to reach Torbox API.',
        });
      }
    },
    [torboxKey, toast]
  );

  // Handle opening download / stream link in new tab
  const handleOpenDownload = useCallback(
    (torrent: Torrent) => {
      if (!torboxKey.trim()) {
        setIsSettingsOpen(true);
        return;
      }
      const lowerHash = (torrent.hash || '').trim().toLowerCase();
      const record = downloadedMap[lowerHash];
      if (record && record.id) {
        openTorboxDownloadLink(torboxKey, record.id, record.fileID);
      } else {
        toast({
          type: 'info',
          title: 'Adding to Torbox...',
          description: 'Torrent ID not found yet. Adding to Torbox to enable direct download.',
        });
        handleAddToTorbox(torrent, selectedMovie?.title || 'Movie');
      }
    },
    [torboxKey, downloadedMap, selectedMovie, toast, handleAddToTorbox]
  );

  // Filter movies for "cached only" toggle
  const displayedMovies = useMemo(() => {
    if (!filters.cachedOnly) return movies;

    return movies.filter((m) => {
      if (!m.torrents || m.torrents.length === 0) return false;
      return m.torrents.some((t) => {
        const h = t.hash?.toLowerCase();
        return cacheMap[h]?.cached === true;
      });
    });
  }, [movies, filters.cachedOnly, cacheMap]);

  // Stats for Navbar
  const totalTorrentsOnPage = useMemo(() => {
    return movies.reduce((acc, m) => acc + (m.torrents?.length || 0), 0);
  }, [movies]);

  const totalCachedOnPage = useMemo(() => {
    return movies.reduce((acc, m) => {
      if (!m.torrents) return acc;
      const count = m.torrents.filter((t) => cacheMap[t.hash?.toLowerCase()]?.cached === true).length;
      return acc + count;
    }, 0);
  }, [movies, cacheMap]);

  // Handle navigation category click
  const handleSelectCategory = (cat: string) => {
    setActiveCategory(cat);
    setCurrentPage(1);

    if (cat === 'all') {
      setFilters((prev) => ({
        ...prev,
        queryTerm: '',
        genre: '',
        year: '',
        quality: '',
        sortBy: 'date_added',
        orderBy: 'desc',
        minimumRating: '0',
        cachedOnly: false,
      }));
    } else if (cat === '2160p') {
      setFilters((prev) => ({
        ...prev,
        queryTerm: '',
        genre: '',
        year: '',
        quality: '2160p',
        sortBy: 'date_added',
        orderBy: 'desc',
        cachedOnly: false,
      }));
    } else if (cat === 'cached_only' || cat === 'cached') {
      if (!torboxKey) {
        setIsSettingsOpen(true);
        toast({
          type: 'info',
          title: 'Torbox API Key Needed',
          description: 'Add your Torbox API key to detect and filter instant cached streams.',
        });
      }
      setFilters((prev) => ({
        ...prev,
        cachedOnly: true,
      }));
    } else if (cat === 'trending' || cat === 'popular') {
      setFilters((prev) => ({
        ...prev,
        queryTerm: '',
        genre: '',
        year: '',
        quality: '',
        sortBy: 'download_count',
        orderBy: 'desc',
        minimumRating: '0',
        cachedOnly: false,
      }));
    } else if (cat === 'top_rated') {
      setFilters((prev) => ({
        ...prev,
        queryTerm: '',
        genre: '',
        year: '',
        quality: '',
        sortBy: 'rating',
        orderBy: 'desc',
        minimumRating: '7',
        cachedOnly: false,
      }));
    }
  };

  const handleOpenDetails = (movie: Movie) => {
    setSelectedMovie(movie);
    setIsDetailsOpen(true);
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans">
      {/* Main Navbar */}
      <Navbar
        onOpenSettings={() => setIsSettingsOpen(true)}
        hasApiKey={Boolean(torboxKey.trim())}
        totalCachedOnPage={totalCachedOnPage}
        totalTorrentsOnPage={totalTorrentsOnPage}
        onSelectCategory={handleSelectCategory}
        activeCategory={activeCategory}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full">
        {/* Hero Section */}
        <div className="mb-6 rounded-2xl bg-gradient-to-r from-neutral-900 via-neutral-900/90 to-neutral-950 border border-neutral-800 p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden shadow-xl">
          <div className="relative z-10 max-w-2xl space-y-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <Zap className="w-3.5 h-3.5" />
              Direct Torbox Cloud Integration
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              YTS Cinema Catalog with Real-Time Debrid Cache
            </h1>
            <p className="text-sm text-neutral-400 leading-relaxed">
              Explore 75,000+ movies in 720p, 1080p & 2160p (x265). Automatically checks which torrent hashes are instantly cached on Torbox cloud storage for zero-waiting downloads.
            </p>
          </div>

          <div className="relative z-10 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              onClick={() => {
                if (!torboxKey) {
                  setIsSettingsOpen(true);
                } else {
                  setFilters((prev) => ({ ...prev, cachedOnly: !prev.cachedOnly }));
                }
              }}
              className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-md ${
                filters.cachedOnly
                  ? 'bg-emerald-600 text-white hover:bg-emerald-500 ring-2 ring-emerald-400/30'
                  : 'bg-neutral-800 text-neutral-200 hover:bg-neutral-700 border border-neutral-700'
              }`}
            >
              <Zap className={`w-4 h-4 ${filters.cachedOnly ? 'fill-white text-white' : 'text-emerald-400'}`} />
              <span>{filters.cachedOnly ? 'Showing Cached Only' : 'Filter Cached Torrents'}</span>
            </button>

            <button
              onClick={() => {
                fetchMovies();
                if (torboxKey && movies.length > 0) {
                  checkTorboxCache(movies);
                }
              }}
              className="px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 flex items-center justify-center gap-1.5 transition-colors"
              title="Refresh catalog & cache status"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingMovies || isCheckingCache ? 'animate-spin text-emerald-400' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <FilterBar
          filters={filters}
          onChange={(updated) => {
            setFilters((prev) => ({ ...prev, ...updated }));
            setCurrentPage(1);
          }}
          onReset={() => {
            setFilters({
              queryTerm: '',
              genre: '',
              year: '',
              sortBy: 'date_added',
              orderBy: 'desc',
              minimumRating: '0',
              cachedOnly: false,
            });
            setCurrentPage(1);
          }}
          totalResults={totalResults}
          hasApiKey={Boolean(torboxKey.trim())}
        />

        {/* Active Filter Indicators */}
        {filters.cachedOnly && (
          <div className="mb-4 flex items-center justify-between p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-xs text-emerald-300">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>
                Filtering by <strong>Torbox Instant Cached</strong> ({displayedMovies.length} movies on this page have cloud-cached copies)
              </span>
            </div>
            <button
              onClick={() => setFilters((prev) => ({ ...prev, cachedOnly: false }))}
              className="text-xs text-emerald-400 hover:text-emerald-200 underline font-medium"
            >
              Show all movies
            </button>
          </div>
        )}

        {/* Error Notification */}
        {errorMessage && (
          <div className="mb-6 p-4 rounded-xl bg-rose-950/40 border border-rose-500/30 flex items-center justify-between text-xs text-rose-300">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={fetchMovies}
              className="px-2.5 py-1 rounded bg-rose-900/60 hover:bg-rose-900 text-rose-200 transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {/* Movie Grid Section */}
        {isLoadingMovies ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className="rounded-xl border border-neutral-800 bg-neutral-900/40 overflow-hidden animate-pulse flex flex-col aspect-[2/3.8]"
              >
                <div className="w-full aspect-[2/3] bg-neutral-800/60" />
                <div className="p-3 space-y-2 flex-1">
                  <div className="h-4 bg-neutral-800 rounded w-3/4" />
                  <div className="h-3 bg-neutral-800 rounded w-1/2" />
                  <div className="h-6 bg-neutral-800 rounded w-full mt-4" />
                </div>
              </div>
            ))}
          </div>
        ) : displayedMovies.length === 0 ? (
          <div className="py-20 text-center rounded-2xl border border-neutral-800/80 bg-neutral-900/30 p-8 space-y-4">
            <Layers className="w-12 h-12 mx-auto text-neutral-600" />
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-neutral-300">No movies found</h3>
              <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                {filters.cachedOnly
                  ? 'None of the movies on this page are currently cached in your Torbox cloud. Try turning off "Cached Only" or checking another page.'
                  : 'Try adjusting your search keywords, genre, or release year filters.'}
              </p>
            </div>
            {filters.cachedOnly && (
              <button
                onClick={() => setFilters((prev) => ({ ...prev, cachedOnly: false }))}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
              >
                Show All Releases
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {displayedMovies.map((movie) => (
              <MovieCard
                key={movie.id}
                movie={movie}
                cacheMap={cacheMap}
                downloadedMap={downloadedMap}
                isCheckingCache={isCheckingCache}
                hasApiKey={Boolean(torboxKey.trim())}
                onOpenDetails={handleOpenDetails}
                onAddToTorbox={handleAddToTorbox}
                onOpenDownload={handleOpenDownload}
                onOpenSettings={() => setIsSettingsOpen(true)}
              />
            ))}
          </div>
        )}

        {/* Pagination Section (20 per page) */}
        {!isLoadingMovies && displayedMovies.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalResults={totalResults}
            pageSize={20}
            onPageChange={(page) => {
              setCurrentPage(page);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            isLoading={isLoadingMovies}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-neutral-800 bg-neutral-950 py-6 text-xs text-neutral-500 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Film className="w-4 h-4 text-emerald-500" />
            <span className="font-semibold text-neutral-300">LumiTorrent</span>
            <span>· Powered by YTS API & Torbox Debrid</span>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="https://yts.gg/api"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-neutral-300 transition-colors"
            >
              YTS API Docs
            </a>
            <a
              href="https://torbox.app"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-neutral-300 transition-colors"
            >
              Torbox Service
            </a>
          </div>
        </div>
      </footer>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        apiKey={torboxKey}
        onSaveKey={saveTorboxKey}
        onRecheckCache={() => checkTorboxCache(movies)}
      />

      {/* Movie Details Modal */}
      <MovieDetailsModal
        movie={selectedMovie}
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        cacheMap={cacheMap}
        downloadedMap={downloadedMap}
        hasApiKey={Boolean(torboxKey.trim())}
        onAddToTorbox={handleAddToTorbox}
        onOpenDownload={handleOpenDownload}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <MainApp />
    </ToastProvider>
  );
}