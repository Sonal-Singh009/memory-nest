import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  FileText,
  Mic,
  PenTool,
  Image as ImageIcon,
  Video,
  Music,
  Plus,
  Trash2,
  List,
  CheckSquare,
  Bold,
  Italic,
  Heading1,
  Heading2,
  Calendar,
  Tag,
  Check,
  Play,
  Square,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import {
  MemoryEntry,
  EntryType,
  Category,
  MediaAttachment,
  CATEGORIES_META
} from '../types';
import { DrawingCanvas } from './DrawingCanvas';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { useAudioRecorder } from '../hooks/useAudioRecorder';
import { getDraft, saveDraft, deleteDraft } from '../utils/db';

interface CaptureModalProps {
  initialDate: string; // YYYY-MM-DD
  existingEntry?: MemoryEntry | null;
  onSave: (entry: MemoryEntry) => Promise<void>;
  onClose: () => void;
  defaultCategory?: Category | 'None';
}

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

export const CaptureModal: React.FC<CaptureModalProps> = ({
  initialDate,
  existingEntry,
  onSave,
  onClose,
  defaultCategory = 'Thought',
}) => {
  const [activeTab, setActiveTab] = useState<EntryType>(
    existingEntry ? existingEntry.type : 'text'
  );

  const [date, setDate] = useState(existingEntry ? existingEntry.date : initialDate);
  const [title, setTitle] = useState(existingEntry?.title || '');
  const [content, setContent] = useState(existingEntry?.content || '');
  const [category, setCategory] = useState<Category | undefined>(
    existingEntry?.category || (defaultCategory === 'None' ? undefined : (defaultCategory as Category))
  );
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>(existingEntry?.tags || []);
  const [attachments, setAttachments] = useState<MediaAttachment[]>(
    existingEntry?.attachments || []
  );

  const [showDrawingCanvas, setShowDrawingCanvas] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [draftLoaded, setDraftLoaded] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const videoInputRef = useRef<HTMLInputElement | null>(null);

  // Voice to text hook
  const {
    transcript,
    setTranscript,
    interimTranscript,
    isListening,
    isSupported: isSpeechSupported,
    error: speechError,
    startListening,
    stopListening,
    resetTranscript,
  } = useSpeechRecognition();

  // Audio recorder hook
  const {
    isRecording,
    recordingDuration,
    audioDataUrl,
    error: audioError,
    startRecording,
    stopRecording,
    resetAudio,
  } = useAudioRecorder();

  // Load draft if creating new entry
  useEffect(() => {
    if (existingEntry) return;

    getDraft<any>('active_entry_draft').then((draft) => {
      if (draft && !draftLoaded) {
        if (draft.title && !title) setTitle(draft.title);
        if (draft.content && !content) setContent(draft.content);
        if (draft.category && !category) setCategory(draft.category);
        if (draft.tags && tags.length === 0) setTags(draft.tags);
        if (draft.activeTab) setActiveTab(draft.activeTab);
      }
      setDraftLoaded(true);
    });
  }, [existingEntry, draftLoaded]);

  // Auto-save draft debounced
  useEffect(() => {
    if (existingEntry) return;
    const timeout = setTimeout(() => {
      if (content.trim() || title.trim()) {
        saveDraft('active_entry_draft', {
          title,
          content,
          category,
          tags,
          activeTab,
          updatedAt: Date.now(),
        });
      }
    }, 800);
    return () => clearTimeout(timeout);
  }, [title, content, category, tags, activeTab, existingEntry]);

  // When speech transcript updates, sync into content or provide quick append
  useEffect(() => {
    if (transcript && activeTab === 'voice_to_text') {
      setContent(transcript);
    }
  }, [transcript, activeTab]);

  // Quick formatting insert helpers
  const insertFormatting = (prefix: string, suffix: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = content.substring(start, end);
    const replacement = `${prefix}${selected || 'text'}${suffix}`;

    const newContent = content.substring(0, start) + replacement + content.substring(end);
    setContent(newContent);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + (selected.length || 4));
    }, 50);
  };

  const handleAddTag = () => {
    const trimmed = tagInput.trim().replace(/^#/, '');
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  // Image Upload handler
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/')) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result && typeof event.target.result === 'string') {
          const newAtt: MediaAttachment = {
            id: `img-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            type: 'image',
            dataUrl: event.target.result,
            fileName: file.name,
            mimeType: file.type,
            fileSize: file.size,
          };
          setAttachments((prev) => [...prev, newAtt]);
        }
      };
      reader.readAsDataURL(file);
    });

    if (e.target) e.target.value = '';
  };

  // Video Upload handler
  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('video/')) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result && typeof event.target.result === 'string') {
        const newAtt: MediaAttachment = {
          id: `vid-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          type: 'video',
          dataUrl: event.target.result,
          fileName: file.name,
          mimeType: file.type,
          fileSize: file.size,
        };
        setAttachments((prev) => [...prev, newAtt]);
      }
    };
    reader.readAsDataURL(file);

    if (e.target) e.target.value = '';
  };

  // Add recorded voice memo as attachment
  const handleAttachRecordedAudio = () => {
    if (!audioDataUrl) return;

    const newAtt: MediaAttachment = {
      id: `audio-${Date.now()}`,
      type: 'audio',
      dataUrl: audioDataUrl,
      duration: recordingDuration,
      fileName: `Voice Memo ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
    };

    setAttachments((prev) => [...prev, newAtt]);
    resetAudio();
  };

  // Add sketch from drawing canvas
  const handleSaveSketch = (dataUrl: string) => {
    const newAtt: MediaAttachment = {
      id: `sketch-${Date.now()}`,
      type: 'sketch',
      dataUrl,
      fileName: `Sketch ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
    };
    setAttachments((prev) => [...prev, newAtt]);
    setShowDrawingCanvas(false);
  };

  const removeAttachment = (id: string) => {
    setAttachments(attachments.filter((a) => a.id !== id));
  };

  const updateAttachmentCaption = (id: string, caption: string) => {
    setAttachments(
      attachments.map((a) => (a.id === id ? { ...a, caption } : a))
    );
  };

  const handleSaveEntry = async () => {
    if (!content.trim() && !title.trim() && attachments.length === 0) {
      // Nothing to save
      return;
    }

    setIsSaving(true);
    const now = Date.now();
    const timeFormatted = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });

    const entryToSave: MemoryEntry = {
      id: existingEntry ? existingEntry.id : `mem-${now}-${Math.random().toString(36).substr(2, 5)}`,
      date,
      timeString: existingEntry ? existingEntry.timeString : timeFormatted,
      createdAt: existingEntry ? existingEntry.createdAt : now,
      updatedAt: now,
      type: activeTab,
      title: title.trim() || undefined,
      content: content.trim(),
      category,
      tags,
      attachments,
      isPinned: existingEntry?.isPinned,
      isFavorite: existingEntry?.isFavorite,
    };

    try {
      await onSave(entryToSave);
      await deleteDraft('active_entry_draft');
      onClose();
    } catch (err) {
      console.error('Failed to save memory:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const formatSecs = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec < 10 ? '0' : ''}${sec}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto">
      {/* Hidden file pickers */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleImageSelect}
      />
      <input
        ref={videoInputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={handleVideoSelect}
      />

      <div className="relative w-full max-w-2xl bg-[#FFFDF9] rounded-3xl border border-[#ECE4D8] shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-98 duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#F0E8DC] bg-[#FAF6F0]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#9C5237]" />
            <h2 className="font-serif font-semibold text-lg text-[#3B2D21]">
              {existingEntry ? 'Edit Memory' : 'Capture in Memory Nest'}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-[#8C7A6B] hover:text-[#3B2D21] hover:bg-[#EFE8DC] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation: Multiple ways to express */}
        <div className="flex items-center gap-1.5 px-5 py-2.5 bg-[#F7F2EA] border-b border-[#EDE4D6] overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab('text')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-medium transition cursor-pointer shrink-0 ${
              activeTab === 'text'
                ? 'bg-[#FFFDF9] text-[#3D2C1E] shadow-xs'
                : 'text-[#6C5B4C] hover:bg-[#EFE7DC]'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-[#9C5237]" />
            <span>Text Note</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('voice_to_text')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-medium transition cursor-pointer shrink-0 ${
              activeTab === 'voice_to_text'
                ? 'bg-[#FFFDF9] text-[#3D2C1E] shadow-xs'
                : 'text-[#6C5B4C] hover:bg-[#EFE7DC]'
            }`}
          >
            <Mic className="w-3.5 h-3.5 text-[#628564]" />
            <span>Voice-to-Text</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('sketch');
              setShowDrawingCanvas(true);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-medium transition cursor-pointer shrink-0 ${
              activeTab === 'sketch'
                ? 'bg-[#FFFDF9] text-[#3D2C1E] shadow-xs'
                : 'text-[#6C5B4C] hover:bg-[#EFE7DC]'
            }`}
          >
            <PenTool className="w-3.5 h-3.5 text-[#C8684C]" />
            <span>Sketch / Doodle</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('image');
              fileInputRef.current?.click();
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-medium transition cursor-pointer shrink-0 ${
              activeTab === 'image'
                ? 'bg-[#FFFDF9] text-[#3D2C1E] shadow-xs'
                : 'text-[#6C5B4C] hover:bg-[#EFE7DC]'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5 text-[#4D6F8A]" />
            <span>Photo</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('video');
              videoInputRef.current?.click();
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-medium transition cursor-pointer shrink-0 ${
              activeTab === 'video'
                ? 'bg-[#FFFDF9] text-[#3D2C1E] shadow-xs'
                : 'text-[#6C5B4C] hover:bg-[#EFE7DC]'
            }`}
          >
            <Video className="w-3.5 h-3.5 text-[#7E6B97]" />
            <span>Video</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('audio')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-medium transition cursor-pointer shrink-0 ${
              activeTab === 'audio'
                ? 'bg-[#FFFDF9] text-[#3D2C1E] shadow-xs'
                : 'text-[#6C5B4C] hover:bg-[#EFE7DC]'
            }`}
          >
            <Music className="w-3.5 h-3.5 text-[#9C5237]" />
            <span>Voice Memo</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Drawing Canvas Modal Replacement */}
          {showDrawingCanvas ? (
            <div className="h-[460px]">
              <DrawingCanvas
                onSave={handleSaveSketch}
                onCancel={() => setShowDrawingCanvas(false)}
              />
            </div>
          ) : (
            <>
              {/* Voice-to-Text Interactive Banner */}
              {activeTab === 'voice_to_text' && (
                <div className="p-4 rounded-2xl bg-[#F4F8F4] border border-[#DDEADD] text-[#335535]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="relative flex h-3 w-3">
                        {isListening && (
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#628564] opacity-75" />
                        )}
                        <span
                          className={`relative inline-flex rounded-full h-3 w-3 ${
                            isListening ? 'bg-[#4B6D4D]' : 'bg-[#A3B8A4]'
                          }`}
                        />
                      </span>
                      <span className="text-xs font-semibold uppercase tracking-wider">
                        {isListening ? 'Listening & Transcribing...' : 'Spoken Voice Note'}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={isListening ? stopListening : startListening}
                      className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition cursor-pointer ${
                        isListening
                          ? 'bg-[#9C3737] text-white hover:bg-[#852C2C]'
                          : 'bg-[#628564] text-white hover:bg-[#527254]'
                      }`}
                    >
                      <Mic className="w-3.5 h-3.5" />
                      <span>{isListening ? 'Pause Speaking' : 'Start Speaking'}</span>
                    </button>
                  </div>

                  {interimTranscript && (
                    <p className="mt-2 text-xs italic text-[#597B5B] bg-[#E8F2E8] p-2 rounded-xl">
                      "{interimTranscript}"
                    </p>
                  )}

                  {speechError && (
                    <div className="mt-2 flex items-start gap-1.5 text-xs text-[#9C3737]">
                      <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                      <span>{speechError}</span>
                    </div>
                  )}

                  {!isSpeechSupported && (
                    <p className="mt-2 text-xs text-[#7A6044]">
                      Note: Real-time speech recognition is best supported on Google Chrome, Edge, and Android Chrome. You can also edit and type in the box below anytime.
                    </p>
                  )}
                </div>
              )}

              {/* Audio Voice Note Recording Banner */}
              {activeTab === 'audio' && (
                <div className="p-4 rounded-2xl bg-[#FAF3EC] border border-[#EEDFCE] text-[#5A4533]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="relative flex h-3 w-3">
                        {isRecording && (
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#C8684C] opacity-75" />
                        )}
                        <span
                          className={`relative inline-flex rounded-full h-3 w-3 ${
                            isRecording ? 'bg-[#9C5237]' : 'bg-[#D2BCAB]'
                          }`}
                        />
                      </span>
                      <span className="text-xs font-semibold uppercase tracking-wider">
                        {isRecording
                          ? `Recording: ${formatSecs(recordingDuration)}`
                          : audioDataUrl
                          ? 'Voice Note Ready'
                          : 'Record a Voice Note'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {isRecording ? (
                        <button
                          type="button"
                          onClick={stopRecording}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-[#9C3737] text-white hover:bg-[#852C2C] transition cursor-pointer"
                        >
                          <Square className="w-3 h-3 fill-current" />
                          <span>Stop Recording</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={startRecording}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-[#9C5237] text-white hover:bg-[#85432B] transition cursor-pointer"
                        >
                          <Mic className="w-3.5 h-3.5" />
                          <span>{audioDataUrl ? 'Re-record' : 'Record Now'}</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {audioDataUrl && (
                    <div className="mt-3 flex items-center justify-between p-2.5 rounded-xl bg-white border border-[#E8DAC8]">
                      <audio controls src={audioDataUrl} className="h-8 max-w-[280px]" />
                      <button
                        type="button"
                        onClick={handleAttachRecordedAudio}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium bg-[#628564] text-white hover:bg-[#527254] transition cursor-pointer"
                      >
                        <Check className="w-3 h-3" />
                        <span>Attach to Memory</span>
                      </button>
                    </div>
                  )}

                  {audioError && (
                    <p className="mt-2 text-xs text-[#9C3737]">{audioError}</p>
                  )}
                </div>
              )}

              {/* Title (Optional) */}
              <div>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Title (optional)..."
                  className="w-full font-serif text-xl sm:text-2xl font-medium text-[#2D2A26] placeholder-[#AB9B8B] bg-transparent border-0 border-b border-transparent focus:border-[#DFD2C0] focus:ring-0 px-0 pb-1 focus:outline-none transition"
                />
              </div>

              {/* Formatting Toolbar */}
              <div className="flex items-center gap-1 py-1 px-2 rounded-xl bg-[#F6F0E6] border border-[#ECE2D2] text-[#6C5B4C] overflow-x-auto no-scrollbar">
                <button
                  type="button"
                  onClick={() => insertFormatting('# ')}
                  className="p-1.5 rounded-lg hover:bg-[#EAE0D0] transition cursor-pointer"
                  title="Heading 1"
                >
                  <Heading1 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => insertFormatting('## ')}
                  className="p-1.5 rounded-lg hover:bg-[#EAE0D0] transition cursor-pointer"
                  title="Heading 2"
                >
                  <Heading2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => insertFormatting('**', '**')}
                  className="p-1.5 rounded-lg hover:bg-[#EAE0D0] transition cursor-pointer"
                  title="Bold"
                >
                  <Bold className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => insertFormatting('*', '*')}
                  className="p-1.5 rounded-lg hover:bg-[#EAE0D0] transition cursor-pointer"
                  title="Italic"
                >
                  <Italic className="w-4 h-4" />
                </button>
                <div className="w-[1px] h-4 bg-[#DCCFBF] mx-1" />
                <button
                  type="button"
                  onClick={() => insertFormatting('- ')}
                  className="p-1.5 rounded-lg hover:bg-[#EAE0D0] transition cursor-pointer"
                  title="Bullet list"
                >
                  <List className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => insertFormatting('- [ ] ')}
                  className="p-1.5 rounded-lg hover:bg-[#EAE0D0] transition cursor-pointer"
                  title="Checklist item"
                >
                  <CheckSquare className="w-4 h-4" />
                </button>
                <div className="w-[1px] h-4 bg-[#DCCFBF] mx-1" />
                <button
                  type="button"
                  onClick={() => setShowDrawingCanvas(true)}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs hover:bg-[#EAE0D0] transition cursor-pointer"
                  title="Add doodle"
                >
                  <PenTool className="w-3.5 h-3.5 text-[#C8684C]" />
                  <span>Doodle</span>
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs hover:bg-[#EAE0D0] transition cursor-pointer"
                  title="Add photo"
                >
                  <ImageIcon className="w-3.5 h-3.5 text-[#4D6F8A]" />
                  <span>Photo</span>
                </button>
              </div>

              {/* Main Content Area */}
              <div>
                <textarea
                  ref={textareaRef}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="What is lingering in your mind? Write a quick thought, long reflection, or future dream..."
                  rows={7}
                  className="w-full text-[#362E25] placeholder-[#AA9987] bg-transparent border-0 focus:ring-0 resize-none font-sans text-base leading-relaxed focus:outline-none notebook-ruled-bg"
                />
              </div>

              {/* Attachments Preview Area */}
              {attachments.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-[#F0E6D8]">
                  <span className="text-xs font-semibold text-[#7D6B5A] uppercase tracking-wider">
                    Attached Media ({attachments.length}):
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {attachments.map((att) => (
                      <div
                        key={att.id}
                        className="group relative rounded-2xl bg-[#F7F2EA] border border-[#E7DDD0] p-1.5 flex flex-col justify-between"
                      >
                        {att.type === 'image' || att.type === 'sketch' ? (
                          <div className="aspect-4/3 rounded-xl overflow-hidden bg-black/5">
                            <img
                              src={att.dataUrl}
                              alt={att.fileName || 'Attachment'}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : att.type === 'video' ? (
                          <div className="aspect-4/3 rounded-xl overflow-hidden bg-black/5 flex items-center justify-center">
                            <video src={att.dataUrl} className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="h-20 rounded-xl bg-[#EFE8DC] flex flex-col items-center justify-center text-[#6C5B4C] p-2">
                            <Music className="w-6 h-6 text-[#9C5237]" />
                            <span className="text-[11px] truncate w-full text-center mt-1">
                              Voice Note
                            </span>
                          </div>
                        )}

                        <input
                          type="text"
                          value={att.caption || ''}
                          onChange={(e) => updateAttachmentCaption(att.id, e.target.value)}
                          placeholder="Add caption..."
                          className="mt-1 text-[11px] text-[#4E4135] bg-transparent border-0 border-b border-transparent focus:border-[#D8C7B4] focus:outline-none px-1"
                        />

                        <button
                          type="button"
                          onClick={() => removeAttachment(att.id)}
                          className="absolute top-2 right-2 p-1 rounded-full bg-black/50 hover:bg-black/75 text-white transition cursor-pointer"
                          title="Remove attachment"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Categories & Tags Section */}
              <div className="pt-3 border-t border-[#F0E6D8] space-y-3">
                {/* Category Selector */}
                <div>
                  <label className="block text-xs font-semibold text-[#7D6B5A] uppercase tracking-wider mb-1.5">
                    Category (Optional)
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {CATEGORIES.map((cat) => {
                      const isSelected = category === cat;
                      const meta = CATEGORIES_META[cat];
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setCategory(isSelected ? undefined : cat)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition cursor-pointer ${
                            isSelected
                              ? `${meta.badgeBg} ${meta.badgeText} ${meta.badgeBorder} ring-2 ring-[#9C5237]/25 shadow-xs`
                              : 'bg-[#F9F5EE] border-[#ECE2D4] text-[#7C6C5C] hover:bg-[#F3EDE2]'
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
                </div>

                {/* Tags Selector */}
                <div>
                  <label className="block text-xs font-semibold text-[#7D6B5A] uppercase tracking-wider mb-1.5">
                    Tags (e.g. #travel, #ideas)
                  </label>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs bg-[#EFE8DC] text-[#5A4B3C]"
                      >
                        #{tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="hover:text-[#9C3737] cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ',') {
                            e.preventDefault();
                            handleAddTag();
                          }
                        }}
                        placeholder="Add tag + Enter"
                        className="text-xs text-[#362E25] bg-[#F7F2EA] border border-[#E5DACB] rounded-lg px-2.5 py-1 focus:outline-none focus:border-[#9C5237]"
                      />
                      {tagInput.trim() && (
                        <button
                          type="button"
                          onClick={handleAddTag}
                          className="p-1 rounded-lg bg-[#9C5237] text-white hover:bg-[#85432B] cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Date Picker */}
                <div className="flex items-center gap-2 pt-1 text-xs text-[#7A6A5A]">
                  <Calendar className="w-4 h-4 text-[#9C5237]" />
                  <span>Entry Date:</span>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="bg-[#F7F2EA] border border-[#E5DACB] rounded-lg px-2 py-0.5 text-xs text-[#3D2C1E] focus:outline-none focus:border-[#9C5237]"
                  />
                </div>
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-5 py-3.5 border-t border-[#F0E8DC] bg-[#FAF6F0]">
          <span className="text-[11px] text-[#8C7A6B]">
            Saved privately to your device's memory vault.
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-2xl text-xs font-medium text-[#6C5B4C] hover:bg-[#EFE8DC] transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveEntry}
              disabled={isSaving || (!content.trim() && !title.trim() && attachments.length === 0)}
              className="flex items-center gap-1.5 px-5 py-2 rounded-2xl text-xs font-medium bg-[#9C5237] hover:bg-[#85432B] disabled:opacity-40 text-white shadow-xs transition cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Saving...' : existingEntry ? 'Update Memory' : 'Save Memory'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
