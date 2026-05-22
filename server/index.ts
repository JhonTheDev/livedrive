import express from 'express';
import { scryptSync, randomUUID } from 'node:crypto';
import { initializeDatabase, closeDatabase, getDatabasePath } from './db/database';
import { createBookmark, deleteBookmark, getBookmarkById, listBookmarks, updateBookmark } from './db/bookmarks';

const app = express();
const port = Number(process.env.PORT ?? 4000);

app.use(express.json());
app.use((_request, response, next) => {
  response.header('Access-Control-Allow-Origin', '*');
  response.header('Access-Control-Allow-Headers', 'Content-Type');
  response.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  if (_request.method === 'OPTIONS') {
    response.sendStatus(204);
    return;
  }
  next();
});

// Initialize DB connection once for the server
const db = initializeDatabase();

const hashPassword = (password: string) => {
  const salt = randomUUID();
  const derived = scryptSync(password, salt, 64);
  return `scrypt$${salt}$${derived.toString('hex')}`;
};

app.get('/health', (_request, response) => {
  response.json({
    ok: true,
    database: getDatabasePath()
  });
});

app.post('/db/init', (_request, response) => {
  // Schema is applied at server startup via initializeDatabase
  response.status(200).json({ ok: true, message: 'Database is initialized.' });
});

// Users CRUD
app.get('/users', (_req, res) => {
  const rows = db.prepare("SELECT id, email, display_name, role, is_active, created_at, updated_at FROM users").all();
  res.json(rows);
});

app.get('/users/:id', (req, res) => {
  const row = db.prepare("SELECT id, email, display_name, role, is_active, created_at, updated_at FROM users WHERE id = ?").get(req.params.id);
  if (!row) return res.status(404).json({ error: 'User not found' });
  res.json(row);
});

app.post('/users', (req, res) => {
  const { email, password, display_name, role = 'user' } = req.body as any;
  if (!email || !password) return res.status(400).json({ error: 'email and password required' });

  const exists = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (exists) return res.status(409).json({ error: 'User with that email already exists' });

  const id = randomUUID();
  const password_hash = hashPassword(password);
  db.prepare(`INSERT INTO users (id, email, password_hash, display_name, role, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 1, datetime('now'), datetime('now'))`).run(id, email, password_hash, display_name ?? email, role);
  res.status(201).json({ id, email, display_name: display_name ?? email, role });
});

app.put('/users/:id', (req, res) => {
  const id = req.params.id;
  const { password, display_name, role, is_active } = req.body as any;
  const user = db.prepare('SELECT id FROM users WHERE id = ?').get(id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  if (password) {
    const password_hash = hashPassword(password);
    db.prepare("UPDATE users SET password_hash = ?, display_name = COALESCE(?, display_name), role = COALESCE(?, role), is_active = COALESCE(?, is_active), updated_at = datetime('now') WHERE id = ?").run(password_hash, display_name, role, is_active, id);
  } else {
    db.prepare("UPDATE users SET display_name = COALESCE(?, display_name), role = COALESCE(?, role), is_active = COALESCE(?, is_active), updated_at = datetime('now') WHERE id = ?").run(display_name, role, is_active, id);
  }

  const updated = db.prepare("SELECT id, email, display_name, role, is_active, created_at, updated_at FROM users WHERE id = ?").get(id);
  res.json(updated);
});

app.delete('/users/:id', (req, res) => {
  const id = req.params.id;
  const user = db.prepare('SELECT id FROM users WHERE id = ?').get(id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  db.prepare('DELETE FROM users WHERE id = ?').run(id);
  res.status(204).send();
});

// Bookmarks API (existing behavior)
app.get('/api/bookmarks', (request, response) => {
  const bookmarks = listBookmarks({
    search: typeof request.query.search === 'string' ? request.query.search : undefined,
    tag: typeof request.query.tag === 'string' ? request.query.tag : undefined,
    isPrivate: typeof request.query.isPrivate === 'string' ? request.query.isPrivate === 'true' : undefined
  });

  response.json({ ok: true, data: bookmarks });
});

app.get('/api/bookmarks/:id', (request, response) => {
  const bookmark = getBookmarkById(request.params.id);

  if (!bookmark) {
    response.status(404).json({ ok: false, message: 'Bookmark not found.' });
    return;
  }

  response.json({ ok: true, data: bookmark });
});

app.post('/api/bookmarks', (request, response) => {
  const { title, url, description = '', tags = [], iconType = 'generic', isPrivate = false } = request.body ?? {};

  if (!title || !url) {
    response.status(400).json({ ok: false, message: 'title and url are required.' });
    return;
  }

  const bookmark = createBookmark({
    title,
    url,
    description,
    tags: Array.isArray(tags) ? tags : [],
    iconType,
    isPrivate: Boolean(isPrivate)
  });

  response.status(201).json({ ok: true, data: bookmark });
});

app.put('/api/bookmarks/:id', (request, response) => {
  const { title, url, description = '', tags = [], iconType = 'generic', isPrivate = false } = request.body ?? {};

  if (!title || !url) {
    response.status(400).json({ ok: false, message: 'title and url are required.' });
    return;
  }

  const bookmark = updateBookmark(request.params.id, {
    title,
    url,
    description,
    tags: Array.isArray(tags) ? tags : [],
    iconType,
    isPrivate: Boolean(isPrivate)
  });

  if (!bookmark) {
    response.status(404).json({ ok: false, message: 'Bookmark not found.' });
    return;
  }

  response.json({ ok: true, data: bookmark });
});

app.delete('/api/bookmarks/:id', (request, response) => {
  const deleted = deleteBookmark(request.params.id);

  if (!deleted) {
    response.status(404).json({ ok: false, message: 'Bookmark not found.' });
    return;
  }

  response.json({ ok: true });
});

process.on('SIGINT', () => {
  console.log('Shutting down server and closing database');
  closeDatabase(db);
  process.exit(0);
});

app.listen(port, () => {
  console.log(`Onelive API running on http://localhost:${port}`);
});
