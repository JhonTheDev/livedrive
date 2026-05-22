import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Trash2, 
  Sparkles, 
  RotateCcw, 
  User, 
  Calendar, 
  ShieldAlert, 
  Bookmark, 
  Tag, 
  LayoutGrid, 
  Database, 
  Sliders,
  CheckCircle,
  X
} from 'lucide-react';

import Sidebar from './components/Sidebar';
import Header from './components/Header';
import BookmarkCard from './components/BookmarkCard';
import AddBookmarkModal from './components/AddBookmarkModal';
import AuthModal from './components/AuthModal';

import { loadBookmarks, saveBookmark, deleteBookmark, replaceCachedBookmarks, INITIAL_BOOKMARKS } from './data';
import { Bookmark as BookmarkType, SidebarTab } from './types';
import { AuthMode, AuthSession, clearAuthSession, loadAuthSession, saveAuthSession } from './auth';

export default function App() {
  const [bookmarks, setBookmarks] = useState<BookmarkType[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<SidebarTab>('home');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isPrivateObscured, setIsPrivateObscured] = useState(true);
  const [authSession, setAuthSession] = useState<AuthSession | null>(() => loadAuthSession());
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>('login');

  // Modal Control
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBookmark, setEditingBookmark] = useState<BookmarkType | null>(null);

  // Toast HUD Alert System
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'alert' } | null>(null);

  const showToast = (message: string, type: 'success' | 'alert' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const openAuthModal = (mode: AuthMode = 'login') => {
    setAuthMode(mode);
    setAuthModalOpen(true);
  };

  const handleAuthenticated = (session: AuthSession) => {
    setAuthSession(session);
    setIsPrivateObscured(true);
    setActiveTab('home');
    setSelectedTag(null);
    showToast(`Welcome, ${session.user.displayName}.`);
  };

  const handleLoggedOut = () => {
    clearAuthSession();
    setAuthSession(null);
    setIsPrivateObscured(true);
    setActiveTab('home');
    setSelectedTag(null);
    showToast('You are now signed out.', 'alert');
  };

  // Hydrate bookmarks on mount
  useEffect(() => {
    void loadBookmarks().then(setBookmarks);
  }, []);

  useEffect(() => {
    saveAuthSession(authSession);
  }, [authSession]);

  // Get index of all available tags
  const isAuthenticated = Boolean(authSession);
  const currentUser = authSession?.user ?? null;
  const visibleBookmarks = isAuthenticated ? bookmarks : bookmarks.filter((bookmark) => !bookmark.isPrivate);
  const allTags = Array.from(new Set(visibleBookmarks.flatMap((b) => b.tags)) as Set<string>).sort();

  // Handle add / edit save
  const handleSaveBookmark = async (data: Omit<BookmarkType, 'id' | 'createdAt'> & { id?: string }) => {
    const savedBookmark = await saveBookmark(data);

    setBookmarks((current) => {
      if (data.id) {
        return current.map((bookmark) => (bookmark.id === savedBookmark.id ? savedBookmark : bookmark));
      }

      return [savedBookmark, ...current.filter((bookmark) => bookmark.id !== savedBookmark.id)];
    });

    showToast(data.id ? 'Spec entry successfully edited.' : 'New entry secured to index storage.');
  };

  // Handle delete
  const handleDeleteBookmark = async (id: string) => {
    await deleteBookmark(id);
    setBookmarks((current) => current.filter((bookmark) => bookmark.id !== id));
    showToast('Entry removed from repository.', 'alert');
  };

  // Handle trigger edit
  const handleEditTrigger = (bookmark: BookmarkType) => {
    setEditingBookmark(bookmark);
    setIsModalOpen(true);
  };

  // Reset to default sample seeds
  const handleRestoreDefaults = () => {
    if (confirm('Restore the default seed specifications? This will override your current collection.')) {
      setBookmarks(INITIAL_BOOKMARKS);
      replaceCachedBookmarks(INITIAL_BOOKMARKS);
      setSelectedTag(null);
      setSearchQuery('');
      showToast('Default spec indices re-seeded.');
    }
  };

  // Wipe storage
  const handleWipeStorage = () => {
    if (confirm('Are you absolutely sure you want to purge all indices from local storage?')) {
      setBookmarks([]);
      replaceCachedBookmarks([]);
      setSelectedTag(null);
      setSearchQuery('');
      showToast('Storage indices thoroughly purged.', 'alert');
    }
  };

  // Compute final filtered bookmarks depending on search and active context tab
  const getFilteredBookmarks = () => {
    return visibleBookmarks.filter((b) => {
      // Tab filter
      if (activeTab === 'vault' && !b.isPrivate) return false;
      
      // Tag filter
      if (selectedTag && !b.tags.includes(selectedTag)) return false;

      // Search text contains title, url, description, tags
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = b.title.toLowerCase().includes(query);
        const matchesDesc = b.description.toLowerCase().includes(query);
        const matchesUrl = b.url.toLowerCase().includes(query);
        const matchesTags = b.tags.some((t) => t.toLowerCase().includes(query));
        return matchesTitle || matchesDesc || matchesUrl || matchesTags;
      }

      return true;
    });
  };

  const filteredBookmarks = getFilteredBookmarks();
  const privateCount = isAuthenticated ? bookmarks.filter((b) => b.isPrivate).length : 0;

  return (
    <div id="app-root-stage" className="flex h-screen bg-[#050505] text-[#e4e4e7] overflow-hidden font-sans antialiased selection:bg-indigo-500/30 selection:text-white">
      
      {/* 1. Left Navigation Sidebar */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={(tab) => {
          if (tab === 'vault' && !isAuthenticated) {
            openAuthModal('login');
            return;
          }

          setActiveTab(tab);
          setSelectedTag(null); // Clear tag selection when changing roots
        }}
        privateCount={privateCount}
        isAuthenticated={isAuthenticated}
        currentSession={authSession}
        onAuthRequest={openAuthModal}
      />

      {/* Main Grid Viewport Wrapper */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        
        {/* 2. Top Fluid Header with search & safety toggles */}
        <Header 
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedTag={selectedTag}
          setSelectedTag={setSelectedTag}
          allTags={allTags}
          viewMode={viewMode}
          setViewMode={setViewMode}
          isPrivateObscured={isPrivateObscured}
          setIsPrivateObscured={setIsPrivateObscured}
          isAuthenticated={isAuthenticated}
          onAuthRequest={openAuthModal}
        />

        {/* 3. Main Dashboard Board Stage */}
        <main className="flex-1 overflow-y-auto px-10 py-8 relative">
          
          <AnimatePresence mode="wait">
            
            {/* TAB CONTENT: HOME or VAULT */}
            {(activeTab === 'home' || activeTab === 'vault') && (
              <motion.div
                key={`${activeTab}-${selectedTag}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col gap-6"
              >
                {/* Heading context panel */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-5">
                  <div>
                    <div className="flex items-center gap-2 text-white/30 text-[10px] font-mono uppercase tracking-widest leading-none">
                      <span>Index Registry</span>
                      <span>/</span>
                      <span className="text-white/60">
                        {activeTab === 'home' ? 'Global Collection' : isAuthenticated ? 'Private Secure Vault' : 'Locked Vault'}
                      </span>
                    </div>
                    
                    <h2 className="text-lg font-sans tracking-tight font-semibold text-white mt-2.5 flex items-center gap-3">
                      <span>{activeTab === 'home' ? 'Stored Bookmarks' : isAuthenticated ? 'Secured Micro Vault' : 'Vault Locked'}</span>
                      {selectedTag && (
                        <span className="text-[10px] font-mono tracking-widest text-white/80 font-normal uppercase bg-white/10 px-2.5 py-0.5 border border-white/10 rounded">
                          TAG: {selectedTag}
                        </span>
                      )}
                    </h2>
                  </div>

                  {/* Micro stats label */}
                  <div className="flex items-center gap-4 text-[10px] font-mono text-white/30 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
                    <div>
                      RESULTS: <span className="text-white font-medium">{filteredBookmarks.length}</span>
                    </div>
                    <div className="w-[1px] h-3 bg-white/10" />
                    <div>
                      TOTAL INDEX: <span className="text-white font-medium">{bookmarks.length}</span>
                    </div>
                  </div>
                </div>

                {/* Grid or List list representation */}
                {activeTab === 'vault' && !isAuthenticated ? (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-white/10 bg-white/[0.03] px-6 py-16 text-center"
                  >
                    <div className="flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/70 shadow-[0_0_30px_rgba(255,255,255,0.04)]">
                      <ShieldAlert className="h-7 w-7 stroke-[1.6]" />
                    </div>
                    <div className="max-w-md space-y-2">
                      <h3 className="text-base font-semibold tracking-tight text-white">Private vault is locked</h3>
                      <p className="text-sm leading-6 text-white/45">
                        Sign in from the user icon in the sidebar to reveal private bookmarks and enable the vault frost mode.
                      </p>
                    </div>
                    <button
                      onClick={() => openAuthModal('login')}
                      className="rounded-2xl bg-white px-5 py-3 text-sm font-medium text-black transition-transform hover:scale-[1.02]"
                    >
                      Sign in now
                    </button>
                  </motion.div>
                ) : filteredBookmarks.length > 0 ? (
                  <div className={viewMode === 'grid' 
                    ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6" 
                    : "flex flex-col gap-3"
                  }>
                    {filteredBookmarks.map((bookmark) => (
                      <BookmarkCard 
                        key={bookmark.id}
                        bookmark={bookmark}
                        isPrivateObscured={isPrivateObscured}
                        isAuthenticated={isAuthenticated}
                        onDelete={handleDeleteBookmark}
                        onEdit={handleEditTrigger}
                        onTagClick={(tag) => setSelectedTag(tag)}
                        viewMode={viewMode}
                      />
                    ))}
                  </div>
                ) : (
                  /* Empty states container */
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center justify-center p-16 rounded-xl border border-dashed border-[#222] bg-[#0a0a0a]/20 text-center"
                  >
                    <div className="w-14 h-14 rounded-full bg-[#121212] border border-white/5 flex items-center justify-center text-zinc-500 mb-4 shadow-[0_0_15px_rgba(255,255,255,0.01)]">
                      <Bookmark className="w-6 h-6 text-zinc-600 stroke-[1.5]" />
                    </div>
                    <h3 className="text-white font-sans text-[15px] font-semibold tracking-tight">
                      No indexes found matching parameters
                    </h3>
                    <p className="text-zinc-500 text-xs mt-1.5 max-w-sm leading-relaxed">
                      {searchQuery 
                        ? `We could not find anything matching "${searchQuery}". Try refining terms or reset active filtering.` 
                        : 'Your secure micro-vault index is currently empty. Initialize a new spec card using the right Floating Action Button.'}
                    </p>
                    
                    {(searchQuery || selectedTag) && (
                      <button
                        onClick={() => {
                          setSearchQuery('');
                          setSelectedTag(null);
                        }}
                        className="mt-4 px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg text-xs font-mono uppercase tracking-wider transition-all border border-white/10"
                      >
                        Clear Filters
                      </button>
                    )}
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* TAB CONTENT: COLLECTIONS */}
            {activeTab === 'collections' && (
              <motion.div
                key="collections"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-col gap-6"
              >
                <div className="border-b border-white/5 pb-5">
                  <span className="text-white/30 text-[10px] font-mono uppercase tracking-widest leading-none">
                    Taxonomy Records
                  </span>
                  <h2 className="text-lg font-sans tracking-tight font-semibold text-white mt-2.5">
                    Visual Collections & Tags
                  </h2>
                </div>

                {allTags.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Left Pane - Tag Listing */}
                    <div className="md:col-span-1 flex flex-col gap-2.5">
                      <span className="text-[9px] font-mono tracking-widest text-white/30 uppercase font-semibold">
                        TAG INDEX SPEC
                      </span>
                      {allTags.map((tag) => {
                        const count = visibleBookmarks.filter((b) => b.tags.includes(tag)).length;
                        const isSelected = selectedTag === tag;
                        return (
                          <button
                            key={tag}
                            onClick={() => setSelectedTag(isSelected ? null : tag)}
                            className={`w-full text-left p-3.5 rounded-xl border flex items-center justify-between transition-all font-mono text-xs ${
                              isSelected
                                ? 'bg-white/10 border-white/20 text-white shadow-lg'
                                : 'bg-white/[0.02] border-white/5 text-white/55 hover:text-white hover:bg-white/5'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <Tag className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-white/20'}`} />
                              <span className="uppercase tracking-widest text-[11px] font-medium">{tag}</span>
                            </div>
                            <span className="bg-white/5 px-2 py-0.5 rounded text-[9px] text-white/40 font-mono">
                              {count}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Right Pane - Active Filter Results */}
                    <div className="md:col-span-2 flex flex-col gap-4">
                      {selectedTag ? (
                        <>
                          <div className="flex items-center justify-between pb-1.5 border-b border-white/5">
                            <span className="text-[9px] font-mono tracking-widest text-white/30 uppercase">
                              Active Filter: <span className="text-white">{selectedTag}</span>
                            </span>
                            <button 
                              onClick={() => setSelectedTag(null)}
                              className="text-white/40 hover:text-white text-[9px] font-mono uppercase tracking-widest"
                            >
                              Show All
                            </button>
                          </div>
                          
                          <div className="flex flex-col gap-3">
                            {visibleBookmarks
                              .filter((b) => b.tags.includes(selectedTag))
                              .map((bookmark) => (
                                <BookmarkCard 
                                  key={bookmark.id}
                                  bookmark={bookmark}
                                  isPrivateObscured={isPrivateObscured}
                                  isAuthenticated={isAuthenticated}
                                  onDelete={handleDeleteBookmark}
                                  onEdit={handleEditTrigger}
                                  onTagClick={(tag) => setSelectedTag(tag)}
                                  viewMode="list"
                                />
                              ))
                            }
                          </div>
                        </>
                      ) : (
                        <div className="h-48 rounded-xl border border-dashed border-white/10 text-center flex flex-col items-center justify-center p-6 text-white/30 bg-white/[0.01]">
                          <Sliders className="w-5 h-5 text-white/15 stroke-[1.5] mb-2" />
                          <h4 className="text-white/60 text-xs font-semibold">No active selection</h4>
                          <p className="text-[10px] text-white/30 mt-1 max-w-[240px] font-sans">
                            Choose a taxonomy spec folder on the left to review nested bookmark files.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-white/30 py-12 text-xs font-mono">
                    No active tags recorded in storage index. Add cards containing tags.
                  </div>
                )}
              </motion.div>
            )}

            {/* TAB CONTENT: SETTINGS */}
            {activeTab === 'settings' && (
              <motion.div
                key="settings"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="max-w-3xl flex flex-col gap-8"
              >
                <div className="border-b border-white/5 pb-5">
                  <span className="text-white/30 text-[10px] font-mono uppercase tracking-widest leading-none">
                    Security & Maintenance
                  </span>
                  <h2 className="text-lg font-sans tracking-tight font-semibold text-white mt-2.5">
                    Vault Configuration Control
                  </h2>
                </div>

                {/* Dashboard Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6 flex flex-col gap-1">
                    <span className="text-[9px] font-mono text-white/40 uppercase tracking-widest font-semibold">Total Bookmarks</span>
                    <span className="text-3xl font-sans text-white font-medium tracking-tight mt-1">{bookmarks.length}</span>
                  </div>
                  <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6 flex flex-col gap-1">
                    <span className="text-[9px] font-mono text-white/40 uppercase tracking-widest font-semibold">Vault Ratio</span>
                    <span className="text-3xl font-sans text-white font-medium tracking-tight mt-1">
                      {visibleBookmarks.length > 0 
                        ? Math.round((visibleBookmarks.filter(b => b.isPrivate).length / visibleBookmarks.length) * 100) 
                        : 0}%
                    </span>
                  </div>
                  <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6 flex flex-col gap-1">
                    <span className="text-[9px] font-mono text-white/40 uppercase tracking-widest font-semibold">Active Tags</span>
                    <span className="text-3xl font-sans text-white font-medium tracking-tight mt-1">{allTags.length}</span>
                  </div>
                </div>

                {/* Authorized Officer Profile */}
                <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6 flex flex-col gap-5">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-full flex items-center justify-center shadow-lg text-white/60">
                      <User className="w-5 h-5 stroke-[1.5]" />
                    </div>
                    <div>
                      <h3 className="text-sm font-sans font-semibold text-white">{currentUser ? currentUser.displayName : 'Guest Session'}</h3>
                      <p className="text-xs text-white/40 font-mono mt-0.5">{currentUser ? currentUser.email : 'Login required to reveal private vault data.'}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-white/5 pt-4 text-[10px] font-mono text-white/30">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-white/15" />
                      <span>{currentUser ? 'SESSION STATUS: ACTIVE' : 'SESSION STATUS: LOGGED OUT'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Database className="w-4 h-4 text-white/15" />
                      <span>{currentUser ? 'PERSISTENCE: LOCAL_SESSION' : 'PERSISTENCE: LOCKED_VIEW'}</span>
                    </div>
                  </div>
                </div>

                {/* Operations */}
                <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6 flex flex-col gap-4">
                  <h3 className="text-[10px] font-mono tracking-widest uppercase text-white/70 font-bold">
                    System Commands
                  </h3>
                  <p className="text-xs text-white/40 -mt-1 leading-relaxed">
                    Perform system operations directly on your sandboxed local environment data. Backup or restore records.
                  </p>

                  <div className="flex flex-wrap gap-3 mt-2">
                    <button
                      onClick={handleRestoreDefaults}
                      className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-lg text-xs font-mono uppercase tracking-widest border border-white/10 transition-colors cursor-pointer"
                    >
                      Restore Sample Seeds
                    </button>

                    <button
                      onClick={handleWipeStorage}
                      className="px-4 py-2.5 bg-white/5 hover:bg-white/10 hover:border-rose-500/35 text-rose-400 border border-white/10 rounded-lg text-xs font-mono uppercase tracking-widest transition-colors cursor-pointer"
                    >
                      Purge Local Repository INDEX
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>

          {/* Floating Action Button (FAB) (Specified Placement) */}
          <button
            id="fab-add-bookmark"
            onClick={() => {
              setEditingBookmark(null);
              setIsModalOpen(true);
            }}
            className="fixed bottom-[40px] right-[40px] w-14 h-14 bg-white text-black hover:bg-white/90 active:scale-95 rounded-2xl flex items-center justify-center transition-all duration-300 z-40 cursor-pointer shadow-[0_8px_30px_rgba(255,255,255,0.15)] scale-100 hover:scale-105"
            title="Create New Bookmark Specification"
          >
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </button>

        </main>
      </div>

      {/* 4. Add/Edit Dialog modal container */}
      <AddBookmarkModal 
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingBookmark(null);
        }}
        onSave={handleSaveBookmark}
        editingBookmark={editingBookmark}
      />

      <AuthModal
        isOpen={authModalOpen}
        mode={authMode}
        onClose={() => setAuthModalOpen(false)}
        onModeChange={setAuthMode}
        onAuthenticated={handleAuthenticated}
        onLoggedOut={handleLoggedOut}
        currentSession={authSession}
      />

      {/* 5. Elegant Alert notification banner HUD */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 20, x: '-50%' }}
            className={`fixed bottom-8 left-1/2 -translate-x-1/2 px-5 py-3 rounded-xl border flex items-center gap-3 z-50 text-xs font-mono uppercase tracking-widest shadow-2xl ${
              toast.type === 'success' 
                ? 'bg-[#0a0a0a]/90 text-indigo-400 border-indigo-500/30 shadow-[0_0_25px_rgba(99,102,241,0.15)]' 
                : 'bg-[#0a0a0a]/90 text-amber-500 border-amber-500/25 shadow-[0_0_25px_rgba(245,158,11,0.15)]'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle className="w-4 h-4 text-indigo-400 animate-pulse" />
            ) : (
              <ShieldAlert className="w-4 h-4 text-amber-500 animate-pulse" />
            )}
            <span>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
