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
import { createContract } from '../../lib/api';

interface StaticContractCreateProps {
  onNavigate: (view: ViewState) => void;
}

export default function StaticContractCreate({ onNavigate }: StaticContractCreateProps) {
  const context = useContext(AppStoreContext);
  if (!context) throw new Error('AppStoreContext not found');
  const { store, upsertContract, pushToast } = context;
  const existingContracts = store.contracts || [];

  const [contractId, setContractId] = useState('');
  const [contractName, setContractName] = useState('');
  const [staffType, setStaffType] = useState('Surgeon');
  const [yearlyLeaves, setYearlyLeaves] = useState(28);
  const [preferredShifts, setPreferredShifts] = useState(12);
  const [weeklyHours, setWeeklyHours] = useState(40.0);
  const [weeklyBreak, setWeeklyBreak] = useState(5.0);
  const [activeDays, setActiveDays] = useState(5);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Generate unique ID
    let newId = '';
    let isUnique = false;
    while (!isUnique) {
      const rand = Math.floor(1000 + Math.random() * 9000);
      newId = `S-${rand}`;
      isUnique = !existingContracts.some(c => c.id === newId);
    }
    setContractId(newId);
  }, [existingContracts]);

  const handleCreate = async () => {
    if (!contractName.trim()) {
      alert('Please enter a contract name.');
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await createContract({
        organization_id: 1,
        name: contractName,
        type: 'STATIC',
        status: 'Active',
        staff_tags: [staffType],
        configuration: {
          annualEntitlements: { yearlyLeaves, preferredShiftsPerYear: preferredShifts },
          weeklyHours,
          weeklyBreakHours: weeklyBreak,
          activeDaysPerWeek: activeDays,
        },
      });
      const fmt = (iso: string) =>
        new Date(iso).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
      const newContract: Contract = {
        id: String(created.id),
        name: created.name,
        type: created.type,
        status: (created.status as any) || 'Active',
        staffTags: created.staff_tags ?? [],
        createdAt: fmt(created.created_at),
        updatedAt: fmt(created.updated_at),
      };
      upsertContract(newContract);
      pushToast('Contract created (backend).');
      onNavigate('LIBRARY');
    } catch (e: any) {
      pushToast(`Create failed: ${e?.message ?? 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (confirm('Are you sure you want to discard changes?')) {
      onNavigate('LIBRARY');
    }
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
            <span className="text-slate-400">Create New Static</span>
          </nav>
          <h1 className="text-5xl font-black tracking-tight text-slate-900 leading-tight font-headline">
            Create Static Contract
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
          <button 
            onClick={handleCreate}
            disabled={isSubmitting}
            className="px-8 py-3 rounded-2xl text-sm font-bold text-white bg-primary shadow-xl shadow-primary/20 hover:brightness-110 transition-all active:scale-95 disabled:opacity-60 disabled:hover:brightness-100"
          >
            Create Static Contract
          </button>
        </div>
      </div>

      {/* Form Content */}
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
    </div>
  );
}
