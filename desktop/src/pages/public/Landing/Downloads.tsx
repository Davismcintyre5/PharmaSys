import { useEffect, useState } from 'react';
import { Apple, Download as DownloadIcon, Monitor, Smartphone, Terminal } from 'lucide-react';
import { publicApi } from '@/api/public';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import type { PublicDownload } from '@/types';

const ICONS: Record<string, React.ReactNode> = {
  windows: <Monitor size={20} />,
  macos: <Apple size={20} />,
  linux: <Terminal size={20} />,
  android: <Smartphone size={20} />,
  ios: <Smartphone size={20} />,
};

export default function DownloadsPage() {
  const [items, setItems] = useState<PublicDownload[] | null>(null);

  useEffect(() => {
    publicApi.site.getDownloads().then(setItems).catch(() => setItems([]));
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
      <header className="text-center">
        <h1 className="text-3xl font-bold text-text sm:text-4xl">Downloads</h1>
        <p className="mt-3 text-base text-text-muted">
          Desktop and mobile apps for PharmaSys.
        </p>
      </header>

      <div className="mt-12">
        {!items ? (
          <div className="flex justify-center py-20">
            <Spinner size="lg" />
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            icon={<DownloadIcon size={20} />}
            title="No downloads yet"
            description="Builds will appear here once published."
          />
        ) : (
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
                      <p className="mt-0.5 text-[10px] text-text-subtle">
                        Requires {item.minOS}
                      </p>
                    )}
                    {item.releaseNotes && (
                      <p className="mt-2 line-clamp-3 text-xs text-text-muted">
                        {item.releaseNotes}
                      </p>
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
        )}
      </div>
    </div>
  );
}