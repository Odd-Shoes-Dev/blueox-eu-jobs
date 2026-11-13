import React from 'react';
import { ArrowRight } from 'lucide-react';

interface Props {
  onStart: () => void;
}

const CheckerIntro: React.FC<Props> = ({ onStart }) => {
  return (
    <div className="flex-1 flex flex-col">
      <h2 className="font-orbitron text-2xl sm:text-3xl font-bold text-[#0755c9] mb-4">
        Is Your Job Offer Real?
      </h2>
      <p className="text-gray-600 mb-3">Answer 17 quick questions. Takes about 3 minutes. Free.</p>
      <p className="text-gray-600 mb-6">
        We'll show you the warning signs in your offer. No judgment. We don't share your answers
        with whoever sent you the offer.
      </p>
      <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 text-sm text-gray-600 mb-8">
        Your answers create a red-flag report. This is a screening tool, not a final finding that
        an employer or person is fraudulent.
      </div>
      <button
        onClick={onStart}
        className="mt-auto inline-flex items-center justify-center gap-2 bg-coral hover:bg-coral-dark text-white font-space font-semibold px-8 py-3 rounded-xl transition-all shadow-lg w-full sm:w-auto"
      >
        Start the Check
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
};

export default CheckerIntro;
