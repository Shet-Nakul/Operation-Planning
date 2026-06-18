import { useContext, useMemo } from 'react';
import { Fingerprint, Plus } from 'lucide-react';
import { AppStoreContext } from '../../../context/AppStoreContext';

interface ContractIdentityProps {
  id: string;
  name: string;
  setName: (name: string) => void;
  type: string;
  setType: (type: string) => void;
}

export default function ContractIdentity({ id, name, setName, type, setType }: ContractIdentityProps) {
  const context = useContext(AppStoreContext);
  const staffTypes = useMemo(() => {
    const fallback = ['Surgeon', 'Specialist', 'Resident', 'Nurse'];
    const rows = context?.store?.settings?.catalogs?.staffTags ?? [];
    const names = rows.map((t) => t.name).filter(Boolean);
    return names.length > 0 ? names : fallback;
  }, [context?.store?.settings?.catalogs?.staffTags]);

  return (
    <div className="bg-white p-6 rounded-2xl space-y-6 shadow-sm border border-slate-100">
      <h2 className="text-sm font-bold text-primary uppercase tracking-wider flex items-center gap-2">
        <Fingerprint className="w-5 h-5" />
        Contract Identity
      </h2>
      
      <div className="space-y-5">
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-400 uppercase px-1 tracking-wider">Contract ID</label>
          <input
            className="w-full bg-slate-50 border-none border-b-2 border-slate-100 focus:border-primary focus:ring-0 text-slate-900 font-semibold px-4 py-3 rounded-t-xl transition-all outline-none"
            readOnly
            type="text"
            value={id || 'Generated after save'}
          />
          <p className="text-[9px] text-slate-400 px-1 italic">Assigned by the backend and available after creation</p>
        </div>
        
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-400 uppercase px-1 tracking-wider">Contract Name</label>
          <input
            className="w-full bg-slate-50 border-none border-b-2 border-slate-100 focus:border-primary focus:ring-0 text-slate-900 font-medium px-4 py-3 rounded-t-xl transition-all outline-none"
            placeholder="e.g. Senior Surgeon Standard 40h"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-slate-400 uppercase px-1 tracking-wider">Staff Type</label>
          <div className="flex flex-wrap gap-2">
            {staffTypes.map((t) => (
              <button
                key={t}
                onClick={() => setType(t)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all active:scale-95 ${
                  t === type
                    ? 'bg-primary text-white shadow-md shadow-primary/20'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {t}
              </button>
            ))}
            <button className="w-8 h-8 flex items-center justify-center rounded-full text-primary border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-all">
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
