import { useAuth } from '../auth/AuthContext.jsx';

/**
 * useRole(['FleetManager', 'SafetyOfficer']) -> boolean
 * Mirrors the backend RBAC gate so the UI can hide/disable mutating
 * actions the current user's role isn't permitted to perform.
 */
export function useRole(allowedRoles = []) {
  const { user } = useAuth();
  if (!user) return false;
  return allowedRoles.includes(user.role);
}
