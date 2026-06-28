import React, { useState, useEffect, useContext } from 'react';
import { motion } from 'motion/react';
import { 
  Settings, 
  ShieldAlert, 
  Clock, 
  ChevronRight, 
  Save, 
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Stethoscope,
  PlusCircle
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
  createCatalogSkill,
  createCatalogSpecialization,
  createCatalogStaffTag,
  getCatalogShifts,
  getCatalogSkills,
  getCatalogSpecializations,
  getCatalogStaffTags,
  getOrgGlobalSettings,
  upsertOrgGlobalSettings,
} from '../lib/api';

type SettingsTab = 'catalogs' | 'forbidden-patterns' | 'shift-config' | 'surgery-config';
type PhaseId = 'preOp' | 'operative' | 'postOp' | 'sterilization' | 'recovery';

const PHASE_LABELS: Record<PhaseId, string> = {
  preOp: 'Pre-operative',
  operative: 'Operative',
  postOp: 'Post-operative',
  sterilization: 'Sterilization',
  recovery: 'Recovery'
};

const RESOURCE_ICONS = ['user', 'nurse', 'room', 'equipment', 'bed'];

export default function SettingsPage() {
  const context = useContext(AppStoreContext);
  if (!context) return null;
  const { store, updateSettings, resetStoreToSeed, pushToast } = context;

  const [activeTab, setActiveTab] = useState<SettingsTab>('forbidden-patterns');
  
  // Local state for editing before save
  const [patterns, setPatterns] = useState<ForbiddenPattern[]>(store.settings?.forbiddenPatterns || []);
  const [operationTypes, setOperationTypes] = useState<string[]>(store.settings?.operationTypes || []);
  const [newOpType, setNewOpType] = useState('');
  const [catalogs, setCatalogs] = useState<CatalogSettings>(store.settings?.catalogs || DEFAULT_GLOBAL_SETTINGS.catalogs);
  const [orgGlobalSettings, setOrgGlobalSettings] = useState<OrgGlobalSettings>(
    store.settings?.orgGlobalSettings || DEFAULT_GLOBAL_SETTINGS.orgGlobalSettings,
  );
  const [newCatalogRole, setNewCatalogRole] = useState({ name: '', color: '#4F46E5' });
  const [newCatalogSpecialization, setNewCatalogSpecialization] = useState({ name: '', description: '' });
  const [newCatalogSkill, setNewCatalogSkill] = useState({ name: '', description: '' });
  const [newCatalogShift, setNewCatalogShift] = useState({ name: '', start_time: '08:00', end_time: '16:00', description: '' });
  const [catalogSyncStatus, setCatalogSyncStatus] = useState<'idle' | 'syncing'>('idle');
  const [orgGlobalSyncStatus, setOrgGlobalSyncStatus] = useState<'idle' | 'syncing' | 'saving'>('idle');
  
  const [phaseResources, setPhaseResources] = useState<Record<string, DefaultResourceSetting[]>>(
    store.settings?.phaseResources || DEFAULT_GLOBAL_SETTINGS.phaseResources
  );
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

  const syncCatalogsFromBackend = async () => {
    setCatalogSyncStatus('syncing');
    try {
      const orgId = 1;
      const [staffTags, specializations, skills, shifts] = await Promise.all([
        getCatalogStaffTags({ orgId }),
        getCatalogSpecializations({ orgId }),
        getCatalogSkills({ orgId }),
        getCatalogShifts({ orgId }),
      ]);
      const next: CatalogSettings = { staffTags, specializations, skills, shifts };
      setCatalogs(next);
      updateSettings({ catalogs: next });
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
      const gs = await getOrgGlobalSettings(orgId);
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
      const saved = await upsertOrgGlobalSettings({
        organization_id: 1,
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
  }, []);

  const handleTogglePattern = (id: string) => {
    setPatterns(prev => prev.map(p => p.id === id ? { ...p, enabled: !p.enabled } : p));
  };

  const handleAddOpType = () => {
    if (!newOpType.trim()) return;
    if (operationTypes.includes(newOpType.trim())) {
      pushToast('Operation type already exists');
      return;
    }
    setOperationTypes(prev => [...prev, newOpType.trim()]);
    setNewOpType('');
  };

  const handleRemoveOpType = (type: string) => {
    setOperationTypes(prev => prev.filter(t => t !== type));
  };

  const handleAddResource = (phase: PhaseId) => {
    if (!newResource.name.trim()) return;
    const current = phaseResources[phase] || [];
    if (current.some(r => r.name.toLowerCase() === newResource.name.toLowerCase())) {
      pushToast('Resource already exists in this phase');
      return;
    }
    setPhaseResources(prev => ({
      ...prev,
      [phase]: [...current, { ...newResource, name: newResource.name.trim() }]
    }));
    setNewResource({ name: '', count: 1, icon: 'user' });
  };

  const handleRemoveResource = (phase: PhaseId, resourceName: string) => {
    setPhaseResources(prev => ({
      ...prev,
      [phase]: (prev[phase] || []).filter(r => r.name !== resourceName)
    }));
  };

  const handleSave = () => {
    setSaveStatus('saving');
    
    // Update global settings
    updateSettings({
      forbiddenPatterns: patterns,
      operationTypes: operationTypes,
      phaseResources: phaseResources,
      catalogs: catalogs,
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
            onClick={() => setActiveTab('shift-config')}
            className={cn(
              "w-full flex items-center justify-between px-5 py-4 rounded-2xl transition-all font-bold text-sm",
              activeTab === 'shift-config' 
                ? "bg-white shadow-sm border border-slate-100 text-primary" 
                : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
            )}
          >
            <div className="flex items-center gap-3">
              <Clock size={18} />
              <span>Shift Configuration</span>
            </div>
            {activeTab === 'shift-config' && <ChevronRight size={16} />}
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
              <span>Surgery Configuration</span>
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

                <div className="p-8 space-y-10">
                  <section className="space-y-4">
                    <h4 className="text-sm font-black text-slate-900">Staff Tags (Roles)</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <input
                        value={newCatalogRole.name}
                        onChange={(e) => setNewCatalogRole((p) => ({ ...p, name: e.target.value }))}
                        placeholder="e.g. Surgeon"
                        className="bg-white border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20"
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
                        className="inline-flex items-center justify-center gap-2 bg-primary text-on-primary px-4 py-3 rounded-2xl text-sm font-black hover:opacity-90"
                      >
                        <Plus size={16} />
                        Add
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {catalogs.staffTags.map((t) => (
                        <span key={t.id} className="px-3 py-1.5 rounded-full text-xs font-black bg-slate-100 text-slate-700">
                          {t.name}
                        </span>
                      ))}
                      {catalogs.staffTags.length === 0 && <p className="text-sm text-slate-400 font-medium">No staff tags yet.</p>}
                    </div>
                  </section>

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
                        className="inline-flex items-center justify-center gap-2 bg-primary text-on-primary px-4 py-3 rounded-2xl text-sm font-black hover:opacity-90 md:col-span-3"
                      >
                        <Plus size={16} />
                        Add
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {catalogs.specializations.map((t) => (
                        <span key={t.id} className="px-3 py-1.5 rounded-full text-xs font-black bg-slate-100 text-slate-700">
                          {t.name}
                        </span>
                      ))}
                      {catalogs.specializations.length === 0 && <p className="text-sm text-slate-400 font-medium">No specializations yet.</p>}
                    </div>
                  </section>

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
                        className="inline-flex items-center justify-center gap-2 bg-primary text-on-primary px-4 py-3 rounded-2xl text-sm font-black hover:opacity-90 md:col-span-3"
                      >
                        <Plus size={16} />
                        Add
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {catalogs.skills.map((t) => (
                        <span key={t.id} className="px-3 py-1.5 rounded-full text-xs font-black bg-slate-100 text-slate-700">
                          {t.name}
                        </span>
                      ))}
                      {catalogs.skills.length === 0 && <p className="text-sm text-slate-400 font-medium">No skills yet.</p>}
                    </div>
                  </section>

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
                <div className="p-8 border-b border-slate-50">
                  <h3 className="text-xl font-black text-slate-900 mb-1">Pattern Constraints</h3>
                  <p className="text-sm text-slate-500 font-medium">These patterns will be flagged or blocked during dynamic contract generation.</p>
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
                      <button 
                        onClick={() => handleTogglePattern(p.id)}
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
                  ))}
                </div>
                <div className="p-6 bg-slate-50/50 border-t border-slate-100">
                  <button className="flex items-center gap-2 text-primary font-bold text-sm hover:underline">
                    <Plus size={16} />
                    Add Custom Forbidden Pattern
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'shift-config' && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-8 border-b border-slate-50 flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-black text-slate-900 mb-1">Shift Configuration</h3>
                    <p className="text-sm text-slate-500 font-medium">Backed by /api/catalogs/shift.</p>
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
                  <div className="bg-slate-50 rounded-2xl p-6 space-y-4 border border-slate-100">
                    <h4 className="text-sm font-black text-slate-900">Create Shift</h4>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                      <input
                        value={newCatalogShift.name}
                        onChange={(e) => setNewCatalogShift((p) => ({ ...p, name: e.target.value }))}
                        placeholder="e.g. Day"
                        className="bg-white border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20"
                      />
                      <input
                        value={newCatalogShift.start_time}
                        onChange={(e) => setNewCatalogShift((p) => ({ ...p, start_time: e.target.value }))}
                        className="bg-white border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20"
                      />
                      <input
                        value={newCatalogShift.end_time}
                        onChange={(e) => setNewCatalogShift((p) => ({ ...p, end_time: e.target.value }))}
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
                              start_time: newCatalogShift.start_time,
                              end_time: newCatalogShift.end_time,
                              description: newCatalogShift.description.trim() || undefined,
                            });
                            setNewCatalogShift({ name: '', start_time: '08:00', end_time: '16:00', description: '' });
                            await syncCatalogsFromBackend();
                          } catch (e: any) {
                            pushToast(e?.message ?? 'Create failed');
                          }
                        }}
                        className="inline-flex items-center justify-center gap-2 bg-primary text-on-primary px-4 py-3 rounded-2xl text-sm font-black hover:opacity-90"
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
                    <h4 className="text-sm font-black text-slate-900">Existing Shifts</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {catalogs.shifts.map((s) => (
                        <div key={s.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                          <div className="flex items-center justify-between">
                            <p className="font-black text-slate-900">{s.name}</p>
                            <p className="text-xs font-mono text-slate-500">
                              {s.start_time}–{s.end_time}
                            </p>
                          </div>
                          {s.description && <p className="text-xs text-slate-500 mt-1 font-medium">{s.description}</p>}
                        </div>
                      ))}
                      {catalogs.shifts.length === 0 && <p className="text-sm text-slate-400 font-medium">No shifts yet.</p>}
                    </div>
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
                    <h3 className="text-xl font-black text-slate-900 mb-1">Global Settings (Backend)</h3>
                    <p className="text-sm text-slate-500 font-medium">
                      Backed by /api/catalogs/global_settings (upsert) and /api/catalogs/global_settings/{'{'}orgId{'}'} (get).
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

              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-8 border-b border-slate-50">
                  <h3 className="text-xl font-black text-slate-900 mb-1">Operation Types</h3>
                  <p className="text-sm text-slate-500 font-medium">Define the available surgical procedure types for requests.</p>
                </div>
                
                <div className="p-8 space-y-6">
                  <div className="flex gap-3">
                    <input 
                      type="text" 
                      placeholder="e.g. Cardio - Valve Replacement"
                      value={newOpType}
                      onChange={(e) => setNewOpType(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddOpType()}
                      className="flex-1 bg-slate-50 border-none rounded-2xl h-12 px-6 text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all shadow-inner"
                    />
                    <button 
                      onClick={handleAddOpType}
                      className="px-6 h-12 bg-primary text-white rounded-2xl font-bold text-sm hover:bg-primary/90 transition-all flex items-center gap-2"
                    >
                      <Plus size={18} />
                      Add Type
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {operationTypes.map((type) => (
                      <div 
                        key={type} 
                        className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-primary/20 transition-all"
                      >
                        <span className="font-bold text-slate-700 text-sm">{type}</span>
                        <button 
                          onClick={() => handleRemoveOpType(type)}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>

                  {operationTypes.length === 0 && (
                    <div className="text-center py-12 bg-slate-50 rounded-[2rem] border border-dashed border-slate-200">
                      <Stethoscope size={48} className="mx-auto text-slate-200 mb-4" />
                      <p className="text-slate-400 font-bold">No operation types defined</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-8 border-b border-slate-50">
                  <h3 className="text-xl font-black text-slate-900 mb-1">Phase Resource Defaults</h3>
                  <p className="text-sm text-slate-500 font-medium">Configure default personnel and equipment requirements for each surgical phase.</p>
                </div>

                <div className="p-8 space-y-8">
                  <div className="flex flex-wrap gap-2">
                    {(Object.keys(PHASE_LABELS) as PhaseId[]).map((phaseId) => (
                      <button
                        key={phaseId}
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
                      <div className="flex items-end">
                        <button 
                          onClick={() => handleAddResource(selectedPhase)}
                          className="w-full h-11 bg-primary text-white rounded-xl font-bold text-xs hover:bg-primary/90 transition-all flex items-center justify-center gap-2"
                        >
                          <Plus size={16} />
                          Add Resource
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {(phaseResources[selectedPhase] || []).map((res) => (
                        <div 
                          key={res.name} 
                          className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 group hover:border-primary/20 transition-all shadow-sm"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-primary transition-colors">
                              <PlusCircle className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="font-bold text-slate-700 text-sm">{res.name}</p>
                              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Default Count: {res.count}</p>
                            </div>
                          </div>
                          <button 
                            onClick={() => handleRemoveResource(selectedPhase, res.name)}
                            className="p-2 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                    </div>

                    {(phaseResources[selectedPhase] || []).length === 0 && (
                      <div className="text-center py-8">
                        <p className="text-slate-400 text-sm font-medium italic">No default resources defined for {PHASE_LABELS[selectedPhase]}.</p>
                      </div>
                    )}
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
