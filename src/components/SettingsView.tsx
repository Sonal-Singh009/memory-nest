import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  Palette,
  Type,
  Shield,
  Download,
  Upload,
  HardDrive,
  Info,
  Smartphone,
  Laptop,
  Check,
  Lock,
  Unlock,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { AppSettings, ThemeType, FontFamilyType, FontSizeType, Category } from '../types';
import {
  exportAllData,
  importData,
  getStorageStats,
  seedSampleMemoriesIfEmpty
} from '../utils/db';

interface SettingsViewProps {
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
  onLockNow: () => void;
  onRefreshData: () => void;
}

const THEMES: { id: ThemeType; name: string; bg: string; border: string; accent: string }[] = [
  { id: 'cream', name: 'Warm Cozy Cream', bg: '#FBF8F3', border: '#EFE8DC', accent: '#9C5237' },
  { id: 'lavender', name: 'Soft Lavender', bg: '#F7F4FA', border: '#ECE5F2', accent: '#786196' },
  { id: 'sage', name: 'Sage Garden', bg: '#F4F7F4', border: '#E2EBE2', accent: '#4D744E' },
  { id: 'peach', name: 'Muted Peach', bg: '#FAF5F2', border: '#F3E6E0', accent: '#C8684C' },
  { id: 'dark', name: 'Dark Night Nest', bg: '#1E1B18', border: '#3D352F', accent: '#E29A78' },
];

