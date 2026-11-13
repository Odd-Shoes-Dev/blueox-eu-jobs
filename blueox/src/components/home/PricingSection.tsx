import React from 'react';
import { Check } from 'lucide-react';

const PricingSection: React.FC = () => {
  return (
    <section className="py-16 sm:py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto">
          <div className="max-w-2xl mb-10">
            <div className="font-space text-sm font-semibold text-coral uppercase tracking-wide mb-3">
              No surprises
            </div>
            <h2 className="font-orbitron text-2xl sm:text-3xl md:text-4xl font-bold text-[#0755c9] mb-4">
              What's free. <span className="text-coral">What costs money.</span>
            </h2>
            <p className="text-gray-600">We'd rather you hear it from us first.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-coral/5 border-2 border-coral rounded-2xl p-6 sm:p-8">
              <h3 className="font-space font-bold text-2xl text-[#0755c9] mb-4">Free</h3>
              <ul className="space-y-3">
                {['Job Offer Checker', 'Your first red-flag read', 'Educational guides and resources'].map(
                  (item) => (
                    <li key={item} className="flex items-center gap-2 text-gray-700">
                      <Check className="w-5 h-5 text-coral flex-shrink-0" />
                      {item}
                    </li>
                  )
                )}
              </ul>
            </div>
            <div className="bg-gray-50 rounded-2xl p-6 sm:p-8 border border-gray-100">
              <h3 className="font-space font-bold text-2xl text-[#0755c9] mb-4">Paid services</h3>
              <p className="text-gray-600">
                Full verification and placement/navigation support. Fees and exactly what they cover
                must be disclosed before you commit.
              </p>
            </div>
          </div>

          <p className="text-xs text-gray-400 mt-8">
            Employers and partner agencies may also pay us when a placement happens. We'll make
            clear who pays us and for what. Confirm payment rules before launch.
          </p>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
