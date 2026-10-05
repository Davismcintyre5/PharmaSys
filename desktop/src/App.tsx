import { HashRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from '@/context/ThemeProvider';
import { SiteProvider } from '@/context/SiteProvider';
import { AuthProvider } from '@/context/AuthProvider';
import { BranchProvider } from '@/context/BranchProvider';
import { SocketProvider } from '@/context/SocketProvider';
import AppRoutes from '@/routes/AppRoutes';

export default function App() {
  return (
    <ThemeProvider>
      <SiteProvider>
        <AuthProvider>
          <BranchProvider>
            <SocketProvider>
              <HashRouter
                future={{
                  v7_startTransition: true,
                  v7_relativeSplatPath: true,
                }}
              >
                <AppRoutes />
                <Toaster
                  position="top-right"
                  toastOptions={{
                    duration: 4000,
                    style: {
                      background: 'rgb(var(--color-surface))',
                      color: 'rgb(var(--color-text))',
                      border: '1px solid rgb(var(--color-border))',
                      fontSize: '0.875rem',
                    },
                    success: {
                      iconTheme: {
                        primary: 'rgb(var(--color-success))',
                        secondary: 'rgb(var(--color-surface))',
                      },
                    },
                    error: {
                      iconTheme: {
                        primary: 'rgb(var(--color-danger))',
                        secondary: 'rgb(var(--color-surface))',
                      },
                    },
                  }}
                />
              </HashRouter>
            </SocketProvider>
          </BranchProvider>
        </AuthProvider>
      </SiteProvider>
    </ThemeProvider>
  );
}