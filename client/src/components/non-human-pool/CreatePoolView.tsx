import React, { useContext, useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { ChevronRight, Rocket } from 'lucide-react';
import { createRenewableResourcePool, type RenewableResourceWeeklyTemplate } from '../../lib/api';
import { AppStoreContext } from '../../context/AppStoreContext';

interface CreatePoolViewProps {
  onCancel: () => void;
  onCreated: (poolId: string) => void;
}

type DayKey = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

type DayRangeInput = { start: string; end: string };

type DayTemplateInput = {
  enabled: boolean;
  ranges: DayRangeInput[];
};

const DAY_KEYS: DayKey[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const TIME_PATTERN = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map((n) => Number(n));
  return h * 60 + m;
}

function normalizeRanges(input: DayRangeInput[]): Array<[string, string]> {
  return input
    .map((r) => ({ start: String(r.start || '').trim(), end: String(r.end || '').trim() }))
    .filter((r) => r.start && r.end)
    .map((r) => [r.start, r.end] as [string, string]);
}

function validateAndBuildWeeklyTemplate(
  draft: Record<DayKey, DayTemplateInput>,
): { weekly_template: RenewableResourceWeeklyTemplate; error: string | null } {
  const weekly_template: RenewableResourceWeeklyTemplate = {};

  for (const day of DAY_KEYS) {
    const dayDraft = draft[day];
    if (!dayDraft?.enabled) continue;

    const ranges = normalizeRanges(dayDraft.ranges);
    const normalizedForSort: Array<{ start: string; end: string; startMin: number; endMin: number }> = [];

    for (const [start, end] of ranges) {
      if (!TIME_PATTERN.test(start) || !TIME_PATTERN.test(end)) {
        return { weekly_template: {}, error: `Invalid time format on ${day}. Use HH:mm.` };
      }
      const startMin = toMinutes(start);
      const endMin = toMinutes(end);
      if (startMin >= endMin) {
        return { weekly_template: {}, error: `Start time must be before end time on ${day}.` };
      }
      normalizedForSort.push({ start, end, startMin, endMin });
    }

    normalizedForSort.sort((a, b) => a.startMin - b.startMin);
    for (let i = 1; i < normalizedForSort.length; i++) {
      if (normalizedForSort[i].startMin < normalizedForSort[i - 1].endMin) {
        return { weekly_template: {}, error: `Overlapping time ranges on ${day}.` };
      }
    }

    weekly_template[day] = {
      hours: normalizedForSort.map((r) => [r.start, r.end]),
    };
  }

  return { weekly_template, error: null };
}

export const CreatePoolView = ({ onCancel, onCreated }: CreatePoolViewProps) => {
  const app = useContext(AppStoreContext);
  const catalogs = (app?.store?.settings?.catalogs as any) ?? null;
  const [poolName, setPoolName] = useState('');
  const [resourceType, setResourceType] = useState<string>('');
  const [totalCapacity, setTotalCapacity] = useState<number>(1);
  const [unitPrefix, setUnitPrefix] = useState('');
  const [department, setDepartment] = useState('');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [weeklyTemplateDraft, setWeeklyTemplateDraft] = useState<Record<DayKey, DayTemplateInput>>(() => {
    return DAY_KEYS.reduce((acc, day) => {
      acc[day] = { enabled: false, ranges: [{ start: '08:00', end: '17:00' }] };
      return acc;
    }, {} as Record<DayKey, DayTemplateInput>);
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const allowedResourceTypeCodes = useMemo(() => {
    return new Set(['BED', 'EQUIPMENT', 'ROOM', 'DEVICE', 'VEHICLE']);
  }, []);

  const normalizeResourceTypeCode = (value: unknown) => {
    const s = String(value ?? '').trim();
    return s ? s.toUpperCase() : '';
  };

  const resourceTypeOptions = useMemo(() => {
    const fromCatalog = (catalogs?.resourceTypes ?? []).map((r: any) => normalizeResourceTypeCode(r?.name));
    const filtered = fromCatalog.filter((x: string) => allowedResourceTypeCodes.has(x));
    return Array.from(new Set(filtered));
  }, [allowedResourceTypeCodes, catalogs]);

  useEffect(() => {
    if (!resourceTypeOptions.includes(resourceType)) {
      setResourceType((resourceTypeOptions[0] as string | undefined) ?? '');
    }
  }, [resourceType, resourceTypeOptions]);

  const departmentOptions = useMemo(() => {
    const fromCatalog = (catalogs?.departments ?? [])
      .map((d: any) => String(d?.name ?? '').trim())
      .filter(Boolean);
    return Array.from(new Set(fromCatalog));
  }, [catalogs]);

  useEffect(() => {
    if (!departmentOptions.includes(department)) {
      setDepartment((departmentOptions[0] as string | undefined) ?? '');
    }
  }, [department, departmentOptions]);

  const formatResourceTypeLabel = (value: string) => {
    const s = String(value ?? '').trim();
    if (s === 'BED') return 'Bed';
    if (s === 'ROOM') return 'Room';
    if (s === 'EQUIPMENT') return 'Equipment';
    if (s === 'DEVICE') return 'Device';
    if (s === 'VEHICLE') return 'Vehicle';
    return s;
  };

  const canCreate = useMemo(() => {
    if (saving) return false;
    if (!poolName.trim()) return false;
    if (!resourceTypeOptions.includes(resourceType)) return false;
    if (!Number.isFinite(totalCapacity) || totalCapacity <= 0) return false;
    return true;
  }, [poolName, resourceType, resourceTypeOptions, saving, totalCapacity]);

  const toFriendlyCreateError = (err: any) => {
    const raw = String(err?.message ?? err ?? '').trim();
    const lower = raw.toLowerCase();

    if (lower.includes('unique constraint') && lower.includes('unit_id')) {
      const prefix = unitPrefix.trim();
      if (prefix) {
        return `Unit Prefix "${prefix}" already exists. Choose a different Unit Prefix (e.g. "${prefix}-A") or delete the existing units using that prefix.`;
      }
      return 'Some unit IDs already exist. Choose a different Unit Prefix or delete the existing units.';
    }

    if (lower.includes('invalid_enum_value') && lower.includes('resource_type')) {
      return 'Invalid Resource Type. Please choose one of: BED, EQUIPMENT, ROOM, DEVICE, VEHICLE.';
    }

    if (raw) return raw;
    return 'Create failed';
  };

  const onSubmit = async () => {
    if (!canCreate) return;
    setSaving(true);
    setError(null);
    try {
      const weeklyTemplateResult = validateAndBuildWeeklyTemplate(weeklyTemplateDraft);
      if (weeklyTemplateResult.error) throw new Error(weeklyTemplateResult.error);

      const res = await createRenewableResourcePool({
        organization_id: 1,
        pool_name: poolName.trim(),
        resource_type: resourceType,
        department: department.trim() ? department.trim() : undefined,
        location: location.trim() ? location.trim() : undefined,
        total_capacity: Math.floor(totalCapacity),
        unit_prefix: unitPrefix.trim() ? unitPrefix.trim() : undefined,
        weekly_template:
          Object.keys(weeklyTemplateResult.weekly_template).length > 0 ? weeklyTemplateResult.weekly_template : undefined,
        metadata: notes.trim() ? { notes: notes.trim() } : undefined,
      });
      const poolId = String((res as any)?.pool_id ?? '');
      if (!poolId) throw new Error('Pool created but missing pool_id');
      onCreated(poolId);
    } catch (e: any) {
      setError(toFriendlyCreateError(e));
    } finally {
      setSaving(false);
    }
  };

  const labelForDay = (day: DayKey) => day[0].toUpperCase() + day.slice(1);

  const toggleDay = (day: DayKey) => {
    setWeeklyTemplateDraft((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        enabled: !prev[day].enabled,
      },
    }));
  };

  const updateRange = (day: DayKey, idx: number, field: 'start' | 'end', value: string) => {
    setWeeklyTemplateDraft((prev) => {
      const dayData = prev[day];
      const ranges = dayData.ranges.slice();
      ranges[idx] = { ...ranges[idx], [field]: value };
      return {
        ...prev,
        [day]: {
          ...dayData,
          ranges,
        },
      };
    });
  };

  const addRange = (day: DayKey) => {
    setWeeklyTemplateDraft((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        ranges: [...prev[day].ranges, { start: '08:00', end: '17:00' }],
      },
    }));
  };

  const removeRange = (day: DayKey, idx: number) => {
    setWeeklyTemplateDraft((prev) => {
      const currentRanges = prev[day].ranges;
      const nextRanges = currentRanges.filter((_, i) => i !== idx);
      return {
        ...prev,
        [day]: {
          ...prev[day],
          ranges: nextRanges.length > 0 ? nextRanges : [{ start: '08:00', end: '17:00' }],
        },
      };
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="px-8 py-12 lg:px-12 max-w-4xl mx-auto w-full pb-32"
    >
      <nav className="mb-8 flex items-center gap-2 text-sm text-slate-500">
        <span>Resource Pools</span>
        <ChevronRight size={14} />
        <span className="text-slate-900 font-medium">New Non-Human Pool</span>
      </nav>

      <div className="mb-12">
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 mb-3">Create Non-Human Pool</h1>
        <p className="text-slate-500 max-w-2xl leading-relaxed">
          Define a new inventory cluster for clinical assets. This will allow for granular tracking of surgical kits, portable imaging units, or sterilized equipment batches across St. Mary's General.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        <div className="md:col-span-8 space-y-10">
          <div className="group">
            <label className="block text-xs font-bold uppercase tracking-widest text-blue-700 mb-4">Pool Name</label>
            <input
              className="w-full bg-white border-0 border-b-2 border-slate-200 py-3 px-4 focus:ring-0 focus:border-blue-700 transition-all rounded-t-lg font-bold text-lg text-slate-900 placeholder:text-slate-300"
              placeholder="e.g., Cardiology Ventilator Fleet"
              type="text"
              value={poolName}
              onChange={(e) => setPoolName(e.target.value)}
            />
          </div>
          <div className="group">
            <label className="block text-xs font-bold uppercase tracking-widest text-blue-700 mb-4">Resource Type</label>
            <select
              className="w-full bg-white border-0 border-b-2 border-slate-200 py-3 px-4 focus:ring-0 focus:border-blue-700 transition-all appearance-none cursor-pointer rounded-t-lg font-semibold text-lg text-slate-900"
              value={resourceType}
              onChange={(e) => setResourceType(e.target.value)}
              disabled={resourceTypeOptions.length === 0}
            >
              {resourceTypeOptions.length === 0 ? (
                <option value="">No resource types configured</option>
              ) : (
                resourceTypeOptions.map((t) => (
                  <option key={String(t)} value={String(t)}>
                    {formatResourceTypeLabel(String(t))}
                  </option>
                ))
              )}
            </select>
            {resourceTypeOptions.length === 0 ? (
              <div className="mt-2 text-sm font-semibold text-slate-500">
                Add Resource Types in Settings → Catalogs → Resource Types.
              </div>
            ) : null}
          </div>
          <div className="group">
            <label className="block text-xs font-bold uppercase tracking-widest text-blue-700 mb-4">Total Unit Count</label>
            <div className="flex items-center gap-6">
              <input
                className="w-32 bg-white border-0 border-b-2 border-slate-200 py-3 px-4 focus:ring-0 focus:border-blue-700 transition-all rounded-t-lg font-bold text-2xl text-slate-900"
                min="1"
                type="number"
                value={String(totalCapacity)}
                onChange={(e) => setTotalCapacity(Number(e.target.value))}
              />
              <span className="text-slate-400 font-medium italic">Individual operational units available for dispatch.</span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="group">
              <label className="block text-xs font-bold uppercase tracking-widest text-blue-700 mb-4">Unit Prefix</label>
              <input
                className="w-full bg-white border-0 border-b-2 border-slate-200 py-3 px-4 focus:ring-0 focus:border-blue-700 transition-all rounded-t-lg font-semibold text-lg text-slate-900 placeholder:text-slate-300"
                placeholder="e.g., ICU"
                type="text"
                value={unitPrefix}
                onChange={(e) => setUnitPrefix(e.target.value)}
              />
            </div>
            <div className="group">
              <label className="block text-xs font-bold uppercase tracking-widest text-blue-700 mb-4">Department</label>
              <select
                className="w-full bg-white border-0 border-b-2 border-slate-200 py-3 px-4 focus:ring-0 focus:border-blue-700 transition-all appearance-none cursor-pointer rounded-t-lg font-semibold text-lg text-slate-900"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                disabled={departmentOptions.length === 0}
              >
                {departmentOptions.length === 0 ? (
                  <option value="">No departments configured</option>
                ) : (
                  departmentOptions.map((d) => (
                     <option key={String(d)} value={String(d)}>
                      {formatResourceTypeLabel(String(d))}
                    </option>
                  ))
                )}
              </select>
              {departmentOptions.length === 0 ? (
                <div className="mt-2 text-sm font-semibold text-slate-500">
                  Add Departments in Settings → Catalogs → Departments.
                </div>
              ) : null}
            </div>
            <div className="group md:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-widest text-blue-700 mb-4">Location</label>
              <input
                className="w-full bg-white border-0 border-b-2 border-slate-200 py-3 px-4 focus:ring-0 focus:border-blue-700 transition-all rounded-t-lg font-semibold text-lg text-slate-900 placeholder:text-slate-300"
                placeholder="e.g., Building A • Floor 3"
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
          </div>
          <div className="group">
            <label className="block text-xs font-bold uppercase tracking-widest text-blue-700 mb-4">Special Notes</label>
            <textarea
              className="w-full bg-white border-0 border-b-2 border-slate-200 py-3 px-4 focus:ring-0 focus:border-blue-700 transition-all rounded-t-lg text-base leading-relaxed text-slate-900 placeholder:text-slate-300 resize-none"
              placeholder="Enter maintenance schedules, sterilization requirements, or specific departmental restrictions..."
              rows={5}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
            {error ? <div className="mt-3 text-sm font-semibold text-red-600">{error}</div> : null}
          </div>
        </div>

        <div className="md:col-span-4 flex flex-col gap-6">
          {/* Inventory Preview at top */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <h3 className="text-xs font-bold uppercase tracking-widest text-blue-700 mb-4">Inventory Preview</h3>
            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <span className="text-sm text-slate-600">Classification</span>
              <span className="text-sm font-semibold text-slate-900">Non-Human</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <span className="text-sm text-slate-600">Visibility</span>
              <span className="text-sm font-semibold text-slate-900">Global</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-slate-600">Tracking</span>
              <span className="text-sm font-semibold text-teal-700">RFID Enabled</span>
            </div>
          </div>

          {/* Weekly Availability Template */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
              <h3 className="text-xs font-bold uppercase tracking-widest text-blue-700">Weekly Availability</h3>
            </div>
            <div className="divide-y divide-slate-100">
              {DAY_KEYS.map((day) => {
                const row = weeklyTemplateDraft[day];
                return (
                  <div key={day} className="px-4 py-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-bold text-slate-800 uppercase tracking-wide w-24 shrink-0">{labelForDay(day)}</span>
                      <button
                        type="button"
                        onClick={() => toggleDay(day)}
                        className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide border transition-colors ${
                          row.enabled
                            ? 'bg-teal-600 text-white border-teal-600 hover:bg-teal-700'
                            : 'bg-white text-slate-400 border-slate-300 hover:border-slate-400'
                        }`}
                      >
                        {row.enabled ? 'Open' : 'Closed'}
                      </button>
                    </div>
                    {row.enabled ? (
                      <div className="flex flex-col gap-2 pl-1">
                        {row.ranges.map((range, idx) => (
                          <div key={`${day}-${idx}`} className="flex items-end gap-2">
                            <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                              <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">From</span>
                              <input
                                type="time"
                                className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-500 transition"
                                value={range.start}
                                onChange={(e) => updateRange(day, idx, 'start', e.target.value)}
                              />
                            </div>
                            <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                              <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">To</span>
                              <input
                                type="time"
                                className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-500 transition"
                                value={range.end}
                                onChange={(e) => updateRange(day, idx, 'end', e.target.value)}
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => removeRange(day, idx)}
                              className="shrink-0 self-end rounded-full w-6 h-6 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors mb-0.5"
                              title="Remove"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => addRange(day)}
                          className="self-start text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors pt-0.5"
                        >
                          + Add Range
                        </button>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic pl-1">No hours set</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-16 pt-8 border-t border-slate-200 flex items-center justify-between">
        <button
          onClick={onCancel}
          className="text-slate-500 font-semibold hover:text-red-500 transition-colors px-6 py-3 rounded-lg hover:bg-red-50"
        >
          Cancel
        </button>
        <button
          disabled={!canCreate}
          onClick={onSubmit}
          className="bg-gradient-to-br from-blue-700 to-blue-800 text-white font-bold px-10 py-4 rounded-lg shadow-lg shadow-blue-700/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2 disabled:opacity-60 disabled:hover:scale-100"
        >
          <span>Create Pool</span>
          <Rocket size={18} />
        </button>
      </div>
    </motion.div>
  );
};
