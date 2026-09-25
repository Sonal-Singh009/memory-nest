import React, { useState, useMemo } from 'react';
import {
  Filter,
  SlidersHorizontal,
  Heart,
  Calendar,
  Layers,
  Sparkles,
  FileText,
  Mic,
  PenTool,
  Image as ImageIcon,
  Video,
  Music,
  ArrowUpDown
} from 'lucide-react';
import { MemoryEntry, Category, EntryType, MediaAttachment, CATEGORIES_META } from '../types';
import { EntryCard } from './EntryCard';

interface MemoriesViewProps {
  entries: MemoryEntry[];
  onEditEntry: (entry: MemoryEntry) => void;
  onDeleteEntry: (id: string) => void;
  onToggleFavorite: (entry: MemoryEntry) => void;
  onTogglePin: (entry: MemoryEntry) => void;
  onOpenMediaLightbox: (attachment: MediaAttachment) => void;
  onOpenCapture: () => void;
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
  { type: 'audio', label: 'Audio Memos', icon: Music },
];

export const MemoriesView: React.FC<MemoriesViewProps> = ({
  entries,
  onEditEntry,
  onDeleteEntry,
  onToggleFavorite,
  onTogglePin,
  onOpenMediaLightbox,
  onOpenCapture,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<Category | 'all'>('all');
  const [selectedType, setSelectedType] = useState<EntryType | 'all'>('all');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

  // Collect all unique tags
  const allTags = useMemo(() => {
    const set = new Set<string>();
    entries.forEach((e) => {
      e.tags?.forEach((t) => set.add(t));
    });
    return Array.from(set);
  }, [entries]);

  // Filtered & sorted entries
  const filteredEntries = useMemo(() => {
    let result = [...entries];

    if (selectedCategory !== 'all') {
      result = result.filter((e) => e.category === selectedCategory);
    }

    if (selectedType !== 'all') {
      result = result.filter((e) => e.type === selectedType);
    }

    if (favoritesOnly) {
      result = result.filter((e) => e.isFavorite);
    }

    if (selectedTag) {
      result = result.filter((e) => e.tags && e.tags.includes(selectedTag));
    }

    result.sort((a, b) => {
      // Pinned entries first if newest
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;

      return sortOrder === 'newest' ? b.createdAt - a.createdAt : a.createdAt - b.createdAt;
    });

    return result;
  }, [entries, selectedCategory, selectedType, favoritesOnly, selectedTag, sortOrder]);

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-[#9C5237]" />
            <span className="text-xs font-semibold uppercase tracking-wider text-[#9C5237]">
              Life Archive
            </span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-[#2D2A26]">
            All Memories ({filteredEntries.length})
          </h1>
        </div>

        {/* Sort & Favorites Quick Toggles */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setFavoritesOnly(!favoritesOnly)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-medium border transition cursor-pointer ${
              favoritesOnly
                ? 'bg-[#FBE8E8] border-[#F2C9C9] text-[#9C3737]'
                : 'bg-[#FFFDF9] border-[#EAE0D3] text-[#6C5B4C] hover:bg-[#F7F2EA]'
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${favoritesOnly ? 'fill-current' : ''}`} />
            <span>Favorites</span>
          </button>

          <button
            type="button"
            onClick={() => setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-medium bg-[#FFFDF9] border border-[#EAE0D3] text-[#6C5B4C] hover:bg-[#F7F2EA] transition cursor-pointer"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-[#9C5237]" />
            <span>{sortOrder === 'newest' ? 'Newest first' : 'Oldest first'}</span>
          </button>
        </div>
      </div>

      {/* Filter Category & Type Strip */}
      <div className="space-y-2.5">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition cursor-pointer shrink-0 ${
              selectedCategory === 'all'
                ? 'bg-[#9C5237] text-white border-[#9C5237] shadow-2xs'
                : 'bg-[#FFFDF9] text-[#6C5B4C] border-[#EAE0D3] hover:bg-[#F7F2EA]'
            }`}
          >
            All Categories
          </button>

          {ALL_CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat;
            const meta = CATEGORIES_META[cat];
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(isSelected ? 'all' : cat)}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition cursor-pointer shrink-0 ${
                  isSelected
                    ? `${meta.badgeBg} ${meta.badgeText} ${meta.badgeBorder} ring-2 ring-[#9C5237]/25 shadow-xs`
                    : 'bg-[#FFFDF9] border-[#EAE0D3] text-[#6C5B4C] hover:bg-[#F7F2EA]'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isSelected ? 'bg-current' : 'bg-[#B09F8F]'
                  }`}
                />
                {cat}
              </button>
            );
          })}
        </div>

        {/* Media Type Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 text-xs">
          <button
            type="button"
            onClick={() => setSelectedType('all')}
            className={`px-2.5 py-1 rounded-xl font-medium transition cursor-pointer shrink-0 ${
              selectedType === 'all'
                ? 'bg-[#EAE0D3] text-[#3D2C1E]'
                : 'text-[#8A7764] hover:bg-[#F3ECE0]'
            }`}
          >
            All Types
          </button>

          {ENTRY_TYPES.map(({ type, label, icon: Icon }) => (
            <button
              key={type}
              type="button"
              onClick={() => setSelectedType(selectedType === type ? 'all' : type)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-xl font-medium transition cursor-pointer shrink-0 ${
                selectedType === type
                  ? 'bg-[#EAE0D3] text-[#3D2C1E]'
                  : 'text-[#8A7764] hover:bg-[#F3ECE0]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{label}</span>
            </button>
          ))}
        </div>

        {/* Tags filter if available */}
        {allTags.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 text-xs text-[#8A7764]">
            <span className="font-semibold text-[11px] uppercase tracking-wider text-[#A08E7D] pl-1">
              Tags:
            </span>
            {allTags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                className={`px-2 py-0.5 rounded-lg transition cursor-pointer ${
                  selectedTag === tag
                    ? 'bg-[#9C5237] text-white'
                    : 'bg-[#F4ECE1] text-[#6E5D4E] hover:bg-[#EAE0D3]'
                }`}
              >
                #{tag}
              </button>
            ))}
            {selectedTag && (
              <button
                type="button"
                onClick={() => setSelectedTag(null)}
                className="text-[11px] underline text-[#9C5237] cursor-pointer"
              >
                Clear tag
              </button>
            )}
          </div>
        )}
      </div>

      {/* Entries List */}
      {filteredEntries.length > 0 ? (
        <div className="space-y-4">
          {filteredEntries.map((entry) => (
            <EntryCard
              key={entry.id}
              entry={entry}
              onEdit={onEditEntry}
              onDelete={onDeleteEntry}
              onToggleFavorite={onToggleFavorite}
              onTogglePin={onTogglePin}
              onOpenMediaLightbox={onOpenMediaLightbox}
              showDate={true}
            />
          ))}
        </div>
      ) : (
        <div className="bg-[#FFFDF9] rounded-3xl p-10 border border-[#EFE8DC] text-center space-y-3">
          <Layers className="w-10 h-10 text-[#C7B5A0] mx-auto opacity-70" />
          <h3 className="font-serif text-lg font-medium text-[#3D3328]">
            No matching memories found
          </h3>
          <p className="text-sm text-[#7D6D5E]">
            Try clearing some filters or start a new memory.
          </p>
        </div>
      )}
    </div>
  );
};
