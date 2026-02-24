export function requireFeature(featureName) {
    return (req, res, next) => {
      if (!req.restaurant.features?.[featureName]) {
        return res.status(403).render("admin/upgrade-feature", { feature: featureName });
      }
      next();
    };
  }