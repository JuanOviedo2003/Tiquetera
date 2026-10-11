import { useEffect } from 'react';
import { X } from 'lucide-react';

export default function Modal({ isOpen, onClose, title, children, maxWidth = 'max-w-lg' }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#07090c]/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog (Bottom sheet on mobile, centered card on desktop) */}
      <div
        className={`relative w-full ${maxWidth} bg-[#161a23] rounded-t-3xl sm:rounded-2xl shadow-2xl p-5 sm:p-7 z-10 border border-[#2b3242] max-h-[92vh] sm:max-h-[88vh] overflow-y-auto transform transition-all pb-safe sm:pb-7`}
        role="dialog"
        aria-modal="true"
      >
        {/* Mobile handle */}
        <div className="flex sm:hidden justify-center pb-2.5 -mt-1">
          <div className="w-10 h-1 rounded-full bg-slate-600/40" />
        </div>

        <div className="flex items-center justify-between pb-3.5 border-b border-[#252b38] mb-5">
          <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight font-display">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Cerrar modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div>{children}</div>
      </div>
    </div>
  );
}
