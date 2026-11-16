import React from 'react';
import { ArrowRight } from 'lucide-react';

const FinalCtaSection: React.FC = () => {
  return (
    <section className="bg-gradient-to-br from-[#062d79] to-[#075bc4] py-16 sm:py-20 text-center">
      <div className="container mx-auto px-4">
        <h2 className="font-orbitron text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4">
          Check it now, or regret it later.
        </h2>
        <p className="text-gray-300 mb-8">
          Your first red-flag check is free. It takes about three minutes.
        </p>
        <a
          href="#checker"
          className="inline-flex items-center gap-2 bg-coral hover:bg-coral-dark text-white font-space font-semibold text-lg px-10 py-4 rounded-xl transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
        >
          Check My Job Offer, Free
          <ArrowRight className="w-5 h-5" />
        </a>
      </div>
    </section>
  );
};

export default FinalCtaSection;
