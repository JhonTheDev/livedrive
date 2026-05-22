import Database from 'better-sqlite3';
import path from 'node:path';

const dbPath = path.resolve(process.cwd(), 'data', 'onelive.sqlite');
const db = new Database(dbPath);

console.log('Starting dedupe on', dbPath);

// 1) Dedupe files by (user_id, source_url) - keep earliest created_at
const dupFiles = db.prepare(
  `SELECT user_id, source_url, COUNT(*) as c FROM files GROUP BY user_id, source_url HAVING c > 1`
).all();

for (const row of dupFiles) {
  const { user_id, source_url } = row;
  const ids = db
    .prepare(
      `SELECT id FROM files WHERE user_id = ? AND source_url = ? ORDER BY datetime(created_at) ASC`
    )
    .all(user_id, source_url)
    .map((r) => r.id);

  if (ids.length <= 1) continue;
  const keep = ids[0];
  const toDelete = ids.slice(1);
  console.log(`Deduping files for user ${user_id} source ${source_url} - keep ${keep} delete ${toDelete.length}`);

  const delFilesTags = db.prepare(`DELETE FROM files_tags WHERE file_id = ?`);
  const delFiles = db.prepare(`DELETE FROM files WHERE id = ?`);

  for (const id of toDelete) {
    delFilesTags.run(id);
    delFiles.run(id);
  }
}

// 2) Merge duplicate tags by slug - keep earliest
const dupTags = db.prepare(`SELECT slug, COUNT(*) as c FROM tags GROUP BY slug HAVING c > 1`).all();
for (const t of dupTags) {
  const slug = t.slug;
  const rows = db.prepare(`SELECT id FROM tags WHERE slug = ? ORDER BY datetime(created_at) ASC`).all(slug).map(r=>r.id);
  if (rows.length <= 1) continue;
  const keep = rows[0];
  const olds = rows.slice(1);
  console.log(`Merging tags slug=${slug} keep=${keep} olds=${olds.join(',')}`);

  // For each old tag, reassign files_tags to keep, avoiding duplicates
  const insertOrIgnore = db.prepare(`INSERT OR IGNORE INTO files_tags (file_id, tag_id) SELECT file_id, ? FROM files_tags WHERE tag_id = ?`);
  const deleteOld = db.prepare(`DELETE FROM files_tags WHERE tag_id = ?`);
  const deleteTag = db.prepare(`DELETE FROM tags WHERE id = ?`);

  for (const oldId of olds) {
    insertOrIgnore.run(keep, oldId);
    deleteOld.run(oldId);
    deleteTag.run(oldId);
  }
}

// 3) Merge duplicate categories by slug - keep earliest
const dupCats = db.prepare(`SELECT slug, COUNT(*) as c FROM categories GROUP BY slug HAVING c > 1`).all();
for (const c of dupCats) {
  const slug = c.slug;
  const rows = db.prepare(`SELECT id FROM categories WHERE slug = ? ORDER BY datetime(created_at) ASC`).all(slug).map(r=>r.id);
  if (rows.length <= 1) continue;
  const keep = rows[0];
  const olds = rows.slice(1);
  console.log(`Merging categories slug=${slug} keep=${keep} olds=${olds.join(',')}`);

  const updateFiles = db.prepare(`UPDATE files SET category_id = ? WHERE category_id = ?`);
  const deleteCat = db.prepare(`DELETE FROM categories WHERE id = ?`);

  for (const oldId of olds) {
    // Move files to keep category
    updateFiles.run(keep, oldId);
    deleteCat.run(oldId);
  }
}

console.log('Dedupe completed.');
db.close();
