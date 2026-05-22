import Database from 'better-sqlite3';
import { randomUUID } from 'node:crypto';
import path from 'node:path';

const dbPath = path.resolve(process.cwd(), 'data', 'onelive.sqlite');
const db = new Database(dbPath);

const user = db.prepare('SELECT id FROM users LIMIT 1').get();
const cat = db.prepare('SELECT id FROM categories LIMIT 1').get();

console.log('Using user:', user?.id, 'category:', cat?.id);

const insertFile = db.prepare(`
  INSERT INTO files (id, user_id, category_id, title, file_type, source_url, keywords, is_private)
  VALUES (@id, @user_id, @category_id, @title, @file_type, @source_url, @keywords, @is_private)
`);

try {
  const id = randomUUID();
  insertFile.run({
    id,
    user_id: user.id,
    category_id: cat.id,
    title: 'Test insert',
    file_type: 'link',
    source_url: 'https://example.com',
    keywords: JSON.stringify(['test']),
    is_private: 0
  });
  console.log('Inserted test file id', id);
} catch (e) {
  console.error('Insert failed:', e.message);
}

db.close();
