export function requireAdmin(req, res, next) {
    if (!req.session.user) {
      return res.redirect(`/admin/${req.params.slug}/login`);
    }
  
    if (req.session.user.restaurant_id !== req.restaurant.id) {
      return res.status(403).send("Forbidden");
    }
  
    next();
  }
  