const CATEGORIES: Category[] = [
  'Thought',
  'Memory',
  'Idea',
  'Future plan',
  'Goal',
  'Learning',
  'Important',
  'Random',
];

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onUpdateSettings,
  onLockNow,
  onRefreshData,
}) => {
  const [appName, setAppName] = useState(settings.appName || 'Memory Nest');
  const [pinInput, setPinInput] = useState('');
  const [showPinSetup, setShowPinSetup] = useState(false);
  const [pinError, setPinError] = useState('');
  const [storageStats, setStorageStats] = useState<{
    entryCount: number;
    mediaCount: number;
    estimatedSizeKb: number;
  }>({ entryCount: 0, mediaCount: 0, estimatedSizeKb: 0 });

  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [exportStatus, setExportStatus] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'preferences' | 'privacy' | 'storage' | 'platforms'>('preferences');

  useEffect(() => {
    getStorageStats().then(setStorageStats);
  }, []);

  const handleSaveAppName = (e: React.FormEvent) => {
    e.preventDefault();
    if (!appName.trim()) return;
    onUpdateSettings({ ...settings, appName: appName.trim() });
  };

  const handleSelectTheme = (theme: ThemeType) => {
    onUpdateSettings({ ...settings, theme });
  };

  const handleSelectFontFamily = (fontFamily: FontFamilyType) => {
    onUpdateSettings({ ...settings, fontFamily });
  };

  const handleSelectFontSize = (fontSize: FontSizeType) => {
    onUpdateSettings({ ...settings, fontSize });
  };

  const handleSelectDefaultCategory = (defaultCategory: Category | 'None') => {
    onUpdateSettings({ ...settings, defaultCategory });
  };

  // PIN Lock Handlers
  const handleSetPin = () => {
    if (pinInput.length !== 4 || !/^\d{4}$/.test(pinInput)) {
      setPinError('Please enter exactly 4 digits');
      return;
    }

    onUpdateSettings({
      ...settings,
      hasPinLock: true,
      pinCode: pinInput,
    });
    setPinInput('');
    setShowPinSetup(false);
    setPinError('');
  };

  const handleDisablePin = () => {
    onUpdateSettings({
      ...settings,
      hasPinLock: false,
      pinCode: '',
    });
  };

  // Export Data JSON
  const handleExportJSON = async () => {
    try {
      setExportStatus('Exporting...');
      const jsonStr = await exportAllData();
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `memory-nest-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setExportStatus('Backup downloaded successfully!');
      setTimeout(() => setExportStatus(null), 3500);
    } catch (err: any) {
      setExportStatus(`Export failed: ${err.message}`);
    }
  };

  // Import Data JSON
  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        setImportStatus('Restoring backup...');
        const res = await importData(text, 'merge');
        setImportStatus(`Successfully restored ${res.importedCount} memories!`);
        getStorageStats().then(setStorageStats);
        onRefreshData();
        setTimeout(() => setImportStatus(null), 3500);
      } catch (err: any) {
        setImportStatus(`Import error: ${err.message}`);
      }
    };
    reader.readAsText(file);
    if (e.target) e.target.value = '';
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full bg-[#9C5237]" />
          <span className="text-xs font-semibold uppercase tracking-wider text-[#9C5237]">
            Configuration & Care
          </span>
        </div>
        <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-[#2D2A26]">
          Notebook Settings
        </h1>
        <p className="mt-1 text-sm text-[#7D6D5E]">
          Personalize colors, typography, lock your vault, export backups, and explore install instructions.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-[#F4EDE2] rounded-2xl border border-[#E7DDD0] overflow-x-auto no-scrollbar">
        <button
          type="button"
          onClick={() => setActiveTab('preferences')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer shrink-0 ${
            activeTab === 'preferences'
              ? 'bg-white text-[#3D2C1E] shadow-xs'
              : 'text-[#6C5B4C] hover:text-[#3D2C1E]'
          }`}
        >
          <Palette className="w-3.5 h-3.5" />
          <span>Appearance</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('privacy')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer shrink-0 ${
            activeTab === 'privacy'
              ? 'bg-white text-[#3D2C1E] shadow-xs'
              : 'text-[#6C5B4C] hover:text-[#3D2C1E]'
          }`}
        >
          <Shield className="w-3.5 h-3.5" />
          <span>Privacy & Lock</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('storage')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer shrink-0 ${
            activeTab === 'storage'
              ? 'bg-white text-[#3D2C1E] shadow-xs'
              : 'text-[#6C5B4C] hover:text-[#3D2C1E]'
          }`}
        >
          <HardDrive className="w-3.5 h-3.5" />
          <span>Storage & Backup</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('platforms')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer shrink-0 ${
            activeTab === 'platforms'
              ? 'bg-white text-[#3D2C1E] shadow-xs'
              : 'text-[#6C5B4C] hover:text-[#3D2C1E]'
          }`}
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>Windows & Android</span>
        </button>
      </div>

      {/* Preferences Tab */}
      {activeTab === 'preferences' && (
        <div className="space-y-6">
          {/* App Name Customizer */}
          <div className="bg-[#FFFDF9] rounded-3xl p-6 border border-[#EFE8DC] shadow-xs space-y-3">
            <h3 className="font-serif text-lg font-semibold text-[#2D2A26]">App Title</h3>
            <p className="text-xs text-[#7D6D5E]">
              Give your personal memory vault any name you like.
            </p>
            <form onSubmit={handleSaveAppName} className="flex items-center gap-2 max-w-md">
              <input
                type="text"
                value={appName}
                onChange={(e) => setAppName(e.target.value)}
                placeholder="Memory Nest"
                className="flex-1 bg-[#F9F5EE] border border-[#E7DDD0] rounded-xl px-3 py-2 text-sm text-[#2D2A26] focus:outline-none focus:border-[#9C5237]"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-[#9C5237] hover:bg-[#85432B] text-white text-xs font-medium transition cursor-pointer"
              >
                Save
              </button>
            </form>
          </div>

          {/* Theme Color Palettes */}
          <div className="bg-[#FFFDF9] rounded-3xl p-6 border border-[#EFE8DC] shadow-xs space-y-4">
            <div>
              <h3 className="font-serif text-lg font-semibold text-[#2D2A26]">Pastel Theme Palette</h3>
              <p className="text-xs text-[#7D6D5E]">
                Select the soft, cozy mood for your pages and cards.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {THEMES.map((t) => {
                const isSelected = settings.theme === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => handleSelectTheme(t.id)}
                    className={`flex items-center gap-3 p-3.5 rounded-2xl border transition text-left cursor-pointer ${
                      isSelected
                        ? 'border-[#9C5237] ring-2 ring-[#9C5237]/20 shadow-xs'
                        : 'border-[#ECE2D4] hover:bg-[#FAF6F0]'
                    }`}
                    style={{ backgroundColor: t.bg }}
                  >
                    <span
                      className="w-7 h-7 rounded-full border border-black/10 shrink-0 flex items-center justify-center"
                      style={{ backgroundColor: t.accent }}
                    >
                      {isSelected && <Check className="w-4 h-4 text-white" />}
                    </span>
                    <div>
                      <span className="block text-sm font-medium text-[#2D2A26]">{t.name}</span>
                      <span className="text-[11px] text-[#7D6D5E]">
                        {t.id === 'cream' ? 'Default' : t.id === 'dark' ? 'Night mode' : 'Pastel tone'}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Typography Settings */}
          <div className="bg-[#FFFDF9] rounded-3xl p-6 border border-[#EFE8DC] shadow-xs space-y-4">
            <div>
              <h3 className="font-serif text-lg font-semibold text-[#2D2A26]">Typography Style</h3>
              <p className="text-xs text-[#7D6D5E]">
                Choose between warm literary serif or clean modern sans-serif.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 max-w-md">
              <button
                type="button"
                onClick={() => handleSelectFontFamily('serif')}
                className={`p-3.5 rounded-2xl border text-center transition cursor-pointer ${
                  settings.fontFamily === 'serif'
                    ? 'border-[#9C5237] bg-[#F9F4EB] text-[#2D2A26] ring-2 ring-[#9C5237]/20'
                    : 'border-[#ECE2D4] bg-[#FFFDF9] text-[#6C5B4C] hover:bg-[#FAF6F0]'
                }`}
              >
                <span className="font-serif text-xl block mb-1">Ag</span>
                <span className="text-xs font-medium">Editorial Serif</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectFontFamily('sans')}
                className={`p-3.5 rounded-2xl border text-center transition cursor-pointer ${
                  settings.fontFamily === 'sans'
                    ? 'border-[#9C5237] bg-[#F9F4EB] text-[#2D2A26] ring-2 ring-[#9C5237]/20'
                    : 'border-[#ECE2D4] bg-[#FFFDF9] text-[#6C5B4C] hover:bg-[#FAF6F0]'
                }`}
              >
                <span className="font-sans text-xl block mb-1 font-semibold">Ag</span>
                <span className="text-xs font-medium">Modern Sans</span>
              </button>
            </div>

            {/* Font Size */}
            <div className="pt-3 border-t border-[#F0E8DC]">
              <label className="block text-xs font-medium text-[#7D6D5E] mb-2">Reading Size</label>
              <div className="flex items-center gap-2">
                {(['normal', 'large', 'generous'] as const).map((sz) => (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => handleSelectFontSize(sz)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium capitalize transition cursor-pointer ${
                      settings.fontSize === sz
                        ? 'bg-[#9C5237] text-white shadow-2xs'
                        : 'bg-[#F9F5EE] border border-[#ECE2D4] text-[#6C5B4C] hover:bg-[#F3EDE2]'
                    }`}
                  >
                    {sz}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Default Category */}
          <div className="bg-[#FFFDF9] rounded-3xl p-6 border border-[#EFE8DC] shadow-xs space-y-3">
            <h3 className="font-serif text-lg font-semibold text-[#2D2A26]">Default Category</h3>
            <p className="text-xs text-[#7D6D5E]">
              Pre-selected category when tapping "+ Add to today".
            </p>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => handleSelectDefaultCategory('None')}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition cursor-pointer ${
                  settings.defaultCategory === 'None'
                    ? 'bg-[#9C5237] text-white border-[#9C5237]'
                    : 'bg-[#FAF6F0] border-[#E8DFC8] text-[#7D6B5A]'
                }`}
              >
                None
              </button>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => handleSelectDefaultCategory(cat)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition cursor-pointer ${
                    settings.defaultCategory === cat
                      ? 'bg-[#9C5237] text-white border-[#9C5237]'
                      : 'bg-[#FAF6F0] border-[#E8DFC8] text-[#7D6B5A]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Privacy & Lock Tab */}
      {activeTab === 'privacy' && (
        <div className="space-y-6">
          {/* Privacy Statement Card */}
          <div className="bg-[#F8F5EE] rounded-3xl p-6 border border-[#E9DFC8] space-y-3">
            <div className="flex items-center gap-2 text-[#9C5237]">
              <Shield className="w-5 h-5" />
              <h3 className="font-serif text-lg font-semibold text-[#2D2A26]">Private & Local-First</h3>
            </div>
            <ul className="text-xs text-[#5C4D3F] space-y-2 leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="text-[#628564] font-bold">✓</span>
                <span>All memories, photos, sketches, and voice notes reside strictly on your device in IndexedDB.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#628564] font-bold">✓</span>
                <span>Zero trackers, zero advertisements, and zero social feeds.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#628564] font-bold">✓</span>
                <span>Works 100% offline without requiring an active internet connection.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#628564] font-bold">✓</span>
                <span>You maintain full data sovereignty: export or import your vault anytime in JSON format.</span>
              </li>
            </ul>
          </div>

          {/* App Lock PIN Section */}
          <div className="bg-[#FFFDF9] rounded-3xl p-6 border border-[#EFE8DC] shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-serif text-lg font-semibold text-[#2D2A26]">App Lock (PIN)</h3>
                <p className="text-xs text-[#7D6D5E]">
                  Protect your notebook with a 4-digit code when opening or switching away.
                </p>
              </div>

              {settings.hasPinLock ? (
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-[#E8F2E8] text-[#335535]">
                    <Lock className="w-3 h-3" />
                    PIN Active
                  </span>
                  <button
                    type="button"
                    onClick={onLockNow}
                    className="px-3 py-1 text-xs font-medium text-white bg-[#9C5237] rounded-xl hover:bg-[#85432B] transition cursor-pointer"
                  >
                    Lock Now
                  </button>
                </div>
              ) : (
                <span className="text-xs font-medium text-[#8C7A6B]">Disabled</span>
              )}
            </div>

            {settings.hasPinLock ? (
              <div className="pt-3 border-t border-[#F0E8DC] flex items-center justify-between">
                <span className="text-xs text-[#7D6D5E]">
                  A 4-digit PIN is currently set to protect your memories.
                </span>
                <button
                  type="button"
                  onClick={handleDisablePin}
                  className="px-3 py-1.5 rounded-xl border border-[#F2C9C9] bg-[#FBE8E8] hover:bg-[#F7D8D8] text-[#9C3737] text-xs font-medium transition cursor-pointer"
                >
                  Turn Off PIN Lock
                </button>
              </div>
            ) : showPinSetup ? (
              <div className="pt-3 border-t border-[#F0E8DC] space-y-3">
                <label className="block text-xs font-medium text-[#5C4D3F]">
                  Enter a 4-digit PIN code:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="password"
                    maxLength={4}
                    value={pinInput}
                    onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
                    placeholder="••••"
                    className="w-28 text-center text-lg tracking-widest bg-[#F9F5EE] border border-[#E7DDD0] rounded-xl px-3 py-1.5 text-[#2D2A26] focus:outline-none focus:border-[#9C5237]"
                  />
                  <button
                    type="button"
                    onClick={handleSetPin}
                    className="px-4 py-1.5 rounded-xl bg-[#9C5237] hover:bg-[#85432B] text-white text-xs font-medium transition cursor-pointer"
                  >
                    Activate Lock
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowPinSetup(false);
                      setPinError('');
                    }}
                    className="px-3 py-1.5 rounded-xl text-xs text-[#7D6D5E] hover:bg-[#EAE0D0] transition cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
                {pinError && <p className="text-xs text-[#9C3737]">{pinError}</p>}
              </div>
            ) : (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setShowPinSetup(true)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-[#EAE0D3] hover:bg-[#DFCFC0] text-[#4D3A29] text-xs font-medium transition cursor-pointer"
                >
                  <Lock className="w-3.5 h-3.5 text-[#9C5237]" />
                  <span>Set 4-Digit PIN Lock</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Storage & Backup Tab */}
      {activeTab === 'storage' && (
        <div className="space-y-6">
          {/* Storage Statistics */}
          <div className="bg-[#FFFDF9] rounded-3xl p-6 border border-[#EFE8DC] shadow-xs space-y-4">
            <h3 className="font-serif text-lg font-semibold text-[#2D2A26]">Device Storage Usage</h3>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-[#FAF5EE] p-3 rounded-2xl border border-[#EAE0D3]">
                <span className="block text-xs font-medium text-[#7D6D5E]">Total Memories</span>
                <span className="font-serif text-xl font-semibold text-[#2D2A26]">
                  {storageStats.entryCount}
                </span>
              </div>
              <div className="bg-[#FAF5EE] p-3 rounded-2xl border border-[#EAE0D3]">
                <span className="block text-xs font-medium text-[#7D6D5E]">Media Files</span>
                <span className="font-serif text-xl font-semibold text-[#2D2A26]">
                  {storageStats.mediaCount}
                </span>
              </div>
              <div className="bg-[#FAF5EE] p-3 rounded-2xl border border-[#EAE0D3]">
                <span className="block text-xs font-medium text-[#7D6D5E]">Estimated Size</span>
                <span className="font-serif text-xl font-semibold text-[#2D2A26]">
                  {storageStats.estimatedSizeKb > 1024
                    ? `${(storageStats.estimatedSizeKb / 1024).toFixed(1)} MB`
                    : `${storageStats.estimatedSizeKb} KB`}
                </span>
              </div>
            </div>
          </div>

          {/* Backup & Export */}
          <div className="bg-[#FFFDF9] rounded-3xl p-6 border border-[#EFE8DC] shadow-xs space-y-4">
            <div>
              <h3 className="font-serif text-lg font-semibold text-[#2D2A26]">Export & Import</h3>
              <p className="text-xs text-[#7D6D5E]">
                Back up your entire vault or move it to another computer or phone.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleExportJSON}
                className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#9C5237] hover:bg-[#85432B] text-white text-xs font-medium transition cursor-pointer shadow-xs"
              >
                <Download className="w-4 h-4" />
                <span>Export Full Backup (JSON)</span>
              </button>

              <label className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#EAE0D3] hover:bg-[#DFCFC0] text-[#4D3A29] text-xs font-medium transition cursor-pointer shadow-2xs">
                <Upload className="w-4 h-4 text-[#9C5237]" />
                <span>Import Backup</span>
                <input
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={handleImportJSON}
                />
              </label>
            </div>

            {exportStatus && (
              <p className="text-xs font-medium text-[#3E6C4E] bg-[#EBF3ED] p-2 rounded-xl">
                {exportStatus}
              </p>
            )}

            {importStatus && (
              <p className="text-xs font-medium text-[#3E6C4E] bg-[#EBF3ED] p-2 rounded-xl">
                {importStatus}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Windows & Android Installation Guide */}
      {activeTab === 'platforms' && (
        <div className="space-y-6">
          <div className="bg-[#FFFDF9] rounded-3xl p-6 border border-[#EFE8DC] shadow-xs space-y-4">
            <div className="flex items-center gap-2 text-[#9C5237]">
              <Smartphone className="w-5 h-5" />
              <h3 className="font-serif text-lg font-semibold text-[#2D2A26]">
                Using on Windows Laptop & Android Phone
              </h3>
            </div>
            <p className="text-xs text-[#6C5B4C] leading-relaxed">
              Memory Nest is crafted as an installable Progressive Web App (PWA). It runs offline, opens in its own window without browser tabs, and saves everything directly to your personal hardware.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {/* Windows Laptop */}
              <div className="p-4 rounded-2xl bg-[#FAF6F0] border border-[#EAE0D3] space-y-2">
                <div className="flex items-center gap-2 text-[#4D3B2B] font-semibold text-sm">
                  <Laptop className="w-4 h-4 text-[#9C5237]" />
                  <span>Windows Laptop Setup</span>
                </div>
                <ol className="text-xs text-[#5C4D3F] space-y-1.5 list-decimal pl-4 leading-relaxed">
                  <li>Open Memory Nest in Google Chrome or Microsoft Edge.</li>
                  <li>Click the <strong>Install App</strong> button in the header (or the install icon in the address bar).</li>
                  <li>Click <strong>Install</strong> when prompted.</li>
                  <li>Memory Nest will now launch as a clean desktop window from your Start Menu or Taskbar!</li>
                </ol>
              </div>

              {/* Android Phone */}
              <div className="p-4 rounded-2xl bg-[#FAF6F0] border border-[#EAE0D3] space-y-2">
                <div className="flex items-center gap-2 text-[#4D3B2B] font-semibold text-sm">
                  <Smartphone className="w-4 h-4 text-[#9C5237]" />
                  <span>Android Phone Setup</span>
                </div>
                <ol className="text-xs text-[#5C4D3F] space-y-1.5 list-decimal pl-4 leading-relaxed">
                  <li>Open Memory Nest in Chrome on your Android device.</li>
                  <li>Tap the <strong>Install App</strong> button or tap the three dots menu (⋮).</li>
                  <li>Select <strong>Add to Home Screen</strong> or <strong>Install App</strong>.</li>
                  <li>The warm nest icon will appear alongside your native apps and launch full-screen!</li>
                </ol>
              </div>
            </div>

            {/* Note on PWA vs Native APK */}
            <div className="p-4 rounded-2xl bg-[#F7F2EA] border border-[#E5DACB] space-y-2 text-xs text-[#5C4D3F]">
              <span className="font-semibold text-[#3D2C1E] block">
                Installed PWA vs Native Android APK:
              </span>
              <p className="leading-relaxed">
                <strong>Progressive Web Apps (PWAs)</strong> are installed instantly directly from the web browser without going through app store bloatware. They work completely offline, have their own home screen icon, and store data in persistent local IndexedDB storage.
              </p>
              <p className="leading-relaxed">
                If you prefer a compiled standalone <strong>.apk</strong> package, the codebase is fully ready for <strong>Capacitor</strong>:
                <br />
                <code className="text-[11px] bg-white/70 px-1 py-0.5 rounded font-mono">
                  npm install @capacitor/core @capacitor/cli @capacitor/android && npx cap add android
                </code>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
