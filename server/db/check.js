import Database from 'better-sqlite3';
import path from 'node:path';

const dbPath = path.resolve(process.cwd(), 'data', 'onelive.sqlite');
const db = new Database(dbPath, { readonly: true });

const userCount = db.prepare('SELECT COUNT(*) as c FROM users').get();
const catCount = db.prepare('SELECT COUNT(*) as c FROM categories').get();
const filesCount = db.prepare('SELECT COUNT(*) as c FROM files').get();
let tagsCount = { c: 0 };
try {
  tagsCount = db.prepare('SELECT COUNT(*) as c FROM tags').get();
} catch (e) {
  // tags table may not exist yet
}

console.log('DB Path:', dbPath);
console.log('Users:', userCount.c);
console.log('Categories:', catCount.c);
console.log('Files:', filesCount.c);
console.log('Tags count:', tagsCount.c ?? 0);

console.log('Files rows:');
try {
  const rows = db.prepare('SELECT id, user_id, category_id, title, file_type, source_url FROM files').all();
  console.log(rows);
} catch (e) {
  console.log('Could not read files rows:', e.message);
}

db.close();
