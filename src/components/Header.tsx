import { useEffect, useRef, useState } from 'react';
import { Search, SlidersHorizontal, Grid, List, Lock, Unlock, Sparkles, X, Filter } from 'lucide-react';
import { AuthMode } from '../auth';

interface HeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedTag: string | null;
  setSelectedTag: (tag: string | null) => void;
  allTags: string[];
  viewMode: 'grid' | 'list';
  setViewMode: (mode: 'grid' | 'list') => void;
  isPrivateObscured: boolean;
  setIsPrivateObscured: (obscured: boolean) => void;
  isAuthenticated: boolean;
  onAuthRequest: (mode: AuthMode) => void;
}

export default function Header({
  searchQuery,
  setSearchQuery,
  selectedTag,
  setSelectedTag,
  allTags,
  viewMode,
  setViewMode,
  isPrivateObscured,
  setIsPrivateObscured,
  isAuthenticated,
  onAuthRequest
}: HeaderProps) {
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);

  // Key listener for Focus Shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Listen for command+f or ctrl+f or / (when not in input)
      if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      } else if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <header 
      id="app-header"
      className="h-20 bg-[#0A0A0A]/50 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-10 shrink-0 z-20 sticky top-0"
    >
      {/* Search Input Container */}
      <div className="flex items-center gap-4 flex-1 max-w-xl">
        <div id="search-input-wrapper" className="relative w-[420px] max-w-full flex items-center gap-3 bg-white/5 border border-white/10 px-4 py-2 rounded-lg group transition-all duration-300 hover:border-white/20 focus-within:border-white/30">
          <Search className="w-4 h-4 text-white/30 group-focus-within:text-white/60 transition-colors duration-200 stroke-[1.8]" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search references..."
            className="bg-transparent border-none outline-none text-sm w-full placeholder-white/20 text-white font-sans"
          />
          {/* ⌘ F Shortcut Indicator */}
          <div className="flex items-center gap-0.5 shrink-0">
            {searchQuery ? (
              <button 
                onClick={() => setSearchQuery('')}
                className="text-white/30 hover:text-white p-0.5 rounded transition-colors"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : (
              <span className="hidden sm:flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-white/10 text-[10px] text-white/40 font-mono select-none">
                ⌘F
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Header Utilities */}
      <div className="flex items-center gap-6">
        {/* Actions Dropdowns & Views */}
        <div className="flex items-center gap-4">
          
          {/* Tag Filter Dropdown Button */}
          <div className="relative">
            <button
              id="tag-filter-btn"
              onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
              className={`h-9 px-3.5 bg-white/5 border border-white/10 hover:border-white/20 text-white/60 hover:text-white rounded-lg text-xs flex items-center gap-2 transition-all duration-200 ${
                selectedTag ? 'border-white/30 text-white bg-white/10' : ''
              }`}
            >
              <Filter className="w-3.5 h-3.5 stroke-[1.5]" />
              <span className="font-mono uppercase tracking-wider text-[10px]">
                {selectedTag ? `TAG: ${selectedTag}` : 'Filter'}
              </span>
            </button>

            {/* Tag Dropdown Shell */}
            {isFilterDropdownOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setIsFilterDropdownOpen(false)} />
                <div 
                  className="absolute right-0 mt-2 w-56 bg-[#0c0c0c] border border-white/10 rounded-lg shadow-2xl p-2 z-40 max-h-80 overflow-y-auto animate-in fade-in slide-in-from-top-1 duration-200"
                >
                  <div className="px-2 py-1 text-[10px] font-mono text-white/30 uppercase tracking-widest border-b border-white/5 mb-1">
                    Categories & Tags
                  </div>
                  <button
                    onClick={() => {
                      setSelectedTag(null);
                      setIsFilterDropdownOpen(false);
                    }}
                    className={`w-full text-left px-2 py-1.5 rounded text-xs font-mono uppercase flex items-center justify-between transition-colors ${
                      selectedTag === null ? 'bg-white/15 text-white' : 'text-white/40 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <span>All Bookmarks</span>
                    {selectedTag === null && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </button>
                  {allTags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => {
                        setSelectedTag(tag);
                        setIsFilterDropdownOpen(false);
                      }}
                      className={`w-full text-left px-2 py-1.5 rounded text-xs font-mono uppercase flex items-center justify-between transition-colors ${
                        selectedTag === tag ? 'bg-white/15 text-white' : 'text-white/40 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <span>{tag}</span>
                      {selectedTag === tag && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* View Mode Split Toggle */}
          <div className="flex border border-white/5 bg-white/5 rounded-lg p-0.5" id="view-mode-toggle">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'grid'
                  ? 'bg-white/10 text-white'
                  : 'text-white/30 hover:text-white/70'
              }`}
              title="Grid Layout"
            >
              <Grid className="w-4 h-4 stroke-[1.5]" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'list'
                  ? 'bg-white/10 text-white'
                  : 'text-white/30 hover:text-white/70'
              }`}
              title="List Layout"
            >
              <List className="w-4 h-4 stroke-[1.5]" />
            </button>
          </div>
        </div>

        {/* Vertical divider */}
        <div className="w-[1px] h-4 bg-white/10" />

        {/* Haptic Vault Protection Toggle - Geometric Balance Design */}
        <div className="flex items-center gap-3">
          <span className="text-[10px] uppercase tracking-widest text-white/30 select-none">
            Private Vault
          </span>
          <button
            onClick={() => {
              if (!isAuthenticated) {
                onAuthRequest('login');
                return;
              }

              setIsPrivateObscured(!isPrivateObscured);
            }}
            className={`w-10 h-5 rounded-full relative border border-white/10 transition-colors ${
              isAuthenticated ? 'bg-white/10 hover:bg-white/15' : 'bg-white/5 hover:bg-white/10'
            }`}
            title={
              !isAuthenticated
                ? 'Login to unlock private vault mode'
                : isPrivateObscured
                  ? 'Reveal private items (vault unlock)'
                  : 'Obscure private items (vault lock)'
            }
          >
            <div 
              className={`absolute top-1 w-2.5 h-2.5 bg-white rounded-full transition-all duration-300 shadow-[0_0_8px_rgba(255,255,255,0.6)] ${
                isAuthenticated
                  ? isPrivateObscured
                    ? 'right-1.5'
                    : 'left-1.5 bg-white/40 shadow-none'
                  : 'right-1.5 bg-white/35 shadow-none'
              }`}
            />
          </button>
        </div>
      </div>
    </header>
  );
}
