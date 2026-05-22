import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';

const dataDir = path.resolve(process.cwd(), 'data');
const databasePath = path.join(dataDir, 'onelive.sqlite');
const schemaPath = path.resolve(process.cwd(), 'server', 'db', 'schema.sql');

export const getDatabasePath = () => databasePath;

export const openDatabase = () => {
  fs.mkdirSync(dataDir, { recursive: true });
  const database = new Database(databasePath);
  database.pragma('foreign_keys = ON');

  const hasFilesTable = database.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'files'").get();

  if (hasFilesTable) {
    const filesColumns = database.prepare('PRAGMA table_info(files)').all() as Array<{ name: string }>;
    const hasIconType = filesColumns.some((column) => column.name === 'icon_type');

    if (!hasIconType) {
      database.exec("ALTER TABLE files ADD COLUMN icon_type TEXT NOT NULL DEFAULT 'generic'");
    }
  }

  return database;
};

export const initializeDatabase = () => {
  const database = openDatabase();
  const schema = fs.readFileSync(schemaPath, 'utf8');
  database.exec(schema);
  return database;
};

export const closeDatabase = (database: Database.Database) => {
  database.close();
};
