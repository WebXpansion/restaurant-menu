import dotenv from "dotenv";
dotenv.config();


import internalRoutes from "./routes/internal.routes.js";
import express from "express";
import session from "express-session";
import helmet from "helmet";
import compression from "compression";
import path from "path";
import { fileURLToPath } from "url";

import { requireAdminRestaurant } from "./middleware/adminRestaurant.js";


import { initDB } from "./db/index.js";
import createSeed from "./db/seed.js";


import { attachRestaurant } from "./middleware/attachRestaurant.js";
import authRoutes from "./routes/auth.routes.js";
import dishRoutes from "./routes/dish.routes.js";
import publicRoutes from "./routes/public.routes.js";
import statsRoutes from "./routes/stats.routes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

/* ========================
   CORE MIDDLEWARE
======================== */
app.use(
  helmet({
    contentSecurityPolicy: false
  })
);

app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production"
    }
  })
);


/* ========================
   STATIC FILES (TOUJOURS EN PREMIER)
======================== */
app.use("/uploads", express.static("uploads"));
app.use(express.static(path.join(__dirname, "../public")));

/* ========================
   VIEW ENGINE
======================== */
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

/* ========================
   ATTACH RESTAURANT
======================== */
app.use("/admin/internal", internalRoutes);
app.use(attachRestaurant);

/* ========================
   PUBLIC ROUTES
======================== */
app.use("/", publicRoutes);

/* ========================
   ADMIN
======================== */
app.use("/admin", authRoutes);
app.use("/admin", requireAdminRestaurant, dishRoutes);

/* ========================
   STATS
======================== */
app.use("/admin/stats", requireAdminRestaurant, statsRoutes);
app.use("/stats", statsRoutes);



/* ========================
   START SERVER
======================== */
const PORT = process.env.PORT || 3000;

initDB();
createSeed();

app.listen(PORT, () => {
  console.log(`✅ Server running → http://localhost:${PORT}`);
});
