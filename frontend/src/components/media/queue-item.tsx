"use client";

import { QueueItem as QueueItemType, useQueueStore } from '@/stores/queue-store';
import { FormatSelector } from './format-selector';
import { PlatformBadge } from './platform-badge';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { triggerFileDownload } from '@/lib/utils';

interface QueueItemProps {
  item: QueueItemType;
  onRemove: (id: string) => void;
  onRetry: (id: string) => void;
  onDownload: (id: string) => void;
}

export function QueueItem({ item, onRemove, onRetry, onDownload }: QueueItemProps) {
  const updateItem = useQueueStore((state) => state.updateItem);

  const getBadgeVariant = (status: string) => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'failed':
        return 'destructive';
      case 'processing':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const handleDownloadClick = async () => {
    if (item.url) {
      const formatStr = item.format || 'MP4 720p';
      const isAudio = formatStr.toLowerCase().includes('mp3') || formatStr.toLowerCase().includes('m4a');
      const ext = isAudio ? 'mp3' : 'mp4';
      const cleanTitle = (item.title || 'mediaflow_download')
        .replace(/[^a-zA-Z0-9_\- ]/g, '')
        .trim()
        .replace(/\s+/g, '_');
      const filename = `${cleanTitle}_${formatStr.replace(/[^a-zA-Z0-9]/g, '')}.${ext}`;

      await triggerFileDownload(item.url, filename);
    } else {
      onDownload(item.id);
    }
  };

  return (
    <Card className="card-editorial flex flex-col md:flex-row items-start md:items-center justify-between p-4 gap-4 transition-all">
      <div className="flex items-center gap-4 w-full md:w-auto overflow-hidden">
        <div
          className="w-24 h-16 rounded-md flex-shrink-0 bg-cover bg-center border border-border"
          style={{
            backgroundImage: item.thumbnail
              ? `url(${item.thumbnail})`
              : 'linear-gradient(45deg, var(--color-neutral-200), var(--color-neutral-300))',
          }}
        />
        <div className="flex flex-col min-w-0 flex-1">
          <div className="font-bold truncate mb-1 text-base text-left" title={item.title || item.url}>
            {item.title || item.url}
          </div>
          <div className="flex items-center gap-2">
            <PlatformBadge platform={item.platform} />
            <Badge variant={getBadgeVariant(item.status)} className="capitalize text-xs">
              {item.status}
            </Badge>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
        <div className="w-full md:w-48 flex flex-col gap-1">
          <Progress value={item.progress || (item.status === 'completed' ? 100 : 0)} className="h-2" />
          <span className="text-xs text-muted-foreground text-right">{item.progress || 0}%</span>
        </div>

        <FormatSelector
          value={item.format}
          availableFormats={item.availableFormats}
          onChange={(newFormat) => updateItem(item.id, { format: newFormat })}
        />

        <div className="flex items-center gap-2">
          {item.status === 'completed' && (
            <Button variant="default" size="sm" onClick={handleDownloadClick}>
              Download 📥
            </Button>
          )}
          {item.status === 'failed' && (
            <Button variant="secondary" size="sm" onClick={() => onRetry(item.id)}>
              Retry
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => onRemove(item.id)}>
            Remove
          </Button>
        </div>
      </div>
    </Card>
  );
}
