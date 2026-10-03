import { useEffect, useState } from 'react';
import { Download as DownloadIcon, Apple, Monitor, Smartphone, Terminal } from 'lucide-react';
import { publicApi, PublicDownload } from '@/api/public';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';

const ICONS: Record<string, React.ReactNode> = {
  windows: <Monitor size={20} />,
  macos: <Apple size={20} />,
  linux: <Terminal size={20} />,
  android: <Smartphone size={20} />,
  ios: <Smartphone size={20} />,
};

export function Downloads() {
  const [items, setItems] = useState<PublicDownload[] | null>(null);

  useEffect(() => {
    publicApi.site.getDownloads().then(setItems).catch(() => setItems([]));
  }, []);

  if (!items) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!items.length) {
    return (
      <EmptyState
        icon={<DownloadIcon size={20} />}
        title="No downloads available"
        description="Desktop and mobile builds will appear here when published."
      />
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <Card key={item.id}>
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              {ICONS[item.type] || <DownloadIcon size={20} />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-text">{item.name}</p>
              <p className="text-xs text-text-muted">
                v{item.version}
                {item.arch ? ` · ${item.arch}` : ''}
                {item.size ? ` · ${item.size}` : ''}
              </p>
              {item.minOS && (
                <p className="mt-0.5 text-[10px] text-text-subtle">Requires {item.minOS}</p>
              )}
              {item.releaseNotes && (
                <p className="mt-2 text-xs text-text-muted line-clamp-3">{item.releaseNotes}</p>
              )}
              <a
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-block"
              >
                <Button size="sm" leftIcon={<DownloadIcon size={14} />}>
                  Download
                </Button>
              </a>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}