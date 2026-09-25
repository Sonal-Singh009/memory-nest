import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Sparkles,
  Calendar,
  Mic,
  PenTool,
  Image as ImageIcon,
  Send,
  RotateCcw,
  Compass,
  Bookmark
} from 'lucide-react';
import { MemoryEntry, MediaAttachment } from '../types';
import { EntryCard } from './EntryCard';

interface TodayViewProps {
  currentDate: string; // YYYY-MM-DD
  onDateChange: (newDate: string) => void;
  entries: MemoryEntry[];
  onOpenCapture: (type?: string, promptText?: string) => void;
  onEditEntry: (entry: MemoryEntry) => void;
  onDeleteEntry: (id: string) => void;
  onToggleFavorite: (entry: MemoryEntry) => void;
  onTogglePin: (entry: MemoryEntry) => void;
  onOpenMediaLightbox: (attachment: MediaAttachment) => void;
  onQuickSave: (text: string) => Promise<void>;
}

const REFLECTION_PROMPTS = [
  'What made you smile or pause with gratitude today?',
  'What is one quiet idea you want to remember six months from now?',
  'What was the most peaceful moment of your day so far?',
  'What is something you learned or noticed differently today?',
  'If tomorrow could be gentle and fulfilling, what would it look like?',
  'What is a conversation or phrase that stayed in your mind recently?',
  'What is a future project or trip you dream of beginning?',
];

