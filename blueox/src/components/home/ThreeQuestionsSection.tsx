import React from 'react';
import { ArrowRight } from 'lucide-react';

const QUESTIONS = [
  { n: 1, text: 'Did they ask for money before showing you a signed contract?' },
  { n: 2, text: 'Did they promise you a visa?' },
  { n: 3, text: 'Did they rush you?' },
];

const ThreeQuestionsSection: React.FC = () => {
  return (
    <section className="bg-gradient-to-br from-[#06358e] to-[#0759c4] py-10 sm:py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-center">
          <h2 className="font-orbitron text-2xl sm:text-3xl font-bold text-white col-span-1 sm:col-span-2 lg:col-span-1">
            Three questions.
            <br />
            Answer honestly.
          </h2>
          {QUESTIONS.map((q) => (
            <div
              key={q.n}
              className="bg-white rounded-2xl p-4 flex items-start gap-3 min-h-[92px]"
            >
              <span className="font-orbitron font-bold text-coral text-lg flex-shrink-0">{q.n}</span>
              <span className="font-space text-sm font-semibold text-[#0755c9]">{q.text}</span>
            </div>
          ))}
          <a
            href="#checker"
            className="bg-coral hover:bg-coral-dark text-white font-space font-semibold text-sm sm:text-base px-6 py-4 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 col-span-1 sm:col-span-2 lg:col-span-1"
          >
            Yes to any one? Check My Offer Now
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    </section>
  );
};

export default ThreeQuestionsSection;
