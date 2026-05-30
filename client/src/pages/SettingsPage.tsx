import React, { useState, useEffect, useContext } from 'react';
import { motion } from 'motion/react';
import { 
  Settings, 
  ShieldAlert, 
  ChevronRight, 
  Save, 
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Stethoscope,
  PlusCircle,
  Pencil,
  X,
  Check
} from 'lucide-react';
import { cn } from '../lib/utils';
import { 
  DEFAULT_FORBIDDEN_PATTERNS, 
  DEFAULT_OPERATION_TYPES,
  DEFAULT_GLOBAL_SETTINGS,
  type CatalogSettings,
  type OrgGlobalSettings,
  type ForbiddenPattern, 
  type DefaultResourceSetting
} from '../types/settings';
import { AppStoreContext } from '../context/AppStoreContext';

import {
  createCatalogShift,
  createCatalogOperationType,
  createCatalogPhaseResource,
  createCatalogSkill,
  createCatalogSpecialization,
  createCatalogStaffTag,
  createForbiddenPatternRecord,
  deleteCatalogShift,
  deleteCatalogOperationType,
  deleteCatalogPhaseResource,
  deleteCatalogSkill,
  deleteCatalogSpecialization,
  deleteCatalogStaffTag,
  getCatalogShifts,
  getCatalogOperationTypes,
  getCatalogPhaseResources,
  getCatalogSkills,
  getCatalogSpecializations,
  getCatalogStaffTags,
  getForbiddenPatternRecords,
  getOrgGlobalSettings,
  upsertOrgGlobalSettings,
  updateCatalogShift,
  updateCatalogOperationType,
  updateCatalogPhaseResource,
  updateCatalogSkill,
  updateCatalogSpecialization,
  updateCatalogStaffTag,
  updateForbiddenPatternRecord,
} from '../lib/api';
import type { ServerOperationType, ServerPhaseResource } from '../lib/api';

type SettingsTab = 'catalogs' | 'forbidden-patterns' | 'surgery-config';
type PhaseId = 'preOp' | 'operative' | 'postOp' | 'sterilization' | 'recovery';
type CatalogSection = 'staff-tags' | 'specializations' | 'skills' | 'shifts' | 'operation-types' | 'phase-resources';
type PhaseResourceRow = ServerPhaseResource & { icon: string };

const PHASE_LABELS: Record<PhaseId, string> = {
  preOp: 'Pre-operative',
  operative: 'Operative',
  postOp: 'Post-operative',
  sterilization: 'Sterilization',
  recovery: 'Recovery'
};

const CATALOG_SECTION_LABELS: Record<CatalogSection, string> = {
  'staff-tags': 'Staff Tags',
  specializations: 'Specializations',
  skills: 'Skills',
  shifts: 'Shifts',
  'operation-types': 'Operation Types',
  'phase-resources': 'Phase Resources',
};

const RESOURCE_ICONS = ['user', 'nurse', 'room', 'equipment', 'bed'];

