/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useContext, useEffect, useMemo } from 'react';
import ContractIdentity from './static-contract/ContractIdentity';
import AnnualEntitlements from './static-contract/AnnualEntitlements';
import WeeklyCommitment from './static-contract/WeeklyCommitment';
import ValidationBar from './static-contract/ValidationBar';
import { motion } from 'motion/react';
import { ViewState, Contract } from './types';
import { AppStoreContext } from '../../context/AppStoreContext';
import { createContract, getContractById, type ServerContract, updateContractById } from '../../lib/api';

interface StaticContractCreateProps {
  onNavigate: (view: ViewState) => void;
  contractId?: string | null;
  mode?: 'create' | 'edit' | 'view';
  onRequestEdit?: () => void;
}

export default function StaticContractCreate({
  onNavigate,
  contractId: selectedContractId,
  mode = 'create',
  onRequestEdit,
}: StaticContractCreateProps) {
  const context = useContext(AppStoreContext);
  if (!context) throw new Error('AppStoreContext not found');
  const { store, upsertContract, pushToast } = context;
  const existingContracts = store.contracts || [];
  const isEditing = mode === 'edit';
  const isViewing = mode === 'view';
  const isReadOnly = isViewing;

  const [contractId, setContractId] = useState('');
  const [contractName, setContractName] = useState('');
  const [staffType, setStaffType] = useState('Surgeon');
  const [yearlyLeaves, setYearlyLeaves] = useState(28);
  const [preferredShifts, setPreferredShifts] = useState(12);
  const [weeklyHours, setWeeklyHours] = useState(40.0);
  const [weeklyBreak, setWeeklyBreak] = useState(5.0);
  const [activeDays, setActiveDays] = useState(5);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadedContract, setLoadedContract] = useState<ServerContract | null>(null);

  useEffect(() => {
    if (isEditing || isViewing) return;
    // Generate unique ID
    let newId = '';
    let isUnique = false;
    while (!isUnique) {
      const rand = Math.floor(1000 + Math.random() * 9000);
      newId = `S-${rand}`;
      isUnique = !existingContracts.some(c => c.contractId === newId);
    }
    setContractId(newId);
  }, [existingContracts, isEditing, isViewing]);

  useEffect(() => {
    if ((!isEditing && !isViewing) || !selectedContractId) return;
    let cancelled = false;
    setIsLoading(true);

    (async () => {
      try {
        const server = await getContractById(selectedContractId);
        if (cancelled) return;
        setLoadedContract(server);
        setContractId(String(server.contract_id));
        setContractName(server.name ?? '');
        setStaffType(Array.isArray(server.staff_tags) && server.staff_tags[0] ? server.staff_tags[0] : 'Surgeon');

        const cfg: any = server.configuration && typeof server.configuration === 'object' ? server.configuration : {};
        const annual: any = cfg.annualEntitlements && typeof cfg.annualEntitlements === 'object' ? cfg.annualEntitlements : {};

        setYearlyLeaves(typeof annual.yearlyLeaves === 'number' ? annual.yearlyLeaves : 28);
        setPreferredShifts(typeof annual.preferredShiftsPerYear === 'number' ? annual.preferredShiftsPerYear : 12);
        setWeeklyHours(typeof cfg.weeklyHours === 'number' ? cfg.weeklyHours : 40.0);
        setWeeklyBreak(typeof cfg.weeklyBreakHours === 'number' ? cfg.weeklyBreakHours : 5.0);
        setActiveDays(typeof cfg.activeDaysPerWeek === 'number' ? cfg.activeDaysPerWeek : 5);
      } catch (e: any) {
        if (cancelled) return;
        pushToast(`Load failed: ${e?.message ?? 'Unknown error'}`);
        onNavigate('LIBRARY');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isEditing, isViewing, onNavigate, pushToast, selectedContractId]);

  const handleSave = async () => {
    if (isReadOnly) return;
    if (!contractName.trim()) {
      alert('Please enter a contract name.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        organization_id: 1,
        contract_id: contractId,
        name: contractName,
        type: 'STATIC',
        status: loadedContract?.status ?? 'Active',
        staff_tags: [staffType],
        configuration: {
          annualEntitlements: { yearlyLeaves, preferredShiftsPerYear: preferredShifts },
          weeklyHours,
          weeklyBreakHours: weeklyBreak,
          activeDaysPerWeek: activeDays,
        },
      } as const;

      const saved = isEditing && selectedContractId
        ? await updateContractById(selectedContractId, {...payload, staff_tags: [...payload.staff_tags]})
        : await createContract({...payload, staff_tags: [...payload.staff_tags]});

      const fmt = (iso: string) =>
        new Date(iso).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
      const newContract: Contract = {
        id: String(saved.id),
        contractId: saved.contract_id,
        name: saved.name,
        type: saved.type,
        status: (saved.status as any) || 'Active',
        staffTags: saved.staff_tags ?? [],
        createdAt: fmt(saved.created_at),
        updatedAt: fmt(saved.updated_at),
      };
      upsertContract(newContract);
      pushToast(isEditing ? 'Contract updated (backend).' : 'Contract created (backend).');
      onNavigate('LIBRARY');
    } catch (e: any) {
      pushToast(`${isEditing ? 'Update' : 'Create'} failed: ${e?.message ?? 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (isReadOnly) {
      onNavigate('LIBRARY');
      return;
    }
    if (confirm('Are you sure you want to discard changes?')) onNavigate('LIBRARY');
  };

  return (
    <div className="space-y-12">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-2"
        >
          <nav className="flex text-[10px] font-extrabold text-primary mb-3 gap-2 uppercase tracking-[0.2em]">
            <span className="opacity-60">Contracts</span>
            <span className="opacity-30">/</span>
            <span className="text-slate-400">{isViewing ? 'Viewing Static' : isEditing ? 'Editing Static' : 'Create New Static'}</span>
          </nav>
          <h1 className="text-5xl font-black tracking-tight text-slate-900 leading-tight font-headline">
            {isViewing ? 'View Static Contract' : isEditing ? 'Edit Static Contract' : 'Create Static Contract'}
          </h1>
          <p className="text-slate-500 font-medium max-w-lg leading-relaxed">
            Define a recurring weekly workload and annual entitlements for clinical staff with absolute precision.
          </p>
        </motion.div>
        
        <div className="flex gap-4">
          <button 
            onClick={handleCancel}
            className="px-8 py-3 rounded-2xl text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all active:scale-95"
          >
            Cancel
          </button>
          {isViewing ? (
            <button
              type="button"
              onClick={() => onRequestEdit?.()}
              className="px-8 py-3 rounded-2xl text-sm font-bold text-white bg-primary shadow-xl shadow-primary/20 hover:brightness-110 transition-all active:scale-95"
            >
              Edit
            </button>
          ) : (
            <button 
              onClick={handleSave}
              disabled={isSubmitting || isLoading}
              className="px-8 py-3 rounded-2xl text-sm font-bold text-white bg-primary shadow-xl shadow-primary/20 hover:brightness-110 transition-all active:scale-95 disabled:opacity-60 disabled:hover:brightness-100"
            >
              {isEditing ? 'Update Static Contract' : 'Create Static Contract'}
            </button>
          )}
        </div>
      </div>

      <fieldset disabled={isReadOnly || isLoading}>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column */}
        <div className="lg:col-span-4 space-y-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <ContractIdentity 
              id={contractId}
              name={contractName} 
              setName={setContractName} 
              type={staffType} 
              setType={setStaffType} 
            />
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <AnnualEntitlements 
              leaves={yearlyLeaves} 
              setLeaves={setYearlyLeaves}
              shifts={preferredShifts}
              setShifts={setPreferredShifts}
            />
          </motion.div>
        </div>

        {/* Right Column */}
        <motion.div 
          className="lg:col-span-8"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15 }}
        >
          <WeeklyCommitment 
            hours={weeklyHours}
            setHours={setWeeklyHours}
            breaks={weeklyBreak}
            setBreaks={setWeeklyBreak}
            days={activeDays}
            setDays={setActiveDays}
          />
        </motion.div>
      </div>

      {/* Summary Card */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <ValidationBar hours={weeklyHours} />
      </motion.div>
      </fieldset>
    </div>
  );
}
