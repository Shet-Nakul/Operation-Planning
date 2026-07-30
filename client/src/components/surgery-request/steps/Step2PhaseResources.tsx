import { useState, useEffect, useContext, useMemo } from 'react';
import {
  Activity,
  AlertTriangle,
  Bed,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Clock,
  Droplets,
  Info,
  Layers,
  Package,
  Plus,
  Search,
  Stethoscope,
  User,
  Users,
  Wrench,
  X,
} from 'lucide-react';
import { motion } from 'motion/react';
import { createPortal } from 'react-dom';
import { cn } from '../../../lib/utils';
import { getPhaseDefaults, getAvailableDefaults } from '../../../lib/resourceDefaults';
import { getNonRenewableResources } from '../../../lib/api';
import type { SurgeryRequest } from '../../../types/surgery';
import { AppStoreContext } from '../../../context/AppStoreContext';

type MainPhase = 'preOp' | 'operative' | 'postOp';
type AssignmentPhase = MainPhase | 'sterilization';

type Step2Props = {
  data: SurgeryRequest;
  updateData: (updates: Partial<SurgeryRequest>) => void;
  onBack: () => void;
  onNext: () => void;
  onSaveDraft: () => void;
};

function priorityHeadline(p: SurgeryRequest['priority']): string {
  if (p === 'emergency') return 'Level 1 — Emergency';
  if (p === 'mandatory') return 'Level 2 — Urgent';
  return 'Level 3 — Elective';
}

/**
 * Parse duration string (e.g., "3 hr 30 min") to total minutes
 */
function parseDurationToMinutes(duration: string): number {
  let totalMinutes = 0;
  const dayMatch = duration.match(/(\d+)\s*day/);
  const hourMatch = duration.match(/(\d+)\s*hr/);
  const minMatch = duration.match(/(\d+)\s*min/);

  if (dayMatch) {
    totalMinutes += parseInt(dayMatch[1], 10) * 24 * 60;
  }
  if (hourMatch) {
    totalMinutes += parseInt(hourMatch[1], 10) * 60;
  }
  if (minMatch) {
    totalMinutes += parseInt(minMatch[1], 10);
  }

  return totalMinutes;
}

/**
 * Convert minutes to duration string (e.g., 210 => "3 hr 30 min", 1500 => "1 day 1 hr")
 */
function formatMinutesToDuration(minutes: number): string {
  if (minutes <= 0) return '0 min';

  const days = Math.floor(minutes / (24 * 60));
  const remainingMinutesAfterDays = minutes % (24 * 60);
  const hours = Math.floor(remainingMinutesAfterDays / 60);
  const mins = remainingMinutesAfterDays % 60;

  const parts: string[] = [];
  if (days > 0) {
    parts.push(`${days} day${days > 1 ? 's' : ''}`);
  }
  if (hours > 0) {
    parts.push(`${hours} hr`);
  }
  if (mins > 0 || parts.length === 0) {
    parts.push(`${mins} min`);
  }

  return parts.join(' ');
}

/**
 * Format minutes to time display (e.g., 90 => "1:30")
 */
function formatMinutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}:${mins.toString().padStart(2, '0')}`;
}

/**
 * Get cumulative time in minutes up to (but not including) a phase
 */
function getPhaseStartTime(phaseId: MainPhase, phases: { preOp: any; operative: any; postOp: any; sterilization: any; recovery: any }): number {
  const phaseOrder = ['preOp', 'operative', 'postOp'];
  let cumulativeTime = 0;

  for (const phase of phaseOrder) {
    if (phase === phaseId) {
      return cumulativeTime;
    }
    cumulativeTime += parseDurationToMinutes(phases[phase as MainPhase].duration);
  }

  return cumulativeTime;
}

/**
 * Extract role keywords from phase resource name and optional roles array.
 */
/**
 * Extract role keywords from phase resource name and optional roles array.
 */
function getResourceRoleKeywords(resourceName: string, roles?: string[]): string[] {
  const name = (resourceName ?? '').toLowerCase();
  const keywords: string[] = [];

  if (Array.isArray(roles) && roles.length > 0) {
    roles.forEach((r) => {
      if (!r) return;
      const lowerR = r.toLowerCase();
      keywords.push(lowerR);
      lowerR.split(/[\s,_\-/]+/).forEach((tok) => {
        if (tok.length > 2) keywords.push(tok);
      });
    });

    if (keywords.length === 0) {
      keywords.push(name);
    }

    return Array.from(new Set(keywords));
  }

  name.split(/[\s,_\-/]+/).forEach((tok) => {
    if (tok.length > 2 && !['and', 'for', 'the', 'with', 'unit'].includes(tok)) {
      keywords.push(tok);
    }
  });

  if (name.includes('surgeon')) {
    keywords.push('surgeon', 'surgery', 'surgical');
  }
  if (name.includes('anesthes') || name.includes('anesthet')) {
    keywords.push('anesthetist', 'anesthesia', 'anesthesiologist');
  }
  if (name.includes('nurse')) {
    keywords.push('nurse');
    if (name.includes('scrub')) keywords.push('scrub');
    if (name.includes('vitals')) keywords.push('vitals');
    if (name.includes('recovery')) keywords.push('recovery', 'pacu');
    if (name.includes('icu')) keywords.push('icu', 'critical');
    if (name.includes('circulat')) keywords.push('circulating');
  }
  if (name.includes('tech')) {
    keywords.push('technician', 'tech');
  }
  if (name.includes('clean') || name.includes('steriliz')) {
    keywords.push('sterilization', 'cleaning', 'crew');
  }
  if (name.includes('therapist')) {
    keywords.push('therapist', 'respiratory');
  }

  if (keywords.length === 0) {
    keywords.push(name);
  }

  return Array.from(new Set(keywords));
}

/**
 * Filter staff members & resource pools for a phase resource:
 * 1. Matching resource pools (e.g. Trauma Surgical Team, Anesthetics Pool).
 * 2. Staff belonging to a matching pool (pool members).
 * 3. Staff matching the role (title, specialization, skills, or roles).
 * 4. Other staff in the department.
 */
function getMatchingStaffForResource(
  resource: { name: string; roles?: string[] },
  selectedDept: string,
  staffList: any[],
  poolsList: any[],
  departmentsList: any[],
) {
  const keywords = getResourceRoleKeywords(resource.name, resource.roles);

  const normalize = (value?: string) => (value ?? '').trim().toLowerCase();
  const normalizeDeptKey = (value?: string) =>
    normalize(value)
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\bdepartments?\b/g, '')
      .replace(/\bservices?\b/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/s\b/g, '');

  const findDeptId = (deptName: string) => {
    const key = normalize(deptName);
    const row = departmentsList.find((d: any) => normalize(d.name) === key);
    return row ? Number(row.id) : undefined;
  };

  const deptKey = selectedDept ? normalize(selectedDept) : '';
  const deptCanonical = selectedDept ? normalizeDeptKey(selectedDept) : '';
  const selectedDeptId = selectedDept ? findDeptId(selectedDept) : undefined;

  const matchStaffDept = (s: any) => {
    if (!selectedDept) return true;
    const byName = normalize(s.department) === deptKey;
    const byCanonical = normalizeDeptKey(s.department) === deptCanonical;
    const byId =
      typeof selectedDeptId === 'number' &&
      (Number(s.departmentId) === selectedDeptId || Number(s.department_id) === selectedDeptId);
    return byName || byCanonical || byId;
  };

  const matchPoolDept = (p: any) => {
    if (!selectedDept) return true;
    const byName = normalize(p.department) === deptKey;
    const byCanonical = normalizeDeptKey(p.department) === deptCanonical;
    const byId =
      typeof selectedDeptId === 'number' &&
      (Number(p.departmentId) === selectedDeptId || Number(p.department_id) === selectedDeptId);
    return byName || byCanonical || byId;
  };

  const matchingPools = poolsList.filter((p: any) => {
    if (!matchPoolDept(p)) return false;
    const pName = normalize(p.name);
    const pSkill = normalize(p.primarySkill);
    const pDept = normalize(p.department);
    return keywords.some((kw) => pName.includes(kw) || pSkill.includes(kw) || pDept.includes(kw));
  });

  const matchingPoolIds = new Set(matchingPools.map((p: any) => String(p.id)));
  const matchingPoolNames = new Set(matchingPools.map((p: any) => normalize(p.name)));

  const deptStaff = staffList.filter(matchStaffDept);

  const poolMembers: { staff: any; poolName: string }[] = [];
  const roleMatchedStaff: any[] = [];

  deptStaff.forEach((s: any) => {
    const title = normalize(s.title);
    const spec = Array.isArray(s.specialization) ? s.specialization.join(' ').toLowerCase() : '';
    const skills = Array.isArray(s.skills) ? s.skills.join(' ').toLowerCase() : '';
    const sRoles = Array.isArray(s.roles) ? s.roles.join(' ').toLowerCase() : '';
    const sEffort = Array.isArray(s.effortRoles)
      ? s.effortRoles.map((e: any) => (e.description ?? '').toLowerCase()).join(' ')
      : '';
    const sPools = Array.isArray(s.pools) ? s.pools : [];

    const inMatchingPool = sPools.find((pRef: string) =>
      matchingPoolIds.has(String(pRef)) || matchingPoolNames.has(normalize(pRef))
    );

    let matchingPoolObj = null;
    if (inMatchingPool) {
      matchingPoolObj = matchingPools.find(
        (p: any) => String(p.id) === String(inMatchingPool) || normalize(p.name) === normalize(inMatchingPool)
      );
    }

    const matchesRole = keywords.some(
      (kw) => title.includes(kw) || spec.includes(kw) || skills.includes(kw) || sRoles.includes(kw) || sEffort.includes(kw)
    );

    if (matchingPoolObj) {
      poolMembers.push({ staff: s, poolName: matchingPoolObj.name });
    } else if (matchesRole) {
      roleMatchedStaff.push(s);
    }
  });

  return { poolMembers, roleMatchedStaff, matchingPools };
}

/**
 * Generate specific non-human resource items for a phase resource.
 * Equipment/Assets do NOT have role associations — show all department-available
 * facilities and pool units, plus inventory items, so the user can freely pick
 * any relevant specific asset. Name matching is still used to surface the most
 * relevant options first.
 */
function getSpecificNonHumanResources(
  resource: { name: string; icon: string; roles?: string[] },
  selectedDept: string,
  poolsList: any[],
  nonRenewableList: any[],
) {
  const nameLower = (resource.name ?? '').toLowerCase();
  const icon = resource.icon;
  const keywords = getResourceRoleKeywords(resource.name, resource.roles);
  const wordTokens = nameLower.split(/[\s,_\-/]+/).filter((t: string) => t.length > 2);

  const results: { id: string; name: string; category: string; source: string; status?: string }[] = [];
  const addedIds = new Set<string>();

  const addUnit = (id: string, name: string, category: string, source: string, status = 'Available') => {
    if (addedIds.has(id)) return;
    addedIds.add(id);
    results.push({ id, name, category, source, status });
  };

  const normalizeDept = (v?: string) =>
    (v ?? '').trim().toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\bdepartments?\b/g, '').replace(/\bservices?\b/g, '')
      .replace(/\s+/g, ' ').trim().replace(/s\b/g, '');

  const deptKey = normalizeDept(selectedDept);

  const poolMatchesDept = (pool: any) => {
    if (!selectedDept) return true;
    const pDept = normalizeDept(pool.department);
    return pDept === deptKey || (pool.department ?? '').toLowerCase().includes(deptKey);
  };

  // 1. Operating Room / Room units
  if (icon === 'room' || nameLower.includes('room') || nameLower.includes('suite')) {
    addUnit('room-or-1', 'OR Suite 101 (Main Operating Room)', 'Operating Room', 'Surgical Block');
    addUnit('room-or-2', 'OR Suite 102 (Cardio / Ortho Suite)', 'Operating Room', 'Surgical Block');
    addUnit('room-or-3', 'OR Suite 103 (Neuro & Hybrid Suite)', 'Operating Room', 'Surgical Block');
    addUnit('room-or-4', 'OR Suite 104 (Day Surgery Unit)', 'Operating Room', 'Surgical Block');
  }

  // 2. PACU / ICU Bed units
  if (icon === 'bed' || nameLower.includes('bed') || nameLower.includes('pacu') || nameLower.includes('icu')) {
    if (nameLower.includes('icu')) {
      addUnit('bed-icu-1', 'ICU Bed 01 (Critical Care Unit)', 'ICU Bed', 'ICU Intensive Care');
      addUnit('bed-icu-2', 'ICU Bed 02 (Critical Care Unit)', 'ICU Bed', 'ICU Intensive Care');
      addUnit('bed-icu-3', 'ICU Bed 03 (Isolation Unit)', 'ICU Bed', 'ICU Intensive Care');
    } else {
      addUnit('bed-pacu-1', 'PACU Bed 01 (Post-Anesthesia Bay)', 'PACU Bed', 'Perioperative Services');
      addUnit('bed-pacu-2', 'PACU Bed 02 (Post-Anesthesia Bay)', 'PACU Bed', 'Perioperative Services');
      addUnit('bed-pacu-3', 'PACU Bed 03 (Recovery Bay)', 'PACU Bed', 'Perioperative Services');
    }
  }

  // 3. Resolve units from non-human resource pools
  //    Show ALL non-human pools in the selected department (equipment has no roles).
  //    Pools matching the resource name are surfaced but dept-available pools always included.
  const nonHumanPools = poolsList.filter((p: any) => !['user', 'nurse'].includes((p.icon ?? '').toLowerCase()));

  const rankedPools: { pool: any; score: number }[] = [];
  nonHumanPools.forEach((pool: any) => {
    if (!poolMatchesDept(pool)) return;
    const pName = (pool.name ?? '').toLowerCase();
    const pSkill = (pool.primarySkill ?? '').toLowerCase();
    const pDept = (pool.department ?? '').toLowerCase();
    let score = 0;
    if (wordTokens.some((tok: string) => pName.includes(tok) || pSkill.includes(tok))) score += 10;
    if (keywords.some((kw) => pName.includes(kw) || pSkill.includes(kw) || pDept.includes(kw))) score += 6;
    if (pName.includes(nameLower) || pSkill.includes(nameLower)) score += 8;
    rankedPools.push({ pool, score });
  });
  rankedPools.sort((a, b) => b.score - a.score);

  rankedPools.forEach(({ pool }) => {
    const count = Math.min(pool.totalMembers || pool.total_capacity || 4, 6);
    for (let i = 1; i <= count; i++) {
      addUnit(
        `${pool.id}-unit-${i}`,
        `${pool.name} — Unit #${i}`,
        (pool.resource_type || (pool.icon && `${pool.icon} pool`) || 'Facility Pool'),
        pool.location || pool.department || 'Central Supply',
        pool.status,
      );
    }
  });

  // 4. Resolve items from non-renewable inventory (broader, name/category based)
  const rankedInventory: { item: any; score: number }[] = [];
  nonRenewableList.forEach((item: any) => {
    const itemName = (item.name ?? '').toLowerCase();
    const itemCat = (item.category ?? '').toLowerCase();
    let score = 0;
    if (wordTokens.some((tok: string) => itemName.includes(tok))) score += 10;
    if (keywords.some((kw) => itemName.includes(kw) || itemCat.includes(kw))) score += 5;
    if (itemName.includes(nameLower) || itemCat.includes(nameLower)) score += 8;
    if (!selectedDept || score > 0) {
      rankedInventory.push({ item, score });
    }
  });
  rankedInventory.sort((a, b) => b.score - a.score);
  const topInventory = rankedInventory.slice(0, 20);

  topInventory.forEach(({ item }) => {
    addUnit(
      `nr-${item.resource_id || item.id}`,
      `${item.name} (${item.spec ? item.spec + ' • ' : ''}Stock: ${item.stockpile_qty})`,
      item.category || 'Inventory',
      'Central Pharmacy / Supply',
      item.status || 'AVAILABLE',
    );
  });

  // 5. Fallback specific items if none found
  if (results.length === 0) {
    addUnit(`${nameLower}-unit-1`, `${resource.name} #1`, 'Facility Asset', 'Central Operations');
    addUnit(`${nameLower}-unit-2`, `${resource.name} #2`, 'Facility Asset', 'Central Operations');
    addUnit(`${nameLower}-unit-3`, `${resource.name} #3`, 'Facility Asset', 'Central Operations');
  }

  return results;
}

export function Step2PhaseResources({ data, updateData, onBack, onNext, onSaveDraft }: Step2Props) {
  const context = useContext(AppStoreContext);
  const settings = context?.store.settings;
  const modalRoot = typeof document !== 'undefined' ? document.body : null;

  const [selectedPhaseForAdd, setSelectedPhaseForAdd] = useState<MainPhase | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ phaseId: MainPhase; resourceIndex: number; resourceName: string } | null>(null);
  const [activeSlider, setActiveSlider] = useState<string | null>(null);
  const [expandedResources, setExpandedResources] = useState<Record<string, boolean>>({});
  const [assignmentMode, setAssignmentMode] = useState<Record<string, 'staff' | 'pool' | 'nonhuman'>>({});
  const [assignmentDept, setAssignmentDept] = useState<Record<string, string>>({});
  const [assignmentEditor, setAssignmentEditor] = useState<{ phaseId: AssignmentPhase; resourceIndex: number } | null>(null);
  const [nonRenewableItems, setNonRenewableItems] = useState<any[]>([]);
  const [assignmentSearch, setAssignmentSearch] = useState<string>('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const rows = await getNonRenewableResources({ orgId: 1, limit: 100 });
        if (!cancelled && Array.isArray(rows)) {
          setNonRenewableItems(rows);
        }
      } catch {
        if (!cancelled) setNonRenewableItems([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const staff = context?.store.staff ?? [];
  const pools = context?.store.resourcePools ?? [];
  const departments = context?.store.settings?.catalogs?.departments ?? [];

  const normalize = (value?: string) => (value ?? '').trim().toLowerCase();
  const normalizeDepartmentKey = (value?: string) =>
    normalize(value)
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\bdepartments?\b/g, '')
      .replace(/\bservices?\b/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/s\b/g, '');

  const findDepartmentId = (deptName: string) => {
    const key = normalize(deptName);
    const row = departments.find((d) => normalize(d.name) === key);
    return row ? Number(row.id) : undefined;
  };

  // Get unique department names from settings.
  const deptNames = useMemo(() => {
    const names = departments
      .map(d => (d.name ?? '').trim())
      .filter(Boolean);

    return Array.from(new Set(names)).sort((a, b) => a.localeCompare(b));
  }, [departments]);

  // Get staff members in a department
  const getStaffByDept = (dept: string) => {
    const deptKey = normalize(dept);
    const deptCanonical = normalizeDepartmentKey(dept);
    const selectedDeptId = findDepartmentId(dept);

    return staff.filter((s: any) => {
      const byName = normalize(s.department) === deptKey;
      const byCanonical = normalizeDepartmentKey(s.department) === deptCanonical;
      const byId =
        typeof selectedDeptId === 'number' &&
        (Number(s.departmentId) === selectedDeptId || Number(s.department_id) === selectedDeptId);
      return byName || byCanonical || byId;
    });
  };

  // Get pools in a department, segregated by human/non-human
  const getPoolsByDept = (dept: string) => {
    const deptKey = normalize(dept);
    const deptCanonical = normalizeDepartmentKey(dept);
    const selectedDeptId = findDepartmentId(dept);

    const all = pools.filter((p: any) => {
      const byName = normalize(p.department) === deptKey;
      const byCanonical = normalizeDepartmentKey(p.department) === deptCanonical;
      const byId =
        typeof selectedDeptId === 'number' &&
        (Number(p.departmentId) === selectedDeptId || Number(p.department_id) === selectedDeptId);
      return byName || byCanonical || byId;
    });
    const human = all.filter(p => ['user', 'nurse'].includes(normalize(p.icon)));
    const nonHuman = all.filter(p => !['user', 'nurse'].includes(normalize(p.icon)));
    return { all, human, nonHuman };
  };

  const getResourceKey = (phaseId: AssignmentPhase, resourceIndex: number) => `${phaseId}-${resourceIndex}`;

  const getAssignmentSummaryLabel = (resource: { assignments?: { type?: 'individual' | 'pool' }[]; count?: number } | undefined, resourceKey: string) => {
    const assignments = resource?.assignments ?? [];
    const mode = assignmentMode[resourceKey] ?? 'staff';

    if (assignments.length === 0) {
      return 'No assignments';
    }

    if (mode === 'pool') {
      return 'Human pool assigned';
    }

    if (mode === 'nonhuman') {
      return 'Equipment pool assigned';
    }

    return `Assigned ${assignments.length}/${resource?.count ?? assignments.length}`;
  };

  const getPhaseResources = (phaseId: AssignmentPhase) => {
    if (phaseId === 'sterilization') return data.phases.sterilization.resources;
    return data.phases[phaseId].resources;
  };

  const getResourceAssignments = (phaseId: AssignmentPhase, resourceIndex: number) => {
    const resource = getPhaseResources(phaseId)[resourceIndex];
    return resource?.assignments ?? [];
  };

  const setResourceAssignments = (phaseId: AssignmentPhase, resourceIndex: number, assignments: { type: 'individual' | 'pool'; id: string; name: string }[]) => {
    if (phaseId === 'sterilization') {
      const resources = data.phases.sterilization.resources.map((r, idx) =>
        idx === resourceIndex ? { ...r, assignments } : r
      );
      updateData({
        phases: {
          ...data.phases,
          sterilization: { ...data.phases.sterilization, resources },
        },
      });
      return;
    }

    const phase = data.phases[phaseId];
    const resources = phase.resources.map((r, idx) =>
      idx === resourceIndex ? { ...r, assignments } : r
    );
    updateData({
      phases: {
        ...data.phases,
        [phaseId]: { ...phase, resources },
      },
    });
  };

  useEffect(() => {
    if (deptNames.length === 0) {
      setAssignmentDept({});
      return;
    }

    const validSet = new Set(deptNames.map(normalize));
    setAssignmentDept(prev => {
      const next: Record<string, string> = {};
      for (const [key, value] of Object.entries(prev)) {
        if (validSet.has(normalize(value))) {
          next[key] = value;
        }
      }
      return Object.keys(next).length === Object.keys(prev).length ? prev : next;
    });
  }, [deptNames]);

  useEffect(() => {
    if (!data.department) return;
    setAssignmentDept(prev => {
      const next: Record<string, string> = { ...prev };
      let changed = false;
      for (const key of Object.keys(next)) {
        if (!next[key]) {
          next[key] = data.department ?? '';
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [data.department]);

  const getSelectionLimit = (mode: 'staff' | 'pool' | 'nonhuman', resourceCount: number) => {
    return mode === 'staff' ? resourceCount : 1;
  };

  const isPersonnelResource = (icon: string) => icon === 'user' || icon === 'nurse';

  const toggleResourceExpand = (key: string) => {
    setExpandedResources(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const phases: {
    id: MainPhase;
    title: string;
    desc: string;
    active?: boolean;
  }[] = [
      {
        id: 'preOp',
        title: 'Pre-operative',
        desc: 'Initial stabilization and vitals monitoring.',
      },
      {
        id: 'operative',
        title: 'Operative',
        desc: 'Core surgical procedure and anesthesia.',
        active: true,
      },
      {
        id: 'postOp',
        title: 'Post-operative',
        desc: 'Initial emergence and recovery.',
      },
    ];

  const ster = data.phases.sterilization;
  const cleaning = ster.resources[0] ?? { name: 'Cleaning Crew', count: 2, icon: 'user' };
  const icu = data.phases.recovery.icuProbability ?? 35;

  const setCleaningCount = (count: number) => {
    const resources =
      ster.resources.length > 0
        ? ster.resources.map((r, i) => (i === 0 ? { ...r, count: Math.max(0, count) } : r))
        : [{ ...cleaning, count: Math.max(0, count) }];
    updateData({
      phases: {
        ...data.phases,
        sterilization: { ...ster, resources },
      },
    });
  };

  // Clear active slider on mouse/touch release
  useEffect(() => {
    const handleRelease = () => setActiveSlider(null);
    window.addEventListener('mouseup', handleRelease);
    window.addEventListener('touchend', handleRelease);
    return () => {
      window.removeEventListener('mouseup', handleRelease);
      window.removeEventListener('touchend', handleRelease);
    };
  }, []);

  return (
    <div className="max-w-5xl mx-auto">
      <header className="mb-10">
        <div className="flex justify-between items-end">
          <div>
            <nav className="flex items-center gap-2 text-sm text-slate-500 mb-4">
              <span>Request Workflow</span>
              <ChevronRight size={12} />
              <span className="text-on-surface font-semibold">Resource Phase Allocation</span>
            </nav>
            <h1 className="text-4xl font-extrabold tracking-tight text-on-surface font-headline">Phase Resource Configuration</h1>
            <p className="mt-2 text-slate-600 max-w-2xl">Define clinical staff, room availability, and specialized equipment across the surgical lifecycle.</p>
          </div>
          <div className="text-right">
            <span className="text-xs uppercase tracking-widest font-bold text-primary">Priority Level</span>
            <div className="text-2xl font-bold text-error">{priorityHeadline(data.priority)}</div>
          </div>
        </div>

        <div className="mt-12 flex items-center justify-between relative">
          <div className="absolute h-0.5 bg-outline-variant/30 left-0 right-0 top-1/2 -translate-y-1/2 z-0" />
          {[
            { label: 'Patient Data', icon: Check, done: true },
            { label: 'Phases & Resources', icon: Activity, active: true },
            { label: 'Scheduling', icon: Clock },
            { label: 'Final Review', icon: CheckCircle2 },
          ].map((step, i) => (
            <div key={i} className="relative z-10 flex flex-col items-center gap-2 group">
              <div
                className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center transition-all',
                  step.done
                    ? 'bg-tertiary text-white shadow-lg'
                    : step.active
                      ? 'bg-primary text-white shadow-xl ring-4 ring-primary-container/20'
                      : 'bg-surface-container-highest text-outline',
                )}
              >
                <step.icon size={20} />
              </div>
              <span
                className={cn(
                  'text-xs font-bold',
                  step.done ? 'text-tertiary' : step.active ? 'text-primary' : 'text-outline',
                )}
              >
                {step.label}
              </span>
            </div>
          ))}
        </div>
      </header>

      <div className="space-y-8 pb-20">
        {phases.map((phase) => {
          const cfg = data.phases[phase.id];
          return (
            <div
              key={phase.id}
              className="bg-surface-container-lowest rounded-xl p-8 flex flex-col md:flex-row gap-8 relative overflow-hidden border border-slate-100 shadow-sm"
            >
              {phase.active && <div className="absolute top-0 right-0 w-2 h-full bg-primary-container" />}
              <div className="md:w-1/4">
                <h3 className="text-2xl font-bold font-headline mb-2">{phase.title}</h3>
                <p className="text-sm text-slate-500">{phase.desc}</p>
                <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-primary">
                  <Clock size={14} />
                  <div className="flex items-center gap-1 bg-surface-container-low px-1 py-1 rounded border border-outline-variant/30">
                    <button
                      type="button"
                      onClick={() => {
                        const minutes = Math.max(15, parseDurationToMinutes(cfg.duration) - 15);
                        const newDuration = formatMinutesToDuration(minutes);
                        updateData({
                          phases: {
                            ...data.phases,
                            [phase.id]: { ...cfg, duration: newDuration },
                          },
                        });
                      }}
                      className="p-0.5 hover:bg-surface-container rounded transition-colors"
                      aria-label="Decrease duration"
                    >
                      <ChevronDown size={16} />
                    </button>
                    <span className="px-2 min-w-20 text-center">{cfg.duration}</span>
                    <button
                      type="button"
                      onClick={() => {
                        const minutes = parseDurationToMinutes(cfg.duration) + 15;
                        const newDuration = formatMinutesToDuration(minutes);
                        updateData({
                          phases: {
                            ...data.phases,
                            [phase.id]: { ...cfg, duration: newDuration },
                          },
                        });
                      }}
                      className="p-0.5 hover:bg-surface-container rounded transition-colors"
                      aria-label="Increase duration"
                    >
                      <ChevronUp size={16} />
                    </button>
                  </div>
                  <span className="text-[10px] text-slate-400">(EST)</span>
                </div>
              </div>
              <div className="flex-1 flex items-start gap-4">
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {cfg.resources.map((res, i) => {
                    const resourceKey = getResourceKey(phase.id, i);
                    const assignmentSummaryLabel = getAssignmentSummaryLabel(res, resourceKey);
                    return (
                      <div
                        key={`${phase.id}-${i}-${res.name}`}
                        className="bg-surface-container-low p-4 rounded-lg flex flex-col gap-3 group hover:bg-surface-container transition-colors relative"
                      >
                        <div className="flex justify-between items-center gap-2">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="text-tertiary">
                              <Stethoscope size={20} />
                            </div>
                            <div className="flex items-center gap-1 min-w-0">
                              <span className="text-sm font-bold truncate">{res.name}</span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setDeleteConfirm({ phaseId: phase.id, resourceIndex: i, resourceName: res.name })}
                            className="text-slate-400 hover:text-error transition-colors shrink-0"
                            aria-label="Delete resource"
                          >
                            <X size={16} />
                          </button>
                        </div>
                        <div className="flex items-center justify-end">
                          <input
                            type="number"
                            min={0}
                            className="w-14 bg-surface-container-lowest border-none focus:ring-1 focus:ring-primary text-sm font-bold rounded p-1 text-center"
                            value={res.count}
                            onChange={(e) => {
                              const v = Math.max(0, parseInt(e.target.value, 10) || 0);
                              const p = data.phases[phase.id];
                              const resources = p.resources.map((r, idx) => (idx === i ? { ...r, count: v } : r));
                              updateData({
                                phases: {
                                  ...data.phases,
                                  [phase.id]: { ...p, resources },
                                },
                              });
                            }}
                          />
                        </div>
                        <div className="space-y-2 border-t border-surface-container pt-2">
                          <div className="flex items-center justify-between">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                              {assignmentSummaryLabel}
                            </label>
                            <button
                              type="button"
                              onClick={() => {
                                const resourceKey = getResourceKey(phase.id, i);
                                setAssignmentDept(prev => ({ ...prev, [resourceKey]: prev[resourceKey] || data.department || '' }));
                                setAssignmentEditor({ phaseId: phase.id, resourceIndex: i });
                              }}
                              className="text-[10px] font-bold text-primary hover:text-primary/80 transition-colors"
                            >
                              Manage
                            </button>
                          </div>
                          {(res.assignments ?? []).length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                              {(res.assignments ?? []).map((assignment) => (
                                <span key={assignment.id} className="text-[10px] bg-primary/10 text-primary rounded px-2 py-1 font-semibold">
                                  {assignment.name}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        {/* Timeline Range Slider for Resource Allocation */}
                        <div className="pt-2 border-t border-surface-container space-y-2">
                          {(() => {
                            const phaseStartOffset = getPhaseStartTime(phase.id, data.phases);
                            const phaseDurationMinutes = parseDurationToMinutes(cfg.duration);
                            const phaseEndOffset = phaseStartOffset + phaseDurationMinutes;
                            const resStartTime = res.startTime ?? 0;
                            const resEndTime = res.endTime ?? phaseDurationMinutes;
                            const absStartTime = phaseStartOffset + resStartTime;
                            const absEndTime = phaseStartOffset + Math.min(resEndTime, phaseDurationMinutes);
                            const isExpanded = expandedResources[`${phase.id}-${i}`];
                            const isThroughout = resStartTime === 0 && resEndTime >= phaseDurationMinutes;

                            return (
                              <>
                                <button
                                  type="button"
                                  onClick={() => toggleResourceExpand(`${phase.id}-${i}`)}
                                  className="flex items-center justify-between gap-2 w-full text-left"
                                >
                                  <div className="flex items-center gap-1">
                                    <span className="text-xs text-outline font-semibold">Required Time Window</span>
                                    <ChevronDown
                                      size={14}
                                      className={cn("text-outline transition-transform", isExpanded && "rotate-180")}
                                    />
                                  </div>
                                  <span className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded uppercase tracking-wider">
                                    {isThroughout ? 'Throughout' : `${formatMinutesToTime(absStartTime)} - ${formatMinutesToTime(absEndTime)}`}
                                  </span>
                                </button>

                                {isExpanded && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    className="overflow-hidden pt-2"
                                  >
                                    <div className="relative pt-2 pb-2">
                                      {/* Background track */}
                                      <div className="absolute h-1 bg-slate-200 rounded-lg w-full top-1/2 -translate-y-1/2" />

                                      {/* 15-minute markers */}
                                      <div className="absolute w-full flex items-center top-1/2 -translate-y-1/2 px-0">
                                        {Array.from({ length: Math.floor(parseDurationToMinutes(cfg.duration) / 15) + 1 }).map((_, idx) => {
                                          const percentage = (idx * 15 / parseDurationToMinutes(cfg.duration)) * 100;
                                          return (
                                            <div
                                              key={idx}
                                              className="absolute w-0.5 h-2 bg-slate-300"
                                              style={{
                                                left: `${percentage}%`,
                                                transform: 'translateX(-50%)',
                                              }}
                                            />
                                          );
                                        })}
                                      </div>

                                      {/* Active range highlight */}
                                      <div
                                        className="absolute h-1 bg-gradient-to-r from-primary to-tertiary rounded-lg top-1/2 -translate-y-1/2"
                                        style={{
                                          left: `${(resStartTime / parseDurationToMinutes(cfg.duration)) * 100}%`,
                                          right: `${100 - (resEndTime / parseDurationToMinutes(cfg.duration)) * 100}%`,
                                        }}
                                      />

                                      {/* Start time slider */}
                                      <input
                                        type="range"
                                        min={0}
                                        max={parseDurationToMinutes(cfg.duration)}
                                        step={15}
                                        value={resStartTime}
                                        onMouseDown={() => setActiveSlider(`${phase.id}-${i}-start`)}
                                        onTouchStart={() => setActiveSlider(`${phase.id}-${i}-start`)}
                                        onChange={(e) => {
                                          const startVal = parseInt(e.target.value, 10);
                                          const p = data.phases[phase.id];
                                          const endVal = res.endTime ?? parseDurationToMinutes(cfg.duration);
                                          const resources = p.resources.map((r, idx) =>
                                            idx === i ? { ...r, startTime: startVal, endTime: Math.max(startVal, endVal) } : r
                                          );
                                          updateData({
                                            phases: {
                                              ...data.phases,
                                              [phase.id]: { ...p, resources },
                                            },
                                          });
                                        }}
                                        className="absolute w-full h-1 top-1/2 -translate-y-1/2 appearance-none bg-transparent rounded-lg cursor-pointer"
                                        style={{
                                          zIndex: activeSlider === `${phase.id}-${i}-start` ? 10 : 3,
                                        }}
                                      />

                                      {/* End time slider */}
                                      <input
                                        type="range"
                                        min={0}
                                        max={parseDurationToMinutes(cfg.duration)}
                                        step={15}
                                        value={resEndTime}
                                        onMouseDown={() => setActiveSlider(`${phase.id}-${i}-end`)}
                                        onTouchStart={() => setActiveSlider(`${phase.id}-${i}-end`)}
                                        onChange={(e) => {
                                          const endVal = parseInt(e.target.value, 10);
                                          const p = data.phases[phase.id];
                                          const resources = p.resources.map((r, idx) =>
                                            idx === i ? { ...r, endTime: endVal } : r
                                          );
                                          updateData({
                                            phases: {
                                              ...data.phases,
                                              [phase.id]: { ...p, resources },
                                            },
                                          });
                                        }}
                                        className="absolute w-full h-1 top-1/2 -translate-y-1/2 appearance-none bg-transparent rounded-lg cursor-pointer"
                                        style={{
                                          zIndex: activeSlider === `${phase.id}-${i}-end` ? 10 : 3,
                                        }}
                                      />
                                    </div>
                                    <div className="flex items-center justify-between text-xs text-slate-400">
                                      <span>{formatMinutesToTime(phaseStartOffset)}</span>
                                      <span>{formatMinutesToTime(phaseEndOffset)}</span>
                                    </div>
                                  </motion.div>
                                )}
                              </>
                            );
                          })()}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedPhaseForAdd(phase.id)}
                  className="w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-lg hover:scale-110 transition-transform shrink-0"
                  aria-label="Add resource to phase"
                >
                  <Plus size={20} />
                </button>
              </div>
            </div>
          );
        })}

        {/* Resource Selection Modal - Outside phase container */}
        {selectedPhaseForAdd && modalRoot && createPortal((
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/50 z-[200]"
              onClick={() => setSelectedPhaseForAdd(null)}
            />
            {/* Modal */}
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[210]">
              <div className="bg-white rounded-lg shadow-2xl border border-slate-200 max-h-96 overflow-y-auto min-w-72">
                <div className="sticky top-0 flex justify-between items-center p-4 bg-surface-container-low border-b border-slate-200">
                  <h3 className="font-bold text-on-surface">Select Resource</h3>
                  <button
                    type="button"
                    onClick={() => setSelectedPhaseForAdd(null)}
                    className="text-slate-500 hover:text-on-surface transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
                <div className="p-2 space-y-1">
                  {(() => {
                    const phaseId = selectedPhaseForAdd;
                    const phaseConfig = data.phases[phaseId];
                    const available = getAvailableDefaults(phaseConfig, phaseId, settings);

                    if (available.length === 0) {
                      return (
                        <div className="px-4 py-6 text-center text-sm text-outline">
                          All resources for this phase have been added.
                        </div>
                      );
                    }

                    return available.map((resource, idx) => (
                      <button
                        key={`${phaseId}-option-${idx}`}
                        type="button"
                        onClick={() => {
                          const p = data.phases[phaseId];
                          const resources = [...p.resources, resource];
                          updateData({
                            phases: {
                              ...data.phases,
                              [phaseId]: { ...p, resources },
                            },
                          });
                          setSelectedPhaseForAdd(null);
                        }}
                        className="w-full text-left px-4 py-3 hover:bg-primary/5 rounded-lg transition-colors flex items-center justify-between group"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <div className="text-tertiary">
                            <Stethoscope size={18} />
                          </div>
                          <div>
                            <p className="font-medium text-on-surface">{resource.name}</p>
                            <p className="text-xs text-outline">Default: {resource.count} count</p>
                          </div>
                        </div>
                        <Plus size={16} className="text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    ));
                  })()}
                </div>
              </div>
            </div>
          </>
        ), modalRoot)}

        {/* Assignment Management Modal */}
        {assignmentEditor && modalRoot && (
          (() => {
            const { phaseId, resourceIndex } = assignmentEditor;
            const resource = getPhaseResources(phaseId)[resourceIndex];
            if (!resource) return null;

            const resourceKey = getResourceKey(phaseId, resourceIndex);
            const selectedDept = assignmentDept[resourceKey] ?? data.department ?? '';

            const isPersonnel = ['user', 'nurse'].includes(resource.icon) ||
              ['surgeon', 'anesthes', 'nurse', 'tech', 'therapist', 'crew'].some(k => (resource.name ?? '').toLowerCase().includes(k));

            const mode = assignmentMode[resourceKey] ?? (isPersonnel ? 'staff' : 'nonhuman');
            const currentAssignments = getResourceAssignments(phaseId, resourceIndex);
            const selectionLimit = resource.count || 1;

            const { poolMembers, roleMatchedStaff, matchingPools } = getMatchingStaffForResource(
              resource,
              selectedDept,
              staff,
              pools,
              departments
            );

            const nonHumanOptions = getSpecificNonHumanResources(resource, selectedDept, pools, nonRenewableItems);

            const filterQuery = assignmentSearch.trim().toLowerCase();

            const filteredPoolMembers = filterQuery
              ? poolMembers.filter(pm => pm.staff.name.toLowerCase().includes(filterQuery) || pm.staff.title.toLowerCase().includes(filterQuery))
              : poolMembers;

            const filteredRoleStaff = filterQuery
              ? roleMatchedStaff.filter(s => s.name.toLowerCase().includes(filterQuery) || s.title.toLowerCase().includes(filterQuery))
              : roleMatchedStaff;

            const filteredNonHumanOptions = filterQuery
              ? nonHumanOptions.filter(o => o.name.toLowerCase().includes(filterQuery) || o.category.toLowerCase().includes(filterQuery))
              : nonHumanOptions;

            const addAssignmentItem = (item: { id: string; name: string }) => {
              if (!item?.id) return;
              if (currentAssignments.some(a => a.id === item.id)) return;
              if (currentAssignments.length >= selectionLimit) return;

              setResourceAssignments(phaseId, resourceIndex, [
                ...currentAssignments,
                { id: item.id, name: item.name, type: 'individual' },
              ]);
            };

            const removeAssignment = (id: string) => {
              setResourceAssignments(
                phaseId,
                resourceIndex,
                currentAssignments.filter(item => item.id !== id),
              );
            };

            return createPortal((
              <>
                <div
                  className="fixed inset-0 bg-black/50 z-[200]"
                  onClick={() => {
                    setAssignmentEditor(null);
                    setAssignmentSearch('');
                  }}
                />
                <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[210] w-[min(92vw,720px)]">
                  <div className="bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
                    {/* Header */}
                    <div className="flex justify-between items-center p-4 bg-surface-container-low border-b border-slate-200 shrink-0">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs uppercase font-bold text-primary tracking-wider">Configure Specific Resource</span>
                          <span className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded">
                            {isPersonnel ? 'Personnel Role' : 'Facility Asset'}
                          </span>
                        </div>
                        <h3 className="text-lg font-bold text-on-surface mt-0.5">{resource.name}</h3>
                        <p className="text-xs text-slate-500">
                          Assigned: <span className="font-bold text-on-surface">{currentAssignments.length}</span> / {selectionLimit} required
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setAssignmentEditor(null);
                          setAssignmentSearch('');
                        }}
                        className="text-slate-400 hover:text-on-surface transition-colors p-1"
                      >
                        <X size={20} />
                      </button>
                    </div>

                    <div className="p-4 space-y-4 overflow-y-auto flex-1">
                      {/* Top Bar: Dept selection & Mode toggle */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Department</label>
                          <select
                            value={selectedDept}
                            onChange={(e) => {
                              setAssignmentDept(prev => ({ ...prev, [resourceKey]: e.target.value }));
                            }}
                            className="w-full bg-surface-container-lowest border border-slate-200 focus:ring-1 focus:ring-primary text-xs font-bold rounded-lg px-3 py-2"
                          >
                            <option value="">— All Departments —</option>
                            {deptNames.map(dept => (
                              <option key={dept} value={dept}>{dept}</option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Category</label>
                          <div className="flex rounded-lg overflow-hidden border border-outline-variant/30 text-[11px] font-bold">
                            <button
                              type="button"
                              onClick={() => setAssignmentMode(prev => ({ ...prev, [resourceKey]: 'staff' }))}
                              className={cn(
                                'flex-1 py-2 flex items-center justify-center gap-1.5 transition-colors',
                                mode === 'staff'
                                  ? 'bg-primary text-on-primary'
                                  : 'bg-surface-container-lowest text-outline hover:bg-surface-container',
                              )}
                            >
                              <User size={14} />
                              Staff Members
                            </button>
                            <button
                              type="button"
                              onClick={() => setAssignmentMode(prev => ({ ...prev, [resourceKey]: 'nonhuman' }))}
                              className={cn(
                                'flex-1 py-2 flex items-center justify-center gap-1.5 transition-colors',
                                mode === 'nonhuman'
                                  ? 'bg-primary text-on-primary'
                                  : 'bg-surface-container-lowest text-outline hover:bg-surface-container',
                              )}
                            >
                              <Wrench size={14} />
                              Equipment & Assets
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Search Bar */}
                      <div className="relative">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          placeholder={mode === 'staff' ? `Search ${resource.name} staff by name or title...` : `Search specific ${resource.name} units or items...`}
                          value={assignmentSearch}
                          onChange={(e) => setAssignmentSearch(e.target.value)}
                          className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:bg-white focus:ring-1 focus:ring-primary transition-all"
                        />
                        {assignmentSearch && (
                          <button
                            type="button"
                            onClick={() => setAssignmentSearch('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                          >
                            <X size={14} />
                          </button>
                        )}
                      </div>

                      {/* Content Section based on Mode */}
                      {mode === 'staff' ? (
                        <div className="space-y-4">
                          <div className="flex items-start gap-2 p-2.5 rounded-lg bg-emerald-50 border border-emerald-100">
                            <Info size={14} className="text-emerald-600 mt-0.5 shrink-0" />
                            <div className="space-y-0.5">
                              <p className="text-[10px] font-bold text-emerald-800 leading-tight">
                                Staff shown are filtered by matching roles
                              </p>
                              <p className="text-[10px] text-emerald-700/90 leading-tight">
                                Only personnel whose title/specialization/skills match the Associated Roles
                                of this phase resource are listed. Configure roles in Settings › Catalogs ›
                                Phase Resources.
                              </p>
                            </div>
                          </div>

                          {/* Pool Members Section */}
                          {filteredPoolMembers.length > 0 && (
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <label className="text-[10px] font-extrabold text-blue-700 uppercase tracking-widest flex items-center gap-1.5">
                                  <Users size={12} />
                                  People in {matchingPools[0]?.name || `${resource.name} Pool`} ({filteredPoolMembers.length})
                                </label>
                                <span className="text-[9px] font-bold text-slate-400 bg-blue-50 px-2 py-0.5 rounded">Matching Pool</span>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                                {filteredPoolMembers.map(({ staff: s, poolName }) => {
                                  const isAssigned = currentAssignments.some(a => a.id === s.id);
                                  const disabled = isAssigned || currentAssignments.length >= selectionLimit;
                                  return (
                                    <div
                                      key={s.id}
                                      className={cn(
                                        'p-3 rounded-lg border flex items-center justify-between gap-2 transition-all',
                                        isAssigned
                                          ? 'bg-blue-50/70 border-blue-200'
                                          : 'bg-white border-slate-200 hover:border-blue-300 hover:shadow-sm'
                                      )}
                                    >
                                      <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-1.5">
                                          <p className="text-xs font-bold text-slate-900 truncate">{s.name}</p>
                                          <span className="text-[9px] font-extrabold bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded shrink-0">
                                            {poolName}
                                          </span>
                                        </div>
                                        <p className="text-[10px] text-slate-500 truncate">{s.title} • {s.department || 'Surgery'}</p>
                                      </div>
                                      <button
                                        type="button"
                                        disabled={disabled}
                                        onClick={() => addAssignmentItem({ id: s.id, name: `${s.name} (${s.title})` })}
                                        className={cn(
                                          'px-2.5 py-1 rounded-md text-[10px] font-bold transition-all shrink-0',
                                          isAssigned
                                            ? 'bg-emerald-100 text-emerald-800 cursor-default'
                                            : disabled
                                              ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                              : 'bg-primary text-on-primary hover:opacity-90 shadow-xs'
                                        )}
                                      >
                                        {isAssigned ? 'Assigned' : 'Assign'}
                                      </button>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* Role-Matched Staff Section */}
                          {filteredRoleStaff.length > 0 && (
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <label className="text-[10px] font-extrabold text-slate-600 uppercase tracking-widest flex items-center gap-1.5">
                                  <User size={12} />
                                  Role-Matched Staff: {resource.name} ({filteredRoleStaff.length})
                                </label>
                                <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">Matching Skill</span>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                                {filteredRoleStaff.map(s => {
                                  const isAssigned = currentAssignments.some(a => a.id === s.id);
                                  const disabled = isAssigned || currentAssignments.length >= selectionLimit;
                                  return (
                                    <div
                                      key={s.id}
                                      className={cn(
                                        'p-3 rounded-lg border flex items-center justify-between gap-2 transition-all',
                                        isAssigned
                                          ? 'bg-emerald-50/70 border-emerald-200'
                                          : 'bg-white border-slate-200 hover:border-primary/40 hover:shadow-sm'
                                      )}
                                    >
                                      <div className="min-w-0 flex-1">
                                        <p className="text-xs font-bold text-slate-900 truncate">{s.name}</p>
                                        <p className="text-[10px] text-slate-500 truncate">{s.title} • {s.department || 'Staff'}</p>
                                      </div>
                                      <button
                                        type="button"
                                        disabled={disabled}
                                        onClick={() => addAssignmentItem({ id: s.id, name: `${s.name} (${s.title})` })}
                                        className={cn(
                                          'px-2.5 py-1 rounded-md text-[10px] font-bold transition-all shrink-0',
                                          isAssigned
                                            ? 'bg-emerald-100 text-emerald-800 cursor-default'
                                            : disabled
                                              ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                              : 'bg-primary text-on-primary hover:opacity-90 shadow-xs'
                                        )}
                                      >
                                        {isAssigned ? 'Assigned' : 'Assign'}
                                      </button>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {filteredPoolMembers.length === 0 && filteredRoleStaff.length === 0 && (
                            <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                              <User size={32} className="mx-auto text-slate-300 mb-2" />
                              <p className="text-xs font-bold text-slate-600">No staff members found matching "{resource.name}" role</p>
                              <p className="text-[11px] text-slate-400 mt-1">Configure Associated Roles in Settings › Catalogs › Phase Resources, or try a different department.</p>
                            </div>
                          )}
                        </div>
                      ) : (
                        /* Non-Human Equipment & Assets Mode */
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <label className="text-[10px] font-extrabold text-slate-600 uppercase tracking-widest flex items-center gap-1.5">
                              <Package size={12} />
                              Specific Asset Units for {resource.name} ({filteredNonHumanOptions.length})
                            </label>
                            <span className="text-[9px] font-bold text-slate-400 bg-amber-50 text-amber-800 px-2 py-0.5 rounded">Specific Resource</span>
                          </div>

                          <div className="flex items-start gap-2 p-2.5 rounded-lg bg-sky-50 border border-sky-100">
                            <Info size={14} className="text-sky-600 mt-0.5 shrink-0" />
                            <div className="space-y-0.5">
                              <p className="text-[10px] font-bold text-sky-800 leading-tight">
                                Equipment &amp; assets have no role associations
                              </p>
                              <p className="text-[10px] text-sky-700/90 leading-tight">
                                All department-available facilities, pool units, and inventory are shown below.
                                Relevance-ranked by resource name. Select any specific asset you need.
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1">
                            {filteredNonHumanOptions.map(opt => {
                              const isAssigned = currentAssignments.some(a => a.id === opt.id);
                              const disabled = isAssigned || currentAssignments.length >= selectionLimit;
                              return (
                                <div
                                  key={opt.id}
                                  className={cn(
                                    'p-3 rounded-lg border flex items-center justify-between gap-2 transition-all',
                                    isAssigned
                                      ? 'bg-amber-50/70 border-amber-200'
                                      : 'bg-white border-slate-200 hover:border-amber-400 hover:shadow-sm'
                                  )}
                                >
                                  <div className="min-w-0 flex-1">
                                    <p className="text-xs font-bold text-slate-900 truncate">{opt.name}</p>
                                    <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5">
                                      <span>{opt.category}</span>
                                      <span>•</span>
                                      <span>{opt.source}</span>
                                    </div>
                                  </div>
                                  <button
                                    type="button"
                                    disabled={disabled}
                                    onClick={() => addAssignmentItem({ id: opt.id, name: opt.name })}
                                    className={cn(
                                      'px-2.5 py-1 rounded-md text-[10px] font-bold transition-all shrink-0',
                                      isAssigned
                                        ? 'bg-emerald-100 text-emerald-800 cursor-default'
                                        : disabled
                                          ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                          : 'bg-primary text-on-primary hover:opacity-90 shadow-xs'
                                    )}
                                  >
                                    {isAssigned ? 'Assigned' : 'Assign'}
                                  </button>
                                </div>
                              );
                            })}
                          </div>

                          {filteredNonHumanOptions.length === 0 && (
                            <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                              <Wrench size={32} className="mx-auto text-slate-300 mb-2" />
                              <p className="text-xs font-bold text-slate-600">No specific assets found for "{resource.name}"</p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Current Assignments Summary */}
                      <div className="space-y-2 pt-3 border-t border-slate-200">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            Current Specific Assignments ({currentAssignments.length}/{selectionLimit})
                          </label>
                          {currentAssignments.length > 0 && (
                            <button
                              type="button"
                              onClick={() => setResourceAssignments(phaseId, resourceIndex, [])}
                              className="text-[10px] font-bold text-red-500 hover:text-red-700 transition-colors"
                            >
                              Clear All
                            </button>
                          )}
                        </div>
                        {currentAssignments.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
                            {currentAssignments.map(item => (
                              <div key={item.id} className="flex items-center gap-1.5 bg-primary/10 text-primary border border-primary/20 rounded-lg px-2.5 py-1 text-xs font-bold">
                                <span>{item.name}</span>
                                <button
                                  type="button"
                                  onClick={() => removeAssignment(item.id)}
                                  className="text-slate-400 hover:text-red-600 transition-colors ml-1"
                                  aria-label="Remove assignment"
                                >
                                  <X size={13} />
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-slate-400 italic">No specific resource assigned yet.</p>
                        )}
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="flex justify-end gap-2 p-4 bg-surface-container-low border-t border-slate-200 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setAssignmentEditor(null);
                          setAssignmentSearch('');
                        }}
                        className="px-5 py-2 rounded-lg bg-primary text-on-primary font-bold hover:opacity-90 transition-colors shadow-sm text-xs"
                      >
                        Done
                      </button>
                    </div>
                  </div>
                </div>
              </>
            ), modalRoot);
          })()
        )}

        {/* Delete Confirmation Modal */}
        {deleteConfirm && modalRoot && createPortal((
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/50 z-[200]"
              onClick={() => setDeleteConfirm(null)}
            />
            {/* Modal */}
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[210]">
              <div className="bg-white rounded-lg shadow-2xl border border-slate-200 max-w-sm">
                <div className="p-6">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-12 h-12 rounded-full bg-error/10 flex items-center justify-center shrink-0">
                      <AlertTriangle className="text-error" size={24} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-on-surface text-lg mb-1">Delete Resource?</h3>
                      <p className="text-sm text-on-surface-variant">
                        Are you sure you want to remove <span className="font-semibold">{deleteConfirm.resourceName}</span> from this phase?
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3 justify-end">
                    <button
                      type="button"
                      onClick={() => setDeleteConfirm(null)}
                      className="px-6 py-2 rounded-lg bg-surface-container-high text-on-surface font-semibold hover:bg-surface-container-highest transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const p = data.phases[deleteConfirm.phaseId];
                        const resources = p.resources.filter((_, idx) => idx !== deleteConfirm.resourceIndex);
                        updateData({
                          phases: {
                            ...data.phases,
                            [deleteConfirm.phaseId]: { ...p, resources },
                          },
                        });
                        setDeleteConfirm(null);
                      }}
                      className="px-6 py-2 rounded-lg bg-error text-on-error font-semibold hover:bg-error/90 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        ), modalRoot)}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-surface-container-lowest rounded-xl p-8 border border-slate-100 shadow-sm">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-xl font-bold font-headline">Sterilization</h3>
                <div className="mt-2 flex items-center gap-2 text-xs font-semibold text-primary">
                  <Clock size={14} />
                  <div className="flex items-center gap-1 bg-surface-container-low px-1 py-1 rounded">
                    <button
                      type="button"
                      onClick={() => {
                        const minutes = Math.max(15, parseDurationToMinutes(ster.duration) - 15);
                        const newDuration = formatMinutesToDuration(minutes);
                        updateData({
                          phases: {
                            ...data.phases,
                            sterilization: { ...ster, duration: newDuration },
                          },
                        });
                      }}
                      className="p-0.5 hover:bg-surface-container rounded transition-colors"
                      aria-label="Decrease sterilization duration"
                    >
                      <ChevronDown size={16} />
                    </button>
                    <span className="px-2 min-w-20 text-center">{ster.duration}</span>
                    <button
                      type="button"
                      onClick={() => {
                        const minutes = parseDurationToMinutes(ster.duration) + 15;
                        const newDuration = formatMinutesToDuration(minutes);
                        updateData({
                          phases: {
                            ...data.phases,
                            sterilization: { ...ster, duration: newDuration },
                          },
                        });
                      }}
                      className="p-0.5 hover:bg-surface-container rounded transition-colors"
                      aria-label="Increase sterilization duration"
                    >
                      <ChevronUp size={16} />
                    </button>
                  </div>
                  <span className="text-[10px]">(EST)</span>
                </div>
              </div>
              <div className="text-right">
                <label className="text-[10px] font-bold text-slate-400 block mb-1">INFECTION STATUS</label>
                <select
                  className="bg-error-container/10 border-none text-error text-xs font-bold rounded focus:ring-0 cursor-pointer max-w-[10rem]"
                  value={data.infectionStatus || 'Standard Precautions'}
                  onChange={(e) => updateData({ infectionStatus: e.target.value })}
                >
                  <option>Standard Precautions</option>
                  <option>Contact Precautions (MRSA)</option>
                  <option>Airborne Precautions</option>
                  <option>Positive (+45m sterilization)</option>
                </select>
              </div>
            </div>
            <div className="bg-surface-container-low p-4 rounded-lg space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Droplets className="text-secondary" size={18} />
                  <span className="text-sm font-bold">{cleaning.name}</span>
                </div>
                <input
                  type="number"
                  min={0}
                  className="w-14 bg-surface-container-lowest border-none text-center font-bold rounded py-1"
                  value={cleaning.count}
                  onChange={(e) => setCleaningCount(parseInt(e.target.value, 10) || 0)}
                />
              </div>
              <div className="space-y-2 border-t border-surface-container pt-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    {getAssignmentSummaryLabel(ster.resources[0], getResourceKey('sterilization', 0))}
                  </label>
                  <button
                    type="button"
                    onClick={() => setAssignmentEditor({ phaseId: 'sterilization', resourceIndex: 0 })}
                    className="text-[10px] font-bold text-primary hover:text-primary/80 transition-colors"
                  >
                    Manage
                  </button>
                </div>
                {(ster.resources[0]?.assignments ?? []).length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {(ster.resources[0]?.assignments ?? []).map((assignment) => (
                      <span key={assignment.id} className="text-[10px] bg-primary/10 text-primary rounded px-2 py-1 font-semibold">
                        {assignment.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="h-1 bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full bg-primary w-full" />
              </div>
              <p className="text-xs text-slate-500 italic">Duration extends automatically for positive infection status based on ICU protocols.</p>
            </div>
          </div>

          <div className="bg-surface-container-lowest rounded-xl p-8 border border-slate-100 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-bold font-headline uppercase tracking-widest text-slate-400 text-[10px]">Recovery Phase</h3>
              <div className="flex items-center gap-2 text-xs font-semibold text-primary">
                <Clock size={14} />
                <div className="flex items-center gap-1 bg-surface-container-low px-1 py-1 rounded">
                  <button
                    type="button"
                    onClick={() => {
                      const minutes = Math.max(360, parseDurationToMinutes(data.phases.recovery.duration) - 360);
                      const newDuration = formatMinutesToDuration(minutes);
                      updateData({
                        phases: {
                          ...data.phases,
                          recovery: { ...data.phases.recovery, duration: newDuration },
                        },
                      });
                    }}
                    className="p-0.5 hover:bg-surface-container rounded transition-colors"
                    aria-label="Decrease recovery duration"
                  >
                    <ChevronDown size={16} />
                  </button>
                  <span className="px-2 min-w-20 text-center">{data.phases.recovery.duration}</span>
                  <button
                    type="button"
                    onClick={() => {
                      const minutes = parseDurationToMinutes(data.phases.recovery.duration) + 360;
                      const newDuration = formatMinutesToDuration(minutes);
                      updateData({
                        phases: {
                          ...data.phases,
                          recovery: { ...data.phases.recovery, duration: newDuration },
                        },
                      });
                    }}
                    className="p-0.5 hover:bg-surface-container rounded transition-colors"
                    aria-label="Increase recovery duration"
                  >
                    <ChevronUp size={16} />
                  </button>
                </div>
                <span className="text-[10px]">(EST)</span>
              </div>
            </div>
            <div className="space-y-6">
              <div className="bg-[#f8fafc] p-6 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-1">ICU Probability</h4>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black text-[#1e293b] tracking-tighter">{icu}</span>
                      <span className="text-lg font-bold text-slate-300">%</span>
                    </div>
                  </div>
                  <button className="flex items-center gap-2 px-4 py-2.5 bg-white rounded-xl shadow-sm border border-slate-50 text-[9px] font-black text-primary uppercase tracking-widest transition-transform active:scale-95 group">
                    <Info size={14} className="text-primary group-hover:scale-110 transition-transform" />
                    ASA Score Based
                  </button>
                </div>

                <div className="relative h-16 flex items-center">
                  {/* Background Track */}
                  <div className="absolute left-2 right-2 h-[2px] bg-slate-200/60 rounded-full" />

                  {/* Active Track */}
                  <div className="absolute left-2 right-2 h-[2px] pointer-events-none">
                    <div
                      className="h-full bg-[#004a8d] rounded-full transition-all duration-300"
                      style={{ width: `${icu}%` }}
                    />
                  </div>

                  {/* Milestones Container */}
                  <div className="absolute left-2 right-2 inset-y-0 flex items-center pointer-events-none">
                    {[5, 10, 20, 30, 50, 75, 100].map((val) => (
                      <div
                        key={val}
                        className="absolute flex flex-col items-center"
                        style={{ left: `${val}%`, transform: 'translateX(-50%)' }}
                      >
                        {/* Milestone Label */}
                        <span className={cn(
                          "absolute -top-7 text-[9px] font-black transition-all duration-300",
                          icu >= val ? "text-slate-500" : "text-slate-300"
                        )}>
                          {val}
                        </span>
                        {/* Milestone Dot */}
                        <div className={cn(
                          "w-1.5 h-1.5 rounded-full transition-all duration-300 z-10",
                          icu >= val ? "bg-[#004a8d] scale-110" : "bg-slate-300"
                        )} />
                      </div>
                    ))}
                  </div>

                  {/* Range Input (Interaction Layer) */}
                  <div className="absolute left-2 right-2 inset-0 flex items-center">
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={1}
                      className="w-full h-full opacity-0 cursor-pointer z-40"
                      value={icu}
                      onChange={(e) => updateData({
                        phases: {
                          ...data.phases,
                          recovery: { ...data.phases.recovery, icuProbability: Number(e.target.value) }
                        }
                      })}
                    />
                  </div>

                  {/* Visible Thumb */}
                  <div className="absolute left-2 right-2 inset-y-0 flex items-center pointer-events-none">
                    <motion.div
                      className="absolute w-7 h-7 rounded-full border-[3px] border-white shadow-lg shadow-blue-900/20 bg-gradient-to-br from-blue-500 to-indigo-600 z-30"
                      style={{ left: `${icu}%`, transform: 'translateX(-50%)' }}
                      animate={{ left: `${icu}%` }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center mt-4 px-1">
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em]">Low Risk</span>
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em]">Critical Care Required</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <footer className="flex items-center justify-end pt-10 border-t border-outline-variant/10">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={onSaveDraft}
              className="px-8 py-3 rounded-xl bg-surface-container-high text-on-surface font-bold hover:bg-surface-container-highest transition-colors"
            >
              Save as Draft
            </button>
            <button
              type="button"
              onClick={onNext}
              className="px-10 py-3 rounded-xl bg-gradient-to-br from-primary to-primary-container text-on-primary font-bold shadow-lg hover:shadow-primary-container/20 transition-all active:scale-95"
            >
              Next: Scheduling
            </button>
          </div>
        </footer>

        <style>{`
          input[type="range"] {
            pointer-events: auto;
          }

          input[type="range"]::-webkit-slider-thumb {
            appearance: none;
            pointer-events: auto;
            width: 16px;
            height: 16px;
            border-radius: 50%;
            background: linear-gradient(135deg, #3b82f6, #8b5cf6);
            border: 2px solid white;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
            cursor: pointer;
          }

          input[type="range"]::-moz-range-thumb {
            width: 16px;
            height: 16px;
            border-radius: 50%;
            background: linear-gradient(135deg, #3b82f6, #8b5cf6);
            border: 2px solid white;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
            cursor: pointer;
          }

          input[type="range"]::-webkit-slider-thumb:hover {
            transform: scale(1.2);
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
          }

          input[type="range"]::-moz-range-thumb:hover {
            transform: scale(1.2);
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
          }
        `}</style>
      </div>
    </div>
  );
}
