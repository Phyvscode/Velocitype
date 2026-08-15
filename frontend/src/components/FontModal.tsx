import React, { useState, useRef, useEffect } from 'react';

import {
  PRESET_FONTS,
  getStoredFont,
  getFontType,
  getUploadedFontInfo,
  applyGoogleFont,
  applyUploadedFontFile,
} from '@/lib/fonts';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function FontModal({ isOpen, onClose }: Props) {
  const [activeSource, setActiveSource] = useState<'google' | 'upload'>(() => getFontType() === 'uploaded' ? 'upload' : 'google');
  const [currentFont, setCurrentFont] = useState<string>(() => getStoredFont());
  const [customInput, setCustomInput] = useState<string>('');
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const { user } = useAuth();

  // File Upload State
  const [dragOver, setDragOver] = useState(false);
  const [uploadError, setUploadError] = useState<string>('');
  const [uploadSuccess, setUploadSuccess] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadedInfo = getUploadedFontInfo();

  // Load every preset font's actual weights once, purely for the preview
  // cards below — otherwise "The quick brown fox" just renders in whatever
  // font happens to be globally active right now instead of each font.
  useEffect(() => {
    const CHUNK_SIZE = 30; // Keep URLs under 2,000 characters
    
    // Check if we already loaded the first chunk to prevent duplicates
    if (document.getElementById('font-modal-preview-stylesheet-0')) return;

    for (let i = 0; i < PRESET_FONTS.length; i += CHUNK_SIZE) {
      const chunk = PRESET_FONTS.slice(i, i + CHUNK_SIZE);
      const families = chunk.map((f) => `family=${f.googleFont}:wght@400;600`).join('&');
      
      const link = document.createElement('link');
      link.id = `font-modal-preview-stylesheet-${i}`;
      link.rel = 'stylesheet';
      link.href = `https://fonts.googleapis.com/css2?${families}&display=swap`;
      document.head.appendChild(link);
    }
  }, []);

  // Register a preview-only @font-face for the uploaded font, so the "Live
  // Font Sample" below always renders in the uploaded font — even when a
  // Google Font is the one currently active site-wide.
  useEffect(() => {
    if (!uploadedInfo) return;
    const styleId = 'font-modal-uploaded-preview-face';
    let styleEl = document.getElementById(styleId) as HTMLStyleElement | null;
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = styleId;
      document.head.appendChild(styleEl);
    }
    styleEl.innerHTML = `
      @font-face {
        font-family: 'VelocitypeUploadedPreview';
        src: url('${uploadedInfo.dataUrl}') format('${uploadedInfo.format}');
        font-weight: normal;
        font-style: normal;
        font-display: swap;
      }
    `;
  }, [uploadedInfo]);

  if (!isOpen) return null;

  const categories = ['All', 'Sans-Serif', 'Monospace', 'Serif', 'Display'];

  const filteredFonts = PRESET_FONTS.filter(
    (f) => activeCategory === 'All' || f.category === activeCategory
  );

  const handleSelectGoogleFont = (fontName: string) => {
    setCurrentFont(fontName);
    setActiveSource('google');
    applyGoogleFont(fontName);
    if (user) {
      api.updateSettings({ fontFamily: fontName }).catch(err => console.error(err));
    }
  };

  const handleApplyCustomGoogleFont = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customInput.trim()) return;
    const fontName = customInput.trim();
    handleSelectGoogleFont(fontName);
    setCustomInput('');
  };

  const handleFileProcess = (file: File) => {
    setUploadError('');
    setUploadSuccess('');

    const validExtensions = ['.ttf', '.otf', '.woff', '.woff2'];
    const hasValidExt = validExtensions.some((ext) => file.name.toLowerCase().endsWith(ext));

    if (!hasValidExt) {
      setUploadError('Invalid font file format. Please upload a .ttf, .otf, .woff, or .woff2 file.');
      return;
    }

    if (file.size > 12 * 1024 * 1024) {
      setUploadError('Font file is too large (max 12MB).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (dataUrl) {
        applyUploadedFontFile(file.name, dataUrl);
        setActiveSource('upload');
        setCurrentFont(file.name.replace(/\.[^/.]+$/, ''));
        setUploadSuccess(`Successfully applied custom font "${file.name}"!`);
      }
    };
    reader.onerror = () => {
      setUploadError('Failed to read font file.');
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileProcess(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileProcess(file);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-background border border-[var(--hot)] rounded-2xl p-6 md:p-8 shadow-[0_0_40px_var(--color-hot-soft)] relative max-h-[85vh] flex flex-col">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white hover:text-slate-200 transition-colors p-2 text-xl font-bold exclude-theme"
        >
          ✕
        </button>

        <div className="flex items-center gap-3 mb-6">
          
          <div>
            <h2 className="text-xl font-bold text-slate-100">Typography Settings</h2>
            <p className="text-xs text-slate-400">Choose a Google Font or upload your custom font file</p>
          </div>
        </div>

        {/* Source Selector Tabs */}
        <div className="flex bg-white/5 p-1 mb-6 border border-white/10 shrink-0">
          <button
            onClick={() => setActiveSource('google')}
            className={`flex-1 py-2 text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
              activeSource === 'google'
                ? 'bg-[var(--hot)] text-[var(--background)] shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
             Google Fonts
          </button>
          <button
            onClick={() => setActiveSource('upload')}
            className={`flex-1 py-2 text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
              activeSource === 'upload'
                ? 'bg-[var(--hot)] text-[var(--background)] shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
             Upload Font File (.ttf, .otf, .woff, .woff2)
          </button>
        </div>

        {activeSource === 'google' ? (
          <>
            {/* Custom Google Font Search */}
            <form onSubmit={handleApplyCustomGoogleFont} className="mb-5 flex gap-2 shrink-0">
              <div className="relative flex-1">
                
                <input
                  type="text"
                  value={customInput}
                  onChange={(e) => setCustomInput(e.target.value)}
                  placeholder="Type ANY Google Font name (e.g. Montserrat, Oswald, Pacifico)..."
                  className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 focus:border-[var(--hot)] focus:outline-none text-slate-100 text-sm"
                />
              </div>
              <button
                type="submit"
                className="px-5 py-2.5 bg-[var(--hot)] hover:bg-[var(--hot)]/80 text-slate-950 font-bold text-sm transition-colors flex items-center gap-1.5 shrink-0"
              >
                 Apply Font
              </button>
            </form>

            {/* Categories */}
            <div className="flex gap-2 overflow-x-auto pb-2 mb-4 shrink-0">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3.5 py-1.5 text-xs font-semibold transition-colors shrink-0 ${
                    activeCategory === cat
                      ? 'bg-[var(--hot)]/20 text-[var(--hot)] border border-[var(--hot)]/40'
                      : 'bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Google Font Grid */}
            <div className="flex-1 overflow-y-auto pr-1 grid sm:grid-cols-2 gap-3">
              {filteredFonts.map((f) => {
                const selected =
                  activeSource === 'google' && currentFont.toLowerCase() === f.name.toLowerCase();
                return (
                  <button
                    key={f.name}
                    onClick={() => handleSelectGoogleFont(f.name)}
                    className={`p-4 text-left border transition-all flex flex-col justify-between ${
                      selected
                        ? 'border-[var(--hot)] bg-[var(--hot)]/10 shadow-lg shadow-[var(--hot)]/20'
                        : 'border-white/10 bg-white/5 hover:border-white/10'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-slate-200">{f.name}</span>
                      <span className="text-[10px] uppercase tracking-wider text-slate-500 bg-white/10 px-2 py-0.5 ">
                        {f.category}
                      </span>
                    </div>
                    <div
                      ref={(el) => {
                        if (el) el.style.setProperty('font-family', `'${f.name}', sans-serif`, 'important');
                      }}
                      className="text-xl text-[var(--hot)] font-semibold truncate"
                    >
                      The quick brown fox
                    </div>
                    {selected && (
                      <div className="mt-2 flex items-center gap-1 text-xs text-[var(--hot)] font-medium">
                         Active Font
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </>
        ) : (
          <div className="flex-1 overflow-y-auto space-y-4">
            {/* Drag & Drop Upload Zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed p-8 text-center cursor-pointer transition-all ${
                dragOver
                  ? 'border-[var(--hot)] bg-[var(--hot)]/10'
                  : 'border-white/10 bg-white/5 hover:border-white/20'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".ttf,.otf,.woff,.woff2"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="w-12 h-12 bg-[var(--hot)]/10 text-[var(--hot)] border border-[var(--hot)]/30 flex items-center justify-center mx-auto mb-3">
                
              </div>
              <h3 className="text-lg font-bold text-slate-100 mb-1">
                Upload your font file
              </h3>
              <p className="text-sm text-slate-400 mb-3">
                Drag and drop your <code className="text-[var(--hot)] bg-white/10 px-1.5 py-0.5 text-xs">.ttf</code>, <code className="text-[var(--hot)] bg-white/10 px-1.5 py-0.5 text-xs">.otf</code>, <code className="text-[var(--hot)] bg-white/10 px-1.5 py-0.5 text-xs">.woff</code>, or <code className="text-[var(--hot)] bg-white/10 px-1.5 py-0.5 text-xs">.woff2</code> file here
              </p>
              <span className="inline-block px-4 py-2 bg-white/10 hover:bg-white/20 text-slate-200 text-xs font-semibold border border-white/10 transition-colors">
                Browse File
              </span>
            </div>

            {uploadError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm flex items-center gap-2">
                
                {uploadError}
              </div>
            )}

            {uploadSuccess && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm flex items-center gap-2">
                
                {uploadSuccess}
              </div>
            )}

            {/* Currently Active Uploaded Font Info */}
            {uploadedInfo && (
              <div className="p-5 bg-white/5 border border-white/10 ">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    
                    <div>
                      <h4 className="font-bold text-slate-100">{uploadedInfo.fileName}</h4>
                      <span className="text-xs text-slate-500 uppercase font-mono">Format: {uploadedInfo.format}</span>
                    </div>
                  </div>
                  {activeSource === 'upload' && (
                    <span className="flex items-center gap-1 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 font-medium">
                       Currently Applied
                    </span>
                  )}
                </div>

                {/* Live Font Sample */}
                <div
                  ref={(el) => {
                    if (el) el.style.setProperty('font-family', "'VelocitypeUploadedPreview', sans-serif", 'important');
                  }}
                  className="p-4 bg-black/20 border border-white/10 text-slate-100 text-2xl font-medium tracking-wide"
                >
                  The quick brown fox jumps over the lazy dog 1234567890
                </div>

                {activeSource !== 'upload' && (
                  <button
                    onClick={() => {
                      applyUploadedFontFile(uploadedInfo.fileName, uploadedInfo.dataUrl);
                      setActiveSource('upload');
                    }}
                    className="mt-3 w-full py-2 bg-[var(--hot)] hover:bg-[var(--hot)]/80 text-slate-950 font-bold text-sm transition-colors"
                  >
                    Use This Uploaded Font
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}