import { useEffect, useRef, type ReactNode } from 'react';

interface ModalBackdropProps {
  onClose: () => void;
  ariaLabelledBy: string;
  disableClose?: boolean;
  children: ReactNode;
}

export function ModalBackdrop({
  onClose,
  ariaLabelledBy,
  disableClose = false,
  children,
}: ModalBackdropProps) {
  const startedOnBackdropRef = useRef(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !disableClose) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, disableClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#2B0D14]/80"
      role="dialog"
      aria-modal="true"
      aria-labelledby={ariaLabelledBy}
      onMouseDown={(e) => {
        startedOnBackdropRef.current = e.target === e.currentTarget;
      }}
      onClick={(e) => {
        if (!disableClose && startedOnBackdropRef.current && e.target === e.currentTarget) {
          onClose();
        }
        startedOnBackdropRef.current = false;
      }}
    >
      {children}
    </div>
  );
}
