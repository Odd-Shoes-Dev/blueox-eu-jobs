import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

interface SiteHeaderProps {
  homeTo: string;
  brand: React.ReactNode;
  desktopNav: React.ReactNode;
  mobileNav: React.ReactNode;
}

// Shared visual shell for every top-of-page header (client site, homepage,
// Partner Portal) — same fixed white bar, logo slot, and responsive
// desktop/mobile nav mechanics everywhere. Each caller supplies its own
// brand mark and nav content, since those differ by audience.
const SiteHeader: React.FC<SiteHeaderProps> = ({ homeTo, brand, desktopNav, mobileNav }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const lastScrollY = useRef(0);
  const ticking = useRef(false);

  useEffect(() => {
    lastScrollY.current = window.scrollY;

    const handleScroll = () => {
      if (ticking.current) return;
      ticking.current = true;
      requestAnimationFrame(() => {
        const currentY = window.scrollY;
        const delta = currentY - lastScrollY.current;
        // Always visible near the top, so the bar doesn't flicker on tiny
        // scrolls right at the start of a page. A small delta threshold
        // (not any 1px jitter) is enough to count as a deliberate scroll.
        if (currentY < 80) {
          setHidden(false);
        } else if (delta > 4) {
          setHidden(true);
        } else if (delta < -4) {
          setHidden(false);
        }
        lastScrollY.current = currentY;
        ticking.current = false;
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`bg-white shadow-sm fixed w-full top-0 z-50 transition-transform duration-300 ease-in-out ${
        hidden && !isMenuOpen ? '-translate-y-full' : 'translate-y-0'
      }`}
    >
      <nav className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to={homeTo} className="flex items-center space-x-3">
            {brand}
          </Link>

          <div className="hidden md:flex items-center space-x-8">
            {desktopNav}
          </div>

          <button className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        <div
          className={`md:hidden grid transition-[grid-template-rows,opacity] duration-300 ease-in-out ${
            isMenuOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
          }`}
        >
          <div className="overflow-hidden">
            <div className="flex flex-col space-y-4 border-t mt-4 pt-4 pb-4" onClick={() => setIsMenuOpen(false)}>
              {mobileNav}
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
};

export default SiteHeader;
