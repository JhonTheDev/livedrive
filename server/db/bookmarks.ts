import { randomUUID } from 'node:crypto';
import { openDatabase } from './database';

export type BookmarkIconType = 'github' | 'dribbble' | 'notion' | 'figma' | 'chrome' | 'twitter' | 'youtube' | 'generic';

export interface BookmarkRecord {
  id: string;
  title: string;
  url: string;
  description: string;
  tags: string[];
  iconType: BookmarkIconType;
  isPrivate: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BookmarkInput {
  title: string;
  url: string;
  description: string;
  tags: string[];
  iconType: BookmarkIconType;
  isPrivate: boolean;
}

export interface BookmarkQuery {
  search?: string;
  tag?: string;
  isPrivate?: boolean;
}

const SYSTEM_USER_EMAIL = 'system@onelive.local';
const SYSTEM_USER_NAME = 'Onelive Local';

const normalizeTag = (tag: string) => tag.trim().toUpperCase();

const normalizeIconType = (iconType: string | undefined): BookmarkIconType => {
  const allowed: BookmarkIconType[] = ['github', 'dribbble', 'notion', 'figma', 'chrome', 'twitter', 'youtube', 'generic'];
  return allowed.includes(iconType as BookmarkIconType) ? (iconType as BookmarkIconType) : 'generic';
};

const ensureSystemUser = () => {
  const database = openDatabase();
  const user = database.prepare('SELECT id FROM users WHERE email = ?').get(SYSTEM_USER_EMAIL) as { id: string } | undefined;

  if (user) {
    return { database, userId: user.id };
  }

  const userId = randomUUID();
  database.prepare(`
    INSERT INTO users (id, email, password_hash, display_name, role)
    VALUES (?, ?, ?, ?, 'user')
  `).run(userId, SYSTEM_USER_EMAIL, 'local-only', SYSTEM_USER_NAME);

  return { database, userId };
};

const rowToBookmark = (row: any): BookmarkRecord => ({
  id: row.id,
  title: row.title,
  url: row.source_url,
  description: row.description ?? '',
  tags: JSON.parse(row.tags_json ?? '[]'),
  iconType: normalizeIconType(row.icon_type),
  isPrivate: Boolean(row.is_private),
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const fetchBookmarkRows = (database: ReturnType<typeof openDatabase>, query: BookmarkQuery = {}) => {
  const clauses: string[] = [];
  const params: Record<string, unknown> = {};

  if (query.search?.trim()) {
    clauses.push(`(
      lower(f.title) LIKE lower(@searchLike)
      OR lower(COALESCE(f.description, '')) LIKE lower(@searchLike)
      OR lower(f.source_url) LIKE lower(@searchLike)
      OR EXISTS (
        SELECT 1
        FROM json_each(f.keywords)
        WHERE lower(value) LIKE lower(@searchLike)
      )
      OR EXISTS (
        SELECT 1
        FROM files_tags ft_search
        JOIN tags t_search ON t_search.id = ft_search.tag_id
        WHERE ft_search.file_id = f.id
          AND (lower(t_search.name) LIKE lower(@searchLike) OR lower(t_search.slug) LIKE lower(@searchLike))
      )
    )`);
    params.searchLike = `%${query.search.trim()}%`;
  }

  if (query.tag?.trim()) {
    clauses.push(`EXISTS (
      SELECT 1
      FROM files_tags ft
      JOIN tags t ON t.id = ft.tag_id
      WHERE ft.file_id = f.id
        AND (lower(t.name) = lower(@tagExact) OR lower(t.slug) = lower(@tagExact))
    )`);
    params.tagExact = query.tag.trim();
  }

  if (typeof query.isPrivate === 'boolean') {
    clauses.push('f.is_private = @isPrivate');
    params.isPrivate = query.isPrivate ? 1 : 0;
  }

  const sql = `
    SELECT
      f.id,
      f.title,
      f.source_url,
      f.description,
      f.icon_type,
      f.is_private,
      f.created_at,
      f.updated_at,
      COALESCE((
        SELECT json_group_array(t.name)
        FROM files_tags ft
        JOIN tags t ON t.id = ft.tag_id
        WHERE ft.file_id = f.id
      ), '[]') AS tags_json
    FROM files f
    ${clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : ''}
    ORDER BY datetime(f.created_at) DESC, f.title COLLATE NOCASE ASC
  `;

  return database.prepare(sql).all(params);
};

const replaceBookmarkTags = (database: ReturnType<typeof openDatabase>, fileId: string, tags: string[]) => {
  database.prepare('DELETE FROM files_tags WHERE file_id = ?').run(fileId);

  const insertTag = database.prepare(`
    INSERT INTO tags (id, slug, name, description)
    VALUES (@id, @slug, @name, @description)
    ON CONFLICT(slug) DO UPDATE SET
      name = excluded.name,
      updated_at = datetime('now')
  `);

  const insertFileTag = database.prepare(`
    INSERT OR IGNORE INTO files_tags (file_id, tag_id)
    VALUES (@file_id, @tag_id)
  `);

  for (const tag of tags) {
    const normalizedTag = normalizeTag(tag);
    if (!normalizedTag) {
      continue;
    }

    const slug = normalizedTag.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    const tagId = randomUUID();
    insertTag.run({ id: tagId, slug, name: normalizedTag, description: null });

    const tagRow = database.prepare('SELECT id FROM tags WHERE slug = ?').get(slug) as { id: string } | undefined;
    if (tagRow) {
      insertFileTag.run({ file_id: fileId, tag_id: tagRow.id });
    }
  }
};

export const listBookmarks = (query: BookmarkQuery = {}) => {
  const { database } = ensureSystemUser();

  try {
    return fetchBookmarkRows(database, query).map(rowToBookmark);
  } finally {
    database.close();
  }
};

export const getBookmarkById = (bookmarkId: string) => {
  const { database } = ensureSystemUser();

  try {
    const row = fetchBookmarkRows(database, {}).find((bookmarkRow: { id: string }) => bookmarkRow.id === bookmarkId);
    return row ? rowToBookmark(row) : null;
  } finally {
    database.close();
  }
};

export const createBookmark = (input: BookmarkInput) => {
  const { database, userId } = ensureSystemUser();
  const bookmarkId = randomUUID();
  const now = new Date().toISOString();
  const tags = (input.tags.length > 0 ? input.tags : ['GENERAL']).map(normalizeTag);

  try {
    const insertFile = database.prepare(`
      INSERT INTO files (
        id,
        user_id,
        category_id,
        title,
        file_type,
        icon_type,
        source_url,
        description,
        keywords,
        rating,
        is_private,
        created_at,
        updated_at
      ) VALUES (?, ?, NULL, ?, 'link', ?, ?, ?, ?, NULL, ?, ?, ?)
    `);

    insertFile.run(
      bookmarkId,
      userId,
      input.title.trim(),
      normalizeIconType(input.iconType),
      input.url.trim(),
      input.description.trim(),
      JSON.stringify(tags),
      input.isPrivate ? 1 : 0,
      now,
      now
    );

    replaceBookmarkTags(database, bookmarkId, tags);
    const bookmark = getBookmarkById(bookmarkId);
    if (!bookmark) {
      throw new Error('Bookmark was created but could not be reloaded.');
    }

    return bookmark;
  } finally {
    database.close();
  }
};

export const updateBookmark = (bookmarkId: string, input: BookmarkInput) => {
  const { database } = ensureSystemUser();
  const now = new Date().toISOString();
  const tags = (input.tags.length > 0 ? input.tags : ['GENERAL']).map(normalizeTag);

  try {
    const existing = database.prepare('SELECT id FROM files WHERE id = ?').get(bookmarkId) as { id: string } | undefined;
    if (!existing) {
      return null;
    }

    database.prepare(`
      UPDATE files
      SET title = ?,
          source_url = ?,
          description = ?,
          icon_type = ?,
          keywords = ?,
          is_private = ?,
          updated_at = ?
      WHERE id = ?
    `).run(
      input.title.trim(),
      input.url.trim(),
      input.description.trim(),
      normalizeIconType(input.iconType),
      JSON.stringify(tags),
      input.isPrivate ? 1 : 0,
      now,
      bookmarkId
    );

    replaceBookmarkTags(database, bookmarkId, tags);
    return getBookmarkById(bookmarkId);
  } finally {
    database.close();
  }
};

export const deleteBookmark = (bookmarkId: string) => {
  const { database } = ensureSystemUser();

  try {
    const result = database.prepare('DELETE FROM files WHERE id = ?').run(bookmarkId);
    return result.changes > 0;
  } finally {
    database.close();
  }
};