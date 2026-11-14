// Shared, FK-safe ordering of every Prisma model that is captured in the
// starter snapshot. Both the generator (scripts/generate-starter-seed.ts) and
// the runtime seed (db-starter-seed.ts) iterate this single list so the two
// stay in lockstep.

export interface SeedModel {
  /** Key used inside the generated snapshot file. */
  key: string;
  /** Prisma client delegate name (camelCase model name). */
  delegate: string;
  /** Mapped Postgres table name (@@map) used for sequence resets. */
  table: string;
}

// Order matters: parents must be seeded before children that reference them.
export const SEED_MODELS: SeedModel[] = [
  { key: 'roles', delegate: 'role', table: 'roles' },
  { key: 'organizations', delegate: 'organization', table: 'organizations' },
  { key: 'users', delegate: 'user', table: 'users' },
  { key: 'accessRequests', delegate: 'accessRequest', table: 'access_requests' },
  { key: 'globalSettings', delegate: 'globalSettings', table: 'global_settings' },
  { key: 'staffTags', delegate: 'staffTag', table: 'staff_tags' },
  { key: 'specializations', delegate: 'specialization', table: 'specializations' },
  { key: 'departments', delegate: 'department', table: 'departments' },
  { key: 'skills', delegate: 'skill', table: 'skills' },
  { key: 'resourceTypes', delegate: 'resourceType', table: 'resource_types' },
  { key: 'leaveTypes', delegate: 'leaveType', table: 'leave_types' },
  { key: 'surgeryStatusCatalog', delegate: 'surgeryStatusCatalog', table: 'surgery_status_catalog' },
  { key: 'shifts', delegate: 'shift', table: 'shifts' },
  { key: 'forbiddenPatterns', delegate: 'forbiddenPattern', table: 'forbidden_patterns' },
  { key: 'contracts', delegate: 'contract', table: 'contracts' },
  { key: 'userActivityLogs', delegate: 'userActivityLog', table: 'user_activity_logs' },
  { key: 'staff', delegate: 'staff', table: 'staff' },
  { key: 'leaveShiftRequests', delegate: 'leaveShiftRequest', table: 'leave_shift_requests' },
  { key: 'resourcePools', delegate: 'resourcePool', table: 'resource_pools' },
  { key: 'poolResources', delegate: 'poolResource', table: 'pool_resources' },
  { key: 'poolResourceReservations', delegate: 'poolResourceReservation', table: 'pool_resource_reservations' },
  { key: 'poolDemandConfigs', delegate: 'poolDemandConfig', table: 'pool_demand_configs' },
  { key: 'renewableResourcePools', delegate: 'renewableResourcePool', table: 'renewable_resource_pools' },
  { key: 'resourceUnits', delegate: 'resourceUnit', table: 'resource_units' },
  { key: 'resourceUnitReservations', delegate: 'resourceUnitReservation', table: 'resource_unit_reservations' },
  { key: 'nonRenewableResources', delegate: 'nonRenewableResource', table: 'non_renewable_resources' },
  { key: 'operationTypes', delegate: 'operationType', table: 'operation_types' },
  { key: 'phaseResources', delegate: 'phaseResource', table: 'phase_resources' },
  { key: 'surgeryPlanResults', delegate: 'surgeryPlanResult', table: 'surgery_plan_results' },
  { key: 'rosterings', delegate: 'rostering', table: 'rosterings' },
  { key: 'surgeries', delegate: 'surgery', table: 'surgeries' },
];
