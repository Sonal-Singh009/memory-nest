import React, { useState, useMemo } from 'react';
import {
  Search as SearchIcon,
  X,
  Calendar,
  Tag,
  Filter,
  Sparkles,
  FileText,
  Mic,
  PenTool,
  Image as ImageIcon,
  Video,
  Music,
  ExternalLink
} from 'lucide-react';
import { MemoryEntry, Category, EntryType, MediaAttachment, CATEGORIES_META } from '../types';

interface SearchViewProps {
  entries: MemoryEntry[];
  onSelectEntry: (entry: MemoryEntry) => void;
  onOpenMediaLightbox: (attachment: MediaAttachment) => void;
}

const ALL_CATEGORIES: Category[] = [
  'Thought',
  'Memory',
  'Idea',
  'Future plan',
  'Goal',
  'Learning',
  'Important',
  'Random',
];

const ENTRY_TYPES: { type: EntryType; label: string; icon: React.FC<{ className?: string }> }[] = [
  { type: 'text', label: 'Notes', icon: FileText },
  { type: 'voice_to_text', label: 'Voice-to-Text', icon: Mic },
  { type: 'sketch', label: 'Sketches', icon: PenTool },
  { type: 'image', label: 'Photos', icon: ImageIcon },
  { type: 'video', label: 'Videos', icon: Video },
  { type: 'audio', label: 'Audio', icon: Music },
];

