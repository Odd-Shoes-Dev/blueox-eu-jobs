import React, { useState } from 'react';
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

  return (
    <header className="bg-white shadow-sm fixed w-full top-0 z-50">
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

        {isMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t pt-4">
            <div className="flex flex-col space-y-4" onClick={() => setIsMenuOpen(false)}>
              {mobileNav}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
};

export default SiteHeader;
