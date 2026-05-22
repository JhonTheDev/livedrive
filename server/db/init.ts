import { closeDatabase, initializeDatabase } from './database';

const database = initializeDatabase();
closeDatabase(database);

console.log('SQLite database initialized successfully.');
