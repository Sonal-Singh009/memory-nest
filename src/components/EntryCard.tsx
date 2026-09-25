import React, { useState } from 'react';
import {
  MoreHorizontal,
  Edit3,
  Trash2,
  Heart,
  Pin,
  Share2,
  CheckSquare,
  Square,
  FileText,
  Mic,
  Image as ImageIcon,
  PenTool,
  Video,
  Music,
  Calendar,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { MemoryEntry, CATEGORIES_META, MediaAttachment } from '../types';
import { AudioPlayer } from './AudioPlayer';

interface EntryCardProps {
  entry: MemoryEntry;
  onEdit: (entry: MemoryEntry) => void;
  onDelete: (id: string) => void;
  onToggleFavorite: (entry: MemoryEntry) => void;
  onTogglePin?: (entry: MemoryEntry) => void;
  onOpenMediaLightbox: (attachment: MediaAttachment) => void;
  showDate?: boolean;
}

export const EntryCard: React.FC<EntryCardProps> = ({
  entry,
  onEdit,
  onDelete,
  onToggleFavorite,
  onTogglePin,
  onOpenMediaLightbox,
  showDate = false,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [copied, setCopied] = useState(false);

  const categoryMeta = entry.category ? CATEGORIES_META[entry.category] : null;

  const handleCopy = () => {
    let text = '';
    if (entry.title) text += `${entry.title}\n\n`;
    text += entry.content;
    navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    setShowMenu(false);
  };

  // Helper to render text with markdown checkmarks & bold
  const renderFormattedContent = (content: string) => {
    if (!content) return null;
    const lines = content.split('\n');

    return (
      <div className="space-y-1.5 text-[#3D3731] leading-relaxed break-words font-sans">
        {lines.map((line, idx) => {
          const trimmed = line.trim();
          if (trimmed.startsWith('- [ ] ') || trimmed.startsWith('[ ] ')) {
            const taskText = trimmed.replace(/^(-\s*)?\[ \]\s*/, '');
            return (
              <div key={idx} className="flex items-start gap-2 text-sm text-[#4E4338]">
                <Square className="w-4 h-4 mt-0.5 text-[#9C8B7B] shrink-0" />
                <span>{taskText}</span>
              </div>
            );
          }
          if (
            trimmed.startsWith('- [x] ') ||
            trimmed.startsWith('- [X] ') ||
            trimmed.startsWith('[x] ') ||
            trimmed.startsWith('[X] ')
          ) {
            const taskText = trimmed.replace(/^(-\s*)?\[(x|X)\]\s*/, '');
            return (
              <div key={idx} className="flex items-start gap-2 text-sm text-[#8A7C6E] line-through">
                <CheckSquare className="w-4 h-4 mt-0.5 text-[#628564] shrink-0" />
                <span>{taskText}</span>
              </div>
            );
          }
          if (trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
            return (
              <div key={idx} className="flex items-start gap-2 text-sm text-[#4E4338] pl-1">
                <span className="text-[#9C5237] mt-1 font-bold leading-none">•</span>
                <span>{trimmed.substring(2)}</span>
              </div>
            );
          }
          if (trimmed.startsWith('# ')) {
            return (
              <h3 key={idx} className="font-serif font-semibold text-lg text-[#2D2A26] pt-1">
                {trimmed.substring(2)}
              </h3>
            );
          }
          if (trimmed.startsWith('## ')) {
            return (
              <h4 key={idx} className="font-serif font-semibold text-base text-[#3D3731] pt-1">
                {trimmed.substring(3)}
              </h4>
            );
          }

          if (line === '') {
            return <div key={idx} className="h-2" />;
          }

          return (
            <p key={idx} className="text-[14.5px] leading-relaxed">
              {line}
            </p>
          );
        })}
      </div>
    );
  };

  const getTypeIcon = () => {
    switch (entry.type) {
      case 'voice_to_text':
        return <Mic className="w-3.5 h-3.5 text-[#628564]" />;
      case 'sketch':
        return <PenTool className="w-3.5 h-3.5 text-[#C8684C]" />;
      case 'image':
        return <ImageIcon className="w-3.5 h-3.5 text-[#4D6F8A]" />;
      case 'video':
        return <Video className="w-3.5 h-3.5 text-[#7E6B97]" />;
      case 'audio':
        return <Music className="w-3.5 h-3.5 text-[#9C5237]" />;
      default:
        return <FileText className="w-3.5 h-3.5 text-[#7D6B5A]" />;
    }
  };

  // Filter attachments by type
  const imageAttachments = entry.attachments?.filter((a) => a.type === 'image' || a.type === 'sketch') || [];
  const audioAttachments = entry.attachments?.filter((a) => a.type === 'audio') || [];
  const videoAttachments = entry.attachments?.filter((a) => a.type === 'video') || [];

  return (
    <article className="group relative bg-[#FFFDF9] hover:bg-[#FFFFFF] rounded-3xl p-5 border border-[#EFE8DC] hover:border-[#E3D7C5] shadow-xs hover:shadow-sm transition-all duration-200">
      {/* Top Meta Header */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Category Pill */}
          {categoryMeta && (
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${categoryMeta.badgeBg} ${categoryMeta.badgeText} ${categoryMeta.badgeBorder}`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
              {categoryMeta.name}
            </span>
          )}

          {/* Type Badge */}
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-[#F5EFE6] text-[#6E5D4E] border border-[#E9DFD0]">
            {getTypeIcon()}
            <span className="capitalize text-[11px]">{entry.type.replace(/_/g, ' ')}</span>
          </span>

          {/* Date & Time */}
          <div className="flex items-center gap-1.5 text-xs text-[#8A7B6E]">
            {showDate && (
              <span className="flex items-center gap-1 font-medium text-[#645648]">
                <Calendar className="w-3 h-3 text-[#9C5237]" />
                {entry.date}
              </span>
            )}
            <span>{entry.timeString}</span>
          </div>

          {entry.isPinned && (
            <span className="inline-flex items-center text-[#C8684C]" title="Pinned">
              <Pin className="w-3.5 h-3.5 fill-current" />
            </span>
          )}
        </div>

        {/* Card Actions */}
        <div className="relative flex items-center gap-1">
          <button
            type="button"
            onClick={() => onToggleFavorite(entry)}
            className={`p-1.5 rounded-full transition cursor-pointer ${
              entry.isFavorite
                ? 'text-[#C8684C] hover:bg-[#FBE8E8]'
                : 'text-[#A09384] hover:text-[#C8684C] hover:bg-[#F6EFE6]'
            }`}
            title={entry.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Heart className={`w-4 h-4 ${entry.isFavorite ? 'fill-current' : ''}`} />
          </button>

          <button
            type="button"
            onClick={() => setShowMenu(!showMenu)}
            className="p-1.5 rounded-full text-[#8A7B6E] hover:text-[#3D2C1E] hover:bg-[#F3EBE0] transition cursor-pointer"
            title="Options"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>

          {/* Dropdown Menu */}
          {showMenu && (
            <>
              <div
                className="fixed inset-0 z-20"
                onClick={() => {
                  setShowMenu(false);
                  setConfirmDelete(false);
                }}
              />
              <div className="absolute right-0 top-8 z-30 w-44 rounded-2xl bg-[#FFFDF9] border border-[#EAE2D5] shadow-lg py-1.5 text-xs text-[#4A3C2F] animate-in fade-in zoom-in-95">
                <button
                  type="button"
                  onClick={() => {
                    setShowMenu(false);
                    onEdit(entry);
                  }}
                  className="flex items-center gap-2 w-full px-3 py-2 hover:bg-[#F5EFE6] text-left transition cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5 text-[#6C5B4C]" />
                  <span>Edit memory</span>
                </button>

                {onTogglePin && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowMenu(false);
                      onTogglePin(entry);
                    }}
                    className="flex items-center gap-2 w-full px-3 py-2 hover:bg-[#F5EFE6] text-left transition cursor-pointer"
                  >
                    <Pin className="w-3.5 h-3.5 text-[#6C5B4C]" />
                    <span>{entry.isPinned ? 'Unpin' : 'Pin to top'}</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleCopy}
                  className="flex items-center gap-2 w-full px-3 py-2 hover:bg-[#F5EFE6] text-left transition cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5 text-[#6C5B4C]" />
                  <span>{copied ? 'Copied!' : 'Copy text'}</span>
                </button>

                <div className="my-1 border-t border-[#EFE8DC]" />

                {confirmDelete ? (
                  <div className="p-2 bg-[#FDEFEF] rounded-xl mx-1">
                    <p className="text-[11px] text-[#9C3737] mb-1 font-medium">Delete this memory?</p>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          onDelete(entry.id);
                          setShowMenu(false);
                        }}
                        className="px-2 py-1 rounded-lg bg-[#9C3737] text-white text-[11px] font-medium transition cursor-pointer hover:bg-[#852C2C]"
                      >
                        Yes, delete
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDelete(false)}
                        className="px-2 py-1 rounded-lg text-[#6C5B4C] hover:bg-[#EAE0D3] text-[11px] transition cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(true)}
                    className="flex items-center gap-2 w-full px-3 py-2 text-[#9C3737] hover:bg-[#FDEFEF] text-left transition cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Title */}
      {entry.title && (
        <h3 className="font-serif text-lg font-semibold text-[#2D2A26] mb-2 leading-snug">
          {entry.title}
        </h3>
      )}

      {/* Main Formatted Text Content */}
      {entry.content && (
        <div className="mb-3.5">
          {renderFormattedContent(entry.content)}
        </div>
      )}

      {/* Images & Sketches Grid */}
      {imageAttachments.length > 0 && (
        <div
          className={`grid gap-2 mb-3.5 ${
            imageAttachments.length === 1
              ? 'grid-cols-1'
              : imageAttachments.length === 2
              ? 'grid-cols-2'
              : 'grid-cols-2 sm:grid-cols-3'
          }`}
        >
          {imageAttachments.map((att) => (
            <div
              key={att.id}
              onClick={() => onOpenMediaLightbox(att)}
              className="group/img relative rounded-2xl overflow-hidden bg-[#F4EDE2] border border-[#EAE0D3] aspect-4/3 cursor-pointer shadow-2xs hover:shadow-xs transition"
            >
              <img
                src={att.dataUrl}
                alt={att.caption || 'Memory illustration'}
                className="w-full h-full object-cover group-hover/img:scale-102 transition duration-300"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/10 opacity-0 group-hover/img:opacity-100 transition flex items-center justify-center">
                <span className="p-1.5 rounded-full bg-white/80 text-[#3D2C1E] shadow-sm">
                  <ExternalLink className="w-3.5 h-3.5" />
                </span>
              </div>
              {att.caption && (
                <div className="absolute bottom-0 inset-x-0 bg-black/40 backdrop-blur-2xs text-white text-[11px] px-2 py-1 truncate">
                  {att.caption}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Audio Notes Player */}
      {audioAttachments.length > 0 && (
        <div className="space-y-2 mb-3.5">
          {audioAttachments.map((att) => (
            <AudioPlayer key={att.id} src={att.dataUrl} duration={att.duration} />
          ))}
        </div>
      )}

      {/* Video Attachments */}
      {videoAttachments.length > 0 && (
        <div className="space-y-3 mb-3.5">
          {videoAttachments.map((att) => (
            <div key={att.id} className="rounded-2xl overflow-hidden bg-black/5 border border-[#EAE0D3]">
              <video
                src={att.dataUrl}
                controls
                preload="metadata"
                className="w-full rounded-2xl max-h-[360px]"
              />
              {att.caption && (
                <p className="p-2 text-xs text-[#6C5B4C] bg-[#F7F2EA]">{att.caption}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Tags */}
      {entry.tags && entry.tags.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-[#F2ECE2]">
          {entry.tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center text-xs font-medium text-[#8A7764] bg-[#F6F0E6] hover:bg-[#EFE8DC] px-2 py-0.5 rounded-lg transition"
            >
              #{tag.replace(/^#/, '')}
            </span>
          ))}
        </div>
      )}
    </article>
  );
};
