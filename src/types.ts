export type EntryType = 'text' | 'voice_to_text' | 'sketch' | 'image' | 'video' | 'audio';

export type Category =
  | 'Thought'
  | 'Memory'
  | 'Idea'
  | 'Future plan'
  | 'Goal'
  | 'Learning'
  | 'Important'
  | 'Random';

export interface MediaAttachment {
  id: string;
  type: 'image' | 'video' | 'audio' | 'sketch';
  dataUrl: string; // base64 or blob data URL for persistent offline storage
  fileName?: string;
  mimeType?: string;
  fileSize?: number;
  caption?: string;
  duration?: number; // seconds for audio/video
  width?: number;
  height?: number;
}

export interface MemoryEntry {
  id: string;
  date: string; // YYYY-MM-DD format (e.g. 2026-09-25)
  timeString: string; // e.g. "09:30 AM"
  createdAt: number; // Unix timestamp ms
  updatedAt: number;
  type: EntryType;
  title?: string;
  content: string; // main note or transcript
  category?: Category;
  tags: string[]; // e.g. ["travel", "ideas"]
  attachments: MediaAttachment[];
  isPinned?: boolean;
  isFavorite?: boolean;
}

export type ThemeType = 'cream' | 'lavender' | 'sage' | 'peach' | 'dark';
export type FontFamilyType = 'serif' | 'sans';
export type FontSizeType = 'normal' | 'large' | 'generous';

export interface AppSettings {
  appName: string;
  theme: ThemeType;
  fontFamily: FontFamilyType;
  fontSize: FontSizeType;
  defaultCategory: Category | 'None';
  hasPinLock: boolean;
  pinCode?: string;
}

export type ActiveView = 'today' | 'calendar' | 'memories' | 'ideas' | 'search' | 'settings';

export interface CategoryMeta {
  name: Category;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  iconName: string;
}

export const CATEGORIES_META: Record<Category, CategoryMeta> = {
  Thought: {
    name: 'Thought',
    badgeBg: 'bg-[#F4ECE1]',
    badgeText: 'text-[#7D5A38]',
    badgeBorder: 'border-[#E5D7C5]',
    iconName: 'Sparkles',
  },
  Memory: {
    name: 'Memory',
    badgeBg: 'bg-[#FCECE6]',
    badgeText: 'text-[#9C5237]',
    badgeBorder: 'border-[#F1D5C8]',
    iconName: 'Heart',
  },
  Idea: {
    name: 'Idea',
    badgeBg: 'bg-[#FEF5D9]',
    badgeText: 'text-[#8A6A14]',
    badgeBorder: 'border-[#EEDAA4]',
    iconName: 'Lightbulb',
  },
  'Future plan': {
    name: 'Future plan',
    badgeBg: 'bg-[#EBF3ED]',
    badgeText: 'text-[#3E6C4E]',
    badgeBorder: 'border-[#CCE0D1]',
    iconName: 'Compass',
  },
  Goal: {
    name: 'Goal',
    badgeBg: 'bg-[#EAEFF8]',
    badgeText: 'text-[#33568A]',
    badgeBorder: 'border-[#CAD8EE]',
    iconName: 'Target',
  },
  Learning: {
    name: 'Learning',
    badgeBg: 'bg-[#EFEBF6]',
    badgeText: 'text-[#5C4582]',
    badgeBorder: 'border-[#D9CFE8]',
    iconName: 'BookOpen',
  },
  Important: {
    name: 'Important',
    badgeBg: 'bg-[#FBE8E8]',
    badgeText: 'text-[#963737]',
    badgeBorder: 'border-[#F2C9C9]',
    iconName: 'Bookmark',
  },
  Random: {
    name: 'Random',
    badgeBg: 'bg-[#F0EDE8]',
    badgeText: 'text-[#645F56]',
    badgeBorder: 'border-[#DED8CE]',
    iconName: 'Feather',
  },
};
