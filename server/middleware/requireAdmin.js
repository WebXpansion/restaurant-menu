export function requireAdmin(req, res, next) {
  if (!req.session?.user) {
    return res.redirect("/admin/login");
  }

  if (!req.restaurant) {
    return res.status(400).send("Restaurant context missing");
  }

  if (req.session.user.restaurant_id !== req.restaurant.id) {
    return res.status(403).send("Forbidden");
  }

  next();
}