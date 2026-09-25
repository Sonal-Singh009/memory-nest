import React from 'react';
import { X, Download } from 'lucide-react';
import { MediaAttachment } from '../types';

interface MediaLightboxProps {
  attachment: MediaAttachment | null;
  onClose: () => void;
}

export const MediaLightbox: React.FC<MediaLightboxProps> = ({ attachment, onClose }) => {
  if (!attachment) return null;

  const downloadMedia = () => {
    const link = document.createElement('a');
    link.href = attachment.dataUrl;
    link.download = attachment.fileName || `memory-${attachment.type}-${Date.now()}`;
    link.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
        <button
          onClick={downloadMedia}
          className="p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition cursor-pointer"
          title="Download original"
        >
          <Download className="w-5 h-5" />
        </button>
        <button
          onClick={onClose}
          className="p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition cursor-pointer"
          title="Close preview"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="max-w-4xl max-h-[85vh] flex flex-col items-center justify-center">
        {attachment.type === 'video' ? (
          <video
            src={attachment.dataUrl}
            controls
            autoPlay
            className="max-h-[75vh] max-w-full rounded-2xl shadow-2xl"
          />
        ) : (
          <img
            src={attachment.dataUrl}
            alt={attachment.caption || 'Memory preview'}
            className="max-h-[75vh] max-w-full object-contain rounded-2xl shadow-2xl"
          />
        )}

        {attachment.caption && (
          <p className="mt-4 text-center text-sm font-medium text-white/90 bg-black/40 px-4 py-2 rounded-full max-w-xl">
            {attachment.caption}
          </p>
        )}
      </div>
    </div>
  );
};
