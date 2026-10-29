import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { StaffMember } from '../../../src/components/staff/types';
import type { ResourcePool } from '../../../src/components/hr-pool/types';
import {
  getResourceAssignmentMode,
  matchesResourceRole,
  poolMatchesResourceRole,
  renewablePoolRole,
  staffMatchesResourceRole,
} from '../../../src/lib/phaseResourceAssignments';
import { createBlankSurgeryRequest, mapRequestToBackendPayload } from '../../../src/utils/surgeryMappers';

const member: StaffMember = {
  id: '1', employeeId: '#STAFF-1', name: 'Test Nurse', title: 'Clinical Staff',
  specialization: ['Surgical Nursing'], skills: ['Scrub Nurse'], contractId: 'STA-1',
  supervisor: '', status: 'Active', email: '', pools: [], weeklySchedule: [],
  effortRoles: [{ id: '1', type: 'CLINICAL', description: 'Scrub Nurse', percentage: 100 }],
};

const pool: ResourcePool = {
  id: 'POOL-1', name: 'Nursing Pool', department: 'Surgery', location: '', totalMembers: 3,
  weeklyHours: 40, contractSplit: '50/50', primarySkill: 'Scrub Nurse', status: 'active',
  icon: 'Users', color: 'blue', kind: 'human',
};

test('matches full roles with case, punctuation, legacy wrappers and existing name aliases', () => {
  assert.equal(matchesResourceRole({ name: 'Surgeons' }, ['surgeon']), true);
  assert.equal(matchesResourceRole({ name: 'Scrub Nurses' }, [' SCRUB-NURSE ']), true);
  assert.equal(matchesResourceRole({ name: 'Operating Room' }, ['Operation Room']), true);
  assert.equal(matchesResourceRole({ name: 'Scrub Nurse' }, ['Clinical (Scrub Nurse)']), true);
  assert.equal(matchesResourceRole({ name: 'Anesthesia Tech' }, ['Anesthesiologist']), false);
  assert.equal(matchesResourceRole({ name: 'Scrub Nurse' }, ['Recovery Nurse']), false);
  assert.equal(matchesResourceRole({ name: '' }, ['']), false);
});

test('explicit resource roles override display names and support multiple configured roles', () => {
  const resource = { name: 'Surgical Team', roles: ['Scrub Nurse', 'Surgeon'] };
  assert.equal(matchesResourceRole(resource, ['Surgeon']), true);
  assert.equal(matchesResourceRole(resource, ['Scrub Nurse']), true);
  assert.equal(matchesResourceRole(resource, ['Surgical Team']), false);
  assert.equal(matchesResourceRole({ name: 'Surgeons', roles: [' '] }, ['Surgeon']), true);
});

test('staff match configured roles, not unrelated shared skills, specializations or title', () => {
  assert.equal(staffMatchesResourceRole({ name: 'Scrub Nurse' }, member), true);
  assert.equal(staffMatchesResourceRole({ name: 'Recovery Nurse' }, member), false);
  const recoveryNurse = {
    ...member, title: 'Scrub Nurse',
    effortRoles: [{ ...member.effortRoles[0], description: 'Recovery Nurse' }],
  };
  assert.equal(staffMatchesResourceRole({ name: 'Scrub Nurse' }, recoveryNurse), false);
  assert.equal(staffMatchesResourceRole({ name: 'Scrub Nurse' }, {
    ...member, effortRoles: [], weeklySchedule: [{ id: '1', day: 'Monday', startTime: '08:00', endTime: '16:00', role: 'Scrub Nurse' }],
  }), true);
  assert.equal(staffMatchesResourceRole({ name: 'Surgeon' }, {
    ...member, title: 'Surgeon', effortRoles: [],
  }), true);
});

test('human pools match primary role and never match by pool name', () => {
  assert.equal(poolMatchesResourceRole({ name: 'Scrub Nurse' }, pool), true);
  assert.equal(poolMatchesResourceRole({ name: 'Recovery Nurse' }, pool), false);
  assert.equal(poolMatchesResourceRole({ name: 'Surgeon' }, { ...pool, name: 'Surgeon Pool' }), false);
});