export const SearchView: React.FC<SearchViewProps> = ({
  entries,
  onSelectEntry,
  onOpenMediaLightbox,
}) => {
  const [query, setQuery] = useState('');
  const [filterType, setFilterType] = useState<EntryType | 'all'>('all');
  const [filterCategory, setFilterCategory] = useState<Category | 'all'>('all');
  const [filterDateRange, setFilterDateRange] = useState<'all' | 'today' | 'week' | 'month'>('all');

  const todayStr = new Date().toISOString().split('T')[0];

  // Perform multi-field search locally and instantly
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();

    return entries.filter((entry) => {
      // Type filter
      if (filterType !== 'all' && entry.type !== filterType) {
        return false;
      }

      // Category filter
      if (filterCategory !== 'all' && entry.category !== filterCategory) {
        return false;
      }

      // Date range filter
      if (filterDateRange === 'today' && entry.date !== todayStr) {
        return false;
      }
      if (filterDateRange === 'week') {
        const entryDate = new Date(entry.date);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        if (entryDate < weekAgo) return false;
      }
      if (filterDateRange === 'month') {
        const entryDate = new Date(entry.date);
        const monthAgo = new Date();
        monthAgo.setDate(monthAgo.getDate() - 30);
        if (entryDate < monthAgo) return false;
      }

      // If no query string, keep everything matching filters
      if (!q) return true;

      // Match query in title
      if (entry.title && entry.title.toLowerCase().includes(q)) return true;

      // Match query in content text
      if (entry.content && entry.content.toLowerCase().includes(q)) return true;

      // Match query in category
      if (entry.category && entry.category.toLowerCase().includes(q)) return true;

      // Match query in tags
      if (entry.tags && entry.tags.some((t) => t.toLowerCase().includes(q))) return true;

      // Match query in date (e.g. "2026-09" or "September")
      if (entry.date.includes(q)) return true;

      // Match query in media captions and fileNames
      if (
        entry.attachments &&
        entry.attachments.some(
          (a) =>
            (a.caption && a.caption.toLowerCase().includes(q)) ||
            (a.fileName && a.fileName.toLowerCase().includes(q))
        )
      ) {
        return true;
      }

      return false;
    });
  }, [entries, query, filterType, filterCategory, filterDateRange, todayStr]);

  // Highlight search term in text snippet
  const highlightSnippet = (text: string, q: string) => {
    if (!text) return null;
    if (!q) return text.length > 200 ? text.substring(0, 200) + '...' : text;

    const lower = text.toLowerCase();
    const idx = lower.indexOf(q.toLowerCase());
    if (idx === -1) {
      return text.length > 200 ? text.substring(0, 200) + '...' : text;
    }

    const start = Math.max(0, idx - 40);
    const end = Math.min(text.length, idx + q.length + 80);
    const prefix = start > 0 ? '...' : '';
    const suffix = end < text.length ? '...' : '';

    const snippet = text.substring(start, end);
    const parts = snippet.split(new RegExp(`(${q})`, 'gi'));

    return (
      <span>
        {prefix}
        {parts.map((p, i) =>
          p.toLowerCase() === q.toLowerCase() ? (
            <mark key={i} className="bg-[#FCEAD2] text-[#3D2C1E] font-medium rounded-xs px-0.5">
              {p}
            </mark>
          ) : (
            p
          )
        )}
        {suffix}
      </span>
    );
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full bg-[#9C5237]" />
          <span className="text-xs font-semibold uppercase tracking-wider text-[#9C5237]">
            Instant Local Search
          </span>
        </div>
        <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-[#2D2A26]">
          Search Vault
        </h1>
        <p className="mt-1 text-sm text-[#7D6D5E]">
          Find thoughts, dates, sketches, photos, captions, and tags in milliseconds offline.
        </p>
      </div>

      {/* Search Input Bar */}
      <div className="relative bg-[#FFFDF9] rounded-2xl border border-[#E8DFC8] shadow-xs focus-within:border-[#9C5237] focus-within:ring-2 focus-within:ring-[#9C5237]/15 transition">
        <div className="flex items-center px-4 py-3">
          <SearchIcon className="w-5 h-5 text-[#8C7A6B] shrink-0 mr-3" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type words, tags like #travel, dates, or media captions..."
            className="w-full text-base text-[#2D2A26] placeholder-[#A49483] bg-transparent focus:outline-none"
            autoFocus
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="p-1 rounded-full text-[#8C7A6B] hover:text-[#2D2A26] hover:bg-[#F2ECE2] transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Filter Row */}
      <div className="space-y-2">
        {/* Date Range Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar text-xs">
          <span className="font-medium text-[#8C7A6B] pr-1">Time:</span>
          {(['all', 'today', 'week', 'month'] as const).map((range) => (
            <button
              key={range}
              type="button"
              onClick={() => setFilterDateRange(range)}
              className={`px-3 py-1 rounded-xl font-medium transition cursor-pointer shrink-0 capitalize ${
                filterDateRange === range
                  ? 'bg-[#9C5237] text-white shadow-2xs'
                  : 'bg-[#FFFDF9] border border-[#EAE0D3] text-[#6C5B4C] hover:bg-[#F7F2EA]'
              }`}
            >
              {range === 'all'
                ? 'All Time'
                : range === 'today'
                ? 'Today'
                : range === 'week'
                ? 'Past 7 Days'
                : 'Past 30 Days'}
            </button>
          ))}
        </div>

        {/* Categories */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar text-xs">
          <span className="font-medium text-[#8C7A6B] pr-1">Category:</span>
          <button
            type="button"
            onClick={() => setFilterCategory('all')}
            className={`px-2.5 py-1 rounded-xl transition cursor-pointer shrink-0 ${
              filterCategory === 'all'
                ? 'bg-[#EAE0D3] text-[#3D2C1E] font-medium'
                : 'text-[#7D6B5A] hover:bg-[#F3ECE0]'
            }`}
          >
            All
          </button>
          {ALL_CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setFilterCategory(filterCategory === cat ? 'all' : cat)}
              className={`px-2.5 py-1 rounded-xl transition cursor-pointer shrink-0 ${
                filterCategory === cat
                  ? 'bg-[#EAE0D3] text-[#3D2C1E] font-medium'
                  : 'text-[#7D6B5A] hover:bg-[#F3ECE0]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Types */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar text-xs">
          <span className="font-medium text-[#8C7A6B] pr-1">Type:</span>
          <button
            type="button"
            onClick={() => setFilterType('all')}
            className={`px-2.5 py-1 rounded-xl transition cursor-pointer shrink-0 ${
              filterType === 'all'
                ? 'bg-[#EAE0D3] text-[#3D2C1E] font-medium'
                : 'text-[#7D6B5A] hover:bg-[#F3ECE0]'
            }`}
          >
            All
          </button>
          {ENTRY_TYPES.map(({ type, label }) => (
            <button
              key={type}
              type="button"
              onClick={() => setFilterType(filterType === type ? 'all' : type)}
              className={`px-2.5 py-1 rounded-xl transition cursor-pointer shrink-0 ${
                filterType === type
                  ? 'bg-[#EAE0D3] text-[#3D2C1E] font-medium'
                  : 'text-[#7D6B5A] hover:bg-[#F3ECE0]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between text-xs text-[#8A7764] pt-1">
        <span>Found {results.length} memories</span>
        {(query || filterCategory !== 'all' || filterType !== 'all' || filterDateRange !== 'all') && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setFilterCategory('all');
              setFilterType('all');
              setFilterDateRange('all');
            }}
            className="text-[#9C5237] hover:underline cursor-pointer"
          >
            Reset filters
          </button>
        )}
      </div>

      {/* Results List */}
      {results.length > 0 ? (
        <div className="space-y-3">
          {results.map((entry) => {
            const catMeta = entry.category ? CATEGORIES_META[entry.category] : null;
            const thumb = entry.attachments?.find((a) => a.type === 'image' || a.type === 'sketch');

            return (
              <div
                key={entry.id}
                onClick={() => onSelectEntry(entry)}
                className="group p-4 bg-[#FFFDF9] hover:bg-[#FFFFFF] rounded-2xl border border-[#EFE8DC] hover:border-[#DFCFC0] shadow-2xs hover:shadow-xs transition cursor-pointer flex items-start gap-4"
              >
                {/* Optional Thumbnail */}
                {thumb && (
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenMediaLightbox(thumb);
                    }}
                    className="w-16 h-16 rounded-xl overflow-hidden bg-[#F2EDE4] border border-[#E5DACB] shrink-0"
                  >
                    <img
                      src={thumb.dataUrl}
                      alt="Thumbnail"
                      className="w-full h-full object-cover group-hover:scale-105 transition"
                    />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1 text-xs">
                    <span className="font-medium text-[#645648] flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-[#9C5237]" />
                      {entry.date}
                    </span>
                    <span className="text-[#A49483]">{entry.timeString}</span>

                    {catMeta && (
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${catMeta.badgeBg} ${catMeta.badgeText} ${catMeta.badgeBorder}`}
                      >
                        {catMeta.name}
                      </span>
                    )}

                    <span className="capitalize text-[11px] text-[#8C7A6B] bg-[#F7F2EA] px-2 py-0.5 rounded-md">
                      {entry.type.replace(/_/g, ' ')}
                    </span>
                  </div>

                  {entry.title && (
                    <h3 className="font-serif text-base font-semibold text-[#2D2A26] mb-1 truncate">
                      {highlightSnippet(entry.title, query)}
                    </h3>
                  )}

                  <p className="text-sm text-[#5C4D3F] line-clamp-2 leading-relaxed">
                    {highlightSnippet(entry.content, query)}
                  </p>

                  {/* Tags */}
                  {entry.tags && entry.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {entry.tags.map((t) => (
                        <span key={t} className="text-[11px] text-[#8A7764] bg-[#F6F0E6] px-1.5 py-0.5 rounded">
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="text-[#C7B5A0] group-hover:text-[#9C5237] transition self-center">
                  <ExternalLink className="w-4 h-4" />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-[#FFFDF9] rounded-3xl p-10 border border-[#EFE8DC] text-center space-y-3">
          <SearchIcon className="w-10 h-10 text-[#C7B5A0] mx-auto opacity-70" />
          <h3 className="font-serif text-lg font-medium text-[#3D3328]">
            No matches found for your search
          </h3>
          <p className="text-sm text-[#7D6D5E]">
            Try a different keyword or check your date range and type filters.
          </p>
        </div>
      )}
    </div>
  );
};
