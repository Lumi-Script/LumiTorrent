'use client';

import React from 'react';
import { Settings, Film, Zap, Key } from 'lucide-react';

interface NavbarProps {
  onOpenSettings: () => void;
  hasApiKey: boolean;
  totalCachedOnPage: number;
  totalTorrentsOnPage: number;
  onSelectCategory?: (category: string) => void;
  activeCategory?: string;
}

export function Navbar({
  onOpenSettings,
  hasApiKey,
  totalCachedOnPage,
  totalTorrentsOnPage,
  onSelectCategory,
  activeCategory = 'all',
}: NavbarProps) {
  return (
    <header className="sticky top-0 z-40 w-full bg-neutral-950/90 backdrop-blur-md border-b border-neutral-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Zone 1: Brand title, single element */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Film className="w-4 h-4" />
          </div>
          <a
            href="/"
            className="text-lg font-bold tracking-tight text-white hover:text-emerald-400 transition-colors"
          >
            LumiTorrent
          </a>
        </div>

        {/* Zone 2: Navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-neutral-400">
          <button
            onClick={() => onSelectCategory?.('all')}
            className={`transition-colors text-left hover:text-white ${
              activeCategory === 'all' ? 'text-emerald-400 font-semibold' : ''
            }`}
          >
            All Movies
          </button>
          <button
            onClick={() => onSelectCategory?.('2160p')}
            className={`transition-colors text-left hover:text-white ${
              activeCategory === '2160p' ? 'text-emerald-400 font-semibold' : ''
            }`}
          >
            4K UHD
          </button>
          <button
            onClick={() => onSelectCategory?.('cached_only')}
            className={`transition-colors text-left hover:text-white flex items-center gap-1.5 ${
              activeCategory === 'cached_only' ? 'text-emerald-400 font-semibold' : ''
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-emerald-400" />
            Cached Stream
          </button>
          <button
            onClick={() => onSelectCategory?.('trending')}
            className={`transition-colors text-left hover:text-white ${
              activeCategory === 'trending' ? 'text-emerald-400 font-semibold' : ''
            }`}
          >
            Popular & Seeds
          </button>
        </nav>

        {/* Zone 3: Actions - Torbox Status & Settings Button */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Torbox live cache counter pill if key configured */}
          {hasApiKey ? (
            <div
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-neutral-900 border border-neutral-800 text-xs text-neutral-300"
              title="Cached torrents detected on the current page ready for instantaneous cloud debrid streaming"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-mono tabular-nums text-emerald-400 font-medium">
                {totalCachedOnPage}/{totalTorrentsOnPage}
              </span>
              <span className="text-neutral-400 text-[11px]">Torbox Cached</span>
            </div>
          ) : (
            <button
              onClick={onOpenSettings}
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 hover:bg-amber-500/20 transition-colors"
            >
              <Key className="w-3 h-3" />
              <span>Set Torbox Key</span>
            </button>
          )}

          {/* Settings button */}
          <button
            onClick={onOpenSettings}
            className="flex items-center gap-2 px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-200 text-xs font-medium rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            aria-label="Torbox Settings"
          >
            <Settings className="w-4 h-4 text-neutral-400 group-hover:text-white" />
            <span className="hidden sm:inline">Torbox Settings</span>
          </button>
        </div>
      </div>
    </header>
  );
}
