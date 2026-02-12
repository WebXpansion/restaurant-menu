import dotenv from "dotenv";
dotenv.config();



import express from "express";
import session from "express-session";
import helmet from "helmet";
import compression from "compression";
import path from "path";
import { fileURLToPath } from "url";




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
    secret: "super-secret-change-me",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax"
    }
  })
);

/* ========================
   STATIC FILES
======================== */
app.use("/uploads", express.static("uploads"));
app.use(express.static(path.join(__dirname, "../public")));

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

/* ========================
   RESTAURANT CONTEXT (UNIQUE)
======================== */
app.use("/r/:slug", attachRestaurant);
app.use("/admin/:slug", attachRestaurant);
app.use("/stats/:slug", attachRestaurant, statsRoutes);



/* ========================
   ROUTES
======================== */

// public menu
app.use("/r", publicRoutes);

// admin auth (login)
app.use("/admin", authRoutes);

// admin features
app.use("/admin", dishRoutes);

/* ========================
   ROOT
======================== */
app.get("/", (req, res) => {
  res.send("Server running 🚀");
});

/* ========================
   START SERVER
======================== */
const PORT = process.env.PORT || 3000;

initDB();
createSeed();

app.listen(PORT, () => {
  console.log(`✅ Server running → http://localhost:${PORT}`);
});
