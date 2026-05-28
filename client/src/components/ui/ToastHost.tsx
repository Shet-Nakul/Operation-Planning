export function ToastHost({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div
      role="status"
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] max-w-[min(90vw,28rem)] px-4 py-3 rounded-xl bg-slate-900 text-white text-sm font-medium shadow-xl text-center"
    >
      {message}
    </div>
  );
}
