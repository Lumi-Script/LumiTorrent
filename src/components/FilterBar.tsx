'use client';

import React, { useState, useEffect } from 'react';
import { Search, X, SlidersHorizontal, ArrowUpDown, RotateCcw, Zap } from 'lucide-react';

export interface FilterOptions {
  queryTerm: string;
  genre: string;
  year: string;
  sortBy: string;
  orderBy: string;
  minimumRating: string;
  cachedOnly: boolean;
}

interface FilterBarProps {
  filters: FilterOptions;
  onChange: (updated: Partial<FilterOptions>) => void;
  onReset: () => void;
  totalResults?: number;
  hasApiKey: boolean;
}

const GENRES = [
  'All Genres',
  'Action',
  'Adventure',
  'Animation',
  'Biography',
  'Comedy',
  'Crime',
  'Documentary',
  'Drama',
  'Family',
  'Fantasy',
  'Film-Noir',
  'History',
  'Horror',
  'Music',
  'Musical',
  'Mystery',
  'Romance',
  'Sci-Fi',
  'Sport',
  'Thriller',
  'War',
  'Western',
];

const YEARS = [
  'All Years',
  '2026',
  '2025',
  '2024',
  '2023',
  '2022',
  '2021',
  '2020',
  '2019',
  '2018',
  '2017',
  '2016',
  '2015',
  '2010',
  '2005',
  '2000',
  '1995',
  '1990',
  '1980',
  '1970',
];

const SORT_OPTIONS = [
  { value: 'date_added', label: 'Date Added' },
  { value: 'year', label: 'Release Year' },
  { value: 'rating', label: 'IMDb Rating' },
  { value: 'seeds', label: 'Seeds Count' },
  { value: 'peers', label: 'Peers Count' },
  { value: 'download_count', label: 'Downloads' },
  { value: 'like_count', label: 'Likes' },
  { value: 'title', label: 'Alphabetical' },
];

const RATING_OPTIONS = [
  { value: '0', label: 'Any Rating' },
  { value: '8', label: '8+ ⭐ Excellent' },
  { value: '7', label: '7+ ⭐ Great' },
  { value: '6', label: '6+ ⭐ Good' },
  { value: '5', label: '5+ ⭐ Average' },
];

export function FilterBar({
  filters,
  onChange,
  onReset,
  totalResults,
  hasApiKey,
}: FilterBarProps) {
  const [searchInput, setSearchInput] = useState(filters.queryTerm);

  useEffect(() => {
    setSearchInput(filters.queryTerm);
  }, [filters.queryTerm]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onChange({ queryTerm: searchInput });
  };

  const clearSearch = () => {
    setSearchInput('');
    onChange({ queryTerm: '' });
  };

  const isFiltered =
    Boolean(filters.queryTerm) ||
    filters.genre !== '' ||
    filters.year !== '' ||
    filters.minimumRating !== '0' ||
    filters.sortBy !== 'date_added' ||
    filters.orderBy !== 'desc' ||
    filters.cachedOnly;

  return (
    <div className="bg-neutral-900/80 border border-neutral-800 rounded-xl p-4 shadow-lg backdrop-blur-sm space-y-3.5">
      {/* Search Input Bar */}
      <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search movies by title, actor, director, or keyword..."
            className="w-full bg-neutral-950 border border-neutral-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg pl-10 pr-9 py-2.5 text-sm text-neutral-100 placeholder-neutral-500"
          />
          {searchInput && (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-200"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <button
          type="submit"
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shadow-sm"
        >
          Search
        </button>
      </form>

      {/* Filter Row: Genre, Year, Sort, Order, Rating, Torbox Cached */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-1">
        {/* Genre Selector */}
        <div>
          <label className="block text-[11px] font-medium text-neutral-400 mb-1">Genre</label>
          <select
            value={filters.genre ? filters.genre : 'All Genres'}
            onChange={(e) => {
              const val = e.target.value === 'All Genres' ? '' : e.target.value;
              onChange({ genre: val });
            }}
            className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs text-neutral-200 focus:border-emerald-500 focus:outline-none"
          >
            {GENRES.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </div>

        {/* Release Year Selector */}
        <div>
          <label className="block text-[11px] font-medium text-neutral-400 mb-1">Release Year</label>
          <select
            value={filters.year ? filters.year : 'All Years'}
            onChange={(e) => {
              const val = e.target.value === 'All Years' ? '' : e.target.value;
              onChange({ year: val });
            }}
            className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs text-neutral-200 focus:border-emerald-500 focus:outline-none"
          >
            {YEARS.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>

        {/* Sort By Selector */}
        <div>
          <label className="block text-[11px] font-medium text-neutral-400 mb-1">Sort By</label>
          <select
            value={filters.sortBy}
            onChange={(e) => onChange({ sortBy: e.target.value })}
            className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs text-neutral-200 focus:border-emerald-500 focus:outline-none"
          >
            {SORT_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        {/* Order Toggle (Desc / Asc) */}
        <div>
          <label className="block text-[11px] font-medium text-neutral-400 mb-1">Order</label>
          <button
            type="button"
            onClick={() => onChange({ orderBy: filters.orderBy === 'desc' ? 'asc' : 'desc' })}
            className="w-full bg-neutral-950 border border-neutral-800 hover:border-neutral-700 rounded-lg px-2.5 py-1.5 text-xs text-neutral-200 flex items-center justify-between transition-colors"
          >
            <span>{filters.orderBy === 'desc' ? 'Descending' : 'Ascending'}</span>
            <ArrowUpDown className="w-3.5 h-3.5 text-neutral-400" />
          </button>
        </div>

        {/* Rating Filter */}
        <div>
          <label className="block text-[11px] font-medium text-neutral-400 mb-1">Rating</label>
          <select
            value={filters.minimumRating}
            onChange={(e) => onChange({ minimumRating: e.target.value })}
            className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs text-neutral-200 focus:border-emerald-500 focus:outline-none"
          >
            {RATING_OPTIONS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>

        {/* Instant Cached Only Toggle */}
        <div>
          <label className="block text-[11px] font-medium text-neutral-400 mb-1">Torbox Instant</label>
          <button
            type="button"
            onClick={() => onChange({ cachedOnly: !filters.cachedOnly })}
            className={`w-full border rounded-lg px-2.5 py-1.5 text-xs flex items-center justify-center gap-1.5 transition-colors ${
              filters.cachedOnly
                ? 'bg-emerald-950/50 border-emerald-500/50 text-emerald-300 font-medium'
                : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-neutral-200'
            }`}
            title={
              hasApiKey
                ? 'Filter to only show movies with at least 1 instant cached torrent'
                : 'Requires Torbox API Key in Settings'
            }
          >
            <Zap className={`w-3.5 h-3.5 ${filters.cachedOnly ? 'text-emerald-400 fill-emerald-400' : ''}`} />
            <span>Cached Only</span>
          </button>
        </div>
      </div>

      {/* Info & Reset Row */}
      <div className="flex items-center justify-between text-xs text-neutral-400 pt-1 border-t border-neutral-800/60">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-3.5 h-3.5 text-neutral-500" />
          {typeof totalResults === 'number' && (
            <span>
              Found <strong className="text-neutral-200 font-mono tabular-nums">{totalResults.toLocaleString()}</strong> titles
            </span>
          )}
        </div>

        {isFiltered && (
          <button
            type="button"
            onClick={onReset}
            className="flex items-center gap-1 text-xs text-neutral-400 hover:text-emerald-400 transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset filters</span>
          </button>
        )}
      </div>
    </div>
  );
}
