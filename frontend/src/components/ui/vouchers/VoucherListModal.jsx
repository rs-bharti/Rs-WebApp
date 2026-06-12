import { useEffect } from 'react';
import { X } from 'lucide-react';
import VoucherList from './VoucherList';

export { fmtDate, toDateInput } from './VoucherList';

const VoucherListModal = ({ isOpen, onClose, ...props }) => {
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;
  return (
    <div
      className="fixed inset-0 z-40 flex items-start justify-center bg-black/40 backdrop-blur-sm overflow-y-auto py-8 px-4"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-7xl">
        <div className="flex justify-end mb-3">
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-2 text-xs font-bold text-white/80 uppercase tracking-widest hover:text-white transition-colors cursor-pointer bg-black/20 hover:bg-black/30 px-4 py-2 rounded-lg"
          >
            <X className="w-4 h-4" /> Close
          </button>
        </div>
        <VoucherList {...props} />
      </div>
    </div>
  );
};

export default VoucherListModal;
