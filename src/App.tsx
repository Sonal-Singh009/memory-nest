/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ActiveView,
  MemoryEntry,
  AppSettings,
  MediaAttachment,
  Category,
  EntryType
} from './types';
import {
  getAllEntries,
  getSettings,
  saveSettings,
  saveEntry,
  deleteEntry,
  seedSampleMemoriesIfEmpty
} from './utils/db';
import { DesktopSidebar, MobileHeader, MobileBottomNav } from './components/Navigation';
import { TodayView } from './components/TodayView';
import { CalendarView } from './components/CalendarView';
import { MemoriesView } from './components/MemoriesView';
import { IdeasPlansView } from './components/IdeasPlansView';
import { SearchView } from './components/SearchView';
import { SettingsView } from './components/SettingsView';
import { CaptureModal } from './components/CaptureModal';
import { MediaLightbox } from './components/MediaLightbox';
import { PinLockModal } from './components/PinLockModal';
import { OfflineIndicator } from './components/OfflineIndicator';

export default function App() {
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  const [settings, setSettings] = useState<AppSettings>({
    appName: 'Memory Nest',
    theme: 'cream',
    fontFamily: 'serif',
    fontSize: 'normal',
    defaultCategory: 'Thought',
    hasPinLock: false,
    pinCode: '',
  });

  const [entries, setEntries] = useState<MemoryEntry[]>([]);
  const [currentDate, setCurrentDate] = useState<string>(todayStr);
  const [activeView, setActiveView] = useState<ActiveView>('today');
  const [isLocked, setIsLocked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Capture Modal State
  const [showCaptureModal, setShowCaptureModal] = useState(false);
  const [captureModalDate, setCaptureModalDate] = useState<string>(todayStr);
  const [captureModalEntry, setCaptureModalEntry] = useState<MemoryEntry | null>(null);

  // Lightbox State
  const [activeLightboxAttachment, setActiveLightboxAttachment] =
    useState<MediaAttachment | null>(null);

  // Load initial data
  const refreshData = useCallback(async () => {
    try {
      await seedSampleMemoriesIfEmpty();
      const [savedSettings, loadedEntries] = await Promise.all([
        getSettings(),
        getAllEntries(),
      ]);
      setSettings(savedSettings);
      setEntries(loadedEntries);

      if (savedSettings.hasPinLock && savedSettings.pinCode) {
        setIsLocked(true);
      }
    } catch (err) {
      console.error('Failed to load initial data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Update settings handler
  const handleUpdateSettings = async (newSettings: AppSettings) => {
    setSettings(newSettings);
    await saveSettings(newSettings);
  };

  // Entry CRUD handlers
  const handleSaveEntry = async (entry: MemoryEntry) => {
    await saveEntry(entry);
    setEntries((prev) => {
      const idx = prev.findIndex((e) => e.id === entry.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = entry;
        return copy.sort((a, b) => b.createdAt - a.createdAt);
      } else {
        return [entry, ...prev].sort((a, b) => b.createdAt - a.createdAt);
      }
    });
  };

  const handleDeleteEntry = async (id: string) => {
    await deleteEntry(id);
    setEntries((prev) => prev.filter((e) => e.id !== id));
  };

  const handleToggleFavorite = async (entry: MemoryEntry) => {
    const updated: MemoryEntry = { ...entry, isFavorite: !entry.isFavorite };
    await handleSaveEntry(updated);
  };

  const handleTogglePin = async (entry: MemoryEntry) => {
    const updated: MemoryEntry = { ...entry, isPinned: !entry.isPinned };
    await handleSaveEntry(updated);
  };

  // Quick Save from Today inline composer
  const handleQuickSave = async (text: string) => {
    const now = Date.now();
    const timeFormatted = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });

    const newEntry: MemoryEntry = {
      id: `mem-${now}-${Math.random().toString(36).substr(2, 5)}`,
      date: currentDate,
      timeString: timeFormatted,
      createdAt: now,
      updatedAt: now,
      type: 'text',
      content: text,
      category: settings.defaultCategory !== 'None' ? settings.defaultCategory : undefined,
      tags: [],
      attachments: [],
    };

    await handleSaveEntry(newEntry);
  };

  // Modal Open Triggers
  const handleOpenCapture = (type?: string, promptText?: string) => {
    setCaptureModalDate(currentDate);
    setCaptureModalEntry(
      promptText
        ? {
            id: '',
            date: currentDate,
            timeString: '',
            createdAt: Date.now(),
            updatedAt: Date.now(),
            type: (type as EntryType) || 'text',
            title: '',
            content: `Prompt: ${promptText}\n\n`,
            tags: [],
            attachments: [],
          }
        : null
    );
    setShowCaptureModal(true);
  };

  const handleEditEntry = (entry: MemoryEntry) => {
    setCaptureModalDate(entry.date);
    setCaptureModalEntry(entry);
    setShowCaptureModal(true);
  };

  // Entries filtered for the currently selected date (for Today View)
  const todayEntries = useMemo(() => {
    return entries.filter((e) => e.date === currentDate);
  }, [entries, currentDate]);

  // Determine theme CSS variables and styling classes
  const themeStyles = useMemo(() => {
    switch (settings.theme) {
      case 'lavender':
        return {
          bg: 'bg-[#F7F4FA]',
          text: 'text-[#2E2835]',
          accent: '#786196',
        };
      case 'sage':
        return {
          bg: 'bg-[#F4F7F4]',
          text: 'text-[#263127]',
          accent: '#4D744E',
        };
      case 'peach':
        return {
          bg: 'bg-[#FAF5F2]',
          text: 'text-[#362A24]',
          accent: '#C8684C',
        };
      case 'dark':
        return {
          bg: 'bg-[#1E1B18]',
          text: 'text-[#F5EFEA]',
          accent: '#E29A78',
        };
      case 'cream':
      default:
        return {
          bg: 'bg-[#FBF8F3]',
          text: 'text-[#2D2A26]',
          accent: '#9C5237',
        };
    }
  }, [settings.theme]);

  const fontSizeClass = useMemo(() => {
    switch (settings.fontSize) {
      case 'large':
        return 'text-[16px]';
      case 'generous':
        return 'text-[17.5px]';
      case 'normal':
      default:
        return 'text-[15px]';
    }
  }, [settings.fontSize]);

  const fontFamilyClass = settings.fontFamily === 'serif' ? 'font-serif' : 'font-sans';

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FBF8F3] text-[#7D6B5A]">
        <div className="flex flex-col items-center gap-3 animate-pulse">
          <div className="w-12 h-12 rounded-full bg-[#EAE0D3] border border-[#DFCFC0]" />
          <p className="font-serif text-sm">Opening your Memory Nest...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen ${themeStyles.bg} ${themeStyles.text} ${fontSizeClass} flex flex-col md:flex-row transition-colors duration-200`}
    >
      {/* PIN Lock Screen Overlay if Active */}
      {isLocked && settings.pinCode && (
        <PinLockModal
          correctPin={settings.pinCode}
          appName={settings.appName || 'Memory Nest'}
          onUnlock={() => setIsLocked(false)}
        />
      )}

      {/* Desktop Sidebar Navigation */}
      <DesktopSidebar
        activeView={activeView}
        onSelectView={setActiveView}
        onOpenQuickAdd={() => handleOpenCapture('text')}
        appName={settings.appName || 'Memory Nest'}
        isPinLocked={settings.hasPinLock}
        onLockNow={() => setIsLocked(true)}
        memoryCount={entries.length}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <MobileHeader
          appName={settings.appName || 'Memory Nest'}
          onOpenQuickAdd={() => handleOpenCapture('text')}
          onSelectView={setActiveView}
        />

        {/* View Router */}
        <main className="flex-1 p-4 sm:p-7 md:p-8 max-w-5xl mx-auto w-full">
          {activeView === 'today' && (
            <TodayView
              currentDate={currentDate}
              onDateChange={setCurrentDate}
              entries={todayEntries}
              onOpenCapture={handleOpenCapture}
              onEditEntry={handleEditEntry}
              onDeleteEntry={handleDeleteEntry}
              onToggleFavorite={handleToggleFavorite}
              onTogglePin={handleTogglePin}
              onOpenMediaLightbox={setActiveLightboxAttachment}
              onQuickSave={handleQuickSave}
            />
          )}

          {activeView === 'calendar' && (
            <CalendarView
              entries={entries}
              selectedDate={currentDate}
              onSelectDate={setCurrentDate}
              onOpenCapture={handleOpenCapture}
              onEditEntry={handleEditEntry}
              onDeleteEntry={handleDeleteEntry}
              onToggleFavorite={handleToggleFavorite}
              onTogglePin={handleTogglePin}
              onOpenMediaLightbox={setActiveLightboxAttachment}
            />
          )}

          {activeView === 'memories' && (
            <MemoriesView
              entries={entries}
              onEditEntry={handleEditEntry}
              onDeleteEntry={handleDeleteEntry}
              onToggleFavorite={handleToggleFavorite}
              onTogglePin={handleTogglePin}
              onOpenMediaLightbox={setActiveLightboxAttachment}
              onOpenCapture={() => handleOpenCapture('text')}
            />
          )}

          {activeView === 'ideas' && (
            <IdeasPlansView
              entries={entries}
              onOpenCapture={(cat) => handleOpenCapture('text')}
              onEditEntry={handleEditEntry}
              onDeleteEntry={handleDeleteEntry}
              onToggleFavorite={handleToggleFavorite}
              onTogglePin={handleTogglePin}
              onOpenMediaLightbox={setActiveLightboxAttachment}
            />
          )}

          {activeView === 'search' && (
            <SearchView
              entries={entries}
              onSelectEntry={(entry) => {
                setCurrentDate(entry.date);
                setActiveView('today');
              }}
              onOpenMediaLightbox={setActiveLightboxAttachment}
            />
          )}

          {activeView === 'settings' && (
            <SettingsView
              settings={settings}
              onUpdateSettings={handleUpdateSettings}
              onLockNow={() => setIsLocked(true)}
              onRefreshData={refreshData}
            />
          )}
        </main>

        {/* Mobile Bottom Navigation */}
        <MobileBottomNav
          activeView={activeView}
          onSelectView={setActiveView}
          onOpenQuickAdd={() => handleOpenCapture('text')}
        />
      </div>

      {/* Floating Offline Status Toast */}
      <OfflineIndicator />

      {/* Quick & Full Capture Composer Modal */}
      {showCaptureModal && (
        <CaptureModal
          initialDate={captureModalDate}
          existingEntry={captureModalEntry}
          onSave={handleSaveEntry}
          onClose={() => {
            setShowCaptureModal(false);
            setCaptureModalEntry(null);
          }}
          defaultCategory={settings.defaultCategory}
        />
      )}

      {/* Fullscreen Photo & Video Lightbox */}
      <MediaLightbox
        attachment={activeLightboxAttachment}
        onClose={() => setActiveLightboxAttachment(null)}
      />
    </div>
  );
}
