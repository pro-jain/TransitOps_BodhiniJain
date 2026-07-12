// Usage: requireRole(['FleetManager', 'SafetyOfficer'])
// Gates MUTATING actions by role. Viewing/reading is intentionally left open
// to all authenticated users per the spec ("don't hard-block viewing across roles").
export function requireRole(allowedRoles = []) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Role '${req.user.role}' is not permitted to perform this action`,
      });
    }
    next();
  };
}