export const TodayView: React.FC<TodayViewProps> = ({
  currentDate,
  onDateChange,
  entries,
  onOpenCapture,
  onEditEntry,
  onDeleteEntry,
  onToggleFavorite,
  onTogglePin,
  onOpenMediaLightbox,
  onQuickSave,
}) => {
  const [quickText, setQuickText] = useState('');
  const [isQuickSaving, setIsQuickSaving] = useState(false);
  const [promptIndex, setPromptIndex] = useState(0);

  const todayStr = new Date().toISOString().split('T')[0];
  const isToday = currentDate === todayStr;

  // Format date nicely
  const parseDatePretty = (dStr: string) => {
    try {
      const [y, m, d] = dStr.split('-').map(Number);
      const dateObj = new Date(y, m - 1, d);
      return dateObj.toLocaleDateString(undefined, {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dStr;
    }
  };

  const handlePrevDay = () => {
    const [y, m, d] = currentDate.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d - 1);
    onDateChange(dateObj.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    const [y, m, d] = currentDate.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d + 1);
    onDateChange(dateObj.toISOString().split('T')[0]);
  };

  const handleGoToToday = () => {
    onDateChange(todayStr);
  };

  const handleQuickSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickText.trim() || isQuickSaving) return;

    setIsQuickSaving(true);
    try {
      await onQuickSave(quickText.trim());
      setQuickText('');
    } catch (err) {
      console.error('Quick save error:', err);
    } finally {
      setIsQuickSaving(false);
    }
  };

  const cyclePrompt = () => {
    setPromptIndex((prev) => (prev + 1) % REFLECTION_PROMPTS.length);
  };

  const currentPrompt = REFLECTION_PROMPTS[promptIndex];

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20">
      {/* Warm Greeting & Date Header */}
      <section className="bg-[#FFFDF9] rounded-3xl p-6 sm:p-7 border border-[#EFE8DC] shadow-xs relative overflow-hidden">
        {/* Decorative soft pastel warmth circles */}
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-44 h-44 rounded-full bg-[#FCEAD2]/35 blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-10 w-40 h-40 rounded-full bg-[#EAE5F5]/35 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-block w-2 h-2 rounded-full bg-[#9C5237]" />
              <p className="text-xs font-semibold uppercase tracking-wider text-[#9C5237]">
                A little space for your thoughts
              </p>
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-[#2D2A26] tracking-tight">
              {parseDatePretty(currentDate)}
            </h1>
          </div>

          {/* Date Controls */}
          <div className="flex items-center gap-1.5 self-start sm:self-auto bg-[#F6F0E6] p-1.5 rounded-2xl border border-[#ECE2D2]">
            <button
              type="button"
              onClick={handlePrevDay}
              className="p-1.5 rounded-xl text-[#6C5B4C] hover:bg-[#EAE0D0] hover:text-[#2D2A26] transition cursor-pointer"
              title="Previous day"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {!isToday && (
              <button
                type="button"
                onClick={handleGoToToday}
                className="px-2.5 py-1 text-xs font-medium text-[#9C5237] hover:bg-[#EAE0D0] rounded-xl transition cursor-pointer"
              >
                Go to today
              </button>
            )}

            {isToday && (
              <span className="px-2 py-0.5 text-xs font-medium text-[#6C5B4C] bg-white rounded-lg shadow-2xs">
                Today
              </span>
            )}

            <button
              type="button"
              onClick={handleNextDay}
              className="p-1.5 rounded-xl text-[#6C5B4C] hover:bg-[#EAE0D0] hover:text-[#2D2A26] transition cursor-pointer"
              title="Next day"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Reflection Prompt Box */}
        <div className="mt-5 p-4 rounded-2xl bg-[#F7F2EA] border border-[#E9DFC8] relative">
          <div className="flex items-center justify-between gap-2 mb-1.5 text-xs font-medium text-[#7D6B5A]">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#C8684C]" />
              Gentle Daily Prompt
            </span>
            <button
              type="button"
              onClick={cyclePrompt}
              className="flex items-center gap-1 text-[11px] text-[#8C7A6B] hover:text-[#3D2C1E] transition cursor-pointer"
              title="Cycle prompt"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Next</span>
            </button>
          </div>
          <p className="font-serif text-[#3D3328] text-base leading-relaxed italic">
            "{currentPrompt}"
          </p>
          <div className="mt-2.5 flex items-center justify-end">
            <button
              type="button"
              onClick={() => onOpenCapture('text', currentPrompt)}
              className="text-xs font-medium text-[#9C5237] hover:text-[#85432B] transition cursor-pointer hover:underline"
            >
              Reflect on this prompt &rarr;
            </button>
          </div>
        </div>

        {/* Quick Capture Bar: Save thought in under 10 seconds */}
        <form onSubmit={handleQuickSubmit} className="mt-5">
          <div className="flex items-center gap-2 p-1.5 bg-[#FAF6F0] rounded-2xl border border-[#EAE0D3] focus-within:border-[#9C5237]/50 focus-within:ring-2 focus-within:ring-[#9C5237]/15 transition">
            <input
              type="text"
              value={quickText}
              onChange={(e) => setQuickText(e.target.value)}
              placeholder="Quick thought? Save in seconds..."
              className="flex-1 bg-transparent px-3 py-1.5 text-sm text-[#3D2C1E] placeholder-[#A49483] focus:outline-none"
            />

            <div className="flex items-center gap-1 pr-1 text-[#7D6B5A]">
              <button
                type="button"
                onClick={() => onOpenCapture('voice_to_text')}
                className="p-1.5 rounded-xl hover:bg-[#EAE0D0] transition cursor-pointer"
                title="Speak a memory"
              >
                <Mic className="w-4 h-4 text-[#628564]" />
              </button>
              <button
                type="button"
                onClick={() => onOpenCapture('sketch')}
                className="p-1.5 rounded-xl hover:bg-[#EAE0D0] transition cursor-pointer"
                title="Quick sketch"
              >
                <PenTool className="w-4 h-4 text-[#C8684C]" />
              </button>
              <button
                type="button"
                onClick={() => onOpenCapture('image')}
                className="p-1.5 rounded-xl hover:bg-[#EAE0D0] transition cursor-pointer"
                title="Attach photo"
              >
                <ImageIcon className="w-4 h-4 text-[#4D6F8A]" />
              </button>

              <button
                type="submit"
                disabled={!quickText.trim() || isQuickSaving}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#9C5237] hover:bg-[#85432B] disabled:opacity-40 text-white text-xs font-medium transition cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Save</span>
              </button>
            </div>
          </div>
        </form>
      </section>

      {/* Prominent "+ Add to today" Banner Button */}
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-serif text-xl font-semibold text-[#3D3328]">
          Saved Memories ({entries.length})
        </h2>

        <button
          type="button"
          onClick={() => onOpenCapture('text')}
          className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#9C5237] hover:bg-[#85432B] text-white shadow-xs hover:shadow-sm font-medium text-xs sm:text-sm transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>+ Add to {isToday ? 'today' : 'this date'}</span>
        </button>
      </div>

      {/* Entries List or Empty State */}
      {entries.length > 0 ? (
        <div className="space-y-4">
          {entries.map((entry) => (
            <EntryCard
              key={entry.id}
              entry={entry}
              onEdit={onEditEntry}
              onDelete={onDeleteEntry}
              onToggleFavorite={onToggleFavorite}
              onTogglePin={onTogglePin}
              onOpenMediaLightbox={onOpenMediaLightbox}
            />
          ))}
        </div>
      ) : (
        <div className="bg-[#FFFDF9] rounded-3xl p-10 border border-[#EFE8DC] text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-[#F6EFE6] border border-[#EAE0D3] flex items-center justify-center mx-auto text-[#9C5237]">
            <Sparkles className="w-8 h-8 opacity-80" />
          </div>
          <div className="max-w-md mx-auto space-y-1.5">
            <h3 className="font-serif text-xl font-medium text-[#3D3328]">
              Nothing saved for this day yet
            </h3>
            <p className="text-sm text-[#7D6D5E] leading-relaxed">
              A peaceful, quiet page waiting for your thoughts, photos, sketches, or voice recordings.
            </p>
          </div>
          <div>
            <button
              type="button"
              onClick={() => onOpenCapture('text')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#EAE0D3] hover:bg-[#DFCFC0] text-[#4D3A29] font-medium text-xs transition cursor-pointer shadow-2xs"
            >
              <Plus className="w-4 h-4 text-[#9C5237]" />
              <span>Record a memory now</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