export default function SettingsPage() {
  const context = useContext(AppStoreContext);
  if (!context) return null;
  const { store, updateSettings, resetStoreToSeed, pushToast } = context;

  const [activeTab, setActiveTab] = useState<SettingsTab>('forbidden-patterns');
  const [activeCatalogSection, setActiveCatalogSection] = useState<CatalogSection>('staff-tags');
  
  // Local state for editing before save
  const [patterns, setPatterns] = useState<ForbiddenPattern[]>(store.settings?.forbiddenPatterns || []);
  const [forbiddenRecordId, setForbiddenRecordId] = useState<number | null>(null);
  const [forbiddenSyncStatus, setForbiddenSyncStatus] = useState<'idle' | 'syncing' | 'saving'>('idle');
  const [newForbiddenPattern, setNewForbiddenPattern] = useState({ pattern: '', description: '' });
  const [operationTypes, setOperationTypes] = useState<string[]>(store.settings?.operationTypes || []);
  const [newOpType, setNewOpType] = useState('');
  const [operationTypeRows, setOperationTypeRows] = useState<ServerOperationType[]>([]);
  const [editingOperationTypeId, setEditingOperationTypeId] = useState<number | null>(null);
  const [operationTypeDraft, setOperationTypeDraft] = useState({ category: '', name: '' });
  const [catalogs, setCatalogs] = useState<CatalogSettings>(store.settings?.catalogs || DEFAULT_GLOBAL_SETTINGS.catalogs);
  const [orgGlobalSettings, setOrgGlobalSettings] = useState<OrgGlobalSettings>(
    store.settings?.orgGlobalSettings || DEFAULT_GLOBAL_SETTINGS.orgGlobalSettings,
  );
  const [newCatalogRole, setNewCatalogRole] = useState({ name: '', color: '#4F46E5' });
  const [newCatalogSpecialization, setNewCatalogSpecialization] = useState({ name: '', description: '' });
  const [newCatalogSkill, setNewCatalogSkill] = useState({ name: '', description: '' });
  const [newCatalogShift, setNewCatalogShift] = useState({ name: '', start_time: '08:00', end_time: '16:00', description: '' });
  const [catalogSyncStatus, setCatalogSyncStatus] = useState<'idle' | 'syncing'>('idle');
  const [catalogMutateStatus, setCatalogMutateStatus] = useState<'idle' | 'saving'>('idle');
  const [orgGlobalSyncStatus, setOrgGlobalSyncStatus] = useState<'idle' | 'syncing' | 'saving'>('idle');

  const [editingStaffTagId, setEditingStaffTagId] = useState<number | null>(null);
  const [staffTagDraft, setStaffTagDraft] = useState({ name: '', color: '#4F46E5' });
  const [editingSpecializationId, setEditingSpecializationId] = useState<number | null>(null);
  const [specializationDraft, setSpecializationDraft] = useState({ name: '', description: '' });
  const [editingSkillId, setEditingSkillId] = useState<number | null>(null);
  const [skillDraft, setSkillDraft] = useState({ name: '', description: '' });
  const [editingShiftId, setEditingShiftId] = useState<number | null>(null);
  const [shiftDraft, setShiftDraft] = useState({ name: '', start_time: '08:00', end_time: '16:00', description: '' });
  
  const [phaseResources, setPhaseResources] = useState<Record<string, DefaultResourceSetting[]>>(
    store.settings?.phaseResources || DEFAULT_GLOBAL_SETTINGS.phaseResources
  );
  const [phaseResourceRows, setPhaseResourceRows] = useState<PhaseResourceRow[]>([]);
  const [editingPhaseResourceId, setEditingPhaseResourceId] = useState<number | null>(null);
  const [phaseResourceDraft, setPhaseResourceDraft] = useState<DefaultResourceSetting>({ name: '', count: 1, icon: 'user' });
  const [selectedPhase, setSelectedPhase] = useState<PhaseId>('preOp');
  const [newResource, setNewResource] = useState<DefaultResourceSetting>({ name: '', count: 1, icon: 'user' });

  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  // Update local state when store changes (e.g. after reset)
  useEffect(() => {
    if (store.settings) {
      setPatterns(store.settings.forbiddenPatterns || []);
      setOperationTypes(store.settings.operationTypes || []);
      setPhaseResources(store.settings.phaseResources || DEFAULT_GLOBAL_SETTINGS.phaseResources);
      setCatalogs(store.settings.catalogs || DEFAULT_GLOBAL_SETTINGS.catalogs);
      setOrgGlobalSettings(store.settings.orgGlobalSettings || DEFAULT_GLOBAL_SETTINGS.orgGlobalSettings);
    }
  }, [store.settings]);

  const pickBestForbiddenRecord = (rows: any[]) => {
    if (!Array.isArray(rows) || rows.length === 0) return null;
    const global = rows.find((r) => r?.scope === 'GLOBAL');
    return global ?? rows[0];
  };

  const normalizeForbiddenPatterns = (value: any): ForbiddenPattern[] => {
    if (!Array.isArray(value)) return [];
    return value
      .map((p) => {
        const pattern = String(p?.pattern ?? '');
        const id = String(p?.id ?? pattern);
        return {
          id,
          pattern,
          description: String(p?.description ?? ''),
          enabled: Boolean(p?.enabled ?? true),
        };
      })
      .filter((p) => p.id && p.pattern);
  };

  const normalizeTimeHHMM = (value: unknown): string => {
    if (typeof value !== 'string') return '';
    const s = value.trim();
    if (!s) return '';

    const isoLike = s.match(/T(\d{2}):(\d{2})/);
    if (isoLike) return `${isoLike[1]}:${isoLike[2]}`;

    const clockLike = s.match(/(\d{1,2}):(\d{2})/);
    if (!clockLike) return '';
    const h = Number(clockLike[1]);
    const m = Number(clockLike[2]);
    if (!Number.isFinite(h) || !Number.isFinite(m)) return '';
    if (h < 0 || h > 23 || m < 0 || m > 59) return '';
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };

  const normalizePhaseTypeToId = (value: unknown): string => {
    const s = String(value ?? '').trim();
    if (!s) return '';
    const asId = s as PhaseId;
    if (asId in PHASE_LABELS) return asId;
    const target = s.toLowerCase();
    const hit = (Object.keys(PHASE_LABELS) as PhaseId[]).find((k) => PHASE_LABELS[k].toLowerCase() === target);
    return hit ?? s;
  };

  const formatOperationTypeLabel = (r: Pick<ServerOperationType, 'category' | 'name'>): string => {
    const category = String(r.category ?? '').trim();
    const name = String(r.name ?? '').trim();
    if (!category) return name;
    if (!name) return category;
    return `${category} - ${name}`;
  };

  const parseOperationTypeInput = (raw: string): { category: string; name: string } | null => {
    const s = raw.trim();
    if (!s) return null;
    const parts = s.split('-');
    if (parts.length >= 2) {
      const category = parts[0].trim() || 'General';
      const name = parts.slice(1).join('-').trim();
      if (!name) return null;
      return { category, name };
    }
    return { category: 'General', name: s };
  };

  const applyOperationTypesFromRows = (rows: ServerOperationType[]) => {
    const nextRows = Array.isArray(rows) ? rows : [];
    setOperationTypeRows(nextRows);
    const labels = nextRows.map(formatOperationTypeLabel).filter(Boolean);
    setOperationTypes(labels);
    updateSettings({ operationTypes: labels });
    setEditingOperationTypeId(null);
  };

  const applyPhaseResourcesFromRows = (rows: PhaseResourceRow[]) => {
    const nextRows = Array.isArray(rows) ? rows : [];
    setPhaseResourceRows(nextRows);

    const next: Record<string, DefaultResourceSetting[]> = {};
    (Object.keys(PHASE_LABELS) as PhaseId[]).forEach((k) => {
      next[k] = [];
    });

    nextRows.forEach((r) => {
      const type = normalizePhaseTypeToId(r.type);
      if (!type) return;
      if (!next[type]) next[type] = [];
      next[type].push({ name: r.name, count: Math.max(1, Number(r.default_count) || 1), icon: r.icon || 'user' });
    });

    setPhaseResources(next);
    updateSettings({ phaseResources: next });
    setEditingPhaseResourceId(null);
  };

  const syncForbiddenPatternsFromBackend = async () => {
    setForbiddenSyncStatus('syncing');
    try {
      const orgId = 1;
      const rows = await getForbiddenPatternRecords({ orgId });
      const rec = pickBestForbiddenRecord(rows as any);

      if (!rec) {
        const created = await createForbiddenPatternRecord({
          organization_id: orgId,
          scope: 'GLOBAL',
          applies_to: 'ALL_CONTRACT_TYPES',
          forbidden_patterns: DEFAULT_FORBIDDEN_PATTERNS,
          metadata: {},
        });
        const next = normalizeForbiddenPatterns(created.forbidden_patterns);
        setForbiddenRecordId(created.id);
        setPatterns(next);
        updateSettings({ forbiddenPatterns: next });
        pushToast('Forbidden patterns initialized from defaults (backend).');
        return;
      }

      const next = normalizeForbiddenPatterns((rec as any).forbidden_patterns);
      setForbiddenRecordId((rec as any).id);
      setPatterns(next);
      updateSettings({ forbiddenPatterns: next });
      pushToast('Forbidden patterns synced from backend.');
    } catch (e: any) {
      pushToast(`Forbidden patterns sync failed: ${e?.message ?? 'Unknown error'}`);
    } finally {
      setForbiddenSyncStatus('idle');
    }
  };

  const saveForbiddenPatternsToBackend = async (nextPatterns: ForbiddenPattern[]) => {
    setForbiddenSyncStatus('saving');
    try {
      const orgId = 1;
      let recordId = forbiddenRecordId;

      if (!recordId) {
        const rows = await getForbiddenPatternRecords({ orgId });
        const rec = pickBestForbiddenRecord(rows as any);
        if (rec?.id) {
          recordId = Number(rec.id);
          setForbiddenRecordId(recordId);
        } else {
          const created = await createForbiddenPatternRecord({
            organization_id: orgId,
            scope: 'GLOBAL',
            applies_to: 'ALL_CONTRACT_TYPES',
            forbidden_patterns: nextPatterns,
            metadata: {},
          });
          recordId = created.id;
          setForbiddenRecordId(recordId);
          const normalized = normalizeForbiddenPatterns(created.forbidden_patterns);
          setPatterns(normalized);
          updateSettings({ forbiddenPatterns: normalized });
          return;
        }
      }

      const saved = await updateForbiddenPatternRecord(recordId, { forbidden_patterns: nextPatterns });
      const normalized = normalizeForbiddenPatterns(saved.forbidden_patterns);
      setPatterns(normalized);
      updateSettings({ forbiddenPatterns: normalized });
    } catch (e: any) {
      pushToast(`Save failed: ${e?.message ?? 'Unknown error'}`);
      throw e;
    } finally {
      setForbiddenSyncStatus('idle');
    }
  };

  const syncCatalogsFromBackend = async () => {
    setCatalogSyncStatus('syncing');
    try {
      const orgId = 1;
      const [staffTags, specializations, skills, shifts, operationTypesRaw, phaseResourcesRaw] = await Promise.all([
        getCatalogStaffTags({ orgId }),
        getCatalogSpecializations({ orgId }),
        getCatalogSkills({ orgId }),
        getCatalogShifts({ orgId }),
        getCatalogOperationTypes({ orgId }),
        getCatalogPhaseResources({ orgId }),
      ]);
      const next: CatalogSettings = { staffTags, specializations, skills, shifts };
      setCatalogs(next);
      updateSettings({ catalogs: next });
      setEditingStaffTagId(null);
      setEditingSpecializationId(null);
      setEditingSkillId(null);
      setEditingShiftId(null);

      let operationTypes = operationTypesRaw;
      if (operationTypes.length === 0) {
        const seeds = (store.settings?.operationTypes || DEFAULT_OPERATION_TYPES)
          .map((s) => parseOperationTypeInput(String(s)))
          .filter(Boolean) as Array<{ category: string; name: string }>;
        if (seeds.length > 0) {
          await Promise.all(seeds.map((x) => createCatalogOperationType({ organization_id: orgId, category: x.category, name: x.name })));
          operationTypes = await getCatalogOperationTypes({ orgId });
        }
      }
      applyOperationTypesFromRows(operationTypes);

      let phaseResourceList = phaseResourcesRaw;
      if (phaseResourceList.length === 0) {
        const seedSettings = store.settings?.phaseResources || DEFAULT_GLOBAL_SETTINGS.phaseResources;
        const phaseKeys = Object.keys(seedSettings);
        const creates: Array<ReturnType<typeof createCatalogPhaseResource>> = [];
        phaseKeys.forEach((k) => {
          const arr = (seedSettings as any)[k];
          if (!Array.isArray(arr)) return;
          arr.forEach((r: any) => {
            const name = String(r?.name ?? '').trim();
            const count = Math.max(1, Number(r?.count) || 1);
            if (!name) return;
            creates.push(createCatalogPhaseResource({ organization_id: orgId, type: String(k), name, default_count: count }));
          });
        });
        if (creates.length > 0) {
          await Promise.all(creates);
          phaseResourceList = await getCatalogPhaseResources({ orgId });
        }
      }

      const iconFor = (type: string, name: string): string => {
        const t = normalizePhaseTypeToId(type);
        const n = String(name ?? '').trim().toLowerCase();
        if (!t || !n) return 'user';
        const fromRows = phaseResourceRows.find((r) => normalizePhaseTypeToId(r.type) === t && String(r.name).trim().toLowerCase() === n)?.icon;
        if (fromRows) return fromRows;
        const fromSettings = phaseResources[t]?.find((r) => String(r.name).trim().toLowerCase() === n)?.icon;
        return fromSettings || 'user';
      };

      const nextPhaseRows: PhaseResourceRow[] = phaseResourceList.map((r) => ({
        ...r,
        type: normalizePhaseTypeToId(r.type),
        icon: iconFor(r.type, r.name),
      }));
      applyPhaseResourcesFromRows(nextPhaseRows);

      pushToast('Catalogs synced from backend.');
    } catch (e: any) {
      pushToast(`Catalog sync failed: ${e?.message ?? 'Unknown error'}`);
    } finally {
      setCatalogSyncStatus('idle');
    }
  };

  const syncOrgGlobalSettingsFromBackend = async () => {
    setOrgGlobalSyncStatus('syncing');
    try {
      const orgId = 1;
      let gs: Awaited<ReturnType<typeof getOrgGlobalSettings>>;
      try {
        gs = await getOrgGlobalSettings(orgId);
      } catch (e: any) {
        const msg = String(e?.message ?? '');
        if (!/not found/i.test(msg)) throw e;
        gs = await upsertOrgGlobalSettings({
          organization_id: orgId,
          business_hours_start: DEFAULT_GLOBAL_SETTINGS.orgGlobalSettings.business_hours_start,
          business_hours_end: DEFAULT_GLOBAL_SETTINGS.orgGlobalSettings.business_hours_end,
          surgery_planning_horizon: DEFAULT_GLOBAL_SETTINGS.orgGlobalSettings.surgery_planning_horizon,
          roster_planning_horizon: DEFAULT_GLOBAL_SETTINGS.orgGlobalSettings.roster_planning_horizon,
          surgery_planning_resolution: DEFAULT_GLOBAL_SETTINGS.orgGlobalSettings.surgery_planning_resolution,
        });
        pushToast('Global settings initialized from defaults (backend).');
      }
      const next: OrgGlobalSettings = {
        organization_id: gs.organization_id,
        business_hours_start: gs.business_hours_start,
        business_hours_end: gs.business_hours_end,
        surgery_planning_horizon: gs.surgery_planning_horizon,
        roster_planning_horizon: gs.roster_planning_horizon,
        surgery_planning_resolution: gs.surgery_planning_resolution,
      };
      setOrgGlobalSettings(next);
      updateSettings({ orgGlobalSettings: next });
      pushToast('Global settings synced from backend.');
    } catch (e: any) {
      pushToast(`Global settings sync failed: ${e?.message ?? 'Unknown error'}`);
    } finally {
      setOrgGlobalSyncStatus('idle');
    }
  };

  const saveOrgGlobalSettingsToBackend = async () => {
    setOrgGlobalSyncStatus('saving');
    try {
      const orgId = orgGlobalSettings.organization_id || 1;
      const saved = await upsertOrgGlobalSettings({
        organization_id: orgId,
        business_hours_start: orgGlobalSettings.business_hours_start,
        business_hours_end: orgGlobalSettings.business_hours_end,
        surgery_planning_horizon: orgGlobalSettings.surgery_planning_horizon,
        roster_planning_horizon: orgGlobalSettings.roster_planning_horizon,
        surgery_planning_resolution: orgGlobalSettings.surgery_planning_resolution,
      });
      const next: OrgGlobalSettings = {
        organization_id: saved.organization_id,
        business_hours_start: saved.business_hours_start,
        business_hours_end: saved.business_hours_end,
        surgery_planning_horizon: saved.surgery_planning_horizon,
        roster_planning_horizon: saved.roster_planning_horizon,
        surgery_planning_resolution: saved.surgery_planning_resolution,
      };
      setOrgGlobalSettings(next);
      updateSettings({ orgGlobalSettings: next });
      pushToast('Global settings saved to backend.');
    } catch (e: any) {
      pushToast(`Save failed: ${e?.message ?? 'Unknown error'}`);
    } finally {
      setOrgGlobalSyncStatus('idle');
    }
  };

  useEffect(() => {
    void syncCatalogsFromBackend();
    void syncOrgGlobalSettingsFromBackend();
    void syncForbiddenPatternsFromBackend();
  }, []);

  const handleTogglePattern = async (id: string) => {
    const next = patterns.map((p) => (p.id === id ? { ...p, enabled: !p.enabled } : p));
    setPatterns(next);
    updateSettings({ forbiddenPatterns: next });
    try {
      await saveForbiddenPatternsToBackend(next);
    } catch {
      await syncForbiddenPatternsFromBackend();
    }
  };

  const handleAddOpType = async () => {
    const parsed = parseOperationTypeInput(newOpType);
    if (!parsed) return;
    const label = `${parsed.category} - ${parsed.name}`.trim();
    if (operationTypes.some((t) => t.trim().toLowerCase() === label.toLowerCase())) {
      pushToast('Operation type already exists');
      return;
    }
    setCatalogMutateStatus('saving');
    try {
      await createCatalogOperationType({ organization_id: 1, category: parsed.category, name: parsed.name });
      await syncCatalogsFromBackend();
      setNewOpType('');
      pushToast('Operation type added.');
    } catch (e: any) {
      pushToast(e?.message ?? 'Create failed');
    } finally {
      setCatalogMutateStatus('idle');
    }
  };

  const handleSaveOperationTypeEdit = async (id: number) => {
    const category = operationTypeDraft.category.trim();
    const name = operationTypeDraft.name.trim();
    if (!category || !name) return;
    setCatalogMutateStatus('saving');
    try {
      await updateCatalogOperationType(id, { category, name });
      await syncCatalogsFromBackend();
      pushToast('Operation type updated.');
    } catch (e: any) {
      pushToast(e?.message ?? 'Update failed');
    } finally {
      setCatalogMutateStatus('idle');
    }
  };

  const handleDeleteOperationType = async (row: ServerOperationType) => {
    const label = formatOperationTypeLabel(row);
    if (!confirm(`Delete operation type "${label}"?`)) return;
    setCatalogMutateStatus('saving');
    try {
      await deleteCatalogOperationType(row.id);
      await syncCatalogsFromBackend();
      pushToast('Operation type deleted.');
    } catch (e: any) {
      pushToast(e?.message ?? 'Delete failed');
    } finally {
      setCatalogMutateStatus('idle');
    }
  };

  const handleAddResource = async (phase: PhaseId) => {
    const name = newResource.name.trim();
    if (!name) return;
    const count = Math.max(1, Number(newResource.count) || 1);
    const icon = String(newResource.icon || 'user');
    const exists = phaseResourceRows.some(
      (r) => normalizePhaseTypeToId(r.type) === phase && String(r.name).trim().toLowerCase() === name.toLowerCase(),
    );
    if (exists) {
      pushToast('Resource already exists in this phase');
      return;
    }
    setCatalogMutateStatus('saving');
    try {
      const created = await createCatalogPhaseResource({ organization_id: 1, type: phase, name, default_count: count });
      const nextRows: PhaseResourceRow[] = [
        ...phaseResourceRows,
        { ...created, type: normalizePhaseTypeToId(created.type), icon },
      ];
      applyPhaseResourcesFromRows(nextRows);
      setNewResource({ name: '', count: 1, icon: 'user' });
      pushToast('Resource added.');
    } catch (e: any) {
      pushToast(e?.message ?? 'Create failed');
    } finally {
      setCatalogMutateStatus('idle');
    }
  };

  const handleSavePhaseResourceEdit = async (id: number) => {
    const name = phaseResourceDraft.name.trim();
    if (!name) return;
    const count = Math.max(1, Number(phaseResourceDraft.count) || 1);
    const icon = String(phaseResourceDraft.icon || 'user');
    const row = phaseResourceRows.find((r) => r.id === id);
    if (!row) return;
    setCatalogMutateStatus('saving');
    try {
      const saved = await updateCatalogPhaseResource(id, {
        type: normalizePhaseTypeToId(row.type) || row.type,
        name,
        default_count: count,
      });
      const nextRows: PhaseResourceRow[] = phaseResourceRows.map((r) =>
        r.id === id ? { ...r, ...saved, type: normalizePhaseTypeToId(saved.type), icon } : r,
      );
      applyPhaseResourcesFromRows(nextRows);
      pushToast('Resource updated.');
    } catch (e: any) {
      pushToast(e?.message ?? 'Update failed');
    } finally {
      setCatalogMutateStatus('idle');
    }
  };

  const handleDeletePhaseResource = async (row: PhaseResourceRow) => {
    if (!confirm(`Delete resource "${row.name}"?`)) return;
    setCatalogMutateStatus('saving');
    try {
      await deleteCatalogPhaseResource(row.id);
      const nextRows = phaseResourceRows.filter((r) => r.id !== row.id);
      applyPhaseResourcesFromRows(nextRows);
      pushToast('Resource deleted.');
    } catch (e: any) {
      pushToast(e?.message ?? 'Delete failed');
    } finally {
      setCatalogMutateStatus('idle');
    }
  };

  const handleSave = () => {
    setSaveStatus('saving');
    
    // Update global settings
    updateSettings({
      forbiddenPatterns: patterns,
      operationTypes: operationTypes,
      phaseResources: phaseResources,
      catalogs: catalogs,
      orgGlobalSettings: orgGlobalSettings,
    });

    setTimeout(() => {
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }, 800);
  };

  const handleReset = () => {
    if (confirm('Reset all settings to defaults?')) {
      resetStoreToSeed();
      pushToast('Settings reset to defaults');
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-5xl mx-auto p-8"
    >
      <header className="mb-10 flex justify-between items-end">
        <div>
          <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">
            <Settings size={14} />
            <span>System Administration</span>
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight font-headline">Global Settings</h1>
          <p className="text-slate-500 mt-2 font-medium">Configure forbidden shift patterns and global shift timing constraints.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleReset}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-all active:scale-95"
          >
            <RotateCcw size={16} />
            Reset Defaults
          </button>
          <button 
            onClick={handleSave}
            disabled={saveStatus !== 'idle'}
            className={cn(
              "flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all active:scale-95 shadow-lg",
              saveStatus === 'saved' ? "bg-emerald-600 text-white shadow-emerald-900/20" : "bg-primary text-white shadow-primary/20"
            )}
          >
            {saveStatus === 'saving' ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving...
              </span>
            ) : saveStatus === 'saved' ? (
              <span className="flex items-center gap-2">
                <CheckCircle2 size={16} />
                Saved Successfully
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Save size={16} />
                Apply Changes
              </span>
            )}
          </button>
        </div>
      </header>

      <div className="grid grid-cols-12 gap-10">
        {/* Internal Navigation */}
        <aside className="col-span-3 space-y-1">
          <button
            onClick={() => setActiveTab('catalogs')}
            className={cn(
              "w-full flex items-center justify-between px-5 py-4 rounded-2xl transition-all font-bold text-sm",
              activeTab === 'catalogs' 
                ? "bg-white shadow-sm border border-slate-100 text-primary" 
                : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
            )}
          >
            <div className="flex items-center gap-3">
              <PlusCircle size={18} />
              <span>Catalogs</span>
            </div>
            {activeTab === 'catalogs' && <ChevronRight size={16} />}
          </button>
          <button
            onClick={() => setActiveTab('forbidden-patterns')}
            className={cn(
              "w-full flex items-center justify-between px-5 py-4 rounded-2xl transition-all font-bold text-sm",
              activeTab === 'forbidden-patterns' 
                ? "bg-white shadow-sm border border-slate-100 text-primary" 
                : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
            )}
          >
            <div className="flex items-center gap-3">
              <ShieldAlert size={18} />
              <span>Forbidden Patterns</span>
            </div>
            {activeTab === 'forbidden-patterns' && <ChevronRight size={16} />}
          </button>
          <button
            onClick={() => setActiveTab('surgery-config')}
            className={cn(
              "w-full flex items-center justify-between px-5 py-4 rounded-2xl transition-all font-bold text-sm",
              activeTab === 'surgery-config' 
                ? "bg-white shadow-sm border border-slate-100 text-primary" 
                : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
            )}
          >
            <div className="flex items-center gap-3">
              <Stethoscope size={18} />
              <span>Hospital Settings</span>
            </div>
            {activeTab === 'surgery-config' && <ChevronRight size={16} />}
          </button>
        </aside>

        {/* Content Area */}
        <main className="col-span-9">
          {activeTab === 'catalogs' && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-8 border-b border-slate-50 flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-black text-slate-900 mb-1">Catalogs</h3>
                    <p className="text-sm text-slate-500 font-medium">Backed by /api/catalogs (protected routes).</p>
                  </div>
                  <button
                    type="button"
                    onClick={syncCatalogsFromBackend}
                    disabled={catalogSyncStatus === 'syncing'}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 disabled:opacity-60"
                  >
                    <RotateCcw size={16} />
                    {catalogSyncStatus === 'syncing' ? 'Syncing…' : 'Sync'}
                  </button>
                </div>

                <div className="p-8 space-y-8">
                  <div className="flex flex-wrap gap-2">
                    {(Object.keys(CATALOG_SECTION_LABELS) as CatalogSection[]).map((key) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setActiveCatalogSection(key)}
                        className={cn(
                          "px-4 py-2 rounded-xl text-xs font-bold transition-all",
                          activeCatalogSection === key
                            ? "bg-primary text-white shadow-lg shadow-primary/20"
                            : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                        )}
                      >
                        {CATALOG_SECTION_LABELS[key]}
                      </button>
                    ))}
                  </div>

                  {activeCatalogSection === 'staff-tags' && (
                  <section className="space-y-4">
                    <h4 className="text-sm font-black text-slate-900">Staff Tags (Roles)</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <input
                        value={newCatalogRole.name}
                        onChange={(e) => setNewCatalogRole((p) => ({ ...p, name: e.target.value }))}
                        placeholder="e.g. Surgeon"
                        className="bg-white border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20 md:col-span-2"
                      />
                      <input
                        value={newCatalogRole.color}
                        onChange={(e) => setNewCatalogRole((p) => ({ ...p, color: e.target.value }))}
                        placeholder="#4F46E5"
                        className="bg-white border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20"
                      />
                      <button
                        type="button"
                        onClick={async () => {
                          const name = newCatalogRole.name.trim();
                          if (!name) return;
                          try {
                            await createCatalogStaffTag({ organization_id: 1, name, color: newCatalogRole.color.trim() || undefined });
                            setNewCatalogRole({ name: '', color: '#4F46E5' });
                            await syncCatalogsFromBackend();
                          } catch (e: any) {
                            pushToast(e?.message ?? 'Create failed');
                          }
                        }}
                        disabled={catalogSyncStatus === 'syncing' || catalogMutateStatus !== 'idle'}
                        className="inline-flex items-center justify-center gap-2 bg-primary text-on-primary px-4 py-3 rounded-2xl text-sm font-black hover:opacity-90 disabled:opacity-60 md:col-span-3"
                      >
                        <Plus size={16} />
                        Add
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {catalogs.staffTags.map((t) => (
                        <div key={t.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                          {editingStaffTagId === t.id ? (
                            <div className="space-y-3">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <input
                                  value={staffTagDraft.name}
                                  onChange={(e) => setStaffTagDraft((p) => ({ ...p, name: e.target.value }))}
                                  className="bg-white border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20"
                                />
                                <input
                                  value={staffTagDraft.color}
                                  onChange={(e) => setStaffTagDraft((p) => ({ ...p, color: e.target.value }))}
                                  className="bg-white border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20"
                                />
                                <div className="flex gap-2">
                                  <button
                                    type="button"
                                    disabled={catalogMutateStatus !== 'idle'}
                                    onClick={async () => {
                                      const name = staffTagDraft.name.trim();
                                      if (!name) return;
                                      setCatalogMutateStatus('saving');
                                      try {
                                        await updateCatalogStaffTag(t.id, { name, color: staffTagDraft.color.trim() || undefined });
                                        setEditingStaffTagId(null);
                                        await syncCatalogsFromBackend();
                                        pushToast('Staff tag updated.');
                                      } catch (e: any) {
                                        pushToast(e?.message ?? 'Update failed');
                                      } finally {
                                        setCatalogMutateStatus('idle');
                                      }
                                    }}
                                    className="flex-1 inline-flex items-center justify-center gap-2 bg-primary text-on-primary px-4 py-3 rounded-2xl text-sm font-black hover:opacity-90 disabled:opacity-60"
                                  >
                                    <Check size={16} />
                                    Save
                                  </button>
                                  <button
                                    type="button"
                                    disabled={catalogMutateStatus !== 'idle'}
                                    onClick={() => setEditingStaffTagId(null)}
                                    className="inline-flex items-center justify-center gap-2 bg-slate-200 text-slate-700 px-4 py-3 rounded-2xl text-sm font-black hover:bg-slate-300 disabled:opacity-60"
                                  >
                                    <X size={16} />
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-center gap-3 min-w-0">
                                <span
                                  className="w-3 h-3 rounded-full border border-slate-200 shrink-0"
                                  style={{ backgroundColor: t.color ?? '#CBD5E1' }}
                                />
                                <div className="min-w-0">
                                  <p className="font-black text-slate-900 truncate">{t.name}</p>
                                  {t.color && <p className="text-xs font-mono text-slate-500 truncate">{t.color}</p>}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  disabled={catalogMutateStatus !== 'idle'}
                                  onClick={() => {
                                    setEditingStaffTagId(t.id);
                                    setStaffTagDraft({ name: t.name, color: (t.color ?? '#4F46E5') as string });
                                  }}
                                  className="p-2 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                                >
                                  <Pencil size={16} />
                                </button>
                                <button
                                  type="button"
                                  disabled={catalogMutateStatus !== 'idle'}
                                  onClick={async () => {
                                    if (!confirm(`Delete staff tag "${t.name}"?`)) return;
                                    setCatalogMutateStatus('saving');
                                    try {
                                      await deleteCatalogStaffTag(t.id);
                                      await syncCatalogsFromBackend();
                                      pushToast('Staff tag deleted.');
                                    } catch (e: any) {
                                      pushToast(e?.message ?? 'Delete failed');
                                    } finally {
                                      setCatalogMutateStatus('idle');
                                    }
                                  }}
                                  className="p-2 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-error hover:bg-error-container disabled:opacity-60"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                      {catalogs.staffTags.length === 0 && <p className="text-sm text-slate-400 font-medium">No staff tags yet.</p>}
                    </div>
                  </section>
                  )}

                  {activeCatalogSection === 'specializations' && (
                  <section className="space-y-4">
                    <h4 className="text-sm font-black text-slate-900">Specializations</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <input
                        value={newCatalogSpecialization.name}
                        onChange={(e) => setNewCatalogSpecialization((p) => ({ ...p, name: e.target.value }))}
                        placeholder="e.g. Oncology"
                        className="bg-white border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20"
                      />
                      <input
                        value={newCatalogSpecialization.description}
                        onChange={(e) => setNewCatalogSpecialization((p) => ({ ...p, description: e.target.value }))}
                        placeholder="Description (optional)"
                        className="bg-white border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20 md:col-span-2"
                      />
                      <button
                        type="button"
                        onClick={async () => {
                          const name = newCatalogSpecialization.name.trim();
                          if (!name) return;
                          try {
                            await createCatalogSpecialization({
                              organization_id: 1,
                              name,
                              description: newCatalogSpecialization.description.trim() || undefined,
                            });
                            setNewCatalogSpecialization({ name: '', description: '' });
                            await syncCatalogsFromBackend();
                          } catch (e: any) {
                            pushToast(e?.message ?? 'Create failed');
                          }
                        }}
                        disabled={catalogSyncStatus === 'syncing' || catalogMutateStatus !== 'idle'}
                        className="inline-flex items-center justify-center gap-2 bg-primary text-on-primary px-4 py-3 rounded-2xl text-sm font-black hover:opacity-90 disabled:opacity-60 md:col-span-3"
                      >
                        <Plus size={16} />
                        Add
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {catalogs.specializations.map((t) => (
                        <div key={t.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                          {editingSpecializationId === t.id ? (
                            <div className="space-y-3">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <input
                                  value={specializationDraft.name}
                                  onChange={(e) => setSpecializationDraft((p) => ({ ...p, name: e.target.value }))}
                                  className="bg-white border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20"
                                />
                                <input
                                  value={specializationDraft.description}
                                  onChange={(e) => setSpecializationDraft((p) => ({ ...p, description: e.target.value }))}
                                  className="bg-white border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20 md:col-span-2"
                                />
                                <div className="flex gap-2 md:col-span-3">
                                  <button
                                    type="button"
                                    disabled={catalogMutateStatus !== 'idle'}
                                    onClick={async () => {
                                      const name = specializationDraft.name.trim();
                                      if (!name) return;
                                      setCatalogMutateStatus('saving');
                                      try {
                                        await updateCatalogSpecialization(t.id, {
                                          name,
                                          description: specializationDraft.description.trim() || undefined,
                                        });
                                        setEditingSpecializationId(null);
                                        await syncCatalogsFromBackend();
                                        pushToast('Specialization updated.');
                                      } catch (e: any) {
                                        pushToast(e?.message ?? 'Update failed');
                                      } finally {
                                        setCatalogMutateStatus('idle');
                                      }
                                    }}
                                    className="flex-1 inline-flex items-center justify-center gap-2 bg-primary text-on-primary px-4 py-3 rounded-2xl text-sm font-black hover:opacity-90 disabled:opacity-60"
                                  >
                                    <Check size={16} />
                                    Save
                                  </button>
                                  <button
                                    type="button"
                                    disabled={catalogMutateStatus !== 'idle'}
                                    onClick={() => setEditingSpecializationId(null)}
                                    className="inline-flex items-center justify-center gap-2 bg-slate-200 text-slate-700 px-4 py-3 rounded-2xl text-sm font-black hover:bg-slate-300 disabled:opacity-60"
                                  >
                                    <X size={16} />
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="font-black text-slate-900 truncate">{t.name}</p>
                                {t.description && <p className="text-xs text-slate-500 font-medium mt-0.5 line-clamp-2">{t.description}</p>}
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  disabled={catalogMutateStatus !== 'idle'}
                                  onClick={() => {
                                    setEditingSpecializationId(t.id);
                                    setSpecializationDraft({ name: t.name, description: (t.description ?? '') as string });
                                  }}
                                  className="p-2 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                                >
                                  <Pencil size={16} />
                                </button>
                                <button
                                  type="button"
                                  disabled={catalogMutateStatus !== 'idle'}
                                  onClick={async () => {
                                    if (!confirm(`Delete specialization "${t.name}"?`)) return;
                                    setCatalogMutateStatus('saving');
                                    try {
                                      await deleteCatalogSpecialization(t.id);
                                      await syncCatalogsFromBackend();
                                      pushToast('Specialization deleted.');
                                    } catch (e: any) {
                                      pushToast(e?.message ?? 'Delete failed');
                                    } finally {
                                      setCatalogMutateStatus('idle');
                                    }
                                  }}
                                  className="p-2 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-error hover:bg-error-container disabled:opacity-60"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                      {catalogs.specializations.length === 0 && <p className="text-sm text-slate-400 font-medium">No specializations yet.</p>}
                    </div>
                  </section>
                  )}

                  {activeCatalogSection === 'skills' && (
                  <section className="space-y-4">
                    <h4 className="text-sm font-black text-slate-900">Skills</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <input
                        value={newCatalogSkill.name}
                        onChange={(e) => setNewCatalogSkill((p) => ({ ...p, name: e.target.value }))}
                        placeholder="e.g. Robotic Surgery"
                        className="bg-white border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20"
                      />
                      <input
                        value={newCatalogSkill.description}
                        onChange={(e) => setNewCatalogSkill((p) => ({ ...p, description: e.target.value }))}
                        placeholder="Description (optional)"
                        className="bg-white border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20 md:col-span-2"
                      />
                      <button
                        type="button"
                        onClick={async () => {
                          const name = newCatalogSkill.name.trim();
                          if (!name) return;
                          try {
                            await createCatalogSkill({
                              organization_id: 1,
                              name,
                              description: newCatalogSkill.description.trim() || undefined,
                            });
                            setNewCatalogSkill({ name: '', description: '' });
                            await syncCatalogsFromBackend();
                          } catch (e: any) {
                            pushToast(e?.message ?? 'Create failed');
                          }
                        }}
                        disabled={catalogSyncStatus === 'syncing' || catalogMutateStatus !== 'idle'}
                        className="inline-flex items-center justify-center gap-2 bg-primary text-on-primary px-4 py-3 rounded-2xl text-sm font-black hover:opacity-90 disabled:opacity-60 md:col-span-3"
                      >
                        <Plus size={16} />
                        Add
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {catalogs.skills.map((t) => (
                        <div key={t.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                          {editingSkillId === t.id ? (
                            <div className="space-y-3">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <input
                                  value={skillDraft.name}
                                  onChange={(e) => setSkillDraft((p) => ({ ...p, name: e.target.value }))}
                                  className="bg-white border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20"
                                />
                                <input
                                  value={skillDraft.description}
                                  onChange={(e) => setSkillDraft((p) => ({ ...p, description: e.target.value }))}
                                  className="bg-white border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20 md:col-span-2"
                                />
                                <div className="flex gap-2 md:col-span-3">
                                  <button
                                    type="button"
                                    disabled={catalogMutateStatus !== 'idle'}
                                    onClick={async () => {
                                      const name = skillDraft.name.trim();
                                      if (!name) return;
                                      setCatalogMutateStatus('saving');
                                      try {
                                        await updateCatalogSkill(t.id, {
                                          name,
                                          description: skillDraft.description.trim() || undefined,
                                        });
                                        setEditingSkillId(null);
                                        await syncCatalogsFromBackend();
                                        pushToast('Skill updated.');
                                      } catch (e: any) {
                                        pushToast(e?.message ?? 'Update failed');
                                      } finally {
                                        setCatalogMutateStatus('idle');
                                      }
                                    }}
                                    className="flex-1 inline-flex items-center justify-center gap-2 bg-primary text-on-primary px-4 py-3 rounded-2xl text-sm font-black hover:opacity-90 disabled:opacity-60"
                                  >
                                    <Check size={16} />
                                    Save
                                  </button>
                                  <button
                                    type="button"
                                    disabled={catalogMutateStatus !== 'idle'}
                                    onClick={() => setEditingSkillId(null)}
                                    className="inline-flex items-center justify-center gap-2 bg-slate-200 text-slate-700 px-4 py-3 rounded-2xl text-sm font-black hover:bg-slate-300 disabled:opacity-60"
                                  >
                                    <X size={16} />
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="font-black text-slate-900 truncate">{t.name}</p>
                                {t.description && <p className="text-xs text-slate-500 font-medium mt-0.5 line-clamp-2">{t.description}</p>}
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  disabled={catalogMutateStatus !== 'idle'}
                                  onClick={() => {
                                    setEditingSkillId(t.id);
                                    setSkillDraft({ name: t.name, description: (t.description ?? '') as string });
                                  }}
                                  className="p-2 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                                >
                                  <Pencil size={16} />
                                </button>
                                <button
                                  type="button"
                                  disabled={catalogMutateStatus !== 'idle'}
                                  onClick={async () => {
                                    if (!confirm(`Delete skill "${t.name}"?`)) return;
                                    setCatalogMutateStatus('saving');
                                    try {
                                      await deleteCatalogSkill(t.id);
                                      await syncCatalogsFromBackend();
                                      pushToast('Skill deleted.');
                                    } catch (e: any) {
                                      pushToast(e?.message ?? 'Delete failed');
                                    } finally {
                                      setCatalogMutateStatus('idle');
                                    }
                                  }}
                                  className="p-2 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-error hover:bg-error-container disabled:opacity-60"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                      {catalogs.skills.length === 0 && <p className="text-sm text-slate-400 font-medium">No skills yet.</p>}
                    </div>
                  </section>
                  )}

                  {activeCatalogSection === 'shifts' && (
                    <section className="space-y-4">
                      <h4 className="text-sm font-black text-slate-900">Shifts</h4>
                      <div className="bg-slate-50 rounded-2xl p-6 space-y-4 border border-slate-100">
                        <h5 className="text-sm font-black text-slate-900">Create Shift</h5>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                          <input
                            value={newCatalogShift.name}
                            onChange={(e) => setNewCatalogShift((p) => ({ ...p, name: e.target.value }))}
                            placeholder="e.g. Day"
                            className="bg-white border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20"
                          />
                          <input
                            type="time"
                            value={newCatalogShift.start_time}
                            onChange={(e) => setNewCatalogShift((p) => ({ ...p, start_time: e.target.value }))}
                            step={60}
                            className="bg-white border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20"
                          />
                          <input
                            type="time"
                            value={newCatalogShift.end_time}
                            onChange={(e) => setNewCatalogShift((p) => ({ ...p, end_time: e.target.value }))}
                            step={60}
                            className="bg-white border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20"
                          />
                          <button
                            type="button"
                            onClick={async () => {
                              const name = newCatalogShift.name.trim();
                              if (!name) return;
                              try {
                                await createCatalogShift({
                                  organization_id: 1,
                                  name,
                                  start_time: normalizeTimeHHMM(newCatalogShift.start_time),
                                  end_time: normalizeTimeHHMM(newCatalogShift.end_time),
                                  description: newCatalogShift.description.trim() || undefined,
                                });
                                setNewCatalogShift({ name: '', start_time: '08:00', end_time: '16:00', description: '' });
                                await syncCatalogsFromBackend();
                              } catch (e: any) {
                                pushToast(e?.message ?? 'Create failed');
                              }
                            }}
                            disabled={catalogSyncStatus === 'syncing' || catalogMutateStatus !== 'idle'}
                            className="inline-flex items-center justify-center gap-2 bg-primary text-on-primary px-4 py-3 rounded-2xl text-sm font-black hover:opacity-90 disabled:opacity-60"
                          >
                            <Plus size={16} />
                            Add
                          </button>
                          <input
                            value={newCatalogShift.description}
                            onChange={(e) => setNewCatalogShift((p) => ({ ...p, description: e.target.value }))}
                            placeholder="Description (optional)"
                            className="bg-white border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20 md:col-span-4"
                          />
                        </div>
                      </div>

                      <div className="space-y-3">
                        <h5 className="text-sm font-black text-slate-900">Existing Shifts</h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {catalogs.shifts.map((s) => (
                            <div key={s.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                              {editingShiftId === s.id ? (
                                <div className="space-y-3">
                                  <div className="grid grid-cols-1 gap-3">
                                    <input
                                      value={shiftDraft.name}
                                      onChange={(e) => setShiftDraft((p) => ({ ...p, name: e.target.value }))}
                                      className="bg-white border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20"
                                    />
                                    <div className="grid grid-cols-2 gap-3">
                                      <input
                                        type="time"
                                        value={shiftDraft.start_time}
                                        onChange={(e) => setShiftDraft((p) => ({ ...p, start_time: e.target.value }))}
                                        step={60}
                                        className="bg-white border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20"
                                      />
                                      <input
                                        type="time"
                                        value={shiftDraft.end_time}
                                        onChange={(e) => setShiftDraft((p) => ({ ...p, end_time: e.target.value }))}
                                        step={60}
                                        className="bg-white border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20"
                                      />
                                    </div>
                                    <input
                                      value={shiftDraft.description}
                                      onChange={(e) => setShiftDraft((p) => ({ ...p, description: e.target.value }))}
                                      placeholder="Description (optional)"
                                      className="bg-white border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20"
                                    />
                                    <div className="flex gap-2">
                                      <button
                                        type="button"
                                        disabled={catalogMutateStatus !== 'idle'}
                                        onClick={async () => {
                                          const name = shiftDraft.name.trim();
                                          if (!name) return;
                                          setCatalogMutateStatus('saving');
                                          try {
                                            await updateCatalogShift(s.id, {
                                              name,
                                              start_time: normalizeTimeHHMM(shiftDraft.start_time),
                                              end_time: normalizeTimeHHMM(shiftDraft.end_time),
                                              description: shiftDraft.description.trim() || undefined,
                                            });
                                            setEditingShiftId(null);
                                            await syncCatalogsFromBackend();
                                            pushToast('Shift updated.');
                                          } catch (e: any) {
                                            pushToast(e?.message ?? 'Update failed');
                                          } finally {
                                            setCatalogMutateStatus('idle');
                                          }
                                        }}
                                        className="flex-1 inline-flex items-center justify-center gap-2 bg-primary text-on-primary px-4 py-3 rounded-2xl text-sm font-black hover:opacity-90 disabled:opacity-60"
                                      >
                                        <Check size={16} />
                                        Save
                                      </button>
                                      <button
                                        type="button"
                                        disabled={catalogMutateStatus !== 'idle'}
                                        onClick={() => setEditingShiftId(null)}
                                        className="inline-flex items-center justify-center gap-2 bg-slate-200 text-slate-700 px-4 py-3 rounded-2xl text-sm font-black hover:bg-slate-300 disabled:opacity-60"
                                      >
                                        <X size={16} />
                                        Cancel
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-start justify-between gap-3">
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-3">
                                      <p className="font-black text-slate-900 truncate">{s.name}</p>
                                      <p className="text-xs font-mono text-slate-500 shrink-0">
                                        {s.start_time}–{s.end_time}
                                      </p>
                                    </div>
                                    {s.description && <p className="text-xs text-slate-500 mt-1 font-medium line-clamp-2">{s.description}</p>}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      disabled={catalogMutateStatus !== 'idle'}
                                      onClick={() => {
                                        setEditingShiftId(s.id);
                                        setShiftDraft({
                                          name: s.name,
                                          start_time: normalizeTimeHHMM(s.start_time),
                                          end_time: normalizeTimeHHMM(s.end_time),
                                          description: (s.description ?? '') as string,
                                        });
                                      }}
                                      className="p-2 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                                    >
                                      <Pencil size={16} />
                                    </button>
                                    <button
                                      type="button"
                                      disabled={catalogMutateStatus !== 'idle'}
                                      onClick={async () => {
                                        if (!confirm(`Delete shift "${s.name}"?`)) return;
                                        setCatalogMutateStatus('saving');
                                        try {
                                          await deleteCatalogShift(s.id);
                                          await syncCatalogsFromBackend();
                                          pushToast('Shift deleted.');
                                        } catch (e: any) {
                                          pushToast(e?.message ?? 'Delete failed');
                                        } finally {
                                          setCatalogMutateStatus('idle');
                                        }
                                      }}
                                      className="p-2 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-error hover:bg-error-container disabled:opacity-60"
                                    >
                                      <Trash2 size={16} />
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                          {catalogs.shifts.length === 0 && <p className="text-sm text-slate-400 font-medium">No shifts yet.</p>}
                        </div>
                      </div>
                    </section>
                  )}

                  {activeCatalogSection === 'operation-types' && (
                    <section className="space-y-4">
                      <h4 className="text-sm font-black text-slate-900">Operation Types</h4>
                      <div className="flex gap-3">
                        <input
                          type="text"
                          placeholder="e.g. Cardio - Valve Replacement"
                          value={newOpType}
                          onChange={(e) => setNewOpType(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && void handleAddOpType()}
                          className="flex-1 bg-slate-50 border-none rounded-2xl h-12 px-6 text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all shadow-inner"
                        />
                        <button
                          type="button"
                          onClick={() => void handleAddOpType()}
                          disabled={catalogSyncStatus === 'syncing' || catalogMutateStatus !== 'idle'}
                          className="px-6 h-12 bg-primary text-white rounded-2xl font-bold text-sm hover:bg-primary/90 transition-all flex items-center gap-2"
                        >
                          <Plus size={18} />
                          Add Type
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {operationTypeRows.map((row) => (
                          <div
                            key={row.id}
                            className="p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-primary/20 transition-all"
                          >
                            {editingOperationTypeId === row.id ? (
                              <div className="space-y-3">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  <input
                                    value={operationTypeDraft.category}
                                    onChange={(e) => setOperationTypeDraft((p) => ({ ...p, category: e.target.value }))}
                                    placeholder="Category"
                                    className="bg-white border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20"
                                  />
                                  <input
                                    value={operationTypeDraft.name}
                                    onChange={(e) => setOperationTypeDraft((p) => ({ ...p, name: e.target.value }))}
                                    placeholder="Name"
                                    className="bg-white border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20"
                                  />
                                </div>
                                <div className="flex gap-2">
                                  <button
                                    type="button"
                                    disabled={catalogMutateStatus !== 'idle'}
                                    onClick={() => void handleSaveOperationTypeEdit(row.id)}
                                    className="flex-1 inline-flex items-center justify-center gap-2 bg-primary text-on-primary px-4 py-3 rounded-2xl text-sm font-black hover:opacity-90 disabled:opacity-60"
                                  >
                                    <Check size={16} />
                                    Save
                                  </button>
                                  <button
                                    type="button"
                                    disabled={catalogMutateStatus !== 'idle'}
                                    onClick={() => setEditingOperationTypeId(null)}
                                    className="inline-flex items-center justify-center gap-2 bg-slate-200 text-slate-700 px-4 py-3 rounded-2xl text-sm font-black hover:bg-slate-300 disabled:opacity-60"
                                  >
                                    <X size={16} />
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center justify-between gap-3">
                                <span className="font-bold text-slate-700 text-sm truncate">{formatOperationTypeLabel(row)}</span>
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    disabled={catalogMutateStatus !== 'idle'}
                                    onClick={() => {
                                      setEditingOperationTypeId(row.id);
                                      setOperationTypeDraft({ category: row.category, name: row.name });
                                    }}
                                    className="p-2 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                                  >
                                    <Pencil size={16} />
                                  </button>
                                  <button
                                    type="button"
                                    disabled={catalogMutateStatus !== 'idle'}
                                    onClick={() => void handleDeleteOperationType(row)}
                                    className="p-2 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-rose-600 hover:bg-rose-50 disabled:opacity-60"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>

                      {operationTypeRows.length === 0 && (
                        <div className="text-center py-12 bg-slate-50 rounded-[2rem] border border-dashed border-slate-200">
                          <Stethoscope size={48} className="mx-auto text-slate-200 mb-4" />
                          <p className="text-slate-400 font-bold">No operation types defined</p>
                        </div>
                      )}
                    </section>
                  )}

                  {activeCatalogSection === 'phase-resources' && (
                    <section className="space-y-4">
                      <h4 className="text-sm font-black text-slate-900">Phase Resource Defaults</h4>
                      <div className="flex flex-wrap gap-2">
                        {(Object.keys(PHASE_LABELS) as PhaseId[]).map((phaseId) => (
                          <button
                            key={phaseId}
                            type="button"
                            onClick={() => setSelectedPhase(phaseId)}
                            className={cn(
                              "px-4 py-2 rounded-xl text-xs font-bold transition-all",
                              selectedPhase === phaseId
                                ? "bg-primary text-white shadow-lg shadow-primary/20"
                                : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                            )}
                          >
                            {PHASE_LABELS[phaseId]}
                          </button>
                        ))}
                      </div>

                      <div className="bg-slate-50 rounded-2xl p-6 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div className="md:col-span-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2 px-1">Resource Name</label>
                            <input
                              type="text"
                              placeholder="e.g. Senior Surgeon"
                              value={newResource.name}
                              onChange={(e) => setNewResource(prev => ({ ...prev, name: e.target.value }))}
                              className="w-full bg-white border-none rounded-xl h-11 px-4 text-sm font-bold focus:ring-2 focus:ring-primary/20 shadow-sm"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2 px-1">Default Count</label>
                            <input
                              type="number"
                              min={1}
                              value={newResource.count}
                              onChange={(e) => setNewResource(prev => ({ ...prev, count: parseInt(e.target.value) || 1 }))}
                              className="w-full bg-white border-none rounded-xl h-11 px-4 text-sm font-bold focus:ring-2 focus:ring-primary/20 shadow-sm text-center"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2 px-1">Icon</label>
                            <select
                              value={newResource.icon}
                              onChange={(e) => setNewResource(prev => ({ ...prev, icon: e.target.value }))}
                              className="w-full bg-white border-none rounded-xl h-11 px-4 text-xs font-bold focus:ring-2 focus:ring-primary/20 shadow-sm"
                            >
                              {RESOURCE_ICONS.map((icon) => (
                                <option key={icon} value={icon}>
                                  {icon}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => void handleAddResource(selectedPhase)}
                          disabled={catalogMutateStatus !== 'idle'}
                          className="w-full h-11 bg-primary text-white rounded-xl font-bold text-xs hover:bg-primary/90 transition-all flex items-center justify-center gap-2"
                        >
                          <Plus size={16} />
                          Add Resource
                        </button>

                        <div className="space-y-2">
                          {(() => {
                            const rows = phaseResourceRows.filter((r) => normalizePhaseTypeToId(r.type) === selectedPhase);
                            return rows.map((row) => (
                              <div
                                key={row.id}
                                className="bg-white rounded-xl border border-slate-100 px-4 py-3"
                              >
                                {editingPhaseResourceId === row.id ? (
                                  <div className="space-y-3">
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                                      <input
                                        value={phaseResourceDraft.name}
                                        onChange={(e) => setPhaseResourceDraft((p) => ({ ...p, name: e.target.value }))}
                                        className="bg-white border border-slate-200 rounded-xl h-11 px-4 text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20 md:col-span-2"
                                      />
                                      <input
                                        type="number"
                                        min={1}
                                        value={phaseResourceDraft.count}
                                        onChange={(e) => setPhaseResourceDraft((p) => ({ ...p, count: parseInt(e.target.value) || 1 }))}
                                        className="bg-white border border-slate-200 rounded-xl h-11 px-4 text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20 text-center"
                                      />
                                      <select
                                        value={phaseResourceDraft.icon}
                                        onChange={(e) => setPhaseResourceDraft((p) => ({ ...p, icon: e.target.value }))}
                                        className="bg-white border border-slate-200 rounded-xl h-11 px-4 text-xs font-bold outline-none focus:ring-2 focus:ring-primary/20"
                                      >
                                        {RESOURCE_ICONS.map((icon) => (
                                          <option key={icon} value={icon}>
                                            {icon}
                                          </option>
                                        ))}
                                      </select>
                                    </div>
                                    <div className="flex gap-2">
                                      <button
                                        type="button"
                                        disabled={catalogMutateStatus !== 'idle'}
                                        onClick={() => void handleSavePhaseResourceEdit(row.id)}
                                        className="flex-1 inline-flex items-center justify-center gap-2 bg-primary text-on-primary px-4 py-3 rounded-xl text-xs font-black hover:opacity-90 disabled:opacity-60"
                                      >
                                        <Check size={16} />
                                        Save
                                      </button>
                                      <button
                                        type="button"
                                        disabled={catalogMutateStatus !== 'idle'}
                                        onClick={() => setEditingPhaseResourceId(null)}
                                        className="inline-flex items-center justify-center gap-2 bg-slate-200 text-slate-700 px-4 py-3 rounded-xl text-xs font-black hover:bg-slate-300 disabled:opacity-60"
                                      >
                                        <X size={16} />
                                        Cancel
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex items-center justify-between gap-3">
                                    <div className="min-w-0">
                                      <p className="text-sm font-black text-slate-900 truncate">{row.name}</p>
                                      <p className="text-xs text-slate-500 font-medium">Default: {row.default_count} • Icon: {row.icon}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <button
                                        type="button"
                                        disabled={catalogMutateStatus !== 'idle'}
                                        onClick={() => {
                                          setEditingPhaseResourceId(row.id);
                                          setPhaseResourceDraft({ name: row.name, count: row.default_count, icon: row.icon });
                                        }}
                                        className="p-2 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                                      >
                                        <Pencil size={16} />
                                      </button>
                                      <button
                                        type="button"
                                        disabled={catalogMutateStatus !== 'idle'}
                                        onClick={() => void handleDeletePhaseResource(row)}
                                        className="p-2 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-rose-600 hover:bg-rose-50 disabled:opacity-60"
                                      >
                                        <Trash2 size={16} />
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            ));
                          })()}
                          {phaseResourceRows.filter((r) => normalizePhaseTypeToId(r.type) === selectedPhase).length === 0 && (
                            <p className="text-sm text-slate-400 font-medium">No default resources for this phase.</p>
                          )}
                        </div>
                      </div>
                    </section>
                  )}

                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'forbidden-patterns' && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-8 border-b border-slate-50 flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-black text-slate-900 mb-1">Pattern Constraints</h3>
                    <p className="text-sm text-slate-500 font-medium">Backed by /api/catalogs/pattern. These patterns will be flagged or blocked during dynamic contract generation.</p>
                  </div>
                  <button
                    type="button"
                    onClick={syncForbiddenPatternsFromBackend}
                    disabled={forbiddenSyncStatus !== 'idle'}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 disabled:opacity-60"
                  >
                    <RotateCcw size={16} />
                    {forbiddenSyncStatus === 'syncing' ? 'Syncing…' : forbiddenSyncStatus === 'saving' ? 'Saving…' : 'Sync'}
                  </button>
                </div>
                <div className="divide-y divide-slate-50">
                  {patterns.map((p) => (
                    <div key={p.id} className="p-6 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                      <div className="flex items-center gap-5">
                        <div className={cn(
                          "w-12 h-12 rounded-2xl flex items-center justify-center transition-colors",
                          p.enabled ? "bg-rose-50 text-rose-600" : "bg-slate-100 text-slate-400"
                        )}>
                          <ShieldAlert size={20} />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 flex items-center gap-2">
                            {p.pattern}
                            {!p.enabled && <span className="text-[10px] bg-slate-200 text-slate-500 px-2 py-0.5 rounded-full uppercase tracking-widest">Disabled</span>}
                          </h4>
                          <p className="text-xs text-slate-500 font-medium mt-0.5">{p.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={async () => {
                            const next = patterns.filter((x) => x.id !== p.id);
                            setPatterns(next);
                            updateSettings({ forbiddenPatterns: next });
                            try {
                              await saveForbiddenPatternsToBackend(next);
                            } catch {
                              await syncForbiddenPatternsFromBackend();
                            }
                          }}
                          className="p-2 rounded-xl bg-slate-100 text-slate-500 hover:text-error hover:bg-error-container transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                        <button 
                          type="button"
                          onClick={() => void handleTogglePattern(p.id)}
                          className={cn(
                            "w-12 h-6 rounded-full relative transition-all duration-300",
                            p.enabled ? "bg-rose-600" : "bg-slate-200"
                          )}
                        >
                          <div className={cn(
                            "absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300",
                            p.enabled ? "left-7" : "left-1"
                          )} />
                        </button>
                      </div>
                    </div>
                  ))}
                  {patterns.length === 0 && (
                    <div className="p-8 text-center">
                      <p className="text-sm text-slate-500 font-medium">No forbidden patterns configured yet.</p>
                    </div>
                  )}
                </div>
                <div className="p-6 bg-slate-50/50 border-t border-slate-100 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <input
                      value={newForbiddenPattern.pattern}
                      onChange={(e) => setNewForbiddenPattern((p) => ({ ...p, pattern: e.target.value }))}
                      placeholder="Pattern (e.g. Night → Day)"
                      className="bg-white border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20"
                    />
                    <input
                      value={newForbiddenPattern.description}
                      onChange={(e) => setNewForbiddenPattern((p) => ({ ...p, description: e.target.value }))}
                      placeholder="Description"
                      className="bg-white border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20 md:col-span-2"
                    />
                    <button
                      type="button"
                      onClick={async () => {
                        const pattern = newForbiddenPattern.pattern.trim();
                        const description = newForbiddenPattern.description.trim();
                        if (!pattern) return;
                        const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
                        const next = [
                          { id, pattern, description: description || 'Custom rule', enabled: true },
                          ...patterns,
                        ];
                        setNewForbiddenPattern({ pattern: '', description: '' });
                        setPatterns(next);
                        updateSettings({ forbiddenPatterns: next });
                        try {
                          await saveForbiddenPatternsToBackend(next);
                          pushToast('Forbidden pattern saved.');
                        } catch {
                          await syncForbiddenPatternsFromBackend();
                        }
                      }}
                      disabled={forbiddenSyncStatus !== 'idle'}
                      className="inline-flex items-center justify-center gap-2 bg-primary text-on-primary px-4 py-3 rounded-2xl text-sm font-black hover:opacity-90 disabled:opacity-60 md:col-span-3"
                    >
                      <Plus size={16} />
                      Add Custom Forbidden Pattern
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'surgery-config' && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-8 border-b border-slate-50 flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-black text-slate-900 mb-1">Hospital Settings</h3>
                    <p className="text-sm text-slate-500 font-medium">
                      Configure business hours and planning horizons used across scheduling.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={syncOrgGlobalSettingsFromBackend}
                      disabled={orgGlobalSyncStatus !== 'idle'}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 disabled:opacity-60"
                    >
                      <RotateCcw size={16} />
                      Sync
                    </button>
                    <button
                      type="button"
                      onClick={saveOrgGlobalSettingsToBackend}
                      disabled={orgGlobalSyncStatus !== 'idle'}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-bold bg-primary text-on-primary hover:opacity-90 disabled:opacity-60"
                    >
                      <Save size={16} />
                      Save
                    </button>
                  </div>
                </div>

                <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Business Hours Start</label>
                    <input
                      type="time"
                      value={orgGlobalSettings.business_hours_start}
                      onChange={(e) => setOrgGlobalSettings((p) => ({ ...p, business_hours_start: e.target.value }))}
                      className="w-full bg-slate-50 border-none rounded-2xl h-12 px-4 text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all shadow-inner"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Business Hours End</label>
                    <input
                      type="time"
                      value={orgGlobalSettings.business_hours_end}
                      onChange={(e) => setOrgGlobalSettings((p) => ({ ...p, business_hours_end: e.target.value }))}
                      className="w-full bg-slate-50 border-none rounded-2xl h-12 px-4 text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all shadow-inner"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Surgery Planning Horizon (days)</label>
                    <input
                      type="number"
                      min={1}
                      value={orgGlobalSettings.surgery_planning_horizon}
                      onChange={(e) =>
                        setOrgGlobalSettings((p) => ({ ...p, surgery_planning_horizon: Number(e.target.value) || 1 }))
                      }
                      className="w-full bg-slate-50 border-none rounded-2xl h-12 px-4 text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all shadow-inner"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Roster Planning Horizon (days)</label>
                    <input
                      type="number"
                      min={1}
                      value={orgGlobalSettings.roster_planning_horizon}
                      onChange={(e) =>
                        setOrgGlobalSettings((p) => ({ ...p, roster_planning_horizon: Number(e.target.value) || 1 }))
                      }
                      className="w-full bg-slate-50 border-none rounded-2xl h-12 px-4 text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all shadow-inner"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Surgery Planning Resolution (minutes)</label>
                    <input
                      type="number"
                      min={1}
                      value={orgGlobalSettings.surgery_planning_resolution}
                      onChange={(e) =>
                        setOrgGlobalSettings((p) => ({ ...p, surgery_planning_resolution: Number(e.target.value) || 1 }))
                      }
                      className="w-full bg-slate-50 border-none rounded-2xl h-12 px-4 text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all shadow-inner"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </main>
      </div>
    </motion.div>
  );
}
