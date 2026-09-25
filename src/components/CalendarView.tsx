import React, { useState, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar as CalendarIcon,
  Sparkles,
  Heart
} from 'lucide-react';
import { MemoryEntry, MediaAttachment } from '../types';
import { EntryCard } from './EntryCard';

interface CalendarViewProps {
  entries: MemoryEntry[];
  selectedDate: string; // YYYY-MM-DD
  onSelectDate: (date: string) => void;
  onOpenCapture: (type?: string) => void;
  onEditEntry: (entry: MemoryEntry) => void;
  onDeleteEntry: (id: string) => void;
  onToggleFavorite: (entry: MemoryEntry) => void;
  onTogglePin: (entry: MemoryEntry) => void;
  onOpenMediaLightbox: (attachment: MediaAttachment) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  entries,
  selectedDate,
  onSelectDate,
  onOpenCapture,
  onEditEntry,
  onDeleteEntry,
  onToggleFavorite,
  onTogglePin,
  onOpenMediaLightbox,
}) => {
  // Calendar month state
  const initialDateObj = useMemo(() => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    return new Date(y, m - 1, d);
  }, [selectedDate]);

  const [currentYear, setCurrentYear] = useState(initialDateObj.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(initialDateObj.getMonth()); // 0-indexed

  const todayStr = new Date().toISOString().split('T')[0];

  // Map of date string -> count of memories
  const dateCounts = useMemo(() => {
    const map = new Map<string, number>();
    entries.forEach((e) => {
      map.set(e.date, (map.get(e.date) || 0) + 1);
    });
    return map;
  }, [entries]);

  // Selected date entries
  const selectedDateEntries = useMemo(() => {
    return entries.filter((e) => e.date === selectedDate);
  }, [entries, selectedDate]);

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay(); // 0 is Sunday

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const goToToday = () => {
    const now = new Date();
    setCurrentYear(now.getFullYear());
    setCurrentMonth(now.getMonth());
    onSelectDate(todayStr);
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  const weekDayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Format selected date nicely
  const formattedSelectedDate = useMemo(() => {
    try {
      const [y, m, d] = selectedDate.split('-').map(Number);
      const dateObj = new Date(y, m - 1, d);
      return dateObj.toLocaleDateString(undefined, {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return selectedDate;
    }
  }, [selectedDate]);

  return (
    <div className="max-w-4xl mx-auto space-y-7 pb-20">
      {/* Calendar Card */}
      <div className="bg-[#FFFDF9] rounded-3xl p-5 sm:p-7 border border-[#EFE8DC] shadow-xs">
        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <h2 className="font-serif text-2xl font-semibold text-[#2D2A26]">
              {monthNames[currentMonth]} {currentYear}
            </h2>
            <button
              type="button"
              onClick={goToToday}
              className="px-2.5 py-1 text-xs font-medium text-[#9C5237] bg-[#F7F1E7] hover:bg-[#EFE7D8] rounded-xl transition cursor-pointer"
            >
              Today
            </button>
          </div>

          <div className="flex items-center gap-1.5 bg-[#F6F0E6] p-1.5 rounded-2xl border border-[#ECE2D2]">
            <button
              type="button"
              onClick={prevMonth}
              className="p-1.5 rounded-xl text-[#6C5B4C] hover:bg-[#EAE0D0] hover:text-[#2D2A26] transition cursor-pointer"
              title="Previous month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={nextMonth}
              className="p-1.5 rounded-xl text-[#6C5B4C] hover:bg-[#EAE0D0] hover:text-[#2D2A26] transition cursor-pointer"
              title="Next month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Days of Week Header */}
        <div className="grid grid-cols-7 gap-1 text-center mb-2">
          {weekDayNames.map((d) => (
            <div key={d} className="text-xs font-semibold uppercase tracking-wider text-[#9C8B7B] py-1">
              {d}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {/* Empty cells for preceding days */}
          {Array.from({ length: firstDayOfWeek }).map((_, i) => (
            <div key={`empty-${i}`} className="aspect-square rounded-2xl opacity-20" />
          ))}

          {/* Days */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const dayNum = i + 1;
            const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(
              dayNum
            ).padStart(2, '0')}`;
            const count = dateCounts.get(dateStr) || 0;
            const isSelected = dateStr === selectedDate;
            const isToday = dateStr === todayStr;

            return (
              <button
                key={dateStr}
                type="button"
                onClick={() => onSelectDate(dateStr)}
                className={`relative aspect-square rounded-2xl flex flex-col items-center justify-center p-1 transition cursor-pointer ${
                  isSelected
                    ? 'bg-[#9C5237] text-white shadow-sm'
                    : isToday
                    ? 'bg-[#F4ECE1] text-[#3D2C1E] border border-[#E3D4C2]'
                    : count > 0
                    ? 'bg-[#F9F5EE] hover:bg-[#F3EDE2] text-[#3D2C1E] border border-[#ECE3D5]'
                    : 'hover:bg-[#F8F4EC] text-[#5C4D3F]'
                }`}
              >
                <span className={`text-sm font-medium ${isSelected ? 'font-semibold' : ''}`}>
                  {dayNum}
                </span>

                {/* Memory dots indicator */}
                {count > 0 && (
                  <div className="flex items-center gap-0.5 mt-0.5">
                    {Array.from({ length: Math.min(count, 3) }).map((_, dotIdx) => (
                      <span
                        key={dotIdx}
                        className={`w-1.5 h-1.5 rounded-full ${
                          isSelected ? 'bg-white' : 'bg-[#9C5237]'
                        }`}
                      />
                    ))}
                    {count > 3 && (
                      <span
                        className={`text-[9px] font-bold leading-none ${
                          isSelected ? 'text-white' : 'text-[#9C5237]'
                        }`}
                      >
                        +
                      </span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Day Memories Header & List */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-[#9C5237]" />
              <span className="text-xs font-semibold uppercase tracking-wider text-[#9C5237]">
                Day Archive
              </span>
            </div>
            <h3 className="font-serif text-2xl font-semibold text-[#2D2A26]">
              {formattedSelectedDate}
            </h3>
          </div>

          <button
            type="button"
            onClick={() => onOpenCapture('text')}
            className="self-start sm:self-auto flex items-center gap-2 px-4 py-2 rounded-2xl bg-[#9C5237] hover:bg-[#85432B] text-white text-xs sm:text-sm font-medium transition cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add to this day</span>
          </button>
        </div>

        {selectedDateEntries.length > 0 ? (
          <div className="space-y-4">
            {selectedDateEntries.map((entry) => (
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
          <div className="bg-[#FFFDF9] rounded-3xl p-8 border border-[#EFE8DC] text-center space-y-3">
            <CalendarIcon className="w-10 h-10 text-[#C7B5A0] mx-auto opacity-70" />
            <h4 className="font-serif text-lg font-medium text-[#3D3328]">
              Nothing saved for {formattedSelectedDate}
            </h4>
            <p className="text-sm text-[#7D6D5E]">
              Add a past memory, future anticipation, or thought for this day.
            </p>
            <button
              type="button"
              onClick={() => onOpenCapture('text')}
              className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-[#EAE0D3] hover:bg-[#DFCFC0] text-[#4D3A29] text-xs font-medium transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-[#9C5237]" />
              <span>Add memory to this date</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
