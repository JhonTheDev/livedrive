import { Bookmark } from './types';

export const INITIAL_BOOKMARKS: Bookmark[] = [
  {
    id: '1',
    title: 'Vercel / Turborepo',
    url: 'https://github.com/vercel/turborepo',
    description: 'High-performance monorepo build system for TypeScript, optimized for fast remote caching and module structures.',
    tags: ['DEV', 'BUILD'],
    iconType: 'github',
    isPrivate: false,
    createdAt: '2026-05-18T10:00:00Z'
  },
  {
    id: '2',
    title: 'Retro-Futurism Interface',
    url: 'https://dribbble.com/shots/futurism',
    description: 'Aesthetic UI dashboard reference featuring neon-infused dark glassmorphic components and strict alignment.',
    tags: ['INSPIRATION', 'DESIGN'],
    iconType: 'dribbble',
    isPrivate: false,
    createdAt: '2026-05-19T14:30:00Z'
  },
  {
    id: '3',
    title: 'Figma Design System Tokens',
    url: 'https://figma.com/file/system-tokens',
    description: 'Global stylesheet, theme parameters, and micro-spacing tokens for core Zenith modular component library.',
    tags: ['DESIGN', 'SYSTEM'],
    iconType: 'figma',
    isPrivate: false,
    createdAt: '2026-05-20T08:15:00Z'
  },
  {
    id: '4',
    title: 'Zenith Product Roadmap Q4',
    url: 'https://notion.so/zenith/roadmap-q4',
    description: 'Confidential strategic outlines, client deliverables, and feature specs for the upcoming secure vaults rewrite.',
    tags: ['STRATEGY', 'INTERNAL', 'VAULT'],
    iconType: 'notion',
    isPrivate: true,
    createdAt: '2026-05-21T09:00:00Z'
  },
  {
    id: '5',
    title: 'Google Fonts: Space Grotesk',
    url: 'https://fonts.google.com/specimen/Space+Grotesk',
    description: 'Proportional geometric sans-serif typeface with clean geometric tracking and modern editorial features.',
    tags: ['FONTS', 'ASSETS'],
    iconType: 'chrome',
    isPrivate: false,
    createdAt: '2026-05-17T11:45:00Z'
  },
  {
    id: '6',
    title: 'Motion Micro-Interaction Details',
    url: 'https://twitter.com/motion_design/status/98472',
    description: 'Handy animations thread detailing spring physics constants, layout gestures, and duration presets.',
    tags: ['MOTION', 'REFERENCE'],
    iconType: 'twitter',
    isPrivate: true,
    createdAt: '2026-05-15T16:20:00Z'
  },
  {
    id: '7',
    title: 'Tailwind CSS v4 Configuration',
    url: 'https://youtube.com/watch?v=tailwind-v4',
    description: 'Thorough guide to custom @theme imports, cascading utility extensions, and zero-runtime-cost benefits.',
    tags: ['REFERENCE', 'TECH'],
    iconType: 'youtube',
    isPrivate: false,
    createdAt: '2026-05-16T13:10:00Z'
  },
  {
    id: '8',
    title: 'Linear Native App Architecture',
    url: 'https://linear.app',
    description: 'Performance parameters, high-speed sync, and state hydration strategies used in Linear workspace desktop app.',
    tags: ['PRODUCTIVITY', 'ENGINEERING'],
    iconType: 'generic',
    isPrivate: false,
    createdAt: '2026-05-14T10:05:00Z'
  }
];

const STORAGE_KEY = 'bookmark_vault_bookmarks';
const API_BASE = '';

const readCachedBookmarks = (): Bookmark[] => {
  if (typeof window === 'undefined') {
    return INITIAL_BOOKMARKS;
  }

  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (!saved) {
    return INITIAL_BOOKMARKS;
  }

  try {
    return JSON.parse(saved) as Bookmark[];
  } catch (error) {
    console.error('Error parsing bookmarks cache', error);
    return INITIAL_BOOKMARKS;
  }
};

const writeCachedBookmarks = (bookmarks: Bookmark[]) => {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(bookmarks));
};

export const replaceCachedBookmarks = (bookmarks: Bookmark[]) => {
  writeCachedBookmarks(bookmarks);
};

const buildBookmarkPayload = (bookmark: Omit<Bookmark, 'id' | 'createdAt' | 'updatedAt'>): Record<string, unknown> => ({
  title: bookmark.title,
  url: bookmark.url,
  description: bookmark.description,
  tags: bookmark.tags,
  iconType: bookmark.iconType,
  isPrivate: bookmark.isPrivate,
});

const requestJson = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {})
    },
    ...init,
  });

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  return response.json() as Promise<T>;
};

export const loadBookmarks = async (): Promise<Bookmark[]> => {
  try {
    const response = await requestJson<{ ok: boolean; data: Bookmark[] }>('/api/bookmarks');
    writeCachedBookmarks(response.data);
    return response.data;
  } catch (error) {
    console.warn('Falling back to cached bookmarks', error);
    return readCachedBookmarks();
  }
};

export const saveBookmark = async (
  bookmark: Omit<Bookmark, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }
): Promise<Bookmark> => {
  const payload = buildBookmarkPayload(bookmark);

  try {
    const response = bookmark.id
      ? await requestJson<{ ok: boolean; data: Bookmark }>(`/api/bookmarks/${bookmark.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        })
      : await requestJson<{ ok: boolean; data: Bookmark }>('/api/bookmarks', {
          method: 'POST',
          body: JSON.stringify(payload),
        });

    const current = readCachedBookmarks();
    const nextBookmarks = bookmark.id
      ? current.map((entry) => (entry.id === response.data.id ? response.data : entry))
      : [response.data, ...current.filter((entry) => entry.id !== response.data.id)];

    writeCachedBookmarks(nextBookmarks);
    return response.data;
  } catch (error) {
    const fallbackBookmark: Bookmark = {
      ...bookmark,
      id: bookmark.id ?? crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const current = readCachedBookmarks();
    const nextBookmarks = bookmark.id
      ? current.map((entry) => (entry.id === fallbackBookmark.id ? fallbackBookmark : entry))
      : [fallbackBookmark, ...current];

    writeCachedBookmarks(nextBookmarks);
    console.warn('Saved bookmark in local cache because the API request failed', error);
    return fallbackBookmark;
  }
};

export const deleteBookmark = async (bookmarkId: string): Promise<void> => {
  try {
    await requestJson<{ ok: boolean }>(`/api/bookmarks/${bookmarkId}`, {
      method: 'DELETE',
    });
  } finally {
    const current = readCachedBookmarks();
    writeCachedBookmarks(current.filter((entry) => entry.id !== bookmarkId));
  }
};
