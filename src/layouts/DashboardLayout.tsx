import { Menu, X } from 'lucide-react';
import type { ReactNode } from 'react';
import { BrandLogo } from '@/components/ui/BrandLogo';

interface DashboardNavItem {
  page: string;
  label: string;
  icon: React.ElementType;
}

interface DashboardLayoutProps<PageKey extends string> {
  activePage: PageKey;
  children: ReactNode;
  isMobileMenuOpen: boolean;
  navItems: Array<Omit<DashboardNavItem, 'page'> & { page: PageKey }>;
  onNavigate: (page: PageKey) => void;
  onToggleMobileMenu: () => void;
}

export function DashboardLayout<PageKey extends string>({
  activePage,
  children,
  isMobileMenuOpen,
  navItems,
  onNavigate,
  onToggleMobileMenu,
}: DashboardLayoutProps<PageKey>) {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-100 bg-white sticky top-0 z-10 shadow-sm">
        <div className="max-w-5xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
          <BrandLogo />

          <button
            onClick={onToggleMobileMenu}
            className="sm:hidden p-2 text-slate-600 hover:text-slate-900 transition-colors"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <nav className="hidden sm:flex items-center gap-1">
            {navItems.map(({ page, label, icon: Icon }) => (
              <button
                key={page}
                onClick={() => onNavigate(page)}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${
                  activePage === page
                    ? 'bg-blue-700 text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </nav>
        </div>

        {isMobileMenuOpen && (
          <div className="sm:hidden border-t border-slate-100 px-5 py-3 space-y-1">
            {navItems.map(({ page, label, icon: Icon }) => (
              <button
                key={page}
                onClick={() => onNavigate(page)}
                className={`w-full flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${
                  activePage === page
                    ? 'bg-blue-700 text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>
        )}
      </header>

      <main className="max-w-5xl mx-auto px-5 sm:px-8 py-4 sm:py-6">{children}</main>
    </div>
  );
}