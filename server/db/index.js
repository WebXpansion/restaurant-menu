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

    CREATE TABLE IF NOT EXISTS subcategories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      restaurant_id INTEGER,
      category TEXT,
      name TEXT
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
      subcategory_id INTEGER,
      availability TEXT,
      image_path TEXT,
      glb_path TEXT,
      usdz_path TEXT,
      scale REAL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS stats_page_views (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      restaurant_id INTEGER,
      count INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS stats_dish_views (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      restaurant_id INTEGER,
      dish_id INTEGER,
      count INTEGER DEFAULT 0,
      UNIQUE (restaurant_id, dish_id)
    );


    CREATE INDEX IF NOT EXISTS idx_dishes_restaurant
    ON dishes(restaurant_id);

    CREATE INDEX IF NOT EXISTS idx_subcategories_restaurant
    ON subcategories(restaurant_id);
  `);

  // 🔥 AJOUT SAFE DES COLONNES
  try { db.prepare(`ALTER TABLE restaurants ADD COLUMN features TEXT`).run(); } catch {}
  try { db.prepare(`ALTER TABLE restaurants ADD COLUMN languages TEXT`).run(); } catch {}
  try { db.prepare(`ALTER TABLE restaurants ADD COLUMN menus TEXT`).run(); } catch {}
  try { db.prepare(`ALTER TABLE restaurants ADD COLUMN custom_domain TEXT`).run(); } catch {}
  try {
    db.prepare(`
      ALTER TABLE restaurants ADD COLUMN google_review_url TEXT
    `).run();
  } catch {}
  
}



export default db;
