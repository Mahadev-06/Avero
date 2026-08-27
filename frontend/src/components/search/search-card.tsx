"use client";

import { useState } from 'react';
import { SearchResult } from '@/lib/api-client';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Copy } from 'lucide-react';

interface SearchCardProps {
  result: SearchResult;
  onSelectMedia?: (url: string) => void;
}

export function SearchCard({ result, onSelectMedia }: SearchCardProps) {
  const [copied, setCopied] = useState(false);
  const handleSelect = onSelectMedia || (() => {});
  const formattedDuration = result.duration
    ? `${Math.floor(result.duration / 60)}:${result.duration % 60 < 10 ? '0' : ''}${result.duration % 60}`
    : '0:00';

  const handleCopy = () => {
    navigator.clipboard.writeText(result.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <Card className="card-editorial overflow-hidden flex flex-col h-full group p-0">
      <div className="relative aspect-video bg-muted overflow-hidden">
        {result.thumbnail_url && (
          <img
            src={result.thumbnail_url}
            alt={result.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        )}
        <div className="absolute bottom-2 right-2">
          <Badge variant="secondary" className="bg-black/80 text-white border-none">
            {formattedDuration}
          </Badge>
        </div>
      </div>

      <CardHeader className="p-4 pb-2">
        <CardTitle className="font-bold text-base line-clamp-2" title={result.title}>
          {result.title}
        </CardTitle>
        <CardDescription className="text-sm text-muted-foreground">{result.channel}</CardDescription>
      </CardHeader>

      <CardContent className="p-4 pt-0 mt-auto">
        <div className="flex flex-col gap-2">
          <Button variant="default" className="w-full justify-center" onClick={() => handleSelect(result.url)}>
            Download Video
          </Button>
          <div className="flex gap-2">
            <a href={result.url} target="_blank" rel="noopener noreferrer" className="flex-1">
              <Button variant="outline" size="sm" className="w-full text-xs">
                Open Source
              </Button>
            </a>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 text-xs inline-flex items-center justify-center gap-1"
              onClick={handleCopy}
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>Copy Link</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
