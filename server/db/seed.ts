import { randomUUID } from 'node:crypto';
import { initializeDatabase, closeDatabase } from './database';

const database = initializeDatabase();

const insertCategory = database.prepare(`
  INSERT OR IGNORE INTO categories (id, slug, name, description)
  VALUES (@id, @slug, @name, @description)
`);

const insertTag = database.prepare(`
  INSERT OR IGNORE INTO tags (id, slug, name, description)
  VALUES (@id, @slug, @name, @description)
`);

const insertFileTag = database.prepare(`
  INSERT OR IGNORE INTO files_tags (file_id, tag_id)
  VALUES (@file_id, @tag_id)
`);

const insertUser = database.prepare(`
  INSERT OR IGNORE INTO users (id, email, password_hash, display_name, role)
  VALUES (@id, @email, @password_hash, @display_name, @role)
`);

const insertFile = database.prepare(`
  INSERT OR IGNORE INTO files (
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
    is_private
  ) VALUES (
    @id,
    @user_id,
    @category_id,
    @title,
    @file_type,
    @icon_type,
    @source_url,
    @description,
    @keywords,
    @rating,
    @is_private
  )
`);

const updateFile = database.prepare(`
  UPDATE files
  SET category_id = ?,
      title = ?,
      file_type = ?,
      icon_type = ?,
      description = ?,
      keywords = ?,
      rating = ?,
      is_private = ?,
      updated_at = datetime('now')
  WHERE id = ?
`);

const deleteFileTags = database.prepare('DELETE FROM files_tags WHERE file_id = ?');

let adminId = null as string | null;
let referenceCategoryId = null as string | null;
let tagDbId = null as string | null;
let tagConfigId = null as string | null;

// Reuse existing user by email if present
const existingUser = database.prepare('SELECT id FROM users WHERE email = ?').get('admin@onelive.local') as { id: string } | undefined;
if (existingUser && existingUser.id) {
  adminId = existingUser.id;
} else {
  adminId = randomUUID();
  insertUser.run({
    id: adminId,
    email: 'admin@onelive.local',
    password_hash: 'change-me',
    display_name: 'Administrador',
    role: 'admin'
  });
}

// Reuse/create category
const existingCat = database.prepare('SELECT id FROM categories WHERE slug = ?').get('references') as { id: string } | undefined;
if (existingCat && existingCat.id) {
  referenceCategoryId = existingCat.id;
} else {
  referenceCategoryId = randomUUID();
  insertCategory.run({
    id: referenceCategoryId,
    slug: 'references',
    name: 'Referências',
    description: 'Materiais de apoio, links e documentos importantes'
  });
}

// Reuse/create tags
const existingTagDb = database.prepare('SELECT id FROM tags WHERE slug = ?').get('database') as { id: string } | undefined;
if (existingTagDb && existingTagDb.id) {
  tagDbId = existingTagDb.id;
} else {
  tagDbId = randomUUID();
  insertTag.run({
    id: tagDbId,
    slug: 'database',
    name: 'Database',
    description: 'Assuntos relacionados a banco de dados e SQL'
  });
}

const existingTagConfig = database.prepare('SELECT id FROM tags WHERE slug = ?').get('config') as { id: string } | undefined;
if (existingTagConfig && existingTagConfig.id) {
  tagConfigId = existingTagConfig.id;
} else {
  tagConfigId = randomUUID();
  insertTag.run({
    id: tagConfigId,
    slug: 'config',
    name: 'Config',
    description: 'Arquivos de configuração e variáveis de ambiente'
  });
}

const syncSeedFile = (params: {
  sourceUrl: string;
  title: string;
  fileType: 'link' | 'pdf' | 'env' | 'md' | 'file' | 'other';
  iconType: 'github' | 'dribbble' | 'notion' | 'figma' | 'chrome' | 'twitter' | 'youtube' | 'generic';
  description: string;
  keywords: string[];
  rating: number;
  isPrivate: 0 | 1;
  tagId: string;
}) => {
  const existingFile = database
    .prepare('SELECT id FROM files WHERE user_id = ? AND source_url = ? LIMIT 1')
    .get(adminId, params.sourceUrl) as { id: string } | undefined;

  const payload = {
    user_id: adminId,
    category_id: referenceCategoryId,
    title: params.title,
    file_type: params.fileType,
    icon_type: params.iconType,
    source_url: params.sourceUrl,
    description: params.description,
    keywords: JSON.stringify(params.keywords),
    rating: params.rating,
    is_private: params.isPrivate
  };

  let fileId = existingFile?.id;

  if (fileId) {
    updateFile.run(
      payload.category_id,
      payload.title,
      payload.file_type,
      payload.icon_type,
      payload.description,
      payload.keywords,
      payload.rating,
      payload.is_private,
      fileId
    );
    deleteFileTags.run(fileId);
  } else {
    fileId = randomUUID();
    insertFile.run({
      id: fileId,
      ...payload
    });
  }

  insertFileTag.run({ file_id: fileId, tag_id: params.tagId });
};

syncSeedFile({
  sourceUrl: 'https://sqlite.org/docs.html',
  title: 'SQLite documentation',
  fileType: 'link',
  iconType: 'generic',
  description: 'Documentação oficial para consulta rápida.',
  keywords: ['db', 'sql', 'reference'],
  rating: 5,
  isPrivate: 0,
  tagId: tagDbId
});

syncSeedFile({
  sourceUrl: './.env.example',
  title: 'Projeto base .env',
  fileType: 'env',
  iconType: 'generic',
  description: 'Arquivo de exemplo com variáveis do projeto.',
  keywords: ['config', 'env'],
  rating: 4,
  isPrivate: 1,
  tagId: tagConfigId
});

closeDatabase(database);
