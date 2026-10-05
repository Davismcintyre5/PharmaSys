import { Outlet } from 'react-router-dom';
import { PublicHeader } from './PublicHeader';
import { PublicFooter } from './PublicFooter';
import { ChatWidget } from '@/components/public/ChatWidget';
import { CookieConsent } from '@/components/public/CookieConsent';

export function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-bg text-text">
      <PublicHeader />
      <main className="flex-1">
        <Outlet />
      </main>
      <PublicFooter />
      <ChatWidget />
      <CookieConsent />
    </div>
  );
}