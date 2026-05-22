import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Lock, Check, Sparkles, Globe, Link } from 'lucide-react';
import { Bookmark } from '../types';

interface AddBookmarkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (bookmark: Omit<Bookmark, 'id' | 'createdAt'> & { id?: string }) => Promise<void>;
  editingBookmark?: Bookmark | null;
}

const BRAND_OPTIONS = [
  { value: 'generic', label: 'Generic / Web Link' },
  { value: 'github', label: 'GitHub Project' },
  { value: 'dribbble', label: 'Dribbble Shot' },
  { value: 'figma', label: 'Figma File' },
  { value: 'notion', label: 'Notion Workspace' },
  { value: 'chrome', label: 'Chrome / Web Google' },
  { value: 'twitter', label: 'Twitter Thread' },
  { value: 'youtube', label: 'YouTube Video' },
] as const;

export default function AddBookmarkModal({
  isOpen,
  onClose,
  onSave,
  editingBookmark
}: AddBookmarkModalProps) {
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [iconType, setIconType] = useState<Bookmark['iconType']>('generic');
  const [isPrivate, setIsPrivate] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Populate data when editing
  useEffect(() => {
    if (editingBookmark) {
      setTitle(editingBookmark.title);
      setUrl(editingBookmark.url);
      setDescription(editingBookmark.description);
      setTagsInput(editingBookmark.tags.join(', '));
      setIconType(editingBookmark.iconType);
      setIsPrivate(editingBookmark.isPrivate);
    } else {
      setTitle('');
      setUrl('');
      setDescription('');
      setTagsInput('');
      setIconType('generic');
      setIsPrivate(false);
    }
    setErrors({});
  }, [editingBookmark, isOpen]);

  // Auto-detect brand icon from URL input
  const handleUrlChange = (value: string) => {
    setUrl(value);
    
    if (editingBookmark) return; // Keep custom brand if editing
    
    const lowers = value.toLowerCase();
    if (lowers.includes('github.com')) {
      setIconType('github');
    } else if (lowers.includes('dribbble.com')) {
      setIconType('dribbble');
    } else if (lowers.includes('figma.com')) {
      setIconType('figma');
    } else if (lowers.includes('notion.so') || lowers.includes('notion.com')) {
      setIconType('notion');
    } else if (lowers.includes('twitter.com') || lowers.includes('x.com')) {
      setIconType('twitter');
    } else if (lowers.includes('youtube.com') || lowers.includes('youtu.be')) {
      setIconType('youtube');
    } else if (lowers.includes('google.com') || lowers.includes('chrome')) {
      setIconType('chrome');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!title.trim()) newErrors.title = 'Title is required';
    if (!url.trim()) {
      newErrors.url = 'URL is required';
    } else {
      try {
        // Try to construct to validate format somewhat, or verify double slash
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
          // auto fix!
          setUrl('https://' + url);
        }
      } catch (err) {
        newErrors.url = 'Invalid URL format';
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Process tags
    const processedTags = tagsInput
      .split(',')
      .map(t => t.trim().toUpperCase())
      .filter(t => t.length > 0);

    const blockUrl = url.startsWith('http://') || url.startsWith('https://') ? url : 'https://' + url;

    await onSave({
      id: editingBookmark?.id,
      title: title.trim(),
      url: blockUrl,
      description: description.trim(),
      tags: processedTags.length > 0 ? processedTags : ['GENERAL'],
      iconType,
      isPrivate
    });

    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          {/* Translucent overlay backdrop */}
          <motion.div
            id="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-[#020202]/85 backdrop-blur-[12px]"
          />

          {/* Modal layout panel */}
          <motion.div
            id="modal-pane"
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', duration: 0.4 }}
            className="w-full max-w-lg bg-[#0A0A0A] border border-white/10 rounded-2xl overflow-hidden relative shadow-[0_12px_40px_rgba(0,0,0,0.8)] z-10"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/5">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 bg-white rounded-sm rotate-45" />
                <h2 className="text-[10px] font-mono tracking-widest uppercase text-white/60 font-semibold">
                  {editingBookmark ? 'Edit Bookmark Specification' : 'Secure Vault Index Entry'}
                </h2>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-colors"
                id="close-modal-btn"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">
              {/* URL */}
              <div className="flex flex-col gap-2">
                <label className="text-[9px] font-mono tracking-widest text-white/40 uppercase flex items-center gap-1.5 font-semibold">
                  Web Resource URL
                </label>
                <input
                  type="text"
                  value={url}
                  onChange={(e) => handleUrlChange(e.target.value)}
                  placeholder="https://github.com/example/repo"
                  className={`w-full h-10 px-3.5 bg-white/5 border ${
                    errors.url ? 'border-rose-500/50 focus:border-rose-500' : 'border-white/10 hover:border-white/15 focus:border-white/30'
                  } rounded-lg text-white text-xs font-mono outline-none transition-all placeholder-white/20`}
                  autoFocus
                />
                {errors.url && <p className="text-[10px] text-rose-400 font-mono">{errors.url}</p>}
              </div>

              {/* Title */}
              <div className="flex flex-col gap-2">
                <label className="text-[9px] font-mono tracking-widest text-white/40 uppercase font-semibold">
                  Entry Header / Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="E.g., Zenith Workspace Hub"
                  className={`w-full h-10 px-3.5 bg-white/5 border ${
                    errors.title ? 'border-rose-500/50 focus:border-rose-500' : 'border-white/10 hover:border-white/15 focus:border-white/30'
                  } rounded-lg text-white text-xs outline-none transition-all placeholder-white/20 font-sans`}
                />
                {errors.title && <p className="text-[10px] text-rose-400 font-mono">{errors.title}</p>}
              </div>

              {/* Description */}
              <div className="flex flex-col gap-2">
                <label className="text-[9px] font-mono tracking-widest text-white/40 uppercase font-semibold">
                  Brief Abstract / Snippet
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Summarize product spec file or main vault records outline..."
                  rows={3}
                  className="w-full p-3.5 bg-white/5 border border-white/10 hover:border-white/15 focus:border-white/30 rounded-lg text-white text-xs outline-none transition-all resize-none leading-relaxed placeholder-white/20 font-sans"
                />
              </div>

              {/* Brand and Tags Split */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Brand Selector */}
                <div className="flex flex-col gap-2">
                  <label className="text-[9px] font-mono tracking-widest text-white/40 uppercase font-semibold">
                    Brand Descriptor / Icon
                  </label>
                  <select
                    value={iconType}
                    onChange={(e) => setIconType(e.target.value as Bookmark['iconType'])}
                    className="w-full h-10 px-3.5 bg-[#0C0C0C] border border-white/10 hover:border-white/15 focus:border-white/30 rounded-lg text-white text-xs outline-none font-mono transition-all cursor-pointer select-element"
                  >
                    {BRAND_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value} className="bg-[#0c0c0c] text-white">
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Comma Tags */}
                <div className="flex flex-col gap-2">
                  <label className="text-[9px] font-mono tracking-widest text-white/40 uppercase font-semibold">
                    Pill Tags (Comma Separated)
                  </label>
                  <input
                    type="text"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    placeholder="DESIGN, REFERENCE, DEV"
                    className="w-full h-10 px-3.5 bg-white/5 border border-white/10 hover:border-white/15 focus:border-white/30 rounded-lg text-white text-xs font-mono outline-none transition-all placeholder-white/20"
                  />
                </div>
              </div>

              {/* Secure Lock Mode Toggle Option */}
              <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl mt-1 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center">
                    <Lock className={`w-4 h-4 ${isPrivate ? 'text-white' : 'text-white/20'}`} />
                  </div>
                  <div>
                    <h4 className="text-xs text-white font-medium">Vault Protection Mode</h4>
                    <p className="text-[10px] text-white/30 mt-0.5 font-sans leading-tight">
                      Enforce extra visual blur when main Protection Mode is active.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsPrivate(!isPrivate)}
                  className={`w-10 h-5 rounded-full p-0.5 relative transition-colors border border-white/10 ${
                    isPrivate ? 'bg-white/20' : 'bg-white/5'
                  }`}
                >
                  <div
                    className={`w-3.5 h-3.5 bg-white rounded-full transition-transform duration-300 ${
                      isPrivate ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-white/5 mt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 h-10 bg-transparent text-white/40 hover:text-white rounded-lg text-xs font-mono uppercase tracking-widest transition-colors font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 h-10 bg-white hover:bg-white/80 text-black font-semibold rounded-lg text-xs font-mono uppercase tracking-widest shadow-xl transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  Save Entry
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
