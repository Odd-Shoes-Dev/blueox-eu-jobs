import React from 'react';
import { ArrowRight } from 'lucide-react';

const StickyMobileCta: React.FC = () => {
  return (
    <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 p-3 bg-white border-t border-gray-200">
      <a
        href="#checker"
        className="flex items-center justify-center gap-2 bg-coral hover:bg-coral-dark text-white font-space font-semibold text-sm py-3 rounded-xl transition-all shadow-lg"
      >
        Check My Offer — Free
        <ArrowRight className="w-4 h-4" />
      </a>
    </div>
  );
};

export default StickyMobileCta;
