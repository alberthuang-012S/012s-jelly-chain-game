import { useEffect, useRef, type ReactNode } from 'react';
import { Icon } from './Icon';
export function Modal({
  title,
  children,
  onClose,
  className = '',
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  className?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current!,
      previouslyFocused = document.activeElement as HTMLElement | null;
    dialog.showModal();
    return () => {
      dialog.close();
      previouslyFocused?.focus();
    };
  }, []);
  useEffect(() => {
    ref.current?.querySelector<HTMLButtonElement>('button')?.focus();
  }, [title]);
  return (
    <dialog
      ref={ref}
      className={`modal ${className}`}
      aria-label={title}
      onKeyDown={(e) => {
        if (e.key !== 'Tab') return;
        const focusable = [
          ...e.currentTarget.querySelectorAll<HTMLElement>(
            'button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex="0"]',
          ),
        ].filter((element) => element.getClientRects().length > 0);
        const first = focusable[0],
          last = focusable.at(-1);
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          const rect = e.currentTarget.getBoundingClientRect();
          if (
            e.clientX < rect.left ||
            e.clientX > rect.right ||
            e.clientY < rect.top ||
            e.clientY > rect.bottom
          )
            onClose();
        }
      }}
    >
      <button
        className="icon-button modal-close"
        aria-label="CLOSE · 關閉"
        onClick={onClose}
        autoFocus
      >
        <Icon name="close" />
      </button>
      {children}
    </dialog>
  );
}
