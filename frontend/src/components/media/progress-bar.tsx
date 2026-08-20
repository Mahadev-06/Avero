import { QueueItemStatus } from '@/stores/queue-store';
import { TextShimmerWave } from '@/components/core/text-shimmer-wave';

interface ProgressBarProps {
  progress: number;
  status: QueueItemStatus;
}

export function ProgressBar({ progress, status }: ProgressBarProps) {
  const isProcessing = status === 'processing';

  return (
    <div className="w-full flex flex-col gap-1.5">
      <div className="flex justify-between items-center text-xs font-bold">
        {isProcessing ? (
          <TextShimmerWave
            duration={1.2}
            spread={1}
            zDistance={4}
            scaleDistance={1.08}
            rotateYDistance={15}
            style={{
              // @ts-expect-error CSS variable
              '--base-color': 'var(--text-color)',
              '--base-gradient-color': 'var(--color-accent-500)',
            }}
          >
            Processing...
          </TextShimmerWave>
        ) : (
          <span style={{ color: status === 'failed' ? 'var(--color-error)' : status === 'completed' ? 'var(--color-success)' : 'inherit' }}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
        )}
        <span
          className="tabular-nums font-extrabold"
          style={{
            display: 'inline-flex',
            padding: '0.1rem 0.45rem',
            borderRadius: 'var(--radius-full)',
            backgroundColor: 'var(--bg-color)',
            boxShadow: '2px 2px 4px var(--neumorph-dark), -2px -2px 4px var(--neumorph-light)',
            color: 'var(--color-accent-500)',
            fontSize: '0.75rem',
          }}
        >
          {Math.round(progress)}%
        </span>
      </div>
      <div className="nm-progress-track">
        <div
          className="nm-progress-fill"
          style={{
            width: `${Math.max(progress, 2)}%`,
            backgroundColor: status === 'failed' ? '#ef4444' : undefined,
          }}
        />
      </div>
    </div>
  );
}
