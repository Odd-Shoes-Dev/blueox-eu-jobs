import React from 'react';

const WhyDifferentSection: React.FC = () => {
  return (
    <section className="py-16 sm:py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          <div className="font-space text-sm font-semibold text-coral uppercase tracking-wide mb-3">
            Why Blue Ox is different
          </div>
          <h2 className="font-orbitron text-2xl sm:text-3xl md:text-4xl font-bold text-[#0755c9] mb-6">
            You don't need our confidence. <span className="text-coral">You need our checking.</span>
          </h2>
          <p className="text-gray-600 mb-4 leading-relaxed">
            Most agencies tell you what you want to hear, because that's how they get paid. We tell
            you what's true, even when it costs us the sale. If your offer is fake, we'll say so,
            even if you were about to pay us instead.
          </p>
          <p className="text-gray-600 mb-10 leading-relaxed">
            <strong className="text-[#0755c9]">5 years in the market. 750+ people placed across Europe.</strong>
            <br />
            We've seen the fake offers. That's how we spot yours fast.
          </p>

          <div className="font-space text-sm font-semibold text-coral uppercase tracking-wide mb-3">
            Where we can check your offer
          </div>
          <h2 className="font-orbitron text-2xl sm:text-3xl md:text-4xl font-bold text-[#0755c9] mb-6">
            Clear boundaries. <span className="text-coral">No guessing.</span>
          </h2>
          <div className="flex flex-wrap gap-3 mb-5">
            {['Western Europe', 'Central Europe', 'The Balkans'].map((tag) => (
              <span
                key={tag}
                className="bg-[#0755c9]/10 text-[#0755c9] font-space text-sm font-semibold px-4 py-2 rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
          <p className="text-gray-600 leading-relaxed">
            Offer from somewhere else? We'll tell you straight that we can't verify it. You'll still
            get your red-flag report.
          </p>
        </div>
      </div>
    </section>
  );
};

export default WhyDifferentSection;
