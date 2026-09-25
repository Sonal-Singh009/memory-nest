import React, { useState } from 'react';
import { Download, Smartphone, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running as an installed standalone PWA, hide the button
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <button
        onClick={install}
        className={`flex items-center gap-1.5 rounded-full bg-[#EAE0D3] hover:bg-[#DFD3C4] text-[#5A4532] font-medium transition cursor-pointer ${
          compact ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-xs'
        }`}
        title="Install Memory Nest on your Windows laptop or Android phone"
      >
        <Download className="w-3.5 h-3.5 text-[#9C5237]" />
        <span>Install App</span>
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className={`flex items-center gap-1.5 rounded-full border border-[#E3D8CA] bg-[#FAF7F2] hover:bg-[#F3EDE3] text-[#6E5C4B] font-medium transition cursor-pointer ${
            compact ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-xs'
          }`}
        >
          <Smartphone className="w-3.5 h-3.5 text-[#9C5237]" />
          <span>Add to Home</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
            <div className="w-full max-w-sm rounded-3xl bg-[#FAF8F5] p-6 shadow-xl border border-[#EFE8DC] text-[#2D2A26]">
              <div className="flex items-center justify-between pb-3 border-b border-[#EFE8DC]">
                <h3 className="font-serif text-lg font-semibold text-[#3D3126]">Install on iPhone / iPad</h3>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 rounded-full text-[#8C7A6B] hover:bg-[#EFE8DC]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="mt-4 text-sm text-[#5C4D3F] leading-relaxed">
                1. Tap the <strong className="text-[#3D3126]">Share</strong> button in Safari's bottom toolbar.<br />
                2. Scroll down and tap <strong className="text-[#3D3126]">Add to Home Screen</strong>.<br />
                3. Memory Nest will open as a full-screen, offline-ready app!
              </p>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full rounded-2xl bg-[#EBE3D7] hover:bg-[#E0D6C8] py-2.5 text-sm font-medium text-[#4A3B2C] transition cursor-pointer"
              >
                Understood
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
