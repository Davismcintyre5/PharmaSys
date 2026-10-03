import { Link } from 'react-router-dom';
import { useState } from 'react';
import { Bell, Check, ChevronDown, LogOut, Search, Settings, User as UserIcon } from 'lucide-react';
import { IconButton } from '@/components/ui/IconButton';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Dropdown, DropdownItem, DropdownSeparator } from '@/components/ui/Dropdown';
import { Input } from '@/components/ui/Input';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { useAuth } from '@/context/AuthProvider';
import { useSocket } from '@/context/SocketProvider';
import { roleLabel } from '@/utils/enums';
import { formatRelativeTime } from '@/utils/format';

export function Header() {
  const { user, tenant, logout } = useAuth();
  const { unreadCount, notifications, markAllRead, markRead } = useSocket();
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-border bg-surface px-4">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <button
          onClick={() => setSearchOpen((v) => !v)}
          className="flex w-full max-w-md items-center gap-2 rounded-md border border-border bg-surface-2 px-3 py-2 text-left text-sm text-text-subtle hover:border-primary/40"
        >
          <Search size={14} />
          <span>Search drugs, patients, sales…</span>
        </button>
      </div>

      <div className="flex items-center gap-1.5">
        <ThemeToggle />

        <Dropdown
          trigger={
            <IconButton aria-label="Notifications">
              <span className="relative">
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-semibold text-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </span>
            </IconButton>
          }
        >
          <div className="w-80">
            <div className="flex items-center justify-between border-b border-border px-3 py-2">
              <span className="text-sm font-semibold text-text">Notifications</span>
              {unreadCount > 0 && (
                <button onClick={markAllRead} className="text-xs text-primary hover:underline">
                  Mark all read
                </button>
              )}
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="px-3 py-6 text-center text-sm text-text-muted">
                  No notifications yet
                </div>
              ) : (
                notifications.slice(0, 8).map((n) => (
                  <button
                    key={n._id}
                    onClick={() => markRead(n._id)}
                    className="flex w-full items-start gap-3 border-b border-border px-3 py-2.5 text-left hover:bg-surface-2"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-text">{n.title}</p>
                      {n.body && <p className="truncate text-xs text-text-muted">{n.body}</p>}
                      <p className="mt-0.5 text-[10px] text-text-subtle">
                        {formatRelativeTime(n.createdAt)}
                      </p>
                    </div>
                    {!n.readAt && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />}
                  </button>
                ))
              )}
            </div>
            <div className="border-t border-border p-2">
              <Link to="/app/notifications">
                <button className="w-full rounded-md px-3 py-1.5 text-xs text-primary hover:bg-surface-2">
                  View all
                </button>
              </Link>
            </div>
          </div>
        </Dropdown>

        <Dropdown
          trigger={
            <button className="flex items-center gap-2 rounded-md px-1.5 py-1 hover:bg-surface-2">
              <Avatar name={user?.fullName} size="sm" />
              <span className="hidden text-sm font-medium text-text sm:block">
                {user?.fullName?.split(' ')[0]}
              </span>
              <ChevronDown size={14} className="text-text-subtle" />
            </button>
          }
        >
          <div className="border-b border-border px-3 py-2">
            <p className="truncate text-sm font-medium text-text">{user?.fullName}</p>
            <p className="truncate text-xs text-text-muted">{user?.email}</p>
            <div className="mt-1 flex items-center gap-2">
              <Badge variant="info">{roleLabel(user?.role || '')}</Badge>
              {tenant?.name && <span className="truncate text-xs text-text-muted">{tenant.name}</span>}
            </div>
          </div>
          <DropdownItem>
            <Link to="/app/settings" className="flex items-center gap-2">
              <UserIcon size={14} /> Profile
            </Link>
          </DropdownItem>
          <DropdownItem>
            <Link to="/app/settings" className="flex items-center gap-2">
              <Settings size={14} /> Settings
            </Link>
          </DropdownItem>
          <DropdownSeparator />
          <DropdownItem danger onClick={logout}>
            <span className="flex items-center gap-2">
              <LogOut size={14} /> Sign out
            </span>
          </DropdownItem>
        </Dropdown>
      </div>

      {searchOpen && (
        <div className="absolute left-0 right-0 top-16 border-b border-border bg-surface p-4">
          <Input
            placeholder="Search across the app…"
            autoFocus
            leftIcon={<Search size={14} />}
          />
        </div>
      )}
    </header>
  );
}