import { Check } from 'lucide-react';

/** Aviso discreto de que algo se guardó. Se anuncia a lectores de pantalla. */
export function SavedStamp({ visible, children }: { visible: boolean; children: string }) {
  return (
    <span role="status" className="inline-flex min-h-5 items-center gap-1 text-small text-positive">
      {visible && (
        <>
          <Check size={14} aria-hidden />
          {children}
        </>
      )}
    </span>
  );
}
