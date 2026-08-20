"use client";

import { ShopifyDropdown, DropdownItem } from '../ui/shopify-dropdown';

interface FormatSelectorProps {
  value?: string;
  availableFormats?: string[];
  onChange: (format: string) => void;
  disabled?: boolean;
}

export function FormatSelector({ value, availableFormats, onChange, disabled }: FormatSelectorProps) {
  const defaultList = ['MP4 1080p', 'MP4 720p', 'MP4 480p', 'MP3 320kbps', 'M4A Audio'];
  const formatsToUse = availableFormats && availableFormats.length > 0 ? availableFormats : defaultList;

  const formatItems: DropdownItem[] = formatsToUse.map((fmt) => {
    const isAudio = fmt.toLowerCase().includes('mp3') || fmt.toLowerCase().includes('m4a');
    return {
      id: fmt,
      label: fmt,
      icon: isAudio ? '🎵' : '🎬',
      onClick: () => onChange(fmt),
    };
  });

  const selectedFormat = value || formatsToUse[0];
  const currentItem = formatItems.find((item) => item.id === selectedFormat) || formatItems[0];

  return (
    <ShopifyDropdown
      label={currentItem.label}
      icon={currentItem.icon}
      items={formatItems.map((item) => ({
        ...item,
        disabled: disabled,
      }))}
      align="left"
    />
  );
}
