/**
 * Node permission enforcement helper.
 *
 * Each flow node stores:
 *   node.data.config.__permissions = {
 *     view:  string[]   // roles that can view this node
 *     edit:  string[]   // roles that can edit config in builder
 *     entry: string[]   // roles that can submit data in ENB
 *   }
 *
 * This module checks if the current user has the required permission.
 */

export type PermissionType = 'view' | 'edit' | 'entry';

export interface NodePermissions {
  view:  string[];
  edit:  string[];
  entry: string[];
}

const DEFAULT_PERMISSIONS: NodePermissions = {
  view:  ['Designer', 'Manager', 'QA Supervisor', 'Org Admin'],
  edit:  ['Designer'],
  entry: ['Worker'],
};

export function checkNodePermission(
  permissions: NodePermissions | undefined | null,
  userRoles: string[],
  type: PermissionType,
): boolean {
  const perms = permissions ?? DEFAULT_PERMISSIONS;
  const allowed = perms[type] ?? DEFAULT_PERMISSIONS[type];

  // Org Admin always has access
  if (userRoles.includes('Org Admin')) return true;

  return allowed.some((role) => userRoles.includes(role));
}
