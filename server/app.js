import dotenv from "dotenv";
dotenv.config();

import express from "express";



import internalRoutes from "./routes/internal.routes.js";

import session from "express-session";
import helmet from "helmet";
import compression from "compression";
import path from "path";
import { fileURLToPath } from "url";
import publicationRoutes from "./routes/publication.routes.js";
import { requireAdminRestaurant } from "./middleware/adminRestaurant.js";
import { requireFeature } from "./middleware/requireFeature.js";


import passwordRoutes from "./routes/password.routes.js";


import { attachRestaurant } from "./middleware/attachRestaurant.js";
import authRoutes from "./routes/auth.routes.js";
import dishRoutes from "./routes/dish.routes.js";
import publicRoutes from "./routes/public.routes.js";
import statsRoutes from "./routes/stats.routes.js";
import { UI_TRANSLATIONS } from "./config/categories.js";



const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

/* ========================
   CORE MIDDLEWARE
======================== */
app.use(
   helmet({
     contentSecurityPolicy: {
       directives: {
         defaultSrc: ["'self'"],
 
         scriptSrc: [
           "'self'",
           "'unsafe-inline'"
         ],
 
         styleSrc: [
           "'self'",
           "'unsafe-inline'"
         ],
 
         imgSrc: [
           "'self'",
           "data:",
           "blob:",   
           "https://res.cloudinary.com"
         ],
 
         mediaSrc: [
           "'self'",
           "https://res.cloudinary.com"
         ],
 
         connectSrc: [
           "'self'",
           "https://res.cloudinary.com" ,
           "blob:" 
         ],
 
         objectSrc: ["'none'"],
         frameAncestors: ["'none'"]
       }
     }
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
       sameSite: "strict",
       secure: true,  // Met à false pour tester sans sécurisation des cookies
       maxAge: 1000 * 60 * 60 * 4
     }
   })
 );


/* ========================
   STATIC FILES (TOUJOURS EN PREMIER)
======================== */

app.use(
   "/admin/publication",
   requireAdminRestaurant,
   requireFeature("publication"),
   publicationRoutes
 );

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

app.use((req, res, next) => {

   if (!req.restaurant) return next();
 
   const restaurant = req.restaurant;
 
   const langFromQuery = req.query.lang;
 
   if (langFromQuery && restaurant.languages.includes(langFromQuery)) {
     req.session.lang = langFromQuery;
   }
 
   next();
 });

app.use((req, res, next) => {

   if (!req.restaurant) return next();
 
   const restaurant = req.restaurant;
 
   const lang =
     restaurant.languages.includes(req.session.lang)
       ? req.session.lang
       : restaurant.languages[0];
 
   function translate(obj) {
     if (!obj) return obj;
 
     // Cas simple : { fr: "...", en: "..." }
     if (obj[lang] !== undefined) {
       return obj[lang] || obj["fr"];
     }
 
     // Cas imbriqué : { add_to_list: { fr: "...", en: "..." } }
     const result = {};
 
     Object.keys(obj).forEach(key => {
       result[key] = translate(obj[key]);
     });
 
     return result;
   }
 
   res.locals.ui = translate(UI_TRANSLATIONS);
 
   next();
 });

/* ========================
   PUBLIC ROUTES
======================== */
app.use("/", publicRoutes);

/* ========================
   ADMIN
======================== */
app.use("/admin", passwordRoutes);
app.use("/admin", authRoutes);
app.use("/admin", requireAdminRestaurant, dishRoutes);


/* ========================
   STATS
======================== */
app.use("/admin/stats", requireAdminRestaurant, statsRoutes);
app.use("/stats", statsRoutes);

// Route pour la page d'accueil
app.get("/", (req, res) => {
   res.send("Welcome to Restaurant Menu Service!");
 });


/* ========================
   START SERVER
======================== */
const PORT = process.env.PORT || 3000;


app.listen(PORT, () => {
  console.log(`✅ Server running → http://localhost:${PORT}`);
});
