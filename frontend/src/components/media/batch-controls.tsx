"use client";

interface BatchControlsProps {
  onDownloadAll: () => void;
  onRetryFailed: () => void;
  onClearCompleted: () => void;
  onClearAll: () => void;
  hasCompleted: boolean;
  hasFailed: boolean;
  totalItems: number;
}

export function BatchControls({
  onDownloadAll, onRetryFailed, onClearCompleted, onClearAll, hasCompleted, hasFailed, totalItems
}: BatchControlsProps) {
  if (totalItems === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 mb-6 p-4 card items-center">
      <span className="text-sm font-semibold mr-4">Batch Actions:</span>
      <button 
        className="btn btn-primary text-sm" 
        disabled={!hasCompleted} 
        onClick={onDownloadAll}
      >
        Download Ready
      </button>
      <button 
        className="btn btn-secondary text-sm" 
        disabled={!hasFailed} 
        onClick={onRetryFailed}
      >
        Retry Failed
      </button>
      <button 
        className="btn btn-outline text-sm ml-auto" 
        disabled={!hasCompleted} 
        onClick={onClearCompleted}
      >
        Clear Completed
      </button>
      <button 
        className="btn btn-outline text-error text-sm border-error" 
        onClick={() => {
          if (confirm('Are you sure you want to clear the entire queue?')) {
            onClearAll();
          }
        }}
      >
        Clear All
      </button>
    </div>
  );
}
