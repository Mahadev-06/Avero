interface PlatformBadgeProps {
  platform: string;
}

export function PlatformBadge({ platform }: PlatformBadgeProps) {
  const p = platform.toLowerCase();
  let bg = 'rgba(0, 0, 0, 0.08)';
  let color = 'var(--text-color)';

  if (p.includes('youtube')) {
    bg = 'rgba(255, 0, 0, 0.12)';
    color = '#ff0000';
  } else if (p.includes('tiktok')) {
    bg = 'rgba(0, 242, 254, 0.12)';
    color = '#00c4cc';
  } else if (p.includes('instagram')) {
    bg = 'rgba(225, 48, 108, 0.12)';
    color = '#e1306c';
  } else if (p.includes('pinterest')) {
    bg = 'rgba(230, 0, 35, 0.12)';
    color = '#e60023';
  } else if (p.includes('reddit')) {
    bg = 'rgba(255, 69, 0, 0.12)';
    color = '#ff4500';
  } else if (p.includes('threads')) {
    bg = 'rgba(0, 0, 0, 0.1)';
    color = 'var(--text-color)';
  } else if (p.includes('facebook')) {
    bg = 'rgba(24, 119, 242, 0.12)';
    color = '#1877f2';
  } else if (p.includes('x') || p.includes('twitter')) {
    bg = 'rgba(0, 0, 0, 0.1)';
    color = 'var(--text-color)';
  }

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '0.2rem 0.6rem',
        borderRadius: 'var(--radius-full)',
        fontSize: '0.75rem',
        fontWeight: 700,
        backgroundColor: bg,
        color: color,
        border: '1px solid rgba(255, 255, 255, 0.4)',
      }}
    >
      {platform}
    </span>
  );
}
