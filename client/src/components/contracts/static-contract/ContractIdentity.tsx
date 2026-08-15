import { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Fingerprint, ChevronDown, Check } from 'lucide-react';
import { AppStoreContext } from '../../../context/AppStoreContext';

interface ContractIdentityProps {
  name: string;
  setName: (name: string) => void;
  tags: string[];
  setTags: (tags: string[]) => void;
}

export default function ContractIdentity({ name, setName, tags, setTags }: ContractIdentityProps) {
  const context = useContext(AppStoreContext);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const catalogStaffTagOptions = useMemo(() => {
    const rows = context?.store?.settings?.catalogs?.staffTags ?? [];
    const names = rows
      .filter((t) => String(t.status ?? 'ACTIVE').toUpperCase() !== 'INACTIVE')
      .map((t) => String(t.name ?? '').trim())
      .filter(Boolean);
    return Array.from(new Set(names));
  }, [context?.store?.settings?.catalogs?.staffTags]);

  const dropdownOptions = useMemo(() => {
    const extras = tags.filter((tag) => !catalogStaffTagOptions.includes(tag));
    return [...catalogStaffTagOptions, ...extras];
  }, [catalogStaffTagOptions, tags]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="bg-white p-6 rounded-2xl space-y-6 shadow-sm border border-slate-100">
      <h2 className="text-sm font-bold text-primary uppercase tracking-wider flex items-center gap-2">
        <Fingerprint className="w-5 h-5" />
        Contract Identity
      </h2>
      
      <div className="space-y-5">
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
        
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-400 uppercase px-1 tracking-wider">Staff Type Tags</label>
          {dropdownOptions.length === 0 ? (
            <p className="px-1 pt-2 text-sm text-slate-400 font-medium">No staff tags in Settings yet.</p>
          ) : (
            <div ref={dropdownRef} className="relative mt-2">
              <button
                type="button"
                onClick={() => setDropdownOpen((open) => !open)}
                className="w-full bg-slate-50 border-none border-b-2 border-slate-100 focus:border-primary rounded-t-xl min-h-12 px-4 py-2.5 text-xs font-bold outline-none flex items-center justify-between gap-2 hover:border-primary/40 transition-colors"
              >
                <div className="flex flex-wrap gap-1.5 flex-1 min-w-0 items-center">
                  {tags.length === 0 ? (
                    <span className="text-slate-400 font-medium">Select staff tags...</span>
                  ) : (
                    tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-black whitespace-nowrap"
                      >
                        {tag}
                      </span>
                    ))
                  )}
                </div>
                <ChevronDown
                  size={16}
                  className={`text-slate-400 flex-shrink-0 transition-transform ${
                    dropdownOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {dropdownOpen && (
                <div className="absolute z-20 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg max-h-56 overflow-y-auto">
                  {dropdownOptions.map((tag) => {
                    const selected = tags.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setTags(
                            selected ? tags.filter((item) => item !== tag) : [...tags, tag],
                          );
                        }}
                        className={`w-full px-4 py-2.5 text-left text-xs font-bold flex items-center justify-between gap-3 transition-colors border-b border-slate-50 last:border-b-0 ${
                          selected
                            ? 'bg-primary/5 text-primary hover:bg-primary/10'
                            : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span className="truncate">{tag}</span>
                        {selected && <Check size={14} className="flex-shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
