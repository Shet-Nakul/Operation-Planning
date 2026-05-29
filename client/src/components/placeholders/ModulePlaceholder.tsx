type ModulePlaceholderProps = {
  title: string;
  description?: string;
};

export function ModulePlaceholder({ title, description }: ModulePlaceholderProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-6 rounded-2xl border border-dashed border-surface-container-high bg-surface-container-low/40">
      <p className="text-lg font-bold font-headline text-on-surface">{title}</p>
      <p className="text-sm text-on-surface-variant mt-2 max-w-md">
        {description ?? 'This module is not wired in the demo yet. Use the sidebar to open Current Status, Operational Backlog, or Surgery Requests.'}
      </p>
    </div>
  );
}
