import React, { useState, useMemo } from 'react';
import {
  Lightbulb,
  Compass,
  Target,
  BookOpen,
  Plus,
  Sparkles,
  CheckCircle2,
  Calendar,
  Tag
} from 'lucide-react';
import { MemoryEntry, Category, MediaAttachment, CATEGORIES_META } from '../types';
import { EntryCard } from './EntryCard';

interface IdeasPlansViewProps {
  entries: MemoryEntry[];
  onOpenCapture: (category?: Category) => void;
  onEditEntry: (entry: MemoryEntry) => void;
  onDeleteEntry: (id: string) => void;
  onToggleFavorite: (entry: MemoryEntry) => void;
  onTogglePin: (entry: MemoryEntry) => void;
  onOpenMediaLightbox: (attachment: MediaAttachment) => void;
}

type IdeaFilter = 'all' | 'Idea' | 'Future plan' | 'Goal' | 'Learning';

export const IdeasPlansView: React.FC<IdeasPlansViewProps> = ({
  entries,
  onOpenCapture,
  onEditEntry,
  onDeleteEntry,
  onToggleFavorite,
  onTogglePin,
  onOpenMediaLightbox,
}) => {
  const [filter, setFilter] = useState<IdeaFilter>('all');

  // Filter only idea/plan/goal/learning entries or entries tagged #idea / #plan
  const relevantEntries = useMemo(() => {
    return entries.filter((e) => {
      const isTargetCategory =
        e.category === 'Idea' ||
        e.category === 'Future plan' ||
        e.category === 'Goal' ||
        e.category === 'Learning';

      const hasTargetTag =
        e.tags &&
        e.tags.some((t) =>
          ['idea', 'plan', 'future', 'goal', 'project', 'dreams', 'travel', 'study'].includes(
            t.toLowerCase()
          )
        );

      return isTargetCategory || hasTargetTag;
    });
  }, [entries]);

  const filteredEntries = useMemo(() => {
    if (filter === 'all') return relevantEntries;
    return relevantEntries.filter((e) => e.category === filter);
  }, [relevantEntries, filter]);

  const ideaCount = entries.filter((e) => e.category === 'Idea').length;
  const planCount = entries.filter((e) => e.category === 'Future plan').length;
  const goalCount = entries.filter((e) => e.category === 'Goal').length;
  const learningCount = entries.filter((e) => e.category === 'Learning').length;

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20">
      {/* Header Banner */}
      <div className="bg-[#FFFDF9] rounded-3xl p-6 border border-[#EFE8DC] shadow-xs relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 rounded-full bg-[#FEF5D9]/50 blur-2xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-[#C9933B]" />
              <span className="text-xs font-semibold uppercase tracking-wider text-[#A0701C]">
                Inspiration Hub
              </span>
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-[#2D2A26]">
              Ideas & Future Plans
            </h1>
            <p className="mt-1 text-sm text-[#7D6D5E]">
              Plant seeds for upcoming journeys, creative projects, dreams, and personal milestones.
            </p>
          </div>

          <button
            type="button"
            onClick={() => onOpenCapture('Idea')}
            className="self-start sm:self-auto flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#9C5237] hover:bg-[#85432B] text-white text-xs sm:text-sm font-medium transition cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>+ Capture an Idea</span>
          </button>
        </div>

        {/* Quick Summary Pill Counters */}
        <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-2 pt-4 border-t border-[#F0E8DC]">
          <div className="bg-[#FEF5D9]/70 rounded-2xl p-2.5 border border-[#EEDAA4]/60 text-center">
            <span className="block text-xs font-medium text-[#8A6A14]">Ideas</span>
            <span className="font-serif text-lg font-semibold text-[#5A450C]">{ideaCount}</span>
          </div>
          <div className="bg-[#EBF3ED]/70 rounded-2xl p-2.5 border border-[#CCE0D1]/60 text-center">
            <span className="block text-xs font-medium text-[#3E6C4E]">Future Plans</span>
            <span className="font-serif text-lg font-semibold text-[#294B34]">{planCount}</span>
          </div>
          <div className="bg-[#EAEFF8]/70 rounded-2xl p-2.5 border border-[#CAD8EE]/60 text-center">
            <span className="block text-xs font-medium text-[#33568A]">Goals</span>
            <span className="font-serif text-lg font-semibold text-[#223E66]">{goalCount}</span>
          </div>
          <div className="bg-[#EFEBF6]/70 rounded-2xl p-2.5 border border-[#D9CFE8]/60 text-center">
            <span className="block text-xs font-medium text-[#5C4582]">Learnings</span>
            <span className="font-serif text-lg font-semibold text-[#402F5C]">{learningCount}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
        <button
          type="button"
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition cursor-pointer shrink-0 ${
            filter === 'all'
              ? 'bg-[#9C5237] text-white border-[#9C5237]'
              : 'bg-[#FFFDF9] border-[#EAE0D3] text-[#6C5B4C] hover:bg-[#F7F2EA]'
          }`}
        >
          All Inspirations ({relevantEntries.length})
        </button>

        <button
          type="button"
          onClick={() => setFilter('Idea')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition cursor-pointer shrink-0 ${
            filter === 'Idea'
              ? 'bg-[#FEF5D9] text-[#8A6A14] border-[#EEDAA4] ring-2 ring-[#C9933B]/25'
              : 'bg-[#FFFDF9] border-[#EAE0D3] text-[#6C5B4C] hover:bg-[#F7F2EA]'
          }`}
        >
          <Lightbulb className="w-3.5 h-3.5 text-[#C9933B]" />
          <span>Ideas ({ideaCount})</span>
        </button>

        <button
          type="button"
          onClick={() => setFilter('Future plan')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition cursor-pointer shrink-0 ${
            filter === 'Future plan'
              ? 'bg-[#EBF3ED] text-[#3E6C4E] border-[#CCE0D1] ring-2 ring-[#628564]/25'
              : 'bg-[#FFFDF9] border-[#EAE0D3] text-[#6C5B4C] hover:bg-[#F7F2EA]'
          }`}
        >
          <Compass className="w-3.5 h-3.5 text-[#3E6C4E]" />
          <span>Future Plans ({planCount})</span>
        </button>

        <button
          type="button"
          onClick={() => setFilter('Goal')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition cursor-pointer shrink-0 ${
            filter === 'Goal'
              ? 'bg-[#EAEFF8] text-[#33568A] border-[#CAD8EE] ring-2 ring-[#4D6F8A]/25'
              : 'bg-[#FFFDF9] border-[#EAE0D3] text-[#6C5B4C] hover:bg-[#F7F2EA]'
          }`}
        >
          <Target className="w-3.5 h-3.5 text-[#33568A]" />
          <span>Goals ({goalCount})</span>
        </button>

        <button
          type="button"
          onClick={() => setFilter('Learning')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition cursor-pointer shrink-0 ${
            filter === 'Learning'
              ? 'bg-[#EFEBF6] text-[#5C4582] border-[#D9CFE8] ring-2 ring-[#7E6B97]/25'
              : 'bg-[#FFFDF9] border-[#EAE0D3] text-[#6C5B4C] hover:bg-[#F7F2EA]'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5 text-[#5C4582]" />
          <span>Learnings ({learningCount})</span>
        </button>
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
          <Lightbulb className="w-10 h-10 text-[#D8C7A0] mx-auto opacity-70" />
          <h3 className="font-serif text-lg font-medium text-[#3D3328]">
            No {filter === 'all' ? 'ideas or plans' : filter.toLowerCase() + 's'} recorded yet
          </h3>
          <p className="text-sm text-[#7D6D5E]">
            A blank page ready for whatever dream or blueprint comes to mind.
          </p>
          <button
            type="button"
            onClick={() => onOpenCapture(filter === 'all' ? 'Idea' : (filter as Category))}
            className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-[#EAE0D3] hover:bg-[#DFCFC0] text-[#4D3A29] text-xs font-medium transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-[#9C5237]" />
            <span>Add an idea now</span>
          </button>
        </div>
      )}
    </div>
  );
};
