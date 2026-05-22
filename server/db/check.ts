import Database from 'better-sqlite3';
import path from 'node:path';

const dbPath = path.resolve(process.cwd(), 'data', 'onelive.sqlite');
const db = new Database(dbPath, { readonly: true });

const userCount = db.prepare('SELECT COUNT(*) as c FROM users').get() as { c: number };
const catCount = db.prepare('SELECT COUNT(*) as c FROM categories').get() as { c: number };
const filesCount = db.prepare('SELECT COUNT(*) as c FROM files').get() as { c: number };
const tagsCount = db.prepare("SELECT name, id FROM tags LIMIT 5").all();

console.log('DB Path:', dbPath);
console.log('Users:', userCount.c);
console.log('Categories:', catCount.c);
console.log('Files:', filesCount.c);
console.log('Tags sample:', tagsCount);

db.close();
