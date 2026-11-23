import { AnimatePresence, motion } from 'motion/react';
import { X } from 'lucide-react';
import { ModalBackdrop } from './ModalBackdrop';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Hapus',
  cancelLabel = 'Batal',
  destructive = true,
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <AnimatePresence>
      {open ? (
        <ModalBackdrop
          onClose={onCancel}
          ariaLabelledBy="confirm-dialog-title"
          disableClose={loading}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="w-full max-w-md bg-[#561F2D] border border-[#702E3F] rounded-lg p-4 sm:p-6 space-y-6 overflow-x-hidden"
          >
            <div className="flex items-start justify-between gap-4">
              <h2 id="confirm-dialog-title" className="text-lg font-semibold text-[#F2ECEE] break-words min-w-0">
                {title}
              </h2>
              <button
                type="button"
                onClick={onCancel}
                disabled={loading}
                aria-label="Tutup dialog"
                className="p-2 rounded-lg text-[#F2ECEE]/70 hover:text-[#F2ECEE] hover:bg-[#622534] transition-colors shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-sm text-[#F2ECEE]/85 leading-relaxed break-words">{message}</p>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onCancel}
                disabled={loading}
                className="px-4 py-2 min-h-[40px] rounded-lg text-sm font-medium bg-[#5B2230] text-[#F2ECEE] border border-[#7D3648] hover:bg-[#6B2A3A] hover:border-[#9C495E] transition-colors whitespace-nowrap shrink-0"
              >
                {cancelLabel}
              </button>
              <button
                type="button"
                onClick={onConfirm}
                disabled={loading}
                className={`px-4 py-2 min-h-[40px] rounded-lg text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
                  destructive
                    ? 'bg-[#5E1B1E] text-[#F0A8AA] border border-[#963538] hover:bg-[#6E2125]'
                    : 'bg-[#D9C5A9] text-[#2B0D14] hover:bg-[#C5AF91]'
                }`}
              >
                {loading ? 'Memproses...' : confirmLabel}
              </button>
            </div>
          </motion.div>
        </ModalBackdrop>
      ) : null}
    </AnimatePresence>
  );
}
