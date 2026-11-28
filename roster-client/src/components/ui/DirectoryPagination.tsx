import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';

type DirectoryPaginationProps = {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  label: string;
  disabled?: boolean;
  onChange: (page: number) => void;
};

export function DirectoryPagination({ page, totalPages, total, limit, label, disabled, onChange }: DirectoryPaginationProps) {
  const start = Math.max(1, Math.min(page - 2, totalPages - 4));
  const pages = Array.from({ length: Math.min(5, totalPages) }, (_, index) => start + index);
  return <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/30 px-6 py-4">
    <p className="text-xs text-slate-500">{total ? <>Showing <span className="font-bold text-slate-900">{(page - 1) * limit + 1}-{Math.min(page * limit, total)}</span> of <span className="font-bold text-slate-900">{total}</span> {label}</> : `No ${label} to show`}</p>
    <nav aria-label={`${label} pagination`} className="flex items-center gap-1">
      <button type="button" aria-label={`Previous ${label} page`} onClick={() => onChange(page - 1)} disabled={disabled || page <= 1} className="rounded p-2 text-slate-400 transition-colors hover:bg-slate-100 disabled:opacity-40"><ChevronLeft size={16} /></button>
      {pages.map(number => <button key={number} type="button" aria-label={`${label} page ${number}`} aria-current={page === number ? 'page' : undefined} disabled={disabled} onClick={() => onChange(number)} className={cn('h-8 w-8 rounded text-xs transition-colors disabled:opacity-40', page === number ? 'bg-blue-700 font-bold text-white' : 'font-medium text-slate-600 hover:bg-slate-100')}>{number}</button>)}
      <button type="button" aria-label={`Next ${label} page`} onClick={() => onChange(page + 1)} disabled={disabled || page >= totalPages} className="rounded p-2 text-slate-400 transition-colors hover:bg-slate-100 disabled:opacity-40"><ChevronRight size={16} /></button>
    </nav>
  </div>;
}
