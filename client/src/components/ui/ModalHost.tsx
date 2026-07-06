import React from 'react';
import { X } from 'lucide-react';
import type { ModalState } from '../../context/AppStoreContext';

export function ModalHost({ modal, onClose }: { modal: ModalState | null; onClose: () => void }) {
  if (!modal || !modal.isOpen) return null;

  const getTypeStyles = () => {
    switch (modal.type) {
      case 'error':
        return {
          container: 'border-error bg-error/10',
          title: 'text-error',
          button: 'bg-error text-white hover:bg-error/90',
          icon: 'text-error',
        };
      case 'warning':
        return {
          container: 'border-warning bg-warning/10',
          title: 'text-warning',
          button: 'bg-warning text-white hover:bg-warning/90',
          icon: 'text-warning',
        };
      case 'info':
        return {
          container: 'border-primary bg-primary/10',
          title: 'text-primary',
          button: 'bg-primary text-white hover:bg-primary/90',
          icon: 'text-primary',
        };
      case 'success':
        return {
          container: 'border-success bg-success/10',
          title: 'text-success',
          button: 'bg-success text-white hover:bg-success/90',
          icon: 'text-success',
        };
      default:
        return {
          container: 'border-gray-300 bg-gray-50',
          title: 'text-gray-900',
          button: 'bg-gray-800 text-white hover:bg-gray-900',
          icon: 'text-gray-600',
        };
    }
  };

  const styles = getTypeStyles();

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50">
      <div className={`relative w-[min(92vw,30rem)] rounded-2xl border-2 ${styles.container} shadow-2xl`}>
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <h3 className={`text-xl font-bold ${styles.title}`}>{modal.title}</h3>
            <button
              onClick={onClose}
              className="p-1 rounded-full hover:bg-black/10 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="mb-6">
            <p className="text-gray-700 whitespace-pre-wrap">{modal.message}</p>
          </div>

          <div className="flex justify-end">
            <button
              onClick={onClose}
              className={`px-6 py-2 rounded-lg font-semibold transition-colors ${styles.button}`}
            >
              OK
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}