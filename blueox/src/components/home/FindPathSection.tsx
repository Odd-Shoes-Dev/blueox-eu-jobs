import React from 'react';
import { ArrowRight } from 'lucide-react';

const FindPathSection: React.FC = () => {
  return (
    <section id="work" className="py-16 sm:py-20 bg-gray-50 scroll-mt-20">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-2xl mb-10">
            <div className="font-space text-sm font-semibold text-coral uppercase tracking-wide mb-3">
              Choose your next move
            </div>
            <h2 className="font-orbitron text-2xl sm:text-3xl md:text-4xl font-bold text-[#0755c9] mb-4">
              Find the right path. <span className="text-coral">Without the guesswork.</span>
            </h2>
            <p className="text-gray-600">
              Start with clear information. Understand the route, the costs and the documents before
              you commit.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 sm:gap-8">
            <article className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-100">
              <div className="font-space text-xs font-semibold text-coral uppercase tracking-wide mb-2">
                Work in Europe
              </div>
              <h3 className="font-space font-bold text-xl text-[#0755c9] mb-3">
                Verified employers. Real contracts.
              </h3>
              <p className="text-gray-600 mb-6">
                Explore opportunities and get guidance on offers across Western Europe, Central
                Europe and the Balkans.
              </p>
              <a
                href="#checker"
                className="inline-flex items-center gap-2 text-coral font-space font-semibold hover:text-coral-dark transition-colors"
              >
                Check a job offer <ArrowRight className="w-4 h-4" />
              </a>
            </article>

            <article id="study" className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-100 scroll-mt-20">
              <div className="font-space text-xs font-semibold text-coral uppercase tracking-wide mb-2">
                Study in Europe
              </div>
              <h3 className="font-space font-bold text-xl text-[#0755c9] mb-3">
                Real costs. Real visa rules.
              </h3>
              <p className="text-gray-600 mb-6">
                Understand study options, requirements and residence pathways. No brochure fantasy.
              </p>
              <a
                href="#contact"
                className="inline-flex items-center gap-2 text-coral font-space font-semibold hover:text-coral-dark transition-colors"
              >
                Explore study options <ArrowRight className="w-4 h-4" />
              </a>
            </article>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FindPathSection;
