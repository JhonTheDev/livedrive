import { randomUUID, scryptSync } from 'node:crypto';
import { initializeDatabase, closeDatabase } from './database.js';

const argv = process.argv.slice(2);
const email = argv[0] ?? 'admin@onelive.local';
const password = argv[1] ?? 'change-me';
const displayName = argv[2] ?? 'Administrador';

if (!email || !password) {
  console.error('Usage: node server/db/create_admin.js <email> <password> [displayName]');
  process.exit(1);
}

const db = initializeDatabase();

const salt = randomUUID();
const derived = scryptSync(password, salt, 64);
const passwordHash = `scrypt$${salt}$${derived.toString('hex')}`;

const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
let userId;
if (existing && existing.id) {
  userId = existing.id;
  db.prepare("UPDATE users SET password_hash = ?, display_name = ?, role = ?, is_active = 1, updated_at = datetime('now') WHERE id = ?")
    .run(passwordHash, displayName, 'admin', userId);
  console.log('Updated existing admin user.');
} else {
  userId = randomUUID();
  db.prepare(`INSERT INTO users (id, email, password_hash, display_name, role, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, 'admin', 1, datetime('now'), datetime('now'))`).run(userId, email, passwordHash, displayName);
  console.log('Created new admin user.');
}

const maskedHash = passwordHash.slice(0, 12) + '...' + passwordHash.slice(-8);
console.log(JSON.stringify({ id: userId, email, display_name: displayName, password_hash: maskedHash }));

closeDatabase(db);
