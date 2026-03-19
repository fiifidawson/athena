import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';

const navLinks = [
  { label: 'Pipeline', href: '#pipeline' },
  { label: 'Platform', href: '#platform' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'About', href: '#about' },
  { label: 'Docs', href: '#', external: false },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-athena-border/50 bg-athena-dark/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        {/* Logo */}
        <a href="#" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-athena-amber to-athena-red">
            <span className="text-sm font-bold text-white">A</span>
          </div>
          <span className="text-xl font-semibold text-white tracking-tight">athena</span>
        </a>

        {/* Desktop Links */}
        <div className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              target={link.external ? '_blank' : undefined}
              rel={link.external ? 'noopener noreferrer' : undefined}
              className="text-sm text-athena-text transition-colors hover:text-white"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* CTA Buttons */}
        <div className="hidden items-center gap-3 md:flex">
          <a
            href="#"
            className="rounded-lg border border-athena-border px-4 py-2 text-sm text-athena-text-bright transition-colors hover:border-athena-amber/50 hover:text-white"
          >
            GitHub
          </a>
          <a
            href="#platform"
            className="rounded-lg bg-athena-amber px-4 py-2 text-sm font-medium text-white transition-all hover:bg-athena-amber-light hover:shadow-lg hover:shadow-athena-amber/25"
          >
            Get Started
          </a>
        </div>

        {/* Mobile Menu Toggle */}
        <button
          className="text-white md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden border-t border-athena-border/50 bg-athena-dark/95 backdrop-blur-xl md:hidden"
          >
            <div className="flex flex-col gap-4 px-6 py-6">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="text-athena-text transition-colors hover:text-white"
                >
                  {link.label}
                </a>
              ))}
              <div className="mt-2 flex flex-col gap-3">
                <a
                  href="#"
                  className="rounded-lg border border-athena-border px-4 py-2 text-center text-sm text-athena-text-bright"
                >
                  GitHub
                </a>
                <a
                  href="#platform"
                  className="rounded-lg bg-athena-amber px-4 py-2 text-center text-sm font-medium text-white"
                >
                  Get Started
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
