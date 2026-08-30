export type MediaItemStatus = 'pending' | 'analyzing' | 'processing' | 'downloading' | 'converting' | 'completed' | 'failed' | 'cancelled';
import { TextShimmerWave } from '@/components/core/text-shimmer-wave';

interface ProgressBarProps {
  progress: number;
  status: MediaItemStatus;
}

export function ProgressBar({ progress, status }: ProgressBarProps) {
  const isProcessing = status === 'processing';

  return (
    <div className="w-full flex flex-col gap-1.5">
      <div className="flex justify-between items-center text-xs font-bold">
        {isProcessing ? (
          <TextShimmerWave
            className="[--base-color:#0D74CE] [--base-gradient-color:#5EB1EF]"
            duration={1}
            spread={1}
            zDistance={1}
            scaleDistance={1.1}
            rotateYDistance={20}
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
            color: '#0D74CE', border: '1px solid rgba(94, 177, 239, 0.45)',
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
