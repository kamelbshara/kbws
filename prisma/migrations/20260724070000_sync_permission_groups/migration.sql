-- Sync existing PermissionGroup rows with this redesign's new defaults
-- (src/lib/permissions.ts DEFAULT_PERMISSION_GROUPS). Rows created by an
-- earlier seed run are otherwise never touched again (seedPermissionGroups.ts
-- upserts with `update: {}` to preserve admin customization), so without this
-- migration, management stays silently unable to create/assign initiatives
-- and teachers stay silently able to create teams even after the redesign's
-- code-level permission checks changed.

-- Management can now create/assign initiatives, same as teachers.
UPDATE "PermissionGroup"
SET "roles" = ARRAY['TEACHER', 'INITIATIVE_OWNER', 'SYSTEM_ADMIN', 'PRINCIPAL', 'VICE_PRINCIPAL']::"Role"[]
WHERE "name" = 'INITIATIVE_CREATOR_ROLES';

-- Teams are now management-only to create.
UPDATE "PermissionGroup"
SET "roles" = ARRAY['SYSTEM_ADMIN', 'PRINCIPAL', 'VICE_PRINCIPAL']::"Role"[]
WHERE "name" = 'TEAM_CREATOR_ROLES';
