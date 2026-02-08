import "./index.js"; // force création tables
import db from "./index.js";

import bcrypt from "bcrypt";

const createSeed = async () => {
  const exists = db
    .prepare("SELECT id FROM restaurants WHERE slug = ?")
    .get("demo");

  if (exists) return;

  console.log("🌱 Seeding demo data...");

  const restaurant = db
    .prepare("INSERT INTO restaurants (name, slug) VALUES (?, ?)")
    .run("Restaurant Demo", "demo");

  const hash = await bcrypt.hash("admin123", 10);

  db.prepare(
    "INSERT INTO users (restaurant_id, email, password_hash) VALUES (?, ?, ?)"
  ).run(restaurant.lastInsertRowid, "admin@demo.com", hash);

  console.log("✅ Demo created:");
  console.log("login: admin@demo.com");
  console.log("password: admin123");
};

export default createSeed;
