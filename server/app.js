import express from "express";
import session from "express-session";
import helmet from "helmet";
import db, { initDB } from "./db/index.js";

import compression from "compression";
import path from "path";
import { fileURLToPath } from "url";
import createSeed from "./db/seed.js";
import authRoutes from "./routes/auth.routes.js";
import dishRoutes from "./routes/dish.routes.js";
import publicRoutes from "./routes/public.routes.js";



const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

/* ========================
   BASIC MIDDLEWARE
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
      sameSite: "lax",
    },
  })
);

app.use("/node_modules", express.static("node_modules"));
app.use("/uploads", express.static("uploads"));

app.use("/r", publicRoutes);
app.use("/admin", authRoutes);
app.use("/admin", dishRoutes);




/* ========================
   STATIC FILES
======================== */
app.use(express.static(path.join(__dirname, "../public")));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

/* ========================
   TEST ROUTES
======================== */

app.get("/", (req, res) => {
  res.send("Server running 🚀");
});

app.get("/r/:slug", (req, res) => {
  const { slug } = req.params;
  res.send(`Menu public pour le restaurant : ${slug}`);
});

/* ========================
   START SERVER
======================== */

const PORT = 3000;
initDB();
createSeed();


app.listen(PORT, () => {
  console.log(`✅ Server running → http://localhost:${PORT}`);
});
