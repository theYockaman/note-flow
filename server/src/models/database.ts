import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';
import { promisify } from 'util';

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../../data/noteflow.db');
const DB_DIR = path.dirname(DB_PATH);

// Ensure data directory exists
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

// Create database connection
const db = new sqlite3.Database(DB_PATH);

// Promisify database methods
const dbRun = promisify(db.run.bind(db));
const dbGet = promisify(db.get.bind(db));
const dbAll = promisify(db.all.bind(db));

// Enable foreign keys
db.run('PRAGMA foreign_keys = ON');

// Initialize database schema
export async function initDatabase() {
  try {
    // Users table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        created_at TEXT DEFAULT (datetime('now'))
      )
    `);

    // Notes table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS notes (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        tags TEXT DEFAULT '[]',
        position_x REAL,
        position_y REAL,
        parent_id TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (parent_id) REFERENCES notes(id) ON DELETE SET NULL
      )
    `);

    // Note links table (for mind mapping connections)
    await dbRun(`
      CREATE TABLE IF NOT EXISTS note_links (
        id TEXT PRIMARY KEY,
        source_note_id TEXT NOT NULL,
        target_note_id TEXT NOT NULL,
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (source_note_id) REFERENCES notes(id) ON DELETE CASCADE,
        FOREIGN KEY (target_note_id) REFERENCES notes(id) ON DELETE CASCADE,
        UNIQUE(source_note_id, target_note_id)
      )
    `);

    // Plugins table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS plugins (
        id TEXT PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        version TEXT NOT NULL,
        enabled INTEGER DEFAULT 1,
        code TEXT NOT NULL,
        config TEXT DEFAULT '{}',
        created_at TEXT DEFAULT (datetime('now'))
      )
    `);

    // API tokens table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS api_tokens (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        token TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        created_at TEXT DEFAULT (datetime('now')),
        last_used TEXT,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Create indexes for better performance
    await dbRun('CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id)');
    await dbRun('CREATE INDEX IF NOT EXISTS idx_notes_parent_id ON notes(parent_id)');
    await dbRun('CREATE INDEX IF NOT EXISTS idx_note_links_source ON note_links(source_note_id)');
    await dbRun('CREATE INDEX IF NOT EXISTS idx_note_links_target ON note_links(target_note_id)');
    await dbRun('CREATE INDEX IF NOT EXISTS idx_api_tokens_user_id ON api_tokens(user_id)');

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

export { db, dbRun, dbGet, dbAll };
export default db;
