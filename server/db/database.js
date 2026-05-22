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
  return database;
};

export const initializeDatabase = () => {
  const database = openDatabase();
  const schema = fs.readFileSync(schemaPath, 'utf8');
  database.exec(schema);
  return database;
};

export const closeDatabase = (database) => {
  database.close();
};
