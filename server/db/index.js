import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, "../../database.sqlite");

const db = new Database(dbPath);

export function initDB() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS restaurants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      slug TEXT UNIQUE
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      restaurant_id INTEGER,
      email TEXT,
      password_hash TEXT
    );

    CREATE TABLE IF NOT EXISTS dishes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      restaurant_id INTEGER,

      title_fr TEXT,
      title_en TEXT,

      desc_short_fr TEXT,
      desc_short_en TEXT,
      desc_long_fr TEXT,
      desc_long_en TEXT,

      price_cents INTEGER,

      category TEXT,
      subcategory TEXT,
      availability TEXT,

      image_path TEXT,
      glb_path TEXT,
      usdz_path TEXT,
      scale REAL DEFAULT 1
    );
  `);
}

export default db;
