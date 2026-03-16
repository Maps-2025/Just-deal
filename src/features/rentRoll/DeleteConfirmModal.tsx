interface DeleteConfirmModalProps {
  date: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function DeleteConfirmModal({ date, onConfirm, onCancel, isLoading }: DeleteConfirmModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md rounded-lg overflow-hidden shadow-2xl">
        {/* Header — sky blue like RedIQ */}
        <div className="bg-[hsl(199,80%,65%)] px-6 py-4">
          <h3 className="text-lg font-semibold text-white">Warning</h3>
        </div>
        {/* Body */}
        <div className="bg-background px-6 py-6">
          <p className="text-sm text-foreground">
            Are you sure that you want to delete all of the rent roll data for {date}?
          </p>
        </div>
        {/* Footer */}
        <div className="bg-background px-6 py-4 flex justify-end gap-3 border-t">
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="px-6 py-2 bg-[hsl(199,80%,65%)] text-white rounded text-sm font-medium hover:bg-[hsl(199,80%,55%)] disabled:opacity-50 transition-colors"
          >
            {isLoading ? "Deleting…" : "OK"}
          </button>
          <button
            onClick={onCancel}
            className="px-6 py-2 bg-muted text-foreground rounded text-sm font-medium hover:bg-muted/80 transition-colors border"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
