export function requireAdmin(req, res, next) {

  console.log("SESSION USER:", req.session.user);
  console.log("REQ RESTAURANT:", req.restaurant.id);
  console.log("TYPES:",
    typeof req.session.user?.restaurant_id,
    typeof req.restaurant.id
  );

  if (!req.session.user) {
    return res.redirect(`/admin/login`);
  }

  if (req.session.user.restaurant_id !== req.restaurant.id) {
    console.log("MISMATCH DETECTED");
    return res.status(403).send("Forbidden");
  }

  next();
}