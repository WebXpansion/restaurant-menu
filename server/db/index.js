import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 🔥 FORCE LA BASE DANS /server
const dbPath = path.resolve(__dirname, "../database.sqlite");

console.log("🚨 USING DATABASE:", dbPath);

const db = new Database(dbPath);



console.log("REAL DB PATH:", dbPath);

/* =========================
   PRAGMAS (perf + sécurité)
========================= */

db.pragma("journal_mode = WAL");
db.pragma("synchronous = NORMAL");
db.pragma("foreign_keys = ON");
db.pragma("busy_timeout = 5000");

/* =========================
   INIT DB
========================= */

export function initDB() {
  db.exec(`
    
    /* =========================
       RESTAURANTS
    ========================= */
    CREATE TABLE IF NOT EXISTS restaurants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      features TEXT,
      limits TEXT,
      languages TEXT,
      menus TEXT,
      custom_domain TEXT,
      google_review_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME
    );

    /* =========================
   AR VIEWS
========================= */

CREATE TABLE IF NOT EXISTS stats_dish_ar_views (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  restaurant_id INTEGER NOT NULL,
  dish_id INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (restaurant_id)
    REFERENCES restaurants(id)
    ON DELETE CASCADE,
  FOREIGN KEY (dish_id)
    REFERENCES dishes(id)
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_stats_dish_ar_restaurant
  ON stats_dish_ar_views(restaurant_id);
    /* =========================
       USERS
    ========================= */
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      restaurant_id INTEGER NOT NULL,
      email TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME,
      FOREIGN KEY (restaurant_id)
        REFERENCES restaurants(id)
        ON DELETE CASCADE
    );

    /* =========================
       SUBCATEGORIES
    ========================= */
    CREATE TABLE IF NOT EXISTS subcategories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      restaurant_id INTEGER NOT NULL,
      category TEXT NOT NULL,
      name TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME,
      FOREIGN KEY (restaurant_id)
        REFERENCES restaurants(id)
        ON DELETE CASCADE
    );

    /* =========================
       DISHES
    ========================= */
    CREATE TABLE IF NOT EXISTS dishes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      restaurant_id INTEGER NOT NULL,
      title_fr TEXT,
      title_en TEXT,
      desc_short_fr TEXT,
      desc_short_en TEXT,
      desc_long_fr TEXT,
      desc_long_en TEXT,
      price_cents INTEGER NOT NULL,
      category TEXT NOT NULL,
      subcategory_id INTEGER,
      availability TEXT NOT NULL,
      image_path TEXT,
      glb_path TEXT,
      usdz_path TEXT,
      scale REAL DEFAULT 1,
      status TEXT DEFAULT 'published',
      has_ar INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME,
      FOREIGN KEY (restaurant_id)
        REFERENCES restaurants(id)
        ON DELETE CASCADE,
      FOREIGN KEY (subcategory_id)
        REFERENCES subcategories(id)
        ON DELETE SET NULL
    );

    /* =========================
   STATS
========================= */

CREATE TABLE IF NOT EXISTS stats_page_views (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  restaurant_id INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (restaurant_id)
    REFERENCES restaurants(id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS stats_dish_views (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  restaurant_id INTEGER NOT NULL,
  dish_id INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (restaurant_id)
    REFERENCES restaurants(id)
    ON DELETE CASCADE,
  FOREIGN KEY (dish_id)
    REFERENCES dishes(id)
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_stats_page_restaurant
  ON stats_page_views(restaurant_id);

CREATE INDEX IF NOT EXISTS idx_stats_dish_restaurant
  ON stats_dish_views(restaurant_id);


    /* =========================
   TAGS (PASTILLES)
    ========================= */
    CREATE TABLE IF NOT EXISTS tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      restaurant_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (restaurant_id)
        REFERENCES restaurants(id)
        ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS stats_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  restaurant_id INTEGER NOT NULL,
  type TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (restaurant_id)
    REFERENCES restaurants(id)
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_stats_events_restaurant
  ON stats_events(restaurant_id);

    CREATE TABLE IF NOT EXISTS dishes_pastilles (
      dish_id INTEGER NOT NULL,
      tag_id INTEGER NOT NULL,
      restaurant_id INTEGER NOT NULL,
      PRIMARY KEY (dish_id, tag_id),
      FOREIGN KEY (dish_id)
        REFERENCES dishes(id)
        ON DELETE CASCADE,
      FOREIGN KEY (tag_id)
        REFERENCES tags(id)
        ON DELETE CASCADE,
      FOREIGN KEY (restaurant_id)
        REFERENCES restaurants(id)
        ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_tags_restaurant
      ON tags(restaurant_id);

    CREATE INDEX IF NOT EXISTS idx_dishes_pastilles_restaurant
      ON dishes_pastilles(restaurant_id);

    /* =========================
       INDEXES (PERFORMANCE)
    ========================= */
    CREATE INDEX IF NOT EXISTS idx_dishes_restaurant
      ON dishes(restaurant_id);

    CREATE INDEX IF NOT EXISTS idx_dishes_status
      ON dishes(status);

    CREATE INDEX IF NOT EXISTS idx_subcategories_restaurant
      ON subcategories(restaurant_id);

    CREATE INDEX IF NOT EXISTS idx_users_restaurant
      ON users(restaurant_id);

  `);
}

export default db;