import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Github, 
  Dribbble, 
  Figma, 
  Twitter, 
  Youtube, 
  Laptop, 
  BookOpen, 
  Bookmark, 
  ExternalLink, 
  Lock, 
  Eye, 
  Trash2, 
  Edit3, 
  MoreVertical,
  X
} from 'lucide-react';
import { Bookmark as BookmarkType } from '../types';

interface BookmarkCardProps {
  bookmark: BookmarkType;
  isPrivateObscured: boolean;
  isAuthenticated: boolean;
  onDelete: (id: string) => void;
  onEdit: (bookmark: BookmarkType) => void;
  onTagClick: (tag: string) => void;
  viewMode: 'grid' | 'list';
}

export default function BookmarkCard({
  bookmark,
  isPrivateObscured,
  isAuthenticated,
  onDelete,
  onEdit,
  onTagClick,
  viewMode
}: BookmarkCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [showOptions, setShowOptions] = useState(false);

  // Get brand monochromatic icon
  const getBrandIcon = () => {
    const iconClass = "w-5 h-5 text-white/80 group-hover:text-white transition-colors stroke-[1.5]";
    switch (bookmark.iconType) {
      case 'github':
        return <Github className={iconClass} />;
      case 'dribbble':
        return <Dribbble className={iconClass} />;
      case 'figma':
        return <Figma className={iconClass} />;
      case 'twitter':
        return <Twitter className={iconClass} />;
      case 'youtube':
        return <Youtube className={iconClass} />;
      case 'notion':
        return <BookOpen className={iconClass} />; // elegant surrogate for Notion
      case 'chrome':
        return <Laptop className={iconClass} />;
      default:
        return <Bookmark className={iconClass} />;
    }
  };

  if (bookmark.isPrivate && !isAuthenticated) {
    return null;
  }

  const isObscured = bookmark.isPrivate && isPrivateObscured && isAuthenticated;

  // Render Grid Layout Card
  if (viewMode === 'grid') {
    return (
      <motion.div
        layout
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => {
          setIsHovered(false);
          setShowOptions(false);
        }}
        className={`relative rounded-2xl overflow-hidden group min-h-[210px] flex flex-col justify-between p-6 transition-all duration-300 border bg-white/[0.03] shadow-[0_4px_24px_rgba(0,0,0,0.5)] ${
          isHovered ? 'border-white/20' : 'border-white/10'
        }`}
        style={{
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
        }}
        animate={{
          scale: isHovered && !isObscured ? 1.02 : 1,
        }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
      >
        {/* Card Content Shell */}
        <div className={`flex flex-col gap-4 h-full justify-between flex-1 transition-all duration-[400ms] ${isObscured ? 'blur-md select-none pointer-events-none' : ''}`}>
          
          {/* Top Section: Brand Icon & Link Action */}
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center group-hover:bg-white/15 transition-all duration-300">
              {getBrandIcon()}
            </div>

            {/* Quick Actions Menu Trigger (Hidden in locked/private obscured mode) */}
            {!isObscured && (
              <div className="relative">
                <button
                  id={`card-menu-btn-${bookmark.id}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowOptions(!showOptions);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-white/10 text-white/40 hover:text-white transition-all duration-200"
                  aria-label="Bookmark Options"
                >
                  <MoreVertical className="w-4 h-4 stroke-[1.8]" />
                </button>

                {showOptions && (
                  <>
                    <div className="fixed inset-0 z-20" onClick={() => setShowOptions(false)} />
                    <div className="absolute right-0 mt-1 w-28 bg-[#121212] border border-white/10 rounded-lg shadow-xl py-1 z-30 animate-in fade-in zoom-in-95 duration-150">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit(bookmark);
                          setShowOptions(false);
                        }}
                        className="w-full text-left px-3 py-1.5 text-xs text-white/60 hover:bg-white/5 hover:text-white flex items-center gap-2"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        Edit
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm('Are you sure you want to delete this bookmark?')) {
                            onDelete(bookmark.id);
                          }
                          setShowOptions(false);
                        }}
                        className="w-full text-left px-3 py-1.5 text-xs text-rose-400 hover:bg-rose-950/20 hover:text-rose-300 flex items-center gap-2"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Text Info */}
          <div>
            <h3 className="font-sans font-semibold text-white tracking-tight text-sm leading-tight line-clamp-1">
              {bookmark.title}
            </h3>
            <p className="text-white/40 text-xs mt-1 leading-relaxed line-clamp-3">
              {bookmark.description}
            </p>
          </div>

          {/* Bottom Tags Row */}
          <div className="flex flex-wrap items-center gap-1.5 pt-2 mt-auto">
            {bookmark.tags.map((tag) => (
              <button
                key={tag}
                onClick={(e) => {
                  e.stopPropagation();
                  onTagClick(tag);
                }}
                className="text-[9px] font-medium bg-white/5 border border-white/5 px-2 py-0.5 rounded text-white/50 hover:bg-white/10 hover:text-white transition-colors cursor-pointer font-mono tracking-wider uppercase"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Private Vault Secure Frost Overlay - Geometric Balance Style */}
        <AnimatePresence>
          {isObscured && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-xl flex flex-col items-center justify-center z-10 select-none cursor-pointer transition-all duration-300"
            >
              <Lock className="w-6 h-6 text-white/40 mb-2 stroke-[1.8]" />
              <span className="text-[10px] tracking-widest text-white/30 uppercase font-mono">
                Private Item
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Real Outer Clickable Launcher Area (Invisible, overlays elements) */}
        {!isObscured && (
          <a
            href={bookmark.url}
            target="_blank"
            rel="noopener noreferrer"
            referrerPolicy="no-referrer"
            className="absolute inset-0 z-[1] cursor-pointer"
            title={`Launch ${bookmark.title}`}
            onClick={(e) => {
              if (showOptions || (e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('a') === null) {
                // stop navigation triggers
              }
            }}
          />
        )}
      </motion.div>
    );
  }

  // Render List Layout Card
  return (
    <motion.div
      layout
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setShowOptions(false);
      }}
      className={`relative rounded-xl overflow-hidden group flex items-center justify-between p-4 transition-all duration-300 border bg-white/[0.02] ${
        isHovered ? 'border-white/20' : 'border-white/10'
      }`}
      style={{
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
      animate={{
        scale: isHovered && !isObscured ? 1.01 : 1,
      }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
    >
      {/* Main content split */}
      <div className={`flex items-center gap-4 flex-1 transition-all duration-[400ms] ${isObscured ? 'blur shadow-inner select-none pointer-events-none' : ''}`}>
        
        {/* Monochromatic icon */}
        <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
          {getBrandIcon()}
        </div>

        {/* Text Area */}
        <div className="flex-1 min-w-0 pr-4">
          <div className="flex items-center gap-3">
            <h3 className="font-sans font-semibold text-white text-sm truncate tracking-tight group-hover:text-white transition-colors">
              {bookmark.title}
            </h3>
            {bookmark.isPrivate && isAuthenticated && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-white/5 border border-white/5 text-[9px] font-mono text-white/30 uppercase">
                Private
              </span>
            )}
          </div>
          <p className="text-white/40 text-xs mt-0.5 truncate max-w-xl">
            {bookmark.description}
          </p>
        </div>

        {/* Tags Row */}
        <div className="hidden sm:flex items-center gap-1.5">
          {bookmark.tags.map((tag) => (
            <button
              key={tag}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onTagClick(tag);
              }}
              className="bg-white/5 border border-white/5 text-white/50 hover:bg-white/10 hover:text-white px-2 py-0.5 rounded text-[9px] font-mono uppercase tracking-wider transition-colors"
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Right control panel (Not obscured) */}
      <div className="relative flex items-center gap-2 shrink-0 z-10 ml-4">
        {isObscured ? (
          <div className="flex items-center gap-2 bg-white/5 border border-white/5 py-1 px-3 rounded-lg text-[10px] font-mono text-white/30 uppercase">
            <Lock className="w-3 h-3 text-white/35" />
            <span>Vault Locked</span>
          </div>
        ) : (
          <>
            <a 
              href={bookmark.url}
              target="_blank"
              rel="noopener noreferrer"
              referrerPolicy="no-referrer"
              className="p-1.5 rounded-md hover:bg-white/10 text-white/40 hover:text-white transition-colors"
              title="Launch Application"
            >
              <ExternalLink className="w-4 h-4 stroke-[1.8]" />
            </a>

            <button
              id={`list-menu-btn-${bookmark.id}`}
              onClick={(e) => {
                e.stopPropagation();
                setShowOptions(!showOptions);
              }}
              className="p-1.5 rounded-md hover:bg-white/10 text-white/40 hover:text-white transition-colors"
            >
              <MoreVertical className="w-4 h-4 stroke-[1.8]" />
            </button>

            {showOptions && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setShowOptions(false)} />
                <div className="absolute right-0 top-full mt-1 w-28 bg-[#121212] border border-white/10 rounded-lg shadow-xl py-1 z-30">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(bookmark);
                      setShowOptions(false);
                    }}
                    className="w-full text-left px-3 py-1.5 text-xs text-white/60 hover:bg-white/5 hover:text-white flex items-center gap-2"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    Edit
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm('Are you sure you want to delete this bookmark?')) {
                        onDelete(bookmark.id);
                      }
                      setShowOptions(false);
                    }}
                    className="w-full text-left px-3 py-1.5 text-xs text-rose-400 hover:bg-rose-950/20 hover:text-rose-300 flex items-center gap-2"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete
                  </button>
                </div>
              </>
            )}
          </>
        )}
      </div>

      {/* Private Vault Locked Hover Over layer for list */}
      {isObscured && (
        <div 
          className="absolute inset-0 bg-black/60 backdrop-blur-xl flex items-center justify-center transition-all duration-300 z-1"
        >
          <div className="flex items-center gap-3">
            <Lock className="w-3.5 h-3.5 text-white/40" />
            <span className="text-[10px] font-mono tracking-widest text-white/30 uppercase">
              Private Item
            </span>
          </div>
        </div>
      )}
    </motion.div>
  );
}
