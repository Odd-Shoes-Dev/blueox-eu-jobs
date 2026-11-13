import React from 'react';
import { PlayCircle } from 'lucide-react';

const TruthSection: React.FC = () => {
  return (
    <section className="py-16 sm:py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-10 md:gap-12 items-center max-w-6xl mx-auto">
          <div>
            <div className="font-space text-sm font-semibold text-coral uppercase tracking-wide mb-3">
              The truth nobody tells you
            </div>
            <h2 className="font-orbitron text-2xl sm:text-3xl md:text-4xl font-bold text-[#0755c9] mb-6">
              A real employer pays to hire you.{' '}
              <span className="text-coral">It doesn't sell you the job.</span>
            </h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              No agent can guarantee a visa, because governments decide visas, not agents. Your
              savings and your family's savings can be gone in one transfer.
            </p>
            <p className="text-gray-600 leading-relaxed">
              Fake job offers hit people in Africa, the Middle East, Singapore, the Philippines and
              India every day. Different countries. Same script.
            </p>
          </div>
          <div className="bg-[#0755c9] rounded-2xl p-8 sm:p-10 text-white shadow-lg">
            <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mb-6">
              <PlayCircle className="w-9 h-9 text-coral" />
            </div>
            <h3 className="font-space font-bold text-xl mb-2">Don't be the next victim.</h3>
            <p className="text-gray-300 text-sm">
              Watch: 3 common job scam scripts
              <br />
              (and how to spot them)
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TruthSection;
