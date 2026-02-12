import db from "../db/index.js";

export function attachRestaurant(req, res, next) {

  const hostname = req.hostname;

  let slug;

  // =========================
  // LOCAL DEV
  // =========================
  if (hostname.includes("localhost")) {

    const parts = hostname.split(".");
    slug = parts.length > 1 ? parts[0] : "demo";

  }

  // =========================
  // RENDER (pas de sous-domaine custom)
  // =========================
  else if (hostname.includes("onrender.com")) {

    slug = "demo"; // ⚠️ temporaire pour test

  }

  // =========================
  // PRODUCTION FUTURE (wildcard domain)
  // =========================
  else {

    slug = hostname.split(".")[0];

  }

  const restaurant = db
    .prepare("SELECT * FROM restaurants WHERE slug = ?")
    .get(slug);

  if (!restaurant) {
    return res.status(404).send("Restaurant not found");
  }

  req.restaurant = restaurant;
  res.locals.restaurant = restaurant;

  next();
}