import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Fish, Gauge,Home, Phone, Menu, X, HomeIcon } from 'lucide-react';
import { GiFishSmoking } from 'react-icons/gi';

// Keep this union in sync with App.tsx
export type Page = 'home' | 'monitoring' | 'contact';

export type NavbarProps = {
  currentPage: Page;
  setCurrentPage: React.Dispatch<React.SetStateAction<Page>>;
};

const tabs: Array<{ key: Page; label: string; icon: React.ElementType }> = [
  { key: 'home', label: 'Home', icon: HomeIcon },
  { key: 'monitoring', label: 'Monitoring', icon: Gauge },
  { key: 'contact', label: 'Contact', icon: Phone },
];

const Navbar: React.FC<NavbarProps> = ({ currentPage, setCurrentPage }) => {
  const [open, setOpen] = useState(false);

  const handleGo = (page: Page) => {
    setCurrentPage(page);
    setOpen(false); // close mobile menu after navigate
    // Scroll to top for nicer transition on phones
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header className="sticky top-0 z-50">
      {/* Top bar with blur + subtle border */}
      <div className="backdrop-blur supports-[backdrop-filter]:bg-white/70 bg-white/80 border-b border-white/40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Brand */}
            <button
              onClick={() => handleGo('home')}
              className="group inline-flex items-center gap-2 rounded-xl px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            >
              <span className="inline-grid place-items-center w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 text-white shadow">
                <GiFishSmoking className="w-5 h-5" />
              </span>
              <div className="flex flex-col items-start">
                <span className="text-base font-semibold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-700 via-cyan-700 to-blue-900">
                  Cakalang Fufu
                </span>
                <span className="text-[10px] uppercase tracking-wider text-blue-600/70 -mt-1">Monitoring</span>
              </div>
            </button>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-1">
              {tabs.map(({ key, label, icon: Icon }) => {
                const active = currentPage === key;
                return (
                  <motion.button
                    key={key}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleGo(key)}
                    className={[
                      'relative inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-colors',
                      active ? 'text-blue-700' : 'text-gray-600 hover:text-blue-700',
                    ].join(' ')}
                    aria-current={active ? 'page' : undefined}
                  >
                    {/* Active background highlight */}
                    {active && (
                      <motion.span
                        layoutId="nav-pill"
                        className="absolute inset-0 rounded-xl bg-white shadow ring-1 ring-black/5"
                        transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                      />
                    )}
                    <span className="relative inline-flex items-center gap-2">
                      <Icon className="w-4 h-4" />
                      {label}
                    </span>
                  </motion.button>
                );
              })}
            </nav>

            {/* Mobile toggle */}
            <button
              className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-xl hover:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              aria-label={open ? 'Tutup menu' : 'Buka menu'}
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
            >
              <AnimatePresence initial={false} mode="wait">
                {open ? (
                  <motion.span key="x" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }}>
                    <X className="w-6 h-6 text-blue-700" />
                  </motion.span>
                ) : (
                  <motion.span key="menu" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }}>
                    <Menu className="w-6 h-6 text-blue-700" />
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="drawer"
            initial={{ y: -24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -24, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="md:hidden bg-white/95 backdrop-blur border-b border-white/50 shadow-lg"
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
              <div className="grid grid-cols-1 gap-2">
                {tabs.map(({ key, label, icon: Icon }) => {
                  const active = currentPage === key;
                  return (
                    <button
                      key={key}
                      onClick={() => handleGo(key)}
                      className={[
                        'w-full inline-flex items-center justify-between gap-3 rounded-xl px-4 py-3 text-base font-medium',
                        active
                          ? 'bg-gradient-to-r from-blue-50 to-cyan-50 text-blue-700 ring-1 ring-blue-100'
                          : 'text-gray-700 hover:bg-gray-50',
                      ].join(' ')}
                    >
                      <span className="inline-flex items-center gap-3">
                        <span className="inline-grid place-items-center w-9 h-9 rounded-lg bg-blue-50 text-blue-700">
                          <Icon className="w-5 h-5" />
                        </span>
                        {label}
                      </span>
                      {active && (
                        <span className="text-[10px] uppercase tracking-wider text-blue-600">Aktif</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Navbar;
