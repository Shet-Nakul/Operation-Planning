import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { AppStoreProvider, useAppStore } from '../../src/context/AppStoreContext';
import { Step2PhaseResources } from '../../src/components/surgery-request/steps/Step2PhaseResources';
import type { StaffMember } from '../../src/components/staff/types';
import type { ResourcePool } from '../../src/components/hr-pool/types';
import { getDefaultAppDataStore } from '../../src/data/store/loadDefaultStore';
import { createBlankSurgeryRequest, mapRequestToBackendPayload } from '../../src/utils/surgeryMappers';
import '../../src/index.css';

function staff(id: string, role: string, department = 'Surgery'): StaffMember {
  return {
    id, employeeId: `#STAFF-${id}`, name: `${role} ${id}`, title: role, department,
    specialization: [], skills: [], contractId: 'STA-1', supervisor: '', status: 'Active',
    email: '', weeklySchedule: [], pools: [],
    effortRoles: [{ id, type: 'CLINICAL', description: role, percentage: 100 }],
  };
}

function humanPool(id: string, name: string, role: string, department = 'Surgery'): ResourcePool {
  return {
    id, name, department, location: '', totalMembers: 3, weeklyHours: 40, contractSplit: '50/50',
    primarySkill: role, status: 'active', icon: 'Users', color: 'blue', kind: 'human',
  };
}

// Non-human pools carry no role column on the backend; App.tsx derives one from the pool name and
// stores it in primarySkill, keeping resource_type for display. The fixture mirrors that shape.
function equipmentPool(id: string, name: string, role: string, resourceType: string, department = 'Surgery'): ResourcePool {
  return {
    id, name, department, location: '', totalMembers: 3, weeklyHours: 40, contractSplit: '50/50',
    primarySkill: role, resourceType, status: 'active', icon: 'Boxes', color: 'blue', kind: 'nonhuman',
  };
}

function Fixture() {
  const { replaceStore } = useAppStore();
  const [data, setData] = useState(() => {
    const request = createBlankSurgeryRequest();
    request.department = 'Surgery';
    for (const phase of Object.values(request.phases)) phase.resources = [];
    request.phases.preOp.resources = [
      { name: 'Scrub Team', roles: ['Scrub Nurse'], icon: 'nurse', count: 3 },
      { name: 'IV Pump', icon: 'equipment', count: 2 },
    ];
    request.phases.sterilization.resources = [
      { name: 'Cleaning Crew', roles: ['Scrub Nurse'], icon: 'user', count: 2 },
    ];
    return request;
  });
  useEffect(() => {
    const store = getDefaultAppDataStore();
    // Staff 3 sits in a different department to prove department is no longer a matching criterion.
    store.staff = [staff('1', 'Scrub Nurse'), staff('2', 'Recovery Nurse'), staff('3', 'Scrub Nurse', 'Recovery')];
    store.resourcePools = [
      humanPool('HR-1', 'OR Scrub Pool', 'Scrub Nurse'),
      humanPool('HR-2', 'Recovery Nurse Pool', 'Recovery Nurse'),
      humanPool('HR-3', 'Night Scrub Pool', 'Scrub Nurse', 'Recovery'),
      equipmentPool('EQ-1', 'IV Pump Pool', 'IV Pump', 'EQUIPMENT'),
      equipmentPool('EQ-2', 'Surgical Light Pool', 'Surgical Light', 'EQUIPMENT'),
      equipmentPool('BED-1', 'ICU Bed Pool', 'ICU Bed', 'BED'),
    ];
    replaceStore(store);
  }, [replaceStore]);
  return <>
    <Step2PhaseResources
      data={data}
      updateData={updates => setData(previous => ({ ...previous, ...updates }))}
      onBack={() => {}}
      onNext={() => {}}
      onSaveDraft={() => {}}
    />
    <pre data-testid="payload">{JSON.stringify(mapRequestToBackendPayload(data, 1))}</pre>
  </>;
}

createRoot(document.getElementById('root')!).render(<AppStoreProvider><Fixture /></AppStoreProvider>);
