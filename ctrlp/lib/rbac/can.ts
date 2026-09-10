// Adapted from CTRL+P 015a7b58b80e63ef87c73bec549a23242b88f3e3: lib/rbac/can.ts
import { ROLE_PERMISSIONS,type Permission } from "@/ctrlp/lib/rbac/permissions";
import { isAppRole,type AppRole } from "@/ctrlp/lib/rbac/roles";
export type RbacUser = {
    role?: string | null;
    status?: string | null;
    deleted_at?: string | null;
};
export function isActiveUser(user: RbacUser | null | undefined): user is RbacUser {
    return Boolean(user && user.status === "active" && !user.deleted_at);
}
export function permissionsForRole(role: string | null | undefined): readonly Permission[] {
    if (!isAppRole(role))
        return [];
    return ROLE_PERMISSIONS[role as AppRole];
}
export function can(user: RbacUser | null | undefined, permission: Permission) {
    if (!isActiveUser(user))
        return false;
    return permissionsForRole(user.role).includes(permission);
}
export function canAny(user: RbacUser | null | undefined, permissions: readonly Permission[]) {
    return permissions.some((permission) => can(user, permission));
}
export function hasRole(user: RbacUser | null | undefined, roles: readonly AppRole[]) {
    if (!isActiveUser(user) || !isAppRole(user.role))
        return false;
    return roles.includes(user.role);
}