test('non-human pools derive a role from the pool name (minus "Pool"), falling back to resource type', () => {
  assert.equal(renewablePoolRole('Operation Room Pool', 'ROOM'), 'Operation Room');
  assert.equal(renewablePoolRole('ICU Bed Pool', 'BED'), 'ICU Bed');
  assert.equal(renewablePoolRole('IV Pump', 'EQUIPMENT'), 'IV Pump');
  assert.equal(renewablePoolRole('   ', 'EQUIPMENT'), 'EQUIPMENT');
});

test('equipment matches its derived role or resource type, not pool-name noise or human skills', () => {
  // App.tsx stores the derived pool-name role in primarySkill for non-human pools.
  const ivPump = { ...pool, kind: 'nonhuman' as const, primarySkill: 'IV Pump', resourceType: 'EQUIPMENT', name: 'IV Pump Pool' };
  assert.equal(poolMatchesResourceRole({ name: 'IV Pump' }, ivPump), true);
  assert.equal(poolMatchesResourceRole({ name: 'IV Pump', roles: ['equipment'] }, ivPump), true);
  assert.equal(poolMatchesResourceRole({ name: 'Operating Room' }, ivPump), false);
  assert.equal(poolMatchesResourceRole({ name: 'Scrub Nurse' }, ivPump), false);

  const operatingRoom = { ...pool, kind: 'nonhuman' as const, primarySkill: 'Operation Room', resourceType: 'ROOM', name: 'Operation Room Pool' };
  assert.equal(poolMatchesResourceRole({ name: 'Operating Room' }, operatingRoom), true);
  assert.equal(poolMatchesResourceRole({ name: 'IV Pump' }, operatingRoom), false);
});

test('assignment mode is restored from assignments and restricted by resource type', () => {
  assert.equal(getResourceAssignmentMode({ name: 'Nurse', count: 1, icon: 'nurse' }), 'staff');
  assert.equal(getResourceAssignmentMode({
    name: 'Nurse', count: 3, icon: 'nurse',
    assignments: [{ id: 'POOL-1', name: 'Pool', type: 'pool', poolId: 'POOL-1', resourceId: 'POOL-1' }],
  }), 'pool');
  for (const icon of ['equipment', 'bed', 'room']) {
    assert.equal(getResourceAssignmentMode({ name: 'Physical Resource', count: 1, icon }), 'nonhuman');
  }
});

test('whole-pool assignments persist all required positions in one solver requirement', () => {
  const request = createBlankSurgeryRequest();
  for (const phase of Object.values(request.phases)) {
    phase.resources = [{
      name: 'Team', roles: ['Scrub Nurse'], count: 3, icon: 'nurse', startTime: 5, endTime: 20,
      assignments: [{ id: 'POOL-1', name: 'Nursing Pool', type: 'pool', poolId: 'POOL-1', resourceId: 'POOL-1' }],
    }];
  }
  const payload = mapRequestToBackendPayload(request, 1);
  for (const [stage, requirements] of Object.entries(payload.stages)) {
    assert.deepEqual(requirements, [{
      role: 'Scrub Nurse', assigned: 'POOL-1', count: 3, duration: [5, 20],
      ...(stage === 'recovery' ? { probability: request.phases.recovery.icuProbability! / 100 } : {}),
    }]);
  }
});

test('direct staff and equipment unit pins retain count-one requirements and leave remaining slots open', () => {
  for (const assignment of [
    { id: '1', name: 'Staff', type: 'individual' as const, resourceId: 'STAFF-1' },
    { id: 'UNIT-1', name: 'Unit', type: 'pool' as const, poolId: 'POOL-1', resourceId: 'UNIT-1' },
  ]) {
    const request = createBlankSurgeryRequest();
    request.phases.operative.resources = [{
      name: 'Resource', roles: ['EQUIPMENT'], icon: 'equipment', count: 3, assignments: [assignment],
    }];
    const requirements = mapRequestToBackendPayload(request, 1).stages.operative!;
    assert.equal(requirements.length, 2);
    assert.equal(requirements[0].assigned, assignment.resourceId);
    assert.equal(requirements[0].count, 1);
    assert.equal(requirements[1].assigned, undefined);
    assert.equal(requirements[1].count, 2);
  }
});
