import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface CatalogSelectOption {
  value: string;
  label: string;
}

interface CatalogSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: CatalogSelectOption[];
  placeholder?: string;
  emptyLabel?: string;
  disabled?: boolean;
  allowClear?: boolean;
  clearLabel?: string;
  className?: string;
}

export default function CatalogSelect({
  value,
  onChange,
  options,
  placeholder = 'Select...',
  emptyLabel = 'No options available',
  disabled = false,
  allowClear = false,
  clearLabel = 'None',
  className,
}: CatalogSelectProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selected = useMemo(
    () => options.find((option) => option.value === value) ?? null,
    [options, value],
  );

  const isEmpty = options.length === 0;

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      <button
        type="button"
        disabled={disabled || isEmpty}
        onClick={() => setOpen((prev) => !prev)}
        className="w-full bg-slate-50 border-none border-b-2 border-slate-100 focus:border-primary rounded-t-xl min-h-12 px-4 py-2.5 text-xs font-bold outline-none flex items-center justify-between gap-2 hover:border-primary/40 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      >
        <span
          className={cn(
            'truncate text-left flex-1 min-w-0',
            selected ? 'text-slate-900' : 'text-slate-400 font-medium',
          )}
        >
          {isEmpty ? emptyLabel : selected?.label ?? placeholder}
        </span>
        <ChevronDown
          size={16}
          className={cn('text-slate-400 flex-shrink-0 transition-transform', open && 'rotate-180')}
        />
      </button>

      {open && !isEmpty && (
        <div className="absolute z-20 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg max-h-56 overflow-y-auto">
          {allowClear && (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onChange('');
                setOpen(false);
              }}
              className="w-full px-4 py-2.5 text-left text-xs font-bold flex items-center justify-between gap-3 transition-colors border-b border-slate-50 text-slate-500 hover:bg-slate-50"
            >
              <span className="truncate">{clearLabel}</span>
              {!value && <Check size={14} className="flex-shrink-0" />}
            </button>
          )}
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onChange(option.value);
                  setOpen(false);
                }}
                className={cn(
                  'w-full px-4 py-2.5 text-left text-xs font-bold flex items-center justify-between gap-3 transition-colors border-b border-slate-50 last:border-b-0',
                  isSelected
                    ? 'bg-primary/5 text-primary hover:bg-primary/10'
                    : 'text-slate-700 hover:bg-slate-50',
                )}
              >
                <span className="truncate">{option.label}</span>
                {isSelected && <Check size={14} className="flex-shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
