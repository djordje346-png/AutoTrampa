'use client';

import { Toaster as Sonner } from 'sonner';
import { useTheme } from '@/hooks/use-theme';

type ToasterProps = React.ComponentProps<typeof Sonner>;

/**
 * Wired to the app's own theme store (not next-themes) so toasts follow the
 * light/dark switch in Profil.
 */
const Toaster = ({ ...props }: ToasterProps) => {
  const { theme, mounted } = useTheme();

  return (
    <Sonner
      theme={mounted ? theme : 'dark'}
      position="top-center"
      offset={16}
      duration={3000}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            'group toast group-[.toaster]:bg-card group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg group-[.toaster]:rounded-xl',
          description: 'group-[.toast]:text-muted-foreground',
          actionButton:
            'group-[.toast]:bg-primary group-[.toast]:text-primary-foreground',
          cancelButton:
            'group-[.toast]:bg-muted group-[.toast]:text-muted-foreground',
          error: 'group-[.toaster]:border-rose-500/40',
          success: 'group-[.toaster]:border-emerald-500/40',
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
