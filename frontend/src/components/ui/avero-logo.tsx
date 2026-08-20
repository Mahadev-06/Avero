'use client';

import Image from 'next/image';

interface AveroLogoProps {
  height?: number;
  width?: number;
  className?: string;
  variant?: 'black' | 'dark' | 'white' | 'gold';
  style?: React.CSSProperties;
}

export function AveroLogo({
  height = 36,
  width,
  className,
  variant = 'black',
  style,
}: AveroLogoProps) {
  // Aspect ratio is 871:132 (~6.598)
  const calculatedWidth = width || Math.round(height * 6.598);

  if (variant === 'gold') {
    return (
      <Image
        src="/avero-logo-gold.png"
        alt="AVERO"
        width={calculatedWidth}
        height={height}
        className={className}
        style={{ height: `${height}px`, width: 'auto', display: 'block', ...style }}
        priority
      />
    );
  }

  if (variant === 'white') {
    return (
      <Image
        src="/avero-logo-white.png"
        alt="AVERO"
        width={calculatedWidth}
        height={height}
        className={className}
        style={{ height: `${height}px`, width: 'auto', display: 'block', ...style }}
        priority
      />
    );
  }

  // Default: Pure solid black logo (transparent background)
  return (
    <Image
      src="/avero-logo.png"
      alt="AVERO"
      width={calculatedWidth}
      height={height}
      className={className}
      style={{ height: `${height}px`, width: 'auto', display: 'block', ...style }}
      priority
    />
  );
}
