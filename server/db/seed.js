import { getPool } from "./postgres.js";
import bcrypt from "bcrypt";


const createSeed = async () => {
  const pool = getPool();

  // Vérifier si déjà existant
  const { rows: existing } = await pool.query(
    `SELECT id FROM restaurants WHERE slug = $1`,
    ["demo"]
  );

  if (existing[0]) {
    console.log("🌱 Demo already exists");
    return;
  }

  console.log("🌱 Seeding demo data...");

  // Créer restaurant
  const { rows: restaurantRows } = await pool.query(
    `
      INSERT INTO restaurants (name, slug, features, limits, languages, menus)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id
    `,
    [
      "Restaurant Demo",
      "demo",
      { stats: true, googleReview: true },
      { ar_limit: 10 },
      ["fr", "en"],
      ["lunch", "dinner"]
    ]
  );

  const restaurantId = restaurantRows[0].id;

  // Hash password
  const hash = await bcrypt.hash("admin123", 10);

  // Créer user
  await pool.query(
    `
      INSERT INTO users (restaurant_id, email, password_hash)
      VALUES ($1, $2, $3)
    `,
    [restaurantId, "admin@demo.com", hash]
  );

  console.log("✅ Demo created:");
  console.log("login: admin@demo.com");
  console.log("password: admin123");
};

export default createSeed